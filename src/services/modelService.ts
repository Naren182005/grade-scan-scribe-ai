/**
 * Model API Service
 * This service handles interactions with the Model API for generating model answers
 */

// API key for Model API - use the one from config
import { MODEL_API_KEY, DEFAULT_MODEL } from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/config/apiConfig';

// Simple in-memory cache for answers to avoid redundant API calls
// This will significantly speed up processing for repeated questions
interface CacheEntry {
  answer: string;
  timestamp: number;
}

// Cache expiration time in milliseconds (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// In-memory cache
const answerCache: Record<string, CacheEntry> = {};

/**
 * Get a cached answer if available and not expired
 * @param question The question to get the cached answer for
 * @returns The cached answer or null if not available
 */
function getCachedAnswer(question: string): string | null {
  const normalizedQuestion = question.trim().toLowerCase();
  const cacheKey = normalizedQuestion;
  
  const cachedEntry = answerCache[cacheKey];
  if (cachedEntry) {
    const now = Date.now();
    if (now - cachedEntry.timestamp < CACHE_EXPIRATION) {
      return cachedEntry.answer;
    }
    // Entry expired, remove it
    delete answerCache[cacheKey];
  }
  return null;
}

/**
 * Cache an answer for future use
 * @param question The question to cache the answer for
 * @param answer The answer to cache
 */
function cacheAnswer(question: string, answer: string): void {
  const normalizedQuestion = question.trim().toLowerCase();
  const cacheKey = normalizedQuestion;
  
  answerCache[cacheKey] = {
    answer,
    timestamp: Date.now()
  };
}

/**
 * Remove <think>...</think> tags and their content from the model's response
 * @param text The text to process
 * @returns The cleaned text without thinking tags
 */
function removeThinkingTags(text: string): string {
  if (!text) return text;

  // Remove <think>...</think> tags and their content
  let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Also handle cases where the closing tag might be malformed or missing
  cleanedText = cleanedText.replace(/<think>[\s\S]*/g, '');

  // Remove any leading/trailing whitespace that might be left after tag removal
  cleanedText = cleanedText.trim();

  return cleanedText;
}

/**
 * Generate a model answer for a given question using the Model API
 * @param question The question to generate an answer for
 * @param model Optional model to use (defaults to gpt-3.5-turbo)
 * @returns The generated model answer
 */
export async function generateModelAnswer(question: string, model: string = DEFAULT_MODEL): Promise<string> {
  try {
    console.log(`Generating model answer with question: ${question.substring(0, 100)}...`);

    // Check for cached answers first
    const cachedAnswer = getCachedAnswer(question);
    if (cachedAnswer) {
      console.log('Using cached answer');
      return cachedAnswer;
    }

    // Determine if this is a multiple-choice question
    const isMCQ = isMultipleChoiceQuestion(question);
    console.log(`Question type: ${isMCQ ? 'Multiple-choice' : 'Open-ended'}`);

    // Prepare the system prompt based on question type
    let systemPrompt: string;
    if (isMCQ) {
      systemPrompt = "You are an intelligent AI exam assistant. For the following multiple-choice question, provide ONLY the letter of the correct option (A, B, C, or D) without any explanation or additional text. Just the letter.";
    } else {
      systemPrompt = "You are an intelligent AI exam assistant. For the following question, provide a brief, direct answer. Your answer should be concise and to the point. Do not include any explanations or reasoning.";
    }

    // Prepare the messages for the API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ];

    // First try using the server API endpoint
    try {
      console.log('Using server API endpoint');

      const response = await fetch(API_ENDPOINTS.MODEL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: question,
          model: model,
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Model API error: ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);
        throw new Error(`Model API error: ${response.status} ${response.statusText}`);
      }

      // Parse the response
      const result = await response.json();

      let generatedAnswer: string;

      // Extract the generated answer from the response
      generatedAnswer = result.choices?.[0]?.message?.content || '';

      // Remove any <think>...</think> tags from the response
      generatedAnswer = removeThinkingTags(generatedAnswer);

      console.log(`Generated model answer (${generatedAnswer.length} chars): ${generatedAnswer.substring(0, 100)}...`);

      // Cache the answer for future use
      cacheAnswer(question, generatedAnswer);

      return generatedAnswer;
    } catch (error) {
      console.error('Error generating model answer with server API:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error generating model answer:', error);
    
    // Return a default answer for the question type
    if (isMultipleChoiceQuestion(question)) {
      return "Unable to determine the correct answer. Please try again later.";
    } else {
      return "Unable to generate an answer at this time. Please try again later.";
    }
  }
}

/**
 * Generate model answers for multiple questions
 * @param questions Array of questions to generate answers for
 * @param model Optional model to use
 * @returns Array of generated model answers
 */
