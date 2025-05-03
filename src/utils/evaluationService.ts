
import { EvaluationResult } from "@/types";

// This is a mock evaluation service that would eventually connect to an AI service
export const evaluateAnswer = async (
  questionText: string,
  totalMarks: number,
  modelAnswer: string,
  studentAnswer: string
): Promise<EvaluationResult> => {
  // In a real implementation, this would call an AI service API
  console.log("Evaluating answer for question:", questionText);
  
  // For demo purposes, we'll return a mock result
  // In production, this would be the response from an AI model
  return {
    marksAwarded: Math.round(totalMarks * 0.8), // Mock score (80%)
    keyPointsCovered: [
      "First key point from the model answer",
      "Second key point from the model answer"
    ],
    keyPointsMissing: [
      "Third key point that was missing"
    ],
    evaluationReason: "The student covered most key points but missed some important details."
  };
};

// Function to extract text from an image (OCR)
// This would connect to a real OCR service in production
export const extractTextFromImage = async (imageUrl: string): Promise<string> => {
  // Mock implementation - in production this would call an OCR service
  console.log("Extracting text from image:", imageUrl);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock extracted text
  return "This is extracted text from the student's answer sheet that would be processed by an OCR service in production.";
};
