import { EvaluationResult, HandwritingAnalysisResult, HandwritingFeedback } from "@/types";
import { createWorker } from 'tesseract.js';
import { OCR_API_KEY } from '@/config/apiKeys'; // Kept for backward compatibility
import { API_ENDPOINTS } from '@/config/apiConfig';
import { dataURLtoBlob, enhanceImageForOCR, compressImage } from '@/utils/imageUtils';
import { compareAnswers, compareMultipleAnswers, calculateTotalScore, AnswerComparisonResult } from './answerComparisonService';
import { formatQuestionPaper, formatMCQQuestion } from './questionUtils';
import { shouldUseOnlineServices } from './onlineOfflineMode';

/**
 * Evaluates a student's answer against a model answer using keyword matching
 * @param studentAnswer The student's answer text
 * @param modelAnswer The model answer text
 * @param questionText The question text
 * @param questionNumber The question number
 * @param totalMarks The total marks available for the question
 * @returns An evaluation result with score and feedback
 */
export const evaluateAnswerWithKeywords = async (
  studentAnswer: string,
  modelAnswer: string,
  questionText: string,
  questionNumber: number,
  totalMarks: number
): Promise<AnswerComparisonResult> => {
  console.log(`Evaluating answer for question ${questionNumber}:`);
  console.log(`Student answer: ${studentAnswer.substring(0, 100)}...`);
  console.log(`Model answer: ${modelAnswer.substring(0, 100)}...`);

  // Use the keyword-based comparison to evaluate the answer
  const result = compareAnswers(
    questionNumber,
    questionText,
    modelAnswer,
    studentAnswer,
    totalMarks
  );

  console.log(`Evaluation result for question ${questionNumber}:`, result);
  return result;
};

/**
 * Evaluates multiple student answers against model answers using keyword matching
 * @param studentAnswers Array of student answers
 * @param modelAnswers Array of model answers
 * @param questions Array of question objects with text and marks
 * @returns Array of evaluation results
 */
export const evaluateMultipleAnswersWithKeywords = async (
  studentAnswers: string[],
  modelAnswers: string[],
  questions: { number: number; text: string; marks: number }[]
): Promise<{
  results: AnswerComparisonResult[];
  totalScore: {
    totalMarksAwarded: number;
    totalMarksAvailable: number;
    percentage: number;
  };
}> => {
  console.log(`Evaluating ${studentAnswers.length} answers against ${modelAnswers.length} model answers`);

  // Use the keyword-based comparison to evaluate multiple answers
  const results = compareMultipleAnswers(
    questions,
    modelAnswers,
    studentAnswers
  );

  // Calculate the total score
  const totalScore = calculateTotalScore(results);

  console.log('Evaluation complete. Total score:', totalScore);
  return { results, totalScore };
};

/**
 * Evaluates a student's answer against model answer keywords using the server API
 * @param answerText The student's answer text
 * @param questionKeywords Array of keywords from the model answer
 * @returns An object with evaluation results including total marks, obtained marks, and matched keywords
 */