export async function generateBatchModelAnswers(questions: string[], model: string = DEFAULT_MODEL): Promise<string[]> {
  try {
    console.log(`Generating batch model answers for ${questions.length} questions`);

    // Initialize answers array with placeholders
    const answers: string[] = new Array(questions.length).fill('');

    // Create an array of questions with their indices
    const questionsToProcess: { index: number; question: string }[] = [];

    // Check cache first and only process uncached questions
    questions.forEach((question, index) => {
      const cachedAnswer = getCachedAnswer(question);
      if (cachedAnswer) {
        console.log(`Using cached answer for question ${index + 1}`);
        answers[index] = cachedAnswer;
      } else {
        questionsToProcess.push({ index, question });
      }
    });

    // If all questions are cached, return immediately
    if (questionsToProcess.length === 0) {
      console.log('All questions have cached answers');
      return answers;
    }

    console.log(`Processing ${questionsToProcess.length} uncached questions...`);

    // Extract just the question strings for the API call
    const questionTexts = questionsToProcess.map(item => item.question);

    // First try using the server batch API endpoint
    try {
      console.log('Using server batch API endpoint');

      const response = await fetch(API_ENDPOINTS.MODEL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompts: questionTexts,
          model: model,
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Batch API response received');

        if (result.results && Array.isArray(result.results)) {
          console.log(`Received ${result.results.length} batch results`);

          // Process each result and update the answers array
          result.results.forEach((batchResult, batchIndex) => {
            // Get the original question index
            const questionIndex = questionsToProcess[batchIndex].index;

            // Extract the generated answer
            let generatedAnswer = '';
            if (batchResult.choices && batchResult.choices.length > 0) {
              generatedAnswer = batchResult.choices[0].message?.content || '';
            }

            // Clean up the answer
            generatedAnswer = removeThinkingTags(generatedAnswer);

            // Cache the answer
            if (generatedAnswer && generatedAnswer.trim().length > 0) {
              cacheAnswer(questionTexts[batchIndex], generatedAnswer);
              answers[questionIndex] = generatedAnswer;
            } else {
              console.error(`Empty or invalid answer received for question ${questionIndex + 1}`);
              answers[questionIndex] = `[Error: Empty response for question ${questionIndex + 1}]`;
            }
          });

          return answers;
        }
      }

      console.error('Batch API failed or returned invalid response, falling back to individual requests');
    } catch (batchError) {
      console.error('Error using batch API:', batchError);
      console.log('Falling back to individual requests');
    }

    // Fallback: Process questions in batches using individual requests
    const BATCH_SIZE = 5; // Process 5 questions at a time

    for (let i = 0; i < questionsToProcess.length; i += BATCH_SIZE) {
      const batch = questionsToProcess.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(questionsToProcess.length/BATCH_SIZE)}`);

      // Process batch in parallel
      const batchPromises = batch.map(item =>
        generateModelAnswer(item.question, model)
          .then(answer => ({ index: item.index, answer }))
          .catch(error => {
            console.error(`Error generating answer for question ${item.index + 1}:`, error);
            return { index: item.index, answer: `[Error generating answer for question ${item.index + 1}]` };
          })
      );

      // Wait for all promises to resolve
      const batchResults = await Promise.all(batchPromises);

      // Update answers array with batch results
      batchResults.forEach(result => {
        answers[result.index] = result.answer;
      });

      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < questionsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return answers;
  } catch (error) {
    console.error('Error generating batch model answers:', error);
    return questions.map(() => 'Error generating model answer');
  }
}

/**
 * Checks if a question is a multiple-choice question
 * @param question The question text to check
 * @returns True if the question is a multiple-choice question, false otherwise
 */
function isMultipleChoiceQuestion(question: string): boolean {
  if (!question) return false;

  // Check for common multiple-choice patterns
  const mcqPatterns = [
    /\bA\).*\bB\).*\bC\).*\bD\)/i,  // A) option B) option C) option D) option
    /\bA\..*\bB\..*\bC\..*\bD\./i,  // A. option B. option C. option D. option
    /\b\(A\).*\b\(B\).*\b\(C\).*\b\(D\)/i,  // (A) option (B) option (C) option (D) option
    /\b\[A\].*\b\[B\].*\b\[C\].*\b\[D\]/i,  // [A] option [B] option [C] option [D] option
    /\ba\).*\bb\).*\bc\).*\bd\)/i,  // a) option b) option c) option d) option
    /\ba\..*\bb\..*\bc\..*\bd\./i,  // a. option b. option c. option d. option
  ];

  // Check if any of the patterns match
  return mcqPatterns.some(pattern => pattern.test(question));
}
