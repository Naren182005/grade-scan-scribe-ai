
export interface Question {
  id: string;
  text: string;
  totalMarks: number;
  modelAnswer: string;
}

export interface StudentAnswer {
  questionId: string;
  answerText: string;
  imageUrl?: string;
}

export interface EvaluationResult {
  marksAwarded: number;
  keyPointsCovered: string[];
  keyPointsMissing: string[];
  evaluationReason: string;
}

export type AppStep = 'scan' | 'evaluate' | 'results';