export const evaluateAnswerWithServer = async (
  answerText: string,
  questionKeywords: string[]
): Promise<{
  totalMarks: number;
  obtainedMarks: number;
  matchCount: number;
  keywordsMatched: string[];
}> => {
  console.log(`Evaluating answer with server API`);
  console.log(`Student answer: ${answerText.substring(0, 100)}...`);
  console.log(`Question keywords: ${questionKeywords.join(', ')}`);

  try {
    // Call the server API endpoint
    const response = await fetch(API_ENDPOINTS.EVALUATE_ANSWER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionKeywords,
        answerText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server evaluation failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Parse the response
    const result = await response.json();
    console.log('Server evaluation result:', result);
    return result;
  } catch (error) {
    console.error('Error evaluating answer with server:', error);
    // Return a default result in case of error
    return {
      totalMarks: questionKeywords.length,
      obtainedMarks: 0,
      matchCount: 0,
      keywordsMatched: []
    };
  }
};

/**
 * Evaluates a student's answer against a model answer
 * @param questionText The text of the question
 * @param totalMarks The total marks available for the question
 * @param modelAnswer The model answer to compare against
 * @param studentAnswer The student's answer
 * @returns An evaluation result with marks awarded and feedback
 */
export const evaluateAnswer = async (
  questionText: string,
  totalMarks: number,
  modelAnswer: string,
  studentAnswer: string
): Promise<EvaluationResult> => {
  console.log("Evaluating answer for question:", questionText);
  console.log("Model answer:", modelAnswer);
  console.log("Student answer:", studentAnswer);
  console.log("Total marks:", totalMarks);

  // Format MCQ questions for better display in the evaluation part
  let formattedQuestionText = questionText;
  if (isMultipleChoiceQuestion(questionText)) {
    formattedQuestionText = formatMCQQuestion(questionText);
    console.log("Formatted MCQ question:", formattedQuestionText);
  }

  // Import the MCQ evaluation service
  const { evaluateMCQAndGetResult, parseAnswerText } = await import('./mcqEvaluationService');

  // Check if this is an MCQ question/answer
  const isMCQ = isMultipleChoiceQuestion(questionText) ||
                (modelAnswer && /^[A-Da-d]$/.test(modelAnswer.trim()));

  // Use the formatted question text for evaluation
  questionText = formattedQuestionText;

  console.log("Is MCQ question:", isMCQ);

  if (isMCQ) {
    console.log("Evaluating as MCQ answer with user-provided total marks:", totalMarks);
    try {
      // Use our local MCQ evaluation service and pass the user-provided total marks
      const result = evaluateMCQAndGetResult(modelAnswer, studentAnswer, totalMarks);
      console.log("MCQ evaluation result:", result);
      return result;
    } catch (error) {
      console.error("Error evaluating MCQ answer:", error);
      // Fall through to server evaluation or fallback
    }
  }

  try {
    // Check if we should use online services based on the online/offline mode
    const useOnlineServices = await shouldUseOnlineServices();

    if (useOnlineServices) {
      // Try to use the server API endpoint for answer evaluation
      console.log("Using online mode: Trying server API for evaluation");
      const response = await fetch(API_ENDPOINTS.EVALUATE_ANSWER || 'http://localhost:3000/api/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelAnswer,
          studentAnswer
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server evaluation failed: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Server evaluation failed: ${response.status} ${response.statusText}`);
      }

      // Parse the response
      const result = await response.json();
      console.log('Server evaluation result:', result);

      // For MCQ questions
      if (result.answerType === 'mcq') {
        const isCorrect = result.isCorrect;
        const obtainedMarks = result.obtainedMarks;

        // Create a properly formatted evaluation result
        return {
          marksAwarded: obtainedMarks,
          performanceLabel: isCorrect ? 'Good' : 'Poor',
          feedbackSummary: isCorrect
            ? ["Correct answer selected."]
            : ["Incorrect answer selected. Review the material and try again."],
          keyPointsCovered: isCorrect ? ["Correct option identified"] : [],
          keyPointsMissing: isCorrect ? [] : ["Correct option not identified"],
          evaluationReason: isCorrect
            ? "The selected answer is correct."
            : "The selected answer is incorrect."
        };
      }
      // For open-ended questions
      else {
        const obtainedMarks = result.obtainedMarks;
        const totalMarks = result.totalMarks;
        const matchCount = result.matchCount;
        const keywordsMatched = result.keywordsMatched || [];
        const percentage = result.percentage || (totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0);

        // Determine performance label based on percentage
        let performanceLabel: 'Poor' | 'Average' | 'Good' | 'Excellent';
        if (percentage >= 85) {
          performanceLabel = 'Excellent';
        } else if (percentage >= 70) {
          performanceLabel = 'Good';
        } else if (percentage >= 50) {
          performanceLabel = 'Average';
        } else {
          performanceLabel = 'Poor';
        }

        // Generate feedback based on the result
        let feedbackSummary: string[] = [];

        if (percentage >= 70) {
          feedbackSummary = ["Good understanding of the topic demonstrated."];
          if (keywordsMatched.length > 0) {
            feedbackSummary.push(`Successfully covered key concepts: ${keywordsMatched.slice(0, 3).join(', ')}${keywordsMatched.length > 3 ? '...' : ''}`);
          }
        } else if (percentage >= 50) {
          feedbackSummary = ["Adequate understanding of the topic."];
          if (keywordsMatched.length > 0) {
            feedbackSummary.push(`Covered some key concepts: ${keywordsMatched.slice(0, 2).join(', ')}${keywordsMatched.length > 2 ? '...' : ''}`);
          }
          feedbackSummary.push("Include more specific details and examples in your answers.");
        } else {
          feedbackSummary = ["Limited understanding of the topic demonstrated."];
          feedbackSummary.push("Review the material and include more key concepts in your answer.");
        }

        // Create a properly formatted evaluation result
        return {
          marksAwarded: obtainedMarks,
          performanceLabel,
          feedbackSummary,
          keyPointsCovered: keywordsMatched,
          keyPointsMissing: [], // We don't have this information from the server
          evaluationReason: `The answer covers ${matchCount} out of ${totalMarks} key concepts.`
        };
      }
    } else {
      // In offline mode, throw an error to use the local fallback
      console.log("Using offline mode: Skipping server API, using local evaluation");
      throw new Error("Offline mode enabled, using local evaluation");
    }
  } catch (error) {
    console.error("Error evaluating answer with server:", error);

    // Try to use local keyword-based comparison as a fallback
    try {
      console.log("Using local keyword-based comparison as fallback");
      const { compareAnswers } = await import('./answerComparisonService');

      const result = compareAnswers(
        1, // Default question number
        questionText,
        modelAnswer,
        studentAnswer,
        totalMarks
      );

      console.log("Local comparison result:", result);

      // Convert the comparison result to an evaluation result
      return {
        marksAwarded: result.marksAwarded,
        performanceLabel: result.marksAwarded >= totalMarks * 0.7 ? 'Good' :
                         result.marksAwarded >= totalMarks * 0.5 ? 'Average' : 'Poor',
        feedbackSummary: [result.feedback],
        keyPointsCovered: result.matchingKeywords,
        keyPointsMissing: [],
        evaluationReason: `The answer matches ${result.matchingKeywords.length} keywords from the model answer.`
      };
    } catch (fallbackError) {
      console.error("Error with fallback evaluation:", fallbackError);

      // Return a default evaluation in case all methods fail
      return {
        marksAwarded: Math.round(totalMarks * 0.5), // Default to 50%
        performanceLabel: 'Average',
        feedbackSummary: ["Improve subject knowledge and conceptual clarity.", "Add more specific examples to support your answers."],
        keyPointsCovered: ["Basic understanding demonstrated"],
        keyPointsMissing: ["Detailed analysis could not be performed"],
        evaluationReason: "An error occurred during evaluation. A default score has been assigned."
      };
    }
  }
};

/**
 * Generates a concise feedback summary for the student
 * @param coverage The percentage of key points covered
 * @param coveredPoints The key points covered
 * @param missingPoints The key points missing
 * @param questionText The original question
 * @returns An array of concise feedback points
 */
const generateConciseFeedbackSummary = (
  coverage: number,
  coveredPoints: string[],
  missingPoints: string[],
  questionText: string
): string[] => {
  const feedback: string[] = [];

  // Add feedback based on coverage
  if (coverage < 0.4) {
    feedback.push("Improve subject knowledge and conceptual understanding.");
  } else if (coverage < 0.7) {
    feedback.push("Enhance answer completeness by addressing all key aspects of the question.");
  }

  // Add feedback based on missing points
  if (missingPoints.length > 0) {
    if (questionText.toLowerCase().includes("explain") || questionText.toLowerCase().includes("describe")) {
      feedback.push("Include more detailed explanations with specific examples.");
    }

    if (questionText.toLowerCase().includes("compare") || questionText.toLowerCase().includes("contrast")) {
      feedback.push("Strengthen comparative analysis by highlighting similarities and differences.");
    }

    if (questionText.toLowerCase().includes("analyze") || questionText.toLowerCase().includes("evaluate")) {
      feedback.push("Develop critical analysis with supporting evidence.");
    }
  }

  // Add feedback on structure and presentation
  if (coverage < 0.8) {
    if (questionText.toLowerCase().includes("discuss") || questionText.toLowerCase().includes("essay")) {
      feedback.push("Structure your answer with clear introduction, body paragraphs, and conclusion.");
    } else {
      feedback.push("Organize your answer in a logical sequence with clear transitions.");
    }
  }

  // Add feedback on technical aspects if relevant
  if (questionText.toLowerCase().includes("calculate") || questionText.toLowerCase().includes("solve")) {
    feedback.push("Show all steps in calculations and verify your final answers.");
  }

  // Ensure we have at least 2 feedback points
  if (feedback.length < 2) {
    feedback.push("Support your arguments with relevant examples and evidence.");
  }

  // Ensure we have at most 3 feedback points
  return feedback.slice(0, 3);
}

/**
 * Extracts key phrases from text
 * @param text The text to extract key phrases from
 * @returns An array of key phrases
 */
const extractKeyPhrases = (text: string): string[] => {
  // Normalize text
  const normalizedText = text
    .replace(/\s+/g, ' ')
    .trim();

  // Split by sentence boundaries to get complete thoughts
  const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // For shorter texts, also consider clause-level phrases
  const clauses = normalizedText.split(/[,;:]/).filter(c => c.trim().length > 0);

  // Combine sentences and meaningful clauses
  let rawPhrases = [...sentences];

  // Only add clauses that are substantial and not already covered by sentences
  clauses.forEach(clause => {
    const trimmedClause = clause.trim();
    // Check if this clause is substantial (contains multiple words and not just common words)
    if (trimmedClause.split(/\s+/).length >= 3 &&
        !sentences.some(s => s.includes(trimmedClause)) &&
        !isPhraseMostlyCommonWords(trimmedClause)) {
      rawPhrases.push(trimmedClause);
    }
  });

  // Remove duplicates and very short phrases
  const filteredPhrases = Array.from(new Set(rawPhrases))
    .map(p => p.trim())
    .filter(p => {
      const words = p.split(/\s+/);
      // Keep phrases with 3+ words or phrases with important keywords
      return words.length > 2 || containsImportantKeyword(p);
    });

  return filteredPhrases;
};

/**
 * Checks if a phrase contains important keywords that should be preserved
 * even if the phrase is short
 */
const containsImportantKeyword = (phrase: string): boolean => {
  // List of domain-specific important terms that should be preserved
  const importantTerms = [
    'algorithm', 'function', 'variable', 'constant', 'equation', 'formula',
    'theory', 'principle', 'law', 'theorem', 'proof', 'definition',
    'concept', 'method', 'technique', 'process', 'system', 'structure',
    'analysis', 'synthesis', 'evaluation', 'application', 'implementation',
    'data', 'information', 'knowledge', 'understanding', 'comprehension',
    'solution', 'problem', 'challenge', 'question', 'answer', 'result'
  ];

  const lowerPhrase = phrase.toLowerCase();
  return importantTerms.some(term => lowerPhrase.includes(term));
};

/**
 * Checks if a phrase consists mostly of common words
 */
const isPhraseMostlyCommonWords = (phrase: string): boolean => {
  const words = phrase.toLowerCase().split(/\s+/);
  const commonWordCount = words.filter(word => isCommonWord(word)).length;

  // If more than 70% of words are common, consider it mostly common words
  return (commonWordCount / words.length) > 0.7;
};

/**
 * Extracts important concepts from text
 * @param text The text to extract concepts from
 * @returns An array of key concepts
 */
const extractConcepts = (text: string): string[] => {
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Extract potential concepts using multiple patterns
  const concepts: string[] = [];

  // Pattern for technical terms, proper nouns, and multi-word concepts
  const technicalPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b|\b([a-z]+(?:-[a-z]+)+)\b|\b([a-z]+\s+(?:of|and|in|for|to|by|with|on)\s+[a-z]+(?:\s+[a-z]+)?)\b/g;

  // Pattern for noun phrases (1-3 word groups that might be important)
  const nounPhrasePattern = /\b([a-z]+(?:\s+[a-z]+){0,2})\b/g;

  // Process each sentence to extract concepts
  sentences.forEach(sentence => {
    // First look for technical terms and proper nouns
    const technicalMatches = sentence.match(technicalPattern) || [];
    technicalMatches.forEach(match => {
      if (match.length > 3 && !isCommonWord(match)) {
        concepts.push(match.trim());
      }
    });

    // Then look for potential noun phrases
    const nounMatches = sentence.match(nounPhrasePattern) || [];
    nounMatches.forEach(match => {
      // Filter out common words and short terms
      if (match.length > 3 && !isCommonWord(match) && !concepts.includes(match.trim())) {
        // Check if this might be a domain-specific term
        if (containsImportantKeyword(match) || match.split(/\s+/).length > 1) {
          concepts.push(match.trim());
        }
      }
    });
  });

  // Remove duplicates and sort by specificity (longer phrases first, then alphabetically for equal lengths)
  return Array.from(new Set(concepts))
    .sort((a, b) => {
      const lengthDiff = b.length - a.length;
      return lengthDiff !== 0 ? lengthDiff : a.localeCompare(b);
    });
};

/**
 * Checks if a word is a common word that should be excluded from concepts
 * @param word The word to check
 * @returns True if the word is common, false otherwise
 */
const isCommonWord = (word: string): boolean => {
  const commonWords = [
    // Articles and determiners
    'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'some', 'any', 'each', 'every', 'all', 'both', 'either', 'neither', 'much', 'many', 'little', 'few',

    // Pronouns
    'i', 'me', 'you', 'he', 'him', 'she', 'her', 'it', 'we', 'us', 'they', 'them', 'who', 'whom', 'whose',
    'which', 'what', 'whatever', 'whoever', 'whomever', 'whichever', 'myself', 'yourself', 'himself',
    'herself', 'itself', 'ourselves', 'themselves',

    // Prepositions
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'among', 'through',
    'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'into', 'onto', 'upon',
    'of', 'off', 'out', 'over', 'under',

    // Conjunctions
    'and', 'but', 'or', 'nor', 'so', 'yet', 'because', 'although', 'since', 'unless', 'while',
    'where', 'if', 'then', 'than', 'as',

    // Common verbs
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'get', 'got', 'getting', 'make', 'made', 'making', 'go', 'goes', 'going', 'went', 'gone',
    'take', 'took', 'taken', 'taking', 'come', 'came', 'coming', 'see', 'saw', 'seen', 'seeing',
    'know', 'knew', 'known', 'knowing', 'want', 'wanted', 'wanting',

    // Common adverbs
    'very', 'really', 'quite', 'rather', 'too', 'enough', 'just', 'even', 'still', 'almost',
    'only', 'also', 'then', 'there', 'here', 'now', 'always', 'never', 'sometimes', 'often',
    'usually', 'again', 'already', 'soon', 'later', 'early', 'once', 'twice',

    // Common adjectives
    'good', 'bad', 'big', 'small', 'high', 'low', 'old', 'new', 'first', 'last', 'long', 'short',
    'great', 'little', 'own', 'other', 'same', 'different', 'next', 'right', 'wrong', 'important',

    // Numbers and time
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'time', 'year', 'day', 'week', 'month', 'hour', 'minute', 'second',

    // Miscellaneous common words
    'people', 'way', 'thing', 'example', 'part', 'most', 'such', 'well', 'however', 'therefore'
  ];

  // Handle multi-word phrases
  if (word.includes(' ')) {
    const words = word.toLowerCase().split(/\s+/);
    // If all words in the phrase are common, consider the phrase common
    return words.every(w => commonWords.includes(w));
  }

  return commonWords.includes(word.toLowerCase());
};

/**
 * Calculates the similarity between a phrase and a text
 * @param phrase The phrase to check
 * @param text The text to check against
 * @returns A similarity score between 0 and 1
 */
const calculateSimilarity = (phrase: string, text: string): number => {
  // Normalize and clean text for better comparison
  const normalizeText = (input: string): string => {
    return input
      .toLowerCase()
      .replace(/[.,;:!?()[\]{}'"]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ')               // Normalize whitespace
      .trim();
  };

  const normalizedPhrase = normalizeText(phrase);
  const normalizedText = normalizeText(text);

  // Check for exact match after normalization
  if (normalizedText.includes(normalizedPhrase)) {
    return 1.0;
  }

  // Split into words for partial matching, including shorter words that might be important
  const phraseWords = normalizedPhrase.split(/\s+/).filter(w => w.length > 1);
  const textWords = normalizedText.split(/\s+/).filter(w => w.length > 1);

  // Skip comparison if either has no valid words
  if (phraseWords.length === 0) return 0;

  // Create a set of text words for faster lookup
  const textWordSet = new Set(textWords);

  // Count exact matching words
  let exactMatchCount = 0;
  // Track words that didn't match exactly for further processing
  const unmatchedPhraseWords: string[] = [];

  phraseWords.forEach(word => {
    if (textWordSet.has(word)) {
      exactMatchCount++;
    } else {
      unmatchedPhraseWords.push(word);
    }
  });

  // For unmatched words, check for similar words using Levenshtein distance
  let similarMatchCount = 0;
  unmatchedPhraseWords.forEach(word => {
    // Skip common words for similarity matching to focus on important terms
    if (isCommonWord(word)) return;

    let bestSimilarity = 0;
    for (const textWord of textWords) {
      // Skip comparing with common words
      if (isCommonWord(textWord)) continue;

      // Calculate normalized edit distance (0-1 range)
      const maxLength = Math.max(word.length, textWord.length);
      if (maxLength === 0) continue;

      const distance = calculateLevenshteinDistance(word, textWord);
      const similarity = 1 - (distance / maxLength);

      // Consider it a match if similarity is high enough
      if (similarity > 0.8) {
        bestSimilarity = 0.9; // High similarity match
        break;
      } else if (similarity > 0.6 && similarity > bestSimilarity) {
        bestSimilarity = 0.7; // Moderate similarity match
      }
    }

    similarMatchCount += bestSimilarity;
  });

  // Calculate final similarity score with more weight on exact matches
  const exactMatchScore = exactMatchCount / phraseWords.length;
  const similarMatchScore = similarMatchCount / phraseWords.length;

  // Combine scores with more weight on exact matches
  return (exactMatchScore * 0.7) + (similarMatchScore * 0.3);
};

/**
 * Calculates the Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns The edit distance between the strings
 */
const calculateLevenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

/**
 * Generates a detailed evaluation reason
 * @param coverage The percentage of key points covered
 * @param totalMarks The total marks available
 * @param marksAwarded The marks awarded
 * @param coveredPoints The key points covered
 * @param missingPoints The key points missing
 * @param questionText The original question
 * @returns A detailed string explaining the evaluation
 */
const generateDetailedEvaluationReason = (
  coverage: number,
  totalMarks: number,
  marksAwarded: number,
  coveredPoints: string[],
  missingPoints: string[],
  questionText: string
): string => {
  // Generate a base evaluation message based on coverage
  let reason = '';

  if (coverage > 0.9) {
    reason = `Excellent answer demonstrating comprehensive understanding of the topic. The response covers almost all key points expected in an ideal answer.`;
  } else if (coverage > 0.7) {
    reason = `Good answer showing solid understanding of the subject matter. The response addresses most of the key points.`;
  } else if (coverage > 0.5) {
    reason = `Satisfactory answer with adequate understanding of the topic. The response covers some important points but misses others.`;
  } else if (coverage > 0.3) {
    reason = `Basic answer showing limited understanding of the subject. The response touches on a few key points but lacks depth.`;
  } else {
    reason = `Insufficient answer demonstrating minimal understanding of the topic. The response misses most of the key points.`;
  }

  // Add specific feedback about strengths
  if (coveredPoints.length > 0) {
    reason += ` Strengths include discussion of ${coveredPoints.length > 1 ?
      coveredPoints.slice(0, -1).join(', ') + ' and ' + coveredPoints[coveredPoints.length - 1] :
      coveredPoints[0]}.`;
  }

  // Add specific feedback about areas for improvement
  if (missingPoints.length > 0) {
    reason += ` To improve, consider addressing ${missingPoints.length > 1 ?
      missingPoints.slice(0, -1).join(', ') + ' and ' + missingPoints[missingPoints.length - 1] :
      missingPoints[0]}.`;
  }

  // Add final score
  reason += ` ${marksAwarded}/${totalMarks} marks awarded.`;

  return reason;
};

/**
 * Extracts text from an image using OCR with Tesseract.js
 * @param imageUrl The URL of the image to extract text from
 * @param isQuestionPaper Whether the image is a question paper (true) or answer sheet (false)
 * @returns The extracted text
 */
export const extractTextFromImage = async (imageUrl: string, isQuestionPaper: boolean = false): Promise<string> => {
  console.log(`Extracting text from ${isQuestionPaper ? 'question paper' : 'answer sheet'} image:`, imageUrl);

  try {
    // Check if we should use online services based on the online/offline mode
    const useOnlineServices = await shouldUseOnlineServices();

    // Check if we have an API key and are in online mode
    if (OCR_API_KEY && useOnlineServices) {
      // Use the OCR API with the provided key
      console.log("Using online mode: Using OCR API with key:", OCR_API_KEY);

      // Enhance and compress the image for better OCR results
      const enhancedImageUrl = await enhanceImageForOCR(imageUrl);
      const compressedImageUrl = await compressImage(enhancedImageUrl, 1600, 0.9);

      // Convert the data URL to a Blob
      const blob = dataURLtoBlob(compressedImageUrl);

      // Create a FormData object to send the image to the OCR API
      const formData = new FormData();
      formData.append('apikey', OCR_API_KEY);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // More accurate OCR engine
      formData.append('isTable', isQuestionPaper ? 'true' : 'false'); // Better for structured content like question papers
      formData.append('file', blob, 'image.png');

      // Send the request to the OCR API
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      // Parse the response
      const ocrResult = await ocrResponse.json();

      // Check if the OCR was successful
      if (ocrResult.IsErroredOnProcessing === false && ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
        let extractedText = ocrResult.ParsedResults[0].ParsedText;

        // If no text was extracted, return a fallback message
        if (!extractedText || extractedText.trim().length === 0) {
          return isQuestionPaper
            ? "No text could be extracted from the question paper. Please try again with a clearer image."
            : "No text could be extracted from the answer sheet. Please try again with a clearer image.";
        }

        // Post-process the extracted text to improve quality
        extractedText = postProcessOCRText(extractedText, isQuestionPaper);

        return extractedText;
      } else {
        console.error('OCR API Error:', ocrResult.ErrorMessage || 'Unknown error');
        throw new Error(ocrResult.ErrorMessage || 'OCR processing failed');
      }
    } else {
      // Fallback to Tesseract.js if no API key is provided or in offline mode
      console.log(useOnlineServices ? "Falling back to Tesseract.js for OCR (no API key)" : "Using offline mode: Using Tesseract.js for OCR");

      // Enhance and compress the image for better OCR results
      const enhancedImageUrl = await enhanceImageForOCR(imageUrl);
      const compressedImageUrl = await compressImage(enhancedImageUrl, 1600, 0.9);

      // Create a worker for OCR processing
      const worker = await createWorker('eng');

      // Configure the worker for better results
      await worker.setParameters({
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:?!()[]{}"\'-+/*=<>%$#@&',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
      });

      // Set image source
      const result = await worker.recognize(compressedImageUrl);

      // Get the extracted text
      let extractedText = result.data.text;

      // Terminate the worker to free up resources
      await worker.terminate();

      // If no text was extracted, return a fallback message
      if (!extractedText || extractedText.trim().length === 0) {
        return isQuestionPaper
          ? "No text could be extracted from the question paper. Please try again with a clearer image."
          : "No text could be extracted from the answer sheet. Please try again with a clearer image.";
      }

      // Post-process the extracted text to improve quality
      extractedText = postProcessOCRText(extractedText, isQuestionPaper);

      return extractedText;
    }
  } catch (error) {
    console.error('OCR Error:', error);

    // Return a fallback message in case of error
    return isQuestionPaper
      ? "Error processing the question paper. Please try again with a clearer image."
      : "Error processing the answer sheet. Please try again with a clearer image.";
  }
};

/**
 * Analyzes handwriting from an image
 * @param imageUrl The URL of the image to analyze
 * @returns A handwriting analysis result with overall score and feedback
 */
/**
 * Extracts the main topic from a question text
 * @param questionText The text of the question
 * @returns The main topic of the question
 */
const extractMainTopic = (questionText: string): string => {
  // Remove common question starters
  let cleanedText = questionText
    .replace(/^(define|explain|describe|discuss|what is|what are|how does|how do|why is|why are)/i, '')
    .trim();

  // Remove punctuation at the end
  cleanedText = cleanedText.replace(/[.?!]$/, '').trim();

  // If the text is too long, take just the first part
  if (cleanedText.length > 50) {
    const words = cleanedText.split(' ');
    if (words.length > 5) {
      cleanedText = words.slice(0, 5).join(' ') + '...';
    }
  }

  // Capitalize the first letter
  return cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);
};

/**
 * Checks if a question is a multiple-choice question
 * @param question The question text to check
 * @returns True if the question is a multiple-choice question, false otherwise
 */
export function isMultipleChoiceQuestion(question: string): boolean {
  // Import the function from questionUtils
  // Using ES module dynamic import instead of require
  return /\b[A-D]\s*[\)\.].*\b[B-D]\s*[\)\.]/i.test(question) ||
         /\b[A-D]\s*[\)\.]\s*[^\n]+\n+\s*\b[B-D]\s*[\)\.]/i.test(question) ||
         /\b[1-4]\s*[\)\.]\s*[^\n]+\n+\s*\b[2-4]\s*[\)\.]/i.test(question) ||
         /choose\s+(one|the\s+correct|the\s+best)/i.test(question) ||
         /select\s+(one|the\s+correct|the\s+best)/i.test(question);
}

/**
 * Extracts questions from question paper text
 * @param text The text of the question paper
 * @returns An array of question objects with text and marks
 */
export const extractQuestionsFromText = (text: string): { number: number; text: string; marks: number }[] => {
  console.log("Extracting questions from text:", text.substring(0, 100) + "...");

  // Split the text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const questions: { number: number; text: string; marks: number }[] = [];
  let currentQuestionText = '';
  let currentQuestionNumber = 0;
  let currentMarks = 0;

  // Regular expressions for detecting question patterns
  const questionStartRegex = /^(?:Q|Question|Ques)\.?\s*(\d+)[.:]?\s*(.*)/i;
  const marksRegex = /\((\d+)\s*(?:marks|mark|points|point)\)/i;
  const standaloneNumberRegex = /^(\d+)[.:]?\s*(.*)/;

  // Special handling for MCQ-only papers
  // Check if this looks like an MCQ-only paper by scanning for option patterns
  let mcqCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^[A-D][\.\)]\s+/.test(lines[i])) {
      mcqCount++;
    }
  }

  // If we have a significant number of MCQ option lines, this is likely an MCQ paper
  const isMCQPaper = mcqCount > 5;

  // Special handling for MCQ papers
  if (isMCQPaper) {
    console.log("Detected MCQ-only paper, using specialized extraction");

    let currentQuestion = "";
    let questionNumber = 0;
    let collectingOptions = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line starts a new question
      const questionMatch = line.match(questionStartRegex) || line.match(standaloneNumberRegex);

      if (questionMatch) {
        // If we were already processing a question, save it
        if (questionNumber > 0 && currentQuestion.length > 0) {
          // Check if we have collected a complete MCQ (question + options)
          if (isMultipleChoiceQuestion(currentQuestion)) {
            questions.push({
              number: questionNumber,
              text: currentQuestion.trim(),
              marks: 1 // Default to 1 mark per MCQ, but this will be overridden by user input
            });
          }
        }

        // Start a new question
        questionNumber = parseInt(questionMatch[1]);
        currentQuestion = questionMatch[2] || '';
        collectingOptions = true;
      }
      // Check if this is an option line (A, B, C, D)
      else if (collectingOptions && /^[A-D][\.\)]\s+/.test(line)) {
        // Add this option to the current question
        currentQuestion += '\n' + line;
      }
      // Check if this might be the end of options
      else if (collectingOptions && currentQuestion.length > 0) {
        // If we've already collected some options and this isn't an option line,
        // it might be the start of the next question without a clear number
        if (isMultipleChoiceQuestion(currentQuestion)) {
          // We have a complete MCQ, save it
          questions.push({
            number: questionNumber,
            text: currentQuestion.trim(),
            marks: 1 // Default to 1 mark for MCQs
          });

          // Start a new question (without a clear number)
          questionNumber = questions.length + 1;
          currentQuestion = line;
          collectingOptions = true;
        } else {
          // Still collecting the current question
          currentQuestion += '\n' + line;
        }
      } else {
        // If we're not collecting options yet, this might be the start of a question
        // without a clear number marker
        if (currentQuestion.length === 0) {
          questionNumber = 1;
          currentQuestion = line;
          collectingOptions = true;
        } else {
          // Otherwise, add to the current question
          currentQuestion += '\n' + line;
        }
      }
    }

    // Add the last question if there is one
    if (questionNumber > 0 && currentQuestion.length > 0) {
      if (isMultipleChoiceQuestion(currentQuestion)) {
        questions.push({
          number: questionNumber,
          text: currentQuestion.trim(),
          marks: 1 // Default to 1 mark for MCQs
        });
      }
    }
  }
  // Standard question extraction for non-MCQ papers
  else {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line starts a new question
      const questionMatch = line.match(questionStartRegex) || line.match(standaloneNumberRegex);

      if (questionMatch) {
        // If we were already processing a question, save it
        if (currentQuestionNumber > 0 && currentQuestionText.length > 0) {
          questions.push({
            number: currentQuestionNumber,
            text: currentQuestionText.trim(),
            marks: currentMarks > 0 ? currentMarks : 5 // Default to 5 marks if not specified
          });
        }

        // Start a new question
        currentQuestionNumber = parseInt(questionMatch[1]);
        currentQuestionText = questionMatch[2] || '';

        // Check for marks in this line
        const marksMatch = line.match(marksRegex);
        currentMarks = marksMatch ? parseInt(marksMatch[1]) : 0;
      } else {
        // This line is part of the current question
        if (currentQuestionNumber > 0) {
          // Check if this line contains marks information
          const marksMatch = line.match(marksRegex);
          if (marksMatch && currentMarks === 0) {
            currentMarks = parseInt(marksMatch[1]);
          }

          // Add this line to the current question text
          currentQuestionText += ' ' + line;
        }
      }
    }

    // Add the last question if there is one
    if (currentQuestionNumber > 0 && currentQuestionText.length > 0) {
      questions.push({
        number: currentQuestionNumber,
        text: currentQuestionText.trim(),
        marks: currentMarks > 0 ? currentMarks : 5 // Default to 5 marks if not specified
      });
    }
  }

  // If no questions were found, try a simpler approach
  if (questions.length === 0) {
    console.log("No questions found with standard format, trying simpler approach");

    // Split by double newlines to separate paragraphs
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      // Check if this paragraph looks like a question
      if (paragraph.includes('?') || /\b(explain|describe|discuss|define|what|how|why)\b/i.test(paragraph)) {
        questions.push({
          number: i + 1,
          text: paragraph,
          marks: 5 // Default to 5 marks
        });
      } else if (isMultipleChoiceQuestion(paragraph)) {
        // This paragraph is an MCQ
        questions.push({
          number: i + 1,
          text: paragraph,
          marks: 1 // Default to 1 mark per MCQ, but this will be overridden by user input
        });
      }
    }
  }

  console.log(`Extracted ${questions.length} questions:`, questions);
  return questions;
};

/**
 * Checks internet connectivity by making a request to the server's connectivity endpoint
 * @returns A promise that resolves to true if connected, false otherwise
 */
const checkInternetConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Use our own server endpoint to check connectivity to avoid CORS issues
    const response = await fetch(API_ENDPOINTS.CONNECTIVITY, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.connected === true;
    }

    return false;
  } catch (error) {
    console.error("Internet connectivity check failed:", error);
    return false;
  }
};

/**
 * Import the template service for fallback answers
 */

// Import the template service
import { getTemplateAnswer } from './templateService';

/**
 * Generates a model answer for a question using multiple fallback methods
 * For MCQ questions, returns only the letter of the correct answer
 * For non-MCQ questions, returns a concise answer
 * @param questionText The text of the question to generate an answer for
 * @returns The generated model answer
 */
export const generateModelAnswer = async (questionText: string): Promise<string> => {
  console.log("Generating model answer for question:", questionText);

  // Check if this is an MCQ question
  const isMCQ = isMultipleChoiceQuestion(questionText);

  console.log(`Question type: ${isMCQ ? 'Multiple-choice' : 'Open-ended'}, generating answer`);

  // Try multiple methods to generate an answer, with fallbacks

  // Method 1: Try OpenAI API (direct client-side call)
  try {
    console.log("Attempting to generate answer with OpenAI API");

    const { generateOpenAIAnswer } = await import('@/services/openaiService');
    const openaiAnswer = await generateOpenAIAnswer(questionText, isMCQ);
    if (openaiAnswer && openaiAnswer.trim().length > 0) {
      console.log("Successfully generated answer with OpenAI API");
      return openaiAnswer;
    }
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    // Continue to next method
  }

  // Method 3: Try server API (Model API through server proxy)
  try {
    console.log("Attempting to generate answer with Model API through server");

    // Clean up the question text to fix common OCR issues
    const cleanedQuestionText = questionText
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase letters
      .replace(/\s*\)\s*/g, ') ') // Normalize spacing around closing parentheses
      .replace(/\s*\.\s*/g, '. '); // Normalize spacing around periods

    console.log("Cleaned question text:", cleanedQuestionText);

    // For MCQ questions, try to extract and format the options
    let formattedQuestion = cleanedQuestionText;

    // Check if this is an MCQ question
    if (isMCQ) {
      // Try to extract the question and options
      const optionMatches = cleanedQuestionText.match(/([A-Da-d])[\.|\)]\s*([^\n]+)/g);

      if (optionMatches && optionMatches.length >= 2) {
        // Extract the main question part (everything before the first option)
        const questionPart = cleanedQuestionText.split(/[A-Da-d][\.|\)]/)[0].trim();

        // Format the question and options in a structured way
        formattedQuestion = `${questionPart}\n\nOptions:\n`;

        // Add each option on a new line
        optionMatches.forEach(option => {
          const optionLetter = option.match(/([A-Da-d])[\.|\)]/)[1].toUpperCase();
          const optionText = option.replace(/[A-Da-d][\.|\)]/, '').trim();
          formattedQuestion += `${optionLetter}) ${optionText}\n`;
        });
      }
    }

    console.log("Formatted question:", formattedQuestion);
    console.log("Sending request to Model API through server proxy");

    // Prepare request parameters based on question type
    const requestParams = {
      model: "gpt-3.5-turbo",
      prompt: ""
    };

    // For MCQ questions, use specific parameters for short, deterministic answers
    if (isMCQ) {
      // For MCQ questions, use a specialized prompt that helps the model understand the format
      const mcqPrompt = `You are a highly accurate model answer generator for multiple choice questions.

Given a question and its options, your task is to select the correct option (A, B, C, or D) and provide ONLY the letter as your answer.

Instructions:
- Read the question and all options carefully
- Select the most accurate answer
- Respond with ONLY the letter of the correct option (A, B, C, or D)
- Do NOT provide explanations, reasoning, or any additional text
- If options are labeled with lowercase letters (a, b, c, d), convert your answer to uppercase

Example:
Question: Which planet is closest to the sun?
Options:
A) Earth
B) Venus
C) Mercury
D) Mars
Answer: C

