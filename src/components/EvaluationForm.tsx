
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationResult } from "@/types";
import { evaluateAnswer } from "@/utils/evaluationServices";
import { toast } from "@/components/ui/sonner";
import { PaperclipIcon, FileTextIcon, BookOpenIcon, ClipboardCheckIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleQuestionPaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setQuestionPaperImageUrl(event.target.result.toString());
        toast.success("Question paper uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          
          <div className="flex justify-start items-center mb-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onQuestionTypeChange('mcq')}
              >
                MCQ Question
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-app-teal-500 text-white hover:bg-app-teal-600"
                onClick={() => onQuestionTypeChange('essay')}
              >
                Essay Question
              </Button>
            </div>
          </div>
          
          <Collapsible open={showQuestionPaper} onOpenChange={setShowQuestionPaper} className="transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline" 
                  className="flex items-center gap-2 text-app-blue-700 hover:bg-app-blue-50 border-app-blue-200 shadow-sm"
                >
                  <BookOpenIcon size={16} />
                  {showQuestionPaper ? "Hide Question Paper" : "Add Question Paper"}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-4 border rounded-md p-5 bg-app-blue-50/50 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="question-paper" className="text-app-blue-800">Question Paper Text</Label>
                <Textarea
                  id="question-paper"
                  name="questionPaper"
                  value={question.questionPaper}
                  onChange={handleInputChange}
                  placeholder="Enter the question paper text..."
                  className="min-h-[80px] focus:border-app-teal-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-app-blue-800">Question Paper Attachment</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleQuestionPaperUpload}
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex gap-2 border-app-blue-200 hover:border-app-blue-300 hover:bg-app-blue-50"
                    onClick={triggerFileInput}
                  >
                    <PaperclipIcon size={16} />
                    Upload Question Paper
                  </Button>
                  
                  {questionPaperImageUrl && (
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-app-teal-600 hover:text-app-teal-700 p-0 h-auto"
                      onClick={() => window.open(questionPaperImageUrl, '_blank')}
                    >
                      View Uploaded Question Paper
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
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
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="student-answer" className="text-app-blue-800">Student's Answer (Scanned)</Label>
              <Button 
                type="button" 
                variant="link" 
                className="text-app-teal-600 hover:text-app-teal-700 p-0 h-auto"
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
              className="min-h-[150px] focus:border-app-teal-300"
            />
          </div>
          
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
