/**
 * Gemini API Service
 * This service handles interactions with the Google Gemini API for generating model answers
 */

// API key for Gemini API - use the one from config
import {
  GEMINI_API_KEY,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_MODELS,
  USE_LOCAL_LLM_FALLBACK,
  USE_HF_FALLBACK
} from '@/config/apiConfig';
import { API_ENDPOINTS } from '@/config/apiConfig';

// Import the local LLM service
import { isLocalLlmAvailable, generateLocalLlmAnswer } from './localLlmService';

// Import the Hugging Face service
import { isHuggingFaceAvailable, generateHuggingFaceAnswer } from './huggingFaceService';

// We'll use fetch for direct API calls to Gemini

/**
 * Call the Gemini API directly from the client with retry logic for rate limits
 * @param question The question to generate an answer for
 * @param systemPrompt The system prompt to use
 * @param model The model to use
 * @param retryCount Current retry count (for internal use in recursion)
 * @param useAlternativeModel Whether to try alternative models if rate limited
 * @returns The generated answer
 */
async function callGeminiDirectly(
  question: string,
  systemPrompt: string,
  model: string = DEFAULT_GEMINI_MODEL,
  retryCount: number = 0,
  useAlternativeModel: boolean = false
): Promise<string> {
  // Maximum number of retries
  const MAX_RETRIES = 3;

  // If we've exceeded max retries, try alternative models or return default answer
  if (retryCount > MAX_RETRIES) {
    if (useAlternativeModel) {
      // We've already tried alternative models, return default answer
      console.log('Max retries exceeded for all models, returning default answer');
      return getDefaultAnswer(question);
    } else {
      // Try alternative models
      return await tryAlternativeModels(question, systemPrompt);
    }
  }

  console.log(`Making direct API call to Gemini (model: ${model}, retry: ${retryCount})`);

  try {
    // Prepare the request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: question }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemPrompt }
        ]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
        topP: 0.95
      }
    };

    // Gemini API functionality has been disabled - API key removed for security
    console.error("Gemini API functionality has been disabled - API key removed for security");

    // Try alternative models or return default answer
    if (!useAlternativeModel) {
      return await tryAlternativeModels(question, systemPrompt);
    } else {
      return getDefaultAnswer(question);
    }
  } catch (error) {
    console.error('Error making direct Gemini API call:', error);

    // If we haven't exceeded max retries, try again with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiDirectly(question, systemPrompt, model, retryCount + 1, useAlternativeModel);
    }

    // If we've exhausted retries, try alternative models or return default answer
    if (!useAlternativeModel) {
      return await tryAlternativeModels(question, systemPrompt);
    } else {
      return getDefaultAnswer(question);
    }
  }
}

/**
 * Try alternative models when the primary model fails
 * @param question The question to generate an answer for
 * @param systemPrompt The system prompt to use
 * @returns The generated answer
 */
