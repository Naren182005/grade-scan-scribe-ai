import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/accessible-toast";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Clock, ArrowRight, Loader2 } from "lucide-react";
// No need for API_ENDPOINTS import as we're using sample data
import { useUser } from '@/contexts/UserContext';

// Define MCQ question type
interface MCQQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer?: string; // Only available after submission
}

interface OnlineMCQTestProps {
  subject: string;
  onComplete: (result: MCQTestResult) => void;
  onBack: () => void;
}

export interface MCQTestResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  questions: MCQQuestion[];
  userAnswers: Record<string, string>;
}

const OnlineMCQTest: React.FC<OnlineMCQTestProps> = ({ subject, onComplete, onBack }) => {
  const { user } = useUser();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would fetch from a backend API
        // For now, we'll generate some sample questions
        const sampleQuestions = generateSampleQuestions(subject, 10);
        setQuestions(sampleQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load questions', {
          description: 'Please try again later'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [subject]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit test
  const handleSubmit = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      const isConfirmed = window.confirm('You have unanswered questions. Are you sure you want to submit?');
      if (!isConfirmed) return;
    }

    setIsSubmitting(true);
    toast.loading('Evaluating your answers...');

    try {
      // In a real app, this would send answers to a backend API for evaluation
      // For now, we'll simulate the evaluation process

      // Generate correct answers (in a real app, these would come from the backend)
      const questionsWithAnswers = questions.map(q => ({
        ...q,
        correctAnswer: q.options[Math.floor(Math.random() * q.options.length)].id
      }));

      // Calculate score
      let correctCount = 0;
      questionsWithAnswers.forEach(q => {
        if (userAnswers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });

      const score = (correctCount / questions.length) * 100;

      // Prepare result
      const result: MCQTestResult = {
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        score,
        questions: questionsWithAnswers,
        userAnswers
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.dismiss();
      toast.success('Test completed!');

      // Pass result to parent component
      onComplete(result);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test', {
        description: 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate sample questions based on subject
  const generateSampleQuestions = (subject: string, count: number): MCQQuestion[] => {
    const questions: MCQQuestion[] = [];

    const subjectQuestions = {
      // Science domain subjects
      'physics': [
        'What is Newton\'s First Law of Motion?',
        'What is the SI unit of force?',
        'Which of the following is a vector quantity?',
        'What is the formula for calculating work done?',
        'What is the principle behind a hydraulic press?'
      ],
      'chemistry': [
        'What is the chemical symbol for gold?',
        'What is the pH of a neutral solution?',
        'Which element has the atomic number 6?',
        'What is the main component of natural gas?',
        'What type of bond is formed when electrons are shared between atoms?'
      ],
      'mathematics': [
        'What is the value of π (pi) to two decimal places?',
        'What is the square root of 144?',
        'If x + 5 = 12, what is the value of x?',
        'What is 25% of 80?',
        'What is the formula for the area of a circle?'
      ],
      'biology': [
        'What is the powerhouse of the cell?',
        'What is the process by which plants make their own food?',
        'What is the largest organ in the human body?',
        'What is the function of hemoglobin in the blood?',
        'What is the basic unit of life?'
      ],
      'computer_science': [
        'What does CPU stand for?',
        'Which programming language is known as the "mother of all languages"?',
        'What is the binary representation of the decimal number 10?',
        'What does HTML stand for?',
        'What is an algorithm?'
      ],

      // Arts domain subjects
      'accountancy': [
        'What is the accounting equation?',
        'What is a balance sheet?',
        'What is the difference between revenue and profit?',
        'What is depreciation?',
        'What is the purpose of a trial balance?'
      ],
      'economics': [
        'What is the law of demand?',
        'What is GDP?',
        'What is inflation?',
        'What is the difference between microeconomics and macroeconomics?',
        'What is a market economy?'
      ],
      'business_studies': [
        'What is marketing?',
        'What are the 4 Ps of marketing?',
        'What is a SWOT analysis?',
        'What is the difference between a private and public limited company?',
        'What is corporate social responsibility?'
      ],
      'english': [
        'What is a metaphor?',
        'Who wrote "Romeo and Juliet"?',
        'What is the difference between a simile and a metaphor?',
        'What is the past tense of "go"?',
        'What is an adverb?'
      ],
      'history': [
        'When did World War II end?',
        'Who was the first President of the United States?',
        'What was the Renaissance?',
        'What was the Industrial Revolution?',
        'Who was Mahatma Gandhi?'
      ],
      'political_science': [
        'What is democracy?',
        'What is the difference between a presidential and parliamentary system?',
        'What is federalism?',
        'What is the separation of powers?',
        'What is a constitution?'
      ],
    };

    // Use subject-specific questions or default ones
    const questionPool = subjectQuestions[subject as keyof typeof subjectQuestions] || [
      'Sample question 1 for ' + subject,
      'Sample question 2 for ' + subject,
      'Sample question 3 for ' + subject,
      'Sample question 4 for ' + subject,
      'Sample question 5 for ' + subject
    ];

    // Generate the requested number of questions
    for (let i = 0; i < count; i++) {
      const questionIndex = i % questionPool.length;

      questions.push({
        id: `q${i+1}`,
        question: `${i+1}. ${questionPool[questionIndex]}`,
        options: [
          { id: 'A', text: `Option A for question ${i+1}` },
          { id: 'B', text: `Option B for question ${i+1}` },
          { id: 'C', text: `Option C for question ${i+1}` },
          { id: 'D', text: `Option D for question ${i+1}` }
        ]
      });
    }

    return questions;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-app-blue-600 mb-4" />
        <p className="text-app-blue-800">Loading questions...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg border-app-blue-100">
        <CardHeader className="bg-app-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-app-blue-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {subject} MCQ Test
            </CardTitle>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-app-blue-200">
              <Clock className="h-4 w-4 text-app-blue-600" />
              <span className={`font-mono font-medium ${timeRemaining < 60 ? 'text-red-600' : 'text-app-blue-800'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <CardDescription>
            Question {currentQuestionIndex + 1} of {questions.length} • {answeredCount} answered
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

              <RadioGroup
                value={userAnswers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{option.id}.</span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex justify-between p-4 bg-slate-50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="border-app-blue-200 text-app-blue-700 hover:bg-app-blue-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="border-app-blue-200 text-app-blue-700 hover:bg-app-blue-50"
            >
              Next
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-app-teal-500 hover:bg-app-teal-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Test
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnlineMCQTest;
