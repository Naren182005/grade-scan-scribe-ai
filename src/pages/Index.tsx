
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ScanCamera from '@/components/ScanCamera';
import EvaluationForm from '@/components/EvaluationForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import EvaluationDemo from '@/components/EvaluationDemo';
import { AppStep, EvaluationResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScanText, FileText, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('scan');
  const [capturedText, setCapturedText] = useState('');
  const [capturedImageUrl, setCapturedImageUrl] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [totalMarks, setTotalMarks] = useState(10);

  const handleCapture = (text: string, imageUrl: string) => {
    setCapturedText(text);
    setCapturedImageUrl(imageUrl);
    setCurrentStep('evaluate');
  };

  const handleEvaluationComplete = (result: EvaluationResult) => {
    setEvaluationResult(result);
    setCurrentStep('results');
  };

  const resetApp = () => {
    setCapturedText('');
    setCapturedImageUrl('');
    setEvaluationResult(null);
    setCurrentStep('scan');
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
            currentStep === 'scan' ? 'bg-app-teal-500 text-white' : 'bg-app-blue-100 text-app-blue-900'
          } transition-all duration-300`}>
            <ScanText size={18} />
          </div>
          <div className={`h-1.5 w-16 transition-all duration-300 ${
            currentStep === 'scan' ? 'bg-muted' : 'bg-app-teal-500'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
            currentStep === 'evaluate' ? 'bg-app-teal-500 text-white' : (
              currentStep === 'results' ? 'bg-app-teal-500 text-white' : 'bg-app-blue-100 text-app-blue-900'
            )
          } transition-all duration-300`}>
            <FileText size={18} />
          </div>
          <div className={`h-1.5 w-16 transition-all duration-300 ${
            currentStep === 'results' ? 'bg-app-teal-500' : 'bg-muted'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
            currentStep === 'results' ? 'bg-app-teal-500 text-white' : 'bg-app-blue-100 text-app-blue-900'
          } transition-all duration-300`}>
            <CheckCircle size={18} />
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'scan':
        return (
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="camera">Scan Answer Sheet</TabsTrigger>
              <TabsTrigger value="demo">AI Evaluation Demo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <ScanCamera onCapture={handleCapture} />
                </div>
                <Card className="col-span-1 md:col-span-2 border-app-teal-100 shadow-md">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-app-blue-800 mb-4 flex items-center">
                      <FileText size={20} className="mr-2 text-app-teal-600" />
                      How it works
                    </h2>
                    <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                      <li className="pl-2">Scan a student's answer sheet using your device camera</li>
                      <li className="pl-2">Enter the question and model answer details</li>
                      <li className="pl-2">Our AI will evaluate the answer and award marks</li>
                      <li className="pl-2">Review the detailed breakdown of points covered and missed</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="demo">
              <EvaluationDemo />
            </TabsContent>
          </Tabs>
        );
        
      case 'evaluate':
        return (
          <div className="grid grid-cols-1 gap-8">
            <EvaluationForm
              studentAnswerText={capturedText}
              imageUrl={capturedImageUrl}
              onEvaluationComplete={handleEvaluationComplete}
            />
          </div>
        );
        
      case 'results':
        return (
          <div className="grid grid-cols-1 gap-8">
            {evaluationResult && (
              <ResultsDisplay
                result={evaluationResult}
                totalMarks={totalMarks}
                onReset={resetApp}
              />
            )}
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
          Scan student answer sheets, compare against model answers, and get instant AI evaluation
        </p>
        
        {renderStepIndicator()}
        <div className="transition-all duration-300 animate-fade-in">
          {renderStepContent()}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