async function tryAlternativeModels(question: string, systemPrompt: string): Promise<string> {
  console.log('Trying alternative models...');

  // Check if we should try Hugging Face API first (prioritize this)
  if (USE_HF_FALLBACK) {
    try {
      // Check if the Hugging Face API is available
      console.log('Checking Hugging Face API availability...');
      const hfAvailable = await isHuggingFaceAvailable();

      if (hfAvailable) {
        console.log('Hugging Face API is available, trying it first');

        // Determine if this is a multiple-choice question
        const isMCQ = isMultipleChoiceQuestion(question);

        // Generate answer using the Hugging Face API
        const hfAnswer = await generateHuggingFaceAnswer(question, isMCQ);

        if (hfAnswer && hfAnswer.trim().length > 0) {
          console.log('Successfully generated answer with Hugging Face API');
          return hfAnswer;
        } else {
          console.log('Hugging Face API returned empty response, trying other models');
        }
      } else {
        console.log('Hugging Face API is not available, trying other models');
      }
    } catch (error) {
      console.error('Error with Hugging Face API:', error);
      // Continue to other models
    }
  }

  // Check if we should try the local LLM server as a fallback
  if (USE_LOCAL_LLM_FALLBACK) {
    try {
      // Check if the local LLM server is available
      console.log('Checking local LLM server availability...');
      const localLlmAvailable = await isLocalLlmAvailable();

      if (localLlmAvailable) {
        console.log('Local LLM server is available, trying it');

        // Determine if this is a multiple-choice question
        const isMCQ = isMultipleChoiceQuestion(question);

        // Generate answer using the local LLM server
        const localAnswer = await generateLocalLlmAnswer(question, isMCQ);

        if (localAnswer && localAnswer.trim().length > 0) {
          console.log('Successfully generated answer with local LLM server');
          return localAnswer;
        } else {
          console.log('Local LLM server returned empty response, trying other models');
        }
      } else {
        console.log('Local LLM server is not available, trying other models');
      }
    } catch (error) {
      console.error('Error with local LLM server:', error);
      // Continue to other models
    }
  }

  // Get alternative models from the fallback list
  const alternativeModels = FALLBACK_MODELS.filter((m: string) =>
    m !== DEFAULT_GEMINI_MODEL &&
    m !== 'local-llm' &&
    m !== 'huggingface'
  );

  // Try each alternative model
  for (const model of alternativeModels) {
    console.log(`Trying alternative model: ${model}`);
    try {
      // Try the alternative model with useAlternativeModel=true to prevent infinite recursion
      return await callGeminiDirectly(question, systemPrompt, model, 0, true);
    } catch (error) {
      console.error(`Error with alternative model ${model}:`, error);
      // Continue to the next model
    }
  }

  // If all alternative models fail, try the Model API service
  try {
    console.log('Trying Model API service as fallback');
    const { generateModelAnswer } = await import('./modelService');
    const modelAnswer = await generateModelAnswer(question);
    if (modelAnswer && modelAnswer.trim().length > 0) {
      return modelAnswer;
    }
  } catch (error) {
    console.error('Error with Model API service:', error);
  }

  // If all else fails, return a default answer
  return getDefaultAnswer(question);
}

/**
 * Get a default answer for a question when all API calls fail
 * @param question The question to get a default answer for
 * @returns A default answer
 */
function getDefaultAnswer(question: string): string {
  // Import the template service for fallback answers
  const { getTemplateAnswer } = require('@/utils/templateService');

  // Try to get a template answer
  const templateAnswer = getTemplateAnswer(question);
  if (templateAnswer) {
    console.log('Using template answer as fallback');
    return templateAnswer;
  }

  // If no template is available, return a generic answer
  if (isMultipleChoiceQuestion(question)) {
    return "Unable to determine the correct answer due to API rate limits. Please try again later.";
  } else {
    return "Unable to generate an answer at this time due to API rate limits. Please try again later.";
  }
}

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
 * Generate a model answer for a given question using the Gemini API
 * @param question The question to generate an answer for
 * @param model Optional model to use (defaults to gemini-1.5-pro)
 * @returns The generated model answer
 */
