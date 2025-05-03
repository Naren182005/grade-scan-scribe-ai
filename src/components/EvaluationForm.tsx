
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Question, StudentAnswer, EvaluationResult } from "@/types";
import { evaluateAnswer } from "@/utils/evaluationService";
import { toast } from "@/components/ui/sonner";

interface EvaluationFormProps {
  studentAnswerText: string;
  imageUrl: string;
  onEvaluationComplete: (result: EvaluationResult) => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  studentAnswerText,
  imageUrl,
  onEvaluationComplete
}) => {
  const [question, setQuestion] = useState<Partial<Question>>({
    text: '',
    totalMarks: 10,
    modelAnswer: ''
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState<string>(studentAnswerText);

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
        question.text!,
        question.totalMarks || 10,
        question.modelAnswer!,
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
    <Card className="overflow-hidden">
      <form onSubmit={handleEvaluate} className="p-4">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-app-blue-900">Evaluation Details</h2>
          
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              name="text"
              value={question.text}
              onChange={handleInputChange}
              placeholder="Enter the question..."
              className="min-h-[80px]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total-marks">Total Marks</Label>
            <Input
              id="total-marks"
              name="totalMarks"
              type="number"
              value={question.totalMarks}
              onChange={handleInputChange}
              min="1"
              max="100"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model-answer">Model Answer</Label>
            <Textarea
              id="model-answer"
              name="modelAnswer"
              value={question.modelAnswer}
              onChange={handleInputChange}
              placeholder="Enter the model answer..."
              className="min-h-[120px]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="student-answer">Student's Answer (Scanned)</Label>
              <Button 
                type="button" 
                variant="link" 
                className="text-app-blue-600 p-0 h-auto"
                onClick={() => window.open(imageUrl, '_blank')}
              >
                View Image
              </Button>
            </div>
            <Textarea
              id="student-answer"
              value={studentAnswer}
              onChange={handleStudentAnswerChange}
              placeholder="Extracted text from the scanned answer..."
              className="min-h-[150px]"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-app-teal-500 hover:bg-app-teal-600"
            disabled={isEvaluating}
          >
            {isEvaluating ? "Evaluating..." : "Evaluate Answer"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EvaluationForm;