Question: ${formattedQuestion}`;

      requestParams.prompt = mcqPrompt;
      requestParams.temperature = 0.1;  // Use low temperature for more deterministic answers
      requestParams.max_tokens = 5;     // Only need a few tokens for the letter
      requestParams.top_p = 0.95;
    } else {
      // For non-MCQ questions, use a specialized prompt for keyword extraction
      const nonMcqPrompt = `You are a highly accurate model answer generator for exam questions.

Given a question, your task is to provide a concise answer with only the essential keywords and concepts.

Instructions:
- Read the question carefully
- Identify the key concepts and terms that should be included in an ideal answer
- Provide ONLY a comma-separated list of these key terms and concepts
- Do NOT write complete sentences, explanations, or reasoning
- Do NOT use bullet points or numbering
- Include ONLY the essential keywords that would be used to grade a student's answer

Example:
Question: Explain the process of photosynthesis.
Answer: chlorophyll, sunlight, carbon dioxide, water, glucose, oxygen, energy conversion, light-dependent reactions, Calvin cycle, thylakoid membrane

Question: ${formattedQuestion}`;

      requestParams.prompt = nonMcqPrompt;
      requestParams.temperature = 0.3;  // Slightly higher temperature for more creative answers
      requestParams.max_tokens = 800;   // Allow for longer answers
      requestParams.top_p = 0.9;
    }

    // Use the server proxy endpoint to make the request
    const response = await fetch(API_ENDPOINTS.MODEL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestParams)
    });

    // Check if the request was successful
    if (response.ok) {
      // Parse the response
      const result = await response.json();
      console.log("API response received from Model API server:", JSON.stringify(result).substring(0, 200) + "...");

      // Extract the generated text from Model API response
      let modelAnswer = "";

      // Handle Model API response format
      if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
        modelAnswer = result.choices[0]?.message?.content || "";
        console.log("Extracted from Model API response:", modelAnswer);

        // Clean up the model answer
        modelAnswer = modelAnswer.trim();

        // If a valid answer was generated, return it
        if (modelAnswer && modelAnswer.trim().length > 0) {
          console.log("Successfully generated answer with Model API through server");
          return modelAnswer;
        }
      }
    }
  } catch (error) {
    console.error("Error with Model API through server:", error);
    // Continue to next method
  }

  // Method 4: Try template matching
  console.log("Trying template matching");
  const templateAnswer = getTemplateAnswer(questionText);
  if (templateAnswer) {
    console.log("Found matching template answer");
    return templateAnswer;
  }

  // Method 5: Return a generic answer if all else fails
  console.log("All methods failed, returning generic answer");
  return `This is a model answer for the question: "${questionText}".