export async function generateGeminiAnswer(question: string, model: string = DEFAULT_GEMINI_MODEL): Promise<string> {
  try {
    console.log(`Generating Gemini answer with question: ${question.substring(0, 100)}...`);

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
      systemPrompt = "You are an expert AI exam assistant. For the following multiple-choice question, carefully analyze the question and all options. Your task is to determine the correct answer. Provide ONLY the letter of the correct option (A, B, C, or D) without any explanation, workings, or additional text. Just the single letter of the correct answer. If the options are labeled with lowercase letters (a, b, c, d), convert your answer to uppercase. For example, if the answer is option B, respond with just 'B'.";
    } else {
      systemPrompt = "You are an expert AI exam assistant. For the following question, provide a brief, direct answer. Your answer should be concise and to the point. Focus on key concepts, definitions, and important facts. Include only the essential information needed to answer the question correctly. Do not include any explanations, reasoning, or unnecessary details.";
    }

    // First try using the server API endpoint
    try {
      console.log('Using server API endpoint for Gemini');

      // Check if the server is available by making a connectivity check
      try {
        const connectivityCheck = await fetch(API_ENDPOINTS.CONNECTIVITY, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!connectivityCheck.ok) {
          console.warn('Server connectivity check failed, falling back to direct API call');
          throw new Error('Server connectivity check failed');
        }

        console.log('Server connectivity check passed, proceeding with server API call');
      } catch (connectivityError) {
        console.warn('Server connectivity check failed, falling back to direct API call');
        // Fall back to direct Gemini API call
        return await callGeminiDirectly(question, systemPrompt, model);
      }

      const response = await fetch(API_ENDPOINTS.GEMINI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: question,
          model: model,
          systemPrompt: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: 150
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error: ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);

        // Check if this is a rate limit error (429)
        if (response.status === 429) {
          console.log('Server API rate limit exceeded, falling back to direct API call with retry logic');
          return await callGeminiDirectly(question, systemPrompt, model);
        }

        // Fall back to direct Gemini API call for other errors
        console.log('Server API call failed, falling back to direct API call');
        return await callGeminiDirectly(question, systemPrompt, model);
      }

      // Parse the response
      const result = await response.json();

      let generatedAnswer: string;

      // Extract the generated answer from the response (Gemini format)
      generatedAnswer = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Remove any <think>...</think> tags from the response
      generatedAnswer = removeThinkingTags(generatedAnswer);

      console.log(`Generated Gemini answer (${generatedAnswer.length} chars): ${generatedAnswer.substring(0, 100)}...`);

      // Cache the answer for future use
      cacheAnswer(question, generatedAnswer);

      return generatedAnswer;
    } catch (error) {
      console.error('Error generating Gemini answer with server API:', error);

      // Check if this is a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        console.log('Rate limit error detected, trying with retry logic');
        return await callGeminiDirectly(question, systemPrompt, model);
      }

      // For other errors, try direct API call
      console.log('Server API error, falling back to direct API call');
      return await callGeminiDirectly(question, systemPrompt, model);
    }
  } catch (error) {
    console.error('Error generating Gemini answer:', error);

    // Try to get a template answer as a last resort
    const { getTemplateAnswer } = require('@/utils/templateService');
    const templateAnswer = getTemplateAnswer(question);
    if (templateAnswer) {
      console.log('Using template answer as fallback');
      return templateAnswer;
    }

    // Return a user-friendly error message
    if (isMultipleChoiceQuestion(question)) {
      return "Unable to determine the correct answer due to API rate limits. Please try again in a few minutes.";
    } else {
      return "Unable to generate an answer at this time due to API rate limits. Please try again in a few minutes.";
    }
  }
}

/**
 * Generate model answers for multiple questions using Gemini API
 * @param questions Array of questions to generate answers for
 * @param model Optional model to use
 * @returns Array of generated model answers
 */
