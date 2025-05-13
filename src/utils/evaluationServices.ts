
import { EvaluationResult } from "@/types";

// Exam answer evaluation function for essay questions
export const evaluateAnswer = async (
  questionText: string,
  totalMarks: number,
  modelAnswer: string,
  studentAnswer: string
): Promise<EvaluationResult> => {
  // In a real implementation, this would call an AI service API
  console.log("Evaluating answer for question:", questionText);
  
  // Basic analysis - identify key phrases from model answer that are present in student answer
  const modelKeyPhrases = extractKeyPhrases(modelAnswer);
  const coveredPoints: string[] = [];
  const missingPoints: string[] = [];
  
  modelKeyPhrases.forEach(phrase => {
    if (studentAnswer.toLowerCase().includes(phrase.toLowerCase())) {
      coveredPoints.push(phrase);
    } else {
      missingPoints.push(phrase);
    }
  });
  
  // Calculate score based on covered points
  const coverage = coveredPoints.length / modelKeyPhrases.length;
  const marksAwarded = Math.round(totalMarks * coverage);
  
  return {
    marksAwarded,
    keyPointsCovered: coveredPoints,
    keyPointsMissing: missingPoints,
    evaluationReason: generateEvaluationReason(coverage, totalMarks, marksAwarded)
  };
};

// MCQ evaluation function
export const evaluateMCQAnswer = async (
  questionText: string,
  totalMarks: number,
  correctOption: number,
  selectedOption: number
): Promise<EvaluationResult> => {
  console.log("Evaluating MCQ answer for question:", questionText);
  
  const isCorrect = correctOption === selectedOption;
  const marksAwarded = isCorrect ? totalMarks : 0;
  
  return {
    marksAwarded,
    keyPointsCovered: isCorrect ? ["Correct option selected"] : [],
    keyPointsMissing: isCorrect ? [] : ["Correct option was not selected"],
    evaluationReason: isCorrect 
      ? `Correct answer selected. Full marks awarded: ${marksAwarded}/${totalMarks}.`
      : `Incorrect answer selected. Option ${selectedOption + 1} was chosen, but the correct answer was option ${correctOption + 1}. 0/${totalMarks} marks awarded.`,
    isCorrect,
    correctOption
  };
};

// Generate MCQ options for a question
export const generateMCQOptions = async (questionText: string): Promise<string[]> => {
  console.log("Generating MCQ options for:", questionText);
  
  // In a real implementation, this would call an AI service
  // For demo purposes, we're generating mock options
  return [
    "Option A - This would be the first potential answer",
    "Option B - This would be the second potential answer",
    "Option C - This would be the third potential answer",
    "Option D - This would be the fourth potential answer"
  ];
};

// Helper function to extract key phrases from text
const extractKeyPhrases = (text: string): string[] => {
  // In a real app, this would use NLP techniques
  // For demo, we'll split by periods and commas to get phrases
  const rawPhrases = text.split(/[.,;]/).filter(p => p.trim().length > 0);
  
  // Remove duplicates and very short phrases
  return Array.from(new Set(rawPhrases))
    .map(p => p.trim())
    .filter(p => p.split(" ").length > 2);
};

// Generate explanation for evaluation
const generateEvaluationReason = (coverage: number, totalMarks: number, marksAwarded: number): string => {
  if (coverage > 0.9) {
    return `Excellent answer covering almost all key points. ${marksAwarded}/${totalMarks} marks awarded.`;
  } else if (coverage > 0.7) {
    return `Good answer with most key points covered. ${marksAwarded}/${totalMarks} marks awarded.`;
  } else if (coverage > 0.5) {
    return `Satisfactory answer covering some key points. ${marksAwarded}/${totalMarks} marks awarded.`;
  } else if (coverage > 0.3) {
    return `Basic answer with limited coverage of key points. ${marksAwarded}/${totalMarks} marks awarded.`;
  } else {
    return `Insufficient answer missing most key points. ${marksAwarded}/${totalMarks} marks awarded.`;
  }
};

// Handwriting analysis function
export const analyzeHandwriting = (handwritingText: string): { neatness_score: number, reason: string } => {
  // In real implementation, this would analyze the actual handwriting image
  // For demo, we'll use text length and variability as proxies for neatness
  
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

// Function to generate JSON output for exam evaluation
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

// Function to generate JSON output for handwriting analysis
export const generateHandwritingAnalysisJSON = (
  neatnessScore: number,
  reason: string
): string => {
  return JSON.stringify({
    neatness_score: neatnessScore.toString(),
    reason: reason
  }, null, 2);
};

// Function to extract text from images using OCR
export const extractTextFromImage = async (imageUrl: string): Promise<string> => {
  // Mock implementation - in production this would call an OCR service
  console.log("Extracting text from image:", imageUrl);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock extracted text
  return "This is extracted text from the student's answer sheet that would be processed by an OCR service in production.";
};