Unfortunately, we couldn't generate a specific answer at this time. Please try again later when internet connectivity is restored.

In a real exam, you would want to:
1. Understand the key concepts related to this topic
2. Provide clear explanations with relevant examples
3. Structure your answer logically with an introduction, body, and conclusion
4. Address all parts of the question
5. Use appropriate terminology and technical language

Please check your internet connection and try again, or consult your course materials for the correct answer.`;
};





export const analyzeHandwriting = async (imageUrl: string): Promise<HandwritingAnalysisResult> => {
  console.log("Analyzing handwriting from image:", imageUrl);

  try {
    // First, extract text from the image using OCR
    const extractedText = await extractTextFromImage(imageUrl);

    // If text extraction failed, return a basic analysis
    if (!extractedText || extractedText.includes("Error processing") || extractedText.includes("No text could be extracted")) {
      return generateBasicHandwritingAnalysis();
    }

    // Analyze the extracted text for handwriting characteristics
    const analysis = analyzeHandwritingCharacteristics(extractedText, imageUrl);

    // Generate concise handwriting feedback for evaluation results
    analysis.conciseFeedback = generateConciseHandwritingFeedback(analysis.feedbackItems);

    return analysis;
  } catch (error) {
    console.error("Error analyzing handwriting:", error);

    // Return a fallback analysis in case of error
    return generateBasicHandwritingAnalysis();
  }
};

/**
 * Analyzes handwriting characteristics from extracted text and image
 * @param extractedText The text extracted from the image
 * @param imageUrl The URL of the image (for potential image-based analysis)
 * @returns A handwriting analysis result
 */
const analyzeHandwritingCharacteristics = (extractedText: string, imageUrl: string): HandwritingAnalysisResult => {
  // Analyze text characteristics
  const textLength = extractedText.length;
  const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
  const words = extractedText.split(/\s+/).filter(word => word.trim().length > 0);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1);

  // Check for common issues in OCR text that might indicate handwriting problems
  const inconsistentSpacing = /\s{3,}/.test(extractedText);
  const mixedCase = /[A-Z][a-z]+[A-Z]/.test(extractedText);
  const symbolNoise = (extractedText.match(/[^a-zA-Z0-9\s.,;:?!'"()\-]/g) || []).length;
  const repeatedChars = /(.)\1{3,}/.test(extractedText);

  // Generate feedback items based on analysis
  const feedbackItems: HandwritingFeedback[] = [];

  // Legibility analysis
  const legibilityScore = calculateLegibilityScore(extractedText, symbolNoise);
  feedbackItems.push({
    category: "Legibility",
    score: legibilityScore,
    feedback: generateLegibilityFeedback(legibilityScore),
    suggestions: generateLegibilitySuggestions(legibilityScore, symbolNoise)
  });

  // Spacing analysis
  const spacingScore = calculateSpacingScore(extractedText, inconsistentSpacing);
  feedbackItems.push({
    category: "Spacing",
    score: spacingScore,
    feedback: generateSpacingFeedback(spacingScore, inconsistentSpacing),
    suggestions: generateSpacingSuggestions(spacingScore)
  });

  // Alignment analysis
  const alignmentScore = calculateAlignmentScore(lines);
  feedbackItems.push({
    category: "Alignment",
    score: alignmentScore,
    feedback: generateAlignmentFeedback(alignmentScore),
    suggestions: generateAlignmentSuggestions(alignmentScore)
  });

  // Letter formation analysis
  const letterFormationScore = calculateLetterFormationScore(extractedText, symbolNoise, mixedCase);
  feedbackItems.push({
    category: "Letter Formation",
    score: letterFormationScore,
    feedback: generateLetterFormationFeedback(letterFormationScore),
    suggestions: generateLetterFormationSuggestions(letterFormationScore, mixedCase)
  });

  // Consistency analysis
  const consistencyScore = calculateConsistencyScore(extractedText, mixedCase, repeatedChars);
  feedbackItems.push({
    category: "Consistency",
    score: consistencyScore,
    feedback: generateConsistencyFeedback(consistencyScore),
    suggestions: generateConsistencySuggestions(consistencyScore)
  });

  // Calculate overall score (weighted average of all categories)
  const weights = {
    Legibility: 0.3,
    Spacing: 0.2,
    Alignment: 0.15,
    "Letter Formation": 0.2,
    Consistency: 0.15
  };

  let weightedSum = 0;
  let totalWeight = 0;

  feedbackItems.forEach(item => {
    const weight = weights[item.category as keyof typeof weights] || 0.2;
    weightedSum += item.score * weight;
    totalWeight += weight;
  });

  const overallScore = Math.round(weightedSum / totalWeight);

  return {
    overallScore,
    feedbackItems
  };
};

/**
 * Generates a basic handwriting analysis when detailed analysis is not possible
 * @returns A basic handwriting analysis result
 */
const generateBasicHandwritingAnalysis = (): HandwritingAnalysisResult => {
  const feedbackItems: HandwritingFeedback[] = [
    {
      category: "Legibility",
      score: 6,
      feedback: "The handwriting appears to have some legibility issues.",
      suggestions: ["Practice writing more clearly", "Ensure proper letter formation"]
    },
    {
      category: "Spacing",
      score: 6,
      feedback: "Spacing between words and letters could be improved.",
      suggestions: ["Maintain consistent spacing between words", "Leave adequate space between letters"]
    },
    {
      category: "Alignment",
      score: 7,
      feedback: "Text alignment appears to be generally consistent.",
      suggestions: ["Practice writing on lined paper"]
    },
    {
      category: "Letter Formation",
      score: 6,
      feedback: "Some letters may be inconsistently formed.",
      suggestions: ["Practice forming letters consistently", "Pay attention to letter shapes"]
    },
    {
      category: "Consistency",
      score: 6,
      feedback: "The overall consistency of the handwriting could be improved.",
      suggestions: ["Maintain consistent style throughout writing", "Practice writing at a steady pace"]
    }
  ];

  const conciseFeedback = [
    "Work on handwriting clarity for better readability.",
    "Maintain consistent letter formation and spacing."
  ];

  return {
    overallScore: 6,
    feedbackItems,
    conciseFeedback
  };
};

/**
 * Generates concise handwriting feedback for evaluation results
 * @param feedbackItems The detailed handwriting feedback items
 * @returns An array of concise feedback points
 */
const generateConciseHandwritingFeedback = (feedbackItems: HandwritingFeedback[]): string[] => {
  const feedback: string[] = [];

  // Find the lowest scoring categories
  const sortedItems = [...feedbackItems].sort((a, b) => a.score - b.score);
  const lowestItems = sortedItems.slice(0, 2);

  // Add feedback for the lowest scoring categories
  lowestItems.forEach(item => {
    switch (item.category) {
      case "Legibility":
        if (item.score < 7) {
          feedback.push("Improve handwriting clarity for better readability.");
        }
        break;
      case "Spacing":
        if (item.score < 7) {
          feedback.push("Work on consistent spacing between words and letters.");
        }
        break;
      case "Alignment":
        if (item.score < 7) {
          feedback.push("Practice writing on lined paper to maintain straight lines.");
        }
        break;
      case "Letter Formation":
        if (item.score < 7) {
          feedback.push("Focus on forming letters consistently and clearly.");
        }
        break;
      case "Consistency":
        if (item.score < 7) {
          feedback.push("Maintain consistent handwriting style throughout your answers.");
        }
        break;
    }
  });

  // If we don't have enough feedback, add a general one
  if (feedback.length < 1) {
    feedback.push("Continue practicing your handwriting for optimal presentation.");
  }

  return feedback;
};

/**
 * Calculates a legibility score based on text characteristics
 */
const calculateLegibilityScore = (text: string, symbolNoise: number): number => {
  let score = 8; // Start with a good score

  // Deduct for issues that affect legibility
  if (symbolNoise > 10) score -= 3;
  else if (symbolNoise > 5) score -= 2;
  else if (symbolNoise > 0) score -= 1;

  // Check for other legibility issues
  if (/[0o1l|I]/.test(text)) score -= 1; // Commonly confused characters

  // Ensure score is within bounds
  return Math.max(1, Math.min(10, score));
};

/**
 * Generates feedback for legibility score
 */
const generateLegibilityFeedback = (score: number): string => {
  if (score >= 9) return "The handwriting is very clear and easily readable.";
  if (score >= 7) return "The handwriting is generally readable with minor clarity issues.";
  if (score >= 5) return "The handwriting is readable but some letters are difficult to distinguish.";
  if (score >= 3) return "The handwriting has significant legibility issues making some words difficult to read.";
  return "The handwriting is very difficult to read with major legibility problems.";
};

/**
 * Generates suggestions for improving legibility
 */
const generateLegibilitySuggestions = (score: number, symbolNoise: number): string[] => {
  const suggestions: string[] = [];

  if (score < 8) suggestions.push("Focus on forming clear, distinct letters");
  if (score < 6) suggestions.push("Practice writing more slowly to improve clarity");
  if (symbolNoise > 5) suggestions.push("Avoid unnecessary marks or corrections that can confuse readers");

  return suggestions.length > 0 ? suggestions : ["Maintain your current level of clarity"];
};

/**
 * Calculates a spacing score based on text characteristics
 */
const calculateSpacingScore = (text: string, inconsistentSpacing: boolean): number => {
  let score = 8; // Start with a good score

  // Deduct for spacing issues
  if (inconsistentSpacing) score -= 2;
  if (/\w\w\s\s\s\w/.test(text)) score -= 1; // Extra spaces
  if (/\w\w\w\w\w\w\w\w\w\w+/.test(text)) score -= 1; // Long words without spaces

  // Ensure score is within bounds
  return Math.max(1, Math.min(10, score));
};

/**
 * Generates feedback for spacing score
 */
const generateSpacingFeedback = (score: number, inconsistentSpacing: boolean): string => {
  if (score >= 9) return "Word and letter spacing is excellent and consistent.";
  if (score >= 7) return "Spacing is generally good with minor inconsistencies.";
  if (score >= 5) return "Word spacing is somewhat inconsistent, making some sentences harder to read.";
  if (inconsistentSpacing) return "Spacing between words and letters varies significantly, affecting readability.";
  return "Spacing issues make the text difficult to read and understand.";
};

/**
 * Generates suggestions for improving spacing
 */
const generateSpacingSuggestions = (score: number): string[] => {
  const suggestions: string[] = [];

  if (score < 8) suggestions.push("Maintain consistent word spacing");
  if (score < 6) suggestions.push("Leave adequate space between words");
  if (score < 4) suggestions.push("Practice writing on lined paper with word spacing guides");

  return suggestions.length > 0 ? suggestions : ["Continue maintaining good spacing between words and letters"];
};

/**
 * Calculates an alignment score based on text lines
 */
const calculateAlignmentScore = (lines: string[]): number => {
  let score = 8; // Start with a good score

  // Check for alignment issues
  if (lines.length < 2) return score; // Not enough lines to judge alignment

  const lineStarts = lines.map(line => line.search(/\S/)).filter(pos => pos >= 0);
  const avgStart = lineStarts.reduce((sum, pos) => sum + pos, 0) / lineStarts.length;
  const maxDeviation = Math.max(...lineStarts.map(pos => Math.abs(pos - avgStart)));

  // Deduct based on alignment deviation
  if (maxDeviation > 10) score -= 3;
  else if (maxDeviation > 5) score -= 2;
  else if (maxDeviation > 2) score -= 1;

  // Ensure score is within bounds
  return Math.max(1, Math.min(10, score));
};

/**
 * Generates feedback for alignment score
 */
const generateAlignmentFeedback = (score: number): string => {
  if (score >= 9) return "Text is excellently aligned with consistent margins and baselines.";
  if (score >= 7) return "Text is mostly well-aligned with only minor deviations from the baseline.";
  if (score >= 5) return "Text alignment is acceptable but shows some inconsistency.";
  if (score >= 3) return "Text alignment varies significantly, affecting the overall presentation.";
  return "Poor text alignment makes the writing appear disorganized.";
};

/**
 * Generates suggestions for improving alignment
 */
const generateAlignmentSuggestions = (score: number): string[] => {
  const suggestions: string[] = [];

  if (score < 8) suggestions.push("Practice writing on lined paper to maintain consistent alignment");
  if (score < 6) suggestions.push("Pay attention to starting each line at the same position");
  if (score < 4) suggestions.push("Use a guide sheet under your paper to help maintain straight lines");

  return suggestions.length > 0 ? suggestions : ["Continue maintaining good text alignment"];
};

/**
 * Calculates a letter formation score based on text characteristics
 */
const calculateLetterFormationScore = (text: string, symbolNoise: number, mixedCase: boolean): number => {
  let score = 8; // Start with a good score

  // Deduct for letter formation issues
  if (symbolNoise > 5) score -= 2;
  if (mixedCase) score -= 1;
  if (/[a-z][A-Z]/.test(text)) score -= 1; // Mixed case within words

  // Ensure score is within bounds
  return Math.max(1, Math.min(10, score));
};

/**
 * Generates feedback for letter formation score
 */
const generateLetterFormationFeedback = (score: number): string => {
  if (score >= 9) return "Letters are well-formed and consistent throughout the text.";
  if (score >= 7) return "Letter formation is generally good with minor inconsistencies.";
  if (score >= 5) return "Some letters are malformed or inconsistent in style.";
  if (score >= 3) return "Many letters are poorly formed, making the text difficult to read.";
  return "Letter formation is very inconsistent and affects overall readability.";
};

/**
 * Generates suggestions for improving letter formation
 */
const generateLetterFormationSuggestions = (score: number, mixedCase: boolean): string[] => {
  const suggestions: string[] = [];

  if (score < 8) suggestions.push("Practice consistent letter shapes");
  if (score < 6) suggestions.push("Focus on problematic letters that are difficult to read");
  if (mixedCase) suggestions.push("Maintain consistent case (uppercase or lowercase) within words");

  return suggestions.length > 0 ? suggestions : ["Continue forming letters clearly and consistently"];
};

/**
 * Calculates a consistency score based on text characteristics
 */
const calculateConsistencyScore = (text: string, mixedCase: boolean, repeatedChars: boolean): number => {
  let score = 8; // Start with a good score

  // Deduct for consistency issues
  if (mixedCase) score -= 1;
  if (repeatedChars) score -= 1;
  if (/[a-z][A-Z][a-z]/.test(text)) score -= 1; // Inconsistent capitalization

  // Ensure score is within bounds
  return Math.max(1, Math.min(10, score));
};

/**
 * Generates feedback for consistency score
 */
const generateConsistencyFeedback = (score: number): string => {
  if (score >= 9) return "The handwriting style is very consistent throughout the text.";
  if (score >= 7) return "The handwriting shows good consistency with minor variations.";
  if (score >= 5) return "The slant and size of letters varies throughout the text.";
  if (score >= 3) return "Significant inconsistency in handwriting style affects readability.";
  return "The handwriting lacks consistency, with major variations in style, size, and slant.";
};

/**
 * Generates suggestions for improving consistency
 */
const generateConsistencySuggestions = (score: number): string[] => {
  const suggestions: string[] = [];

  if (score < 8) suggestions.push("Maintain consistent slant");
  if (score < 6) suggestions.push("Keep letter sizes uniform");
  if (score < 4) suggestions.push("Practice writing at a steady pace to maintain consistency");

  return suggestions.length > 0 ? suggestions : ["Continue maintaining consistent handwriting style"];
};

/**
 * Analyzes handwriting from text
 * @param handwritingText The text to analyze
 * @returns A simple handwriting analysis with score and reason
 */
export const analyzeHandwritingFromText = (handwritingText: string): { neatness_score: number, reason: string } => {
  // Check for common issues in OCR text that might indicate messy handwriting
  const inconsistentSpacing = /\s{3,}/.test(handwritingText);
  const mixedCase = /[A-Z][a-z]+[A-Z]/.test(handwritingText);
  const symbolNoise = (handwritingText.match(/[^a-zA-Z0-9\s.,;:?!'"()\-]/g) || []).length;

  // Analyze text structure
  const sentences = handwritingText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / (sentences.length || 1);
  const sentenceLengthVariability = sentences.reduce((sum, s) => sum + Math.abs(s.length - avgSentenceLength), 0) / (sentences.length || 1);

  // Calculate base score
  let score = 8; // Start with default good score

  // Deduct for issues
  if (inconsistentSpacing) score -= 1;
  if (mixedCase) score -= 1;
  if (symbolNoise > 5) score -= 2;
  else if (symbolNoise > 0) score -= 1;

  // Adjust for sentence structure
  if (sentenceLengthVariability > 20) score -= 1;

  // Ensure score is within bounds
  score = Math.max(1, Math.min(10, score));

  // Generate reason
  const reasons = [];
  if (score >= 9) reasons.push("The handwriting appears very neat and consistent.");
  else if (score >= 7) reasons.push("The handwriting is generally clear and legible.");
  else if (score >= 5) reasons.push("The handwriting is readable but shows some inconsistencies.");
  else reasons.push("The handwriting shows significant clarity issues.");

  if (inconsistentSpacing) reasons.push("Inconsistent spacing detected.");
  if (mixedCase) reasons.push("Irregular capitalization observed.");
  if (symbolNoise > 0) reasons.push("Some unusual symbols or corrections present.");

  return {
    neatness_score: score,
    reason: reasons.join(" ")
  };
};

/**
 * Generates JSON output for exam evaluation
 * @param marksAwarded The marks awarded
 * @param keyPointsCovered The key points covered
 * @param keyPointsMissing The key points missing
 * @param evaluationReason The evaluation reason
 * @returns A JSON string with the evaluation results
 */
export const generateAnswerEvaluationJSON = (
  marksAwarded: number,
  keyPointsCovered: string[],
  keyPointsMissing: string[],
  evaluationReason: string
): string => {
  return JSON.stringify({
    marks_awarded: marksAwarded.toString(),
    key_points_covered: keyPointsCovered,
    key_points_missing: keyPointsMissing,
    evaluation_reason: evaluationReason
  }, null, 2);
};

/**
 * Generates JSON output for handwriting analysis
 * @param neatnessScore The neatness score
 * @param reason The reason for the score
 * @returns A JSON string with the handwriting analysis
 */
export const generateHandwritingAnalysisJSON = (
  neatnessScore: number,
  reason: string
): string => {
  return JSON.stringify({
    neatness_score: neatnessScore.toString(),
    reason: reason
  }, null, 2);
};

/**
 * Post-processes OCR text to improve quality
 * @param text The raw OCR text
 * @param isQuestionPaper Whether the text is from a question paper
 * @returns The processed text
 */
const postProcessOCRText = (text: string, isQuestionPaper: boolean): string => {
  // Preserve original text for debugging
  console.log("Original OCR text:", text);

  // First, fix missing spaces between words (common OCR issue)
  let processedText = text.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between lowercase and uppercase letters

  // Then normalize whitespace (but don't remove all spaces)
  processedText = processedText.replace(/\s{2,}/g, ' '); // Replace multiple spaces with a single space

  // Fix common OCR errors
  processedText = processedText
    .replace(/[|]l/g, 'I') // Fix pipe character and lowercase L to uppercase I
    .replace(/[0O]/g, (match) => /[a-z]/i.test(processedText[processedText.indexOf(match) - 1] || '') ? 'o' : match) // Fix 0 to o when in words
    .replace(/[1]/g, (match) => /[a-z]/i.test(processedText[processedText.indexOf(match) - 1] || '') ? 'l' : match) // Fix 1 to l when in words
    .replace(/\b[0O]ne\b/g, 'One')
    .replace(/\b[0O]f\b/g, 'of')
    .replace(/\b[1I]n\b/g, 'In')
    .replace(/\b[1I]s\b/g, 'is')
    .replace(/\b[1I]t\b/g, 'it')
    .replace(/\b[1I]f\b/g, 'if')
    .replace(/\b[5S]o\b/g, 'So')
    .replace(/\b[5S]e\b/g, 'Se')
    .replace(/\b[8B]e\b/g, 'Be')
    .replace(/\b[8B]y\b/g, 'By');

  // Fix punctuation spacing
  processedText = processedText
    .replace(/\s+([.,;:?!])/g, '$1')
    .replace(/([.,;:?!])([a-zA-Z])/g, '$1 $2');

  // Fix paragraph breaks
  processedText = processedText.replace(/([a-z])\s+([A-Z])/g, '$1\n\n$2');

  // Special processing for question papers
  if (isQuestionPaper) {
    // Fix question numbering
    processedText = processedText
      .replace(/(\d+)\s*\.\s*/g, '\n$1. ')
      .replace(/\b([Qq]uestion|Q)\s*(\d+)/g, '\nQuestion $2');

    // Fix marks indicators
    processedText = processedText
      .replace(/\[(\d+)\s*[mM]arks?\]/g, '[$1 marks]')
      .replace(/\((\d+)\s*[mM]arks?\)/g, '($1 marks)');

    // Extract total marks if present
    const totalMarksMatch = processedText.match(/[Tt]otal\s*[Mm]arks\s*:?\s*(\d+)/);
    if (totalMarksMatch) {
      processedText += `\n\nTotal Marks: ${totalMarksMatch[1]}`;
    }
  }

  return processedText.trim();
};
