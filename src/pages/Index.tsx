
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ScanCamera from '@/components/ScanCamera';
import EvaluationForm from '@/components/EvaluationForm';
import MCQEvaluationForm from '@/components/MCQEvaluationForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import { AppStep, EvaluationResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScanText, FileText, CheckCircle, BarChart, Send } from 'lucide-react';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('scan-question');
  const [capturedText, setCapturedText] = useState('');
  const [capturedImageUrl, setCapturedImageUrl] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [totalMarks, setTotalMarks] = useState(10);
  const [questionType, setQuestionType] = useState<'essay' | 'mcq'>('mcq');

  const handleCapture = (text: string, imageUrl: string, step: AppStep) => {
    setCapturedText(text);
    setCapturedImageUrl(imageUrl);
    setCurrentStep(step === 'scan-question' ? 'scan-answer' : 'evaluate');
  };

  const handleEvaluationComplete = (result: EvaluationResult) => {
    setEvaluationResult(result);
    setCurrentStep('results');
  };

  const resetApp = () => {
    setCapturedText('');
    setCapturedImageUrl('');
    setEvaluationResult(null);
    setCurrentStep('scan-question');
  };

  const sendResults = () => {
    alert("Results sent successfully!");
    resetApp();
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center justify-between w-full max-w-4xl">
          <StepButton 
            icon={<ScanText size={24} />} 
            label="Scan Question"
            active={currentStep === 'scan-question'}
            completed={currentStep !== 'scan-question'}
            onClick={() => currentStep !== 'scan-question' && setCurrentStep('scan-question')}
          />
          
          <StepButton 
            icon={<ScanText size={24} />}
            label="Scan Answer"
            active={currentStep === 'scan-answer'}
            completed={['evaluate', 'results', 'send-results'].includes(currentStep)}
            disabled={currentStep === 'scan-question'}
            onClick={() => ['scan-answer', 'evaluate', 'results', 'send-results'].includes(currentStep) && setCurrentStep('scan-answer')}
          />
          
          <StepButton 
            icon={<CheckCircle size={24} />}
            label="Evaluate Answer"
            active={currentStep === 'evaluate'}
            completed={['results', 'send-results'].includes(currentStep)}
            disabled={['scan-question', 'scan-answer'].includes(currentStep)}
            onClick={() => ['evaluate', 'results', 'send-results'].includes(currentStep) && setCurrentStep('evaluate')}
          />
          
          <StepButton 
            icon={<BarChart size={24} />}
            label="Results & Stats"
            active={currentStep === 'results'}
            completed={currentStep === 'send-results'}
            disabled={['scan-question', 'scan-answer', 'evaluate'].includes(currentStep)}
            onClick={() => ['results', 'send-results'].includes(currentStep) && setCurrentStep('results')}
          />
          
          <StepButton 
            icon={<Send size={24} />}
            label="Send Results"
            active={currentStep === 'send-results'}
            disabled={['scan-question', 'scan-answer', 'evaluate', 'results'].includes(currentStep)}
            onClick={() => currentStep === 'send-results' && sendResults()}
          />
        </div>
      </div>
    );
  };

  const StepButton = ({ 
    icon, 
    label, 
    active = false, 
    completed = false,
    disabled = false,
    onClick 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    active?: boolean, 
    completed?: boolean,
    disabled?: boolean,
    onClick: () => void 
  }) => {
    let buttonClass = "flex flex-col items-center";
    let iconClass = "w-16 h-16 rounded-full flex items-center justify-center transition-all";
    
    if (active) {
      iconClass += " bg-app-teal-500 text-white border-4 border-app-teal-200 shadow-lg";
    } else if (completed) {
      iconClass += " bg-app-blue-500 text-white";
    } else {
      iconClass += " bg-app-teal-100 text-app-teal-800";
      if (disabled) {
        iconClass += " opacity-50";
      }
    }
    
    return (
      <div className={buttonClass}>
        <button 
          className={iconClass} 
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </button>
        <span className={`mt-2 text-sm font-medium ${active ? 'text-app-teal-700' : 'text-app-blue-700'}`}>
          {label}
        </span>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'scan-question':
        return (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            <ScanCamera 
              onCapture={(text, imageUrl) => handleCapture(text, imageUrl, 'scan-question')} 
              title="Scan Question Paper"
              description="Position the MCQ question sheet within the frame and capture a clear image"
            />
          </div>
        );
        
      case 'scan-answer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            <ScanCamera 
              onCapture={(text, imageUrl) => handleCapture(text, imageUrl, 'scan-answer')} 
              title="Scan Answer Sheet"
              description="Position the student's answer sheet within the frame and capture a clear image"
            />
          </div>
        );
        
      case 'evaluate':
        return (
          <div className="grid grid-cols-1 gap-8">
            {questionType === 'mcq' ? (
              <MCQEvaluationForm
                questionText={capturedText}
                questionImageUrl={capturedImageUrl}
                studentAnswerText=""
                answerImageUrl=""
                onEvaluationComplete={handleEvaluationComplete}
                onQuestionTypeChange={setQuestionType}
              />
            ) : (
              <EvaluationForm
                studentAnswerText={capturedText}
                imageUrl={capturedImageUrl}
                onEvaluationComplete={handleEvaluationComplete}
                onQuestionTypeChange={setQuestionType}
              />
            )}
          </div>
        );
        
      case 'results':
        return (
          <div className="grid grid-cols-1 gap-8">
            {evaluationResult && (
              <ResultsDisplay
                result={evaluationResult}
                totalMarks={totalMarks}
                onReset={() => setCurrentStep('send-results')}
              />
            )}
          </div>
        );
        
      case 'send-results':
        return (
          <div className="grid grid-cols-1 gap-8">
            <Card className="p-6 border-app-teal-100 shadow-lg animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-app-blue-900 mb-6">Send Evaluation Results</h2>
                <p className="mb-8 text-muted-foreground">Choose how you would like to send the evaluation results:</p>
                
                <div className="flex flex-col space-y-4 max-w-md mx-auto">
                  <Button className="bg-app-blue-500 hover:bg-app-blue-600" onClick={sendResults}>
                    <Send className="mr-2 h-4 w-4" /> Email Results
                  </Button>
                  <Button variant="outline" className="border-app-blue-200" onClick={sendResults}>
                    <Send className="mr-2 h-4 w-4" /> Export as PDF
                  </Button>
                  <Button variant="outline" className="border-app-blue-200" onClick={resetApp}>
                    <ScanText className="mr-2 h-4 w-4" /> Evaluate Another Answer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-app-blue-900 text-center mb-2">
          AI-Powered Exam Evaluation
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
          Scan MCQ question papers, compare against answers, and get instant AI evaluation
        </p>
        
        {renderStepIndicator()}
        <div className="transition-all duration-300 animate-fade-in">
          {renderStepContent()}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">Click on any button to navigate between steps</p>
      </div>
    </Layout>
  );
};

export default Index;
