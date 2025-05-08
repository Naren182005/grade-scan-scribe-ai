
export interface Question {
  id: string;
  text: string;
  totalMarks: number;
  modelAnswer: string;
  questionPaper?: string; // Text content of the question paper
  questionPaperImageUrl?: string; // URL to the question paper image if uploaded
  options?: string[]; // For MCQ questions
  correctOption?: number; // Index of correct option for MCQ
  questionType: 'essay' | 'mcq';
}

export interface StudentAnswer {
  questionId: string;
  answerText: string;
  imageUrl?: string;
  selectedOption?: number; // For MCQ questions
}

export interface EvaluationResult {
  marksAwarded: number;
  keyPointsCovered: string[];
  keyPointsMissing: string[];
  evaluationReason: string;
  isCorrect?: boolean; // For MCQ questions
  correctOption?: number; // For MCQ questions
}

export type AppStep = 'scan-question' | 'scan-answer' | 'evaluate' | 'results' | 'send-results';