export async function generateBatchGeminiAnswers(questions: string[], model: string = DEFAULT_GEMINI_MODEL): Promise<string[]> {
  try {
    console.log(`Generating batch Gemini answers for ${questions.length} questions`);

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
      console.log('Using server batch API endpoint for Gemini');

      // Check if the server is available by making a connectivity check
      try {
        const connectivityCheck = await fetch(API_ENDPOINTS.CONNECTIVITY, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!connectivityCheck.ok) {
          console.warn('Server connectivity check failed, falling back to direct API calls');
          throw new Error('Server connectivity check failed');
        }

        console.log('Server connectivity check passed, proceeding with server API call');
      } catch (connectivityError) {
        console.warn('Server connectivity check failed, falling back to direct API calls');
        // Process each question individually using direct API calls
        return await processBatchDirectly(questionsToProcess, questionTexts, answers, model);
      }

      // Determine if all questions are MCQs
      const allMCQs = questionTexts.every(q => isMultipleChoiceQuestion(q));

      // Create a specialized system prompt based on question types
      const systemPrompt = allMCQs
        ? "You are an expert AI exam assistant. For each multiple-choice question, carefully analyze the question and all options. Your task is to determine the correct answer for each question. Provide ONLY the letter of the correct option (A, B, C, or D) without any explanation, workings, or additional text. Just the single letter of the correct answer for each question. If the options are labeled with lowercase letters (a, b, c, d), convert your answer to uppercase. For example, if the answer is option B, respond with just 'B'."
        : "You are an expert AI exam assistant. For each question, provide a brief, direct answer. Your answers should be concise and to the point. Focus on key concepts, definitions, and important facts. Include only the essential information needed to answer each question correctly. Do not include any explanations, reasoning, or unnecessary details.";

      console.log(`Using ${allMCQs ? 'MCQ-specific' : 'general'} system prompt for batch processing`);

      const response = await fetch(API_ENDPOINTS.GEMINI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompts: questionTexts,
          model: model,
          systemPrompt: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: allMCQs ? 50 : 150 // Shorter output for MCQs
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Batch API response received');

        if (result.results && Array.isArray(result.results)) {
          console.log(`Received ${result.results.length} batch results`);

          // Process each result and update the answers array
          result.results.forEach((batchResult: any, batchIndex: number) => {
            // Get the original question index
            const questionIndex = questionsToProcess[batchIndex].index;

            // Extract the generated answer
            let generatedAnswer = batchResult.text || batchResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

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

      console.error('Batch API failed or returned invalid response, falling back to direct API calls');
      return await processBatchDirectly(questionsToProcess, questionTexts, answers, model);
    } catch (batchError) {
      console.error('Error using batch API:', batchError);
      console.log('Falling back to direct API calls');
      return await processBatchDirectly(questionsToProcess, questionTexts, answers, model);
    }

  } catch (error) {
    console.error('Error generating batch Gemini answers:', error);
    return questions.map(() => 'Error generating model answer');
  }
}

/**
 * Process a batch of questions directly using the Gemini API
 * @param questionsToProcess Array of questions to process with their indices
 * @param questionTexts Array of question texts
 * @param answers Array to store the answers
 * @param model Model to use
 * @returns Array of answers
 */
async function processBatchDirectly(
  questionsToProcess: { index: number; question: string }[],
  questionTexts: string[],
  answers: string[],
  model: string
): Promise<string[]> {
  console.log('Processing batch directly with Gemini API');

  const BATCH_SIZE = 2; // Reduce batch size to 2 to minimize rate limiting issues

  // Determine if all questions are MCQs
  const allMCQs = questionTexts.every(q => isMultipleChoiceQuestion(q));

  // Create a specialized system prompt based on question types
  const systemPrompt = allMCQs
    ? "You are an expert AI exam assistant. For the following multiple-choice question, carefully analyze the question and all options. Your task is to determine the correct answer. Provide ONLY the letter of the correct option (A, B, C, or D) without any explanation, workings, or additional text. Just the single letter of the correct answer. If the options are labeled with lowercase letters (a, b, c, d), convert your answer to uppercase. For example, if the answer is option B, respond with just 'B'."
    : "You are an expert AI exam assistant. For the following question, provide a brief, direct answer. Your answer should be concise and to the point. Focus on key concepts, definitions, and important facts. Include only the essential information needed to answer the question correctly. Do not include any explanations, reasoning, or unnecessary details.";

  // Try alternative models if the primary model fails
  const modelsToTry = [model, ...FALLBACK_MODELS.filter((m: string) =>
    m !== model &&
    m !== 'local-llm' &&
    m !== 'huggingface'
  )];

  // Check if we should try the local LLM server
  let localLlmAvailable = false;
  if (USE_LOCAL_LLM_FALLBACK) {
    try {
      localLlmAvailable = await isLocalLlmAvailable();
      if (localLlmAvailable) {
        console.log('Local LLM server is available for batch processing');
      }
    } catch (error) {
      console.error('Error checking local LLM availability:', error);
    }
  }

  // Check if we should try Hugging Face API
  let hfAvailable = false;
  if (USE_HF_FALLBACK) {
    try {
      hfAvailable = await isHuggingFaceAvailable();
      if (hfAvailable) {
        console.log('Hugging Face API is available for batch processing');
      }
    } catch (error) {
      console.error('Error checking Hugging Face API availability:', error);
    }
  }

  for (let i = 0; i < questionsToProcess.length; i += BATCH_SIZE) {
    const batch = questionsToProcess.slice(i, i + BATCH_SIZE);
    console.log(`Processing direct batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(questionsToProcess.length/BATCH_SIZE)}`);

    // Process batch sequentially to avoid rate limits
    for (const item of batch) {
      console.log(`Processing question ${item.index + 1}`);

      let answered = false;

      // Try local LLM server first if available
      if (localLlmAvailable) {
        try {
          console.log(`Trying local LLM server for question ${item.index + 1}`);
          const isMCQ = isMultipleChoiceQuestion(item.question);
          const localAnswer = await generateLocalLlmAnswer(item.question, isMCQ);

          if (localAnswer && localAnswer.trim().length > 0) {
            answers[item.index] = localAnswer;
            answered = true;
            console.log(`Successfully generated answer for question ${item.index + 1} using local LLM server`);
          }
        } catch (error) {
          console.error(`Error generating answer with local LLM for question ${item.index + 1}:`, error);
          // Continue to other models
        }
      }

      // Try Hugging Face API if local LLM failed and HF is available
      if (!answered && hfAvailable) {
        try {
          console.log(`Trying Hugging Face API for question ${item.index + 1}`);
          const isMCQ = isMultipleChoiceQuestion(item.question);
          const hfAnswer = await generateHuggingFaceAnswer(item.question, isMCQ);

          if (hfAnswer && hfAnswer.trim().length > 0) {
            answers[item.index] = hfAnswer;
            answered = true;
            console.log(`Successfully generated answer for question ${item.index + 1} using Hugging Face API`);
          }
        } catch (error) {
          console.error(`Error generating answer with Hugging Face API for question ${item.index + 1}:`, error);
          // Continue to other models
        }
      }

      // If local LLM failed or is not available, try other models
      if (!answered) {
        // Try each model until we get an answer
        for (const currentModel of modelsToTry) {
          if (answered) break;

          try {
            console.log(`Trying model ${currentModel} for question ${item.index + 1}`);
            const answer = await callGeminiDirectly(item.question, systemPrompt, currentModel);

            if (answer && !answer.includes("Unable to")) {
              answers[item.index] = answer;
              answered = true;
              console.log(`Successfully generated answer for question ${item.index + 1} using model ${currentModel}`);
            }
          } catch (error) {
            console.error(`Error generating answer for question ${item.index + 1} with model ${currentModel}:`, error);
            // Continue to next model
          }
        }
      }

      // If all models failed, try template answers
      if (!answered) {
        try {
          console.log(`Trying template answer for question ${item.index + 1}`);
          const { getTemplateAnswer } = require('@/utils/templateService');
          const templateAnswer = getTemplateAnswer(item.question);

          if (templateAnswer) {
            answers[item.index] = templateAnswer;
            console.log(`Using template answer for question ${item.index + 1}`);
          } else {
            // Use a default answer as last resort
            answers[item.index] = isMultipleChoiceQuestion(item.question)
              ? "Unable to determine the correct answer due to API rate limits. Please try again later."
              : "Unable to generate an answer at this time due to API rate limits. Please try again later.";
            console.log(`Using default answer for question ${item.index + 1}`);
          }
        } catch (templateError) {
          console.error(`Error getting template answer for question ${item.index + 1}:`, templateError);
          answers[item.index] = `[Error generating answer for question ${item.index + 1}]`;
        }
      }

      // Add a delay between questions to avoid rate limiting
      if (item !== batch[batch.length - 1]) {
        const delay = 2000; // 2 seconds
        console.log(`Waiting ${delay}ms before processing next question...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Add a larger delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < questionsToProcess.length) {
      const delay = 5000; // 5 seconds
      console.log(`Waiting ${delay}ms before processing next batch...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return answers;
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
    /option\s+[A-Da-d][\s\):]/i,    // Option A, Option B, etc.
    /choice\s+[A-Da-d][\s\):]/i,    // Choice A, Choice B, etc.
    /\b[A-Da-d]\s*[\.\)]\s*[A-Za-z0-9]/,  // A. text or A) text at word boundary
    /^[A-Da-d]\.\s+[A-Za-z0-9]/m,   // A. text at start of line
    /^[A-Da-d]\)\s+[A-Za-z0-9]/m,   // A) text at start of line
  ];

  // Check if any of the patterns match
  return mcqPatterns.some(pattern => pattern.test(question));
}
