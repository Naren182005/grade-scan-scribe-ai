
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationResult } from "@/types";
import { evaluateAnswer } from "@/utils/evaluationServices";
import { toast } from "@/components/ui/sonner";
import { FileTextIcon, ClipboardCheckIcon } from "lucide-react";
import QuestionTypeToggle from "./evaluation/QuestionTypeToggle";
import QuestionPaperSection from "./evaluation/QuestionPaperSection";
import StudentAnswerSection from "./evaluation/StudentAnswerSection";

interface EvaluationFormProps {
  studentAnswerText: string;
  imageUrl: string;
  onEvaluationComplete: (result: EvaluationResult) => void;
  onQuestionTypeChange: (type: 'essay' | 'mcq') => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  studentAnswerText,
  imageUrl,
  onEvaluationComplete,
  onQuestionTypeChange
}) => {
  const [question, setQuestion] = useState({
    text: '',
    totalMarks: 10,
    modelAnswer: '',
    questionPaper: ''
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState<string>(studentAnswerText);
  const [questionPaperImageUrl, setQuestionPaperImageUrl] = useState<string>('');
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestion(prev => ({
      ...prev,
      [name]: name === 'totalMarks' ? Number(value) : value
    }));
  };

  const handleStudentAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStudentAnswer(e.target.value);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.text || !question.modelAnswer) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsEvaluating(true);
    
    try {
      const result = await evaluateAnswer(
        question.text,
        question.totalMarks,
        question.modelAnswer,
        studentAnswer
      );
      
      onEvaluationComplete(result);
      toast.success("Evaluation complete!");
    } catch (error) {
      console.error("Evaluation error:", error);
      toast.error("Failed to evaluate answer");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg border-app-teal-100">
      <form onSubmit={handleEvaluate} className="p-6">
        <div className="space-y-5">
          <h2 className="font-semibold text-xl text-app-blue-900 mb-2 flex items-center">
            <ClipboardCheckIcon size={20} className="mr-2 text-app-teal-600" />
            Essay Question Evaluation
          </h2>
          
          <QuestionTypeToggle 
            onQuestionTypeChange={onQuestionTypeChange}
            currentType="essay"
          />
          
          <QuestionPaperSection
            questionPaper={question.questionPaper}
            setQuestionPaper={(value) => setQuestion(prev => ({ ...prev, questionPaper: value }))}
            questionPaperImageUrl={questionPaperImageUrl}
            setQuestionPaperImageUrl={setQuestionPaperImageUrl}
            showQuestionPaper={showQuestionPaper}
            setShowQuestionPaper={setShowQuestionPaper}
          />
          
          <div className="space-y-2">
            <Label htmlFor="question-text" className="text-app-blue-800">Question Text</Label>
            <Textarea
              id="question-text"
              name="text"
              value={question.text}
              onChange={handleInputChange}
              placeholder="Enter the question..."
              className="min-h-[80px] focus:border-app-teal-300"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total-marks" className="text-app-blue-800">Total Marks</Label>
            <Input
              id="total-marks"
              name="totalMarks"
              type="number"
              value={question.totalMarks}
              onChange={handleInputChange}
              min="1"
              max="100"
              className="focus:border-app-teal-300"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model-answer" className="text-app-blue-800">Model Answer</Label>
            <Textarea
              id="model-answer"
              name="modelAnswer"
              value={question.modelAnswer}
              onChange={handleInputChange}
              placeholder="Enter the model answer..."
              className="min-h-[120px] focus:border-app-teal-300"
              required
            />
          </div>
          
          <StudentAnswerSection
            studentAnswer={studentAnswer}
            onChange={handleStudentAnswerChange}
            imageUrl={imageUrl}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-app-teal-500 hover:bg-app-teal-600 transition-all duration-300 shadow-md"
            disabled={isEvaluating}
          >
            {isEvaluating ? 
              "Evaluating..." : 
              <span className="flex items-center gap-2"><ClipboardCheckIcon size={18} /> Evaluate Answer</span>
            }
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EvaluationForm;
