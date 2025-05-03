
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EvaluationResult } from "@/types";
import { Check, X, Printer, RefreshCw } from "lucide-react";

interface ResultsDisplayProps {
  result: EvaluationResult;
  totalMarks: number;
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  totalMarks,
  onReset
}) => {
  const percentage = Math.round((result.marksAwarded / totalMarks) * 100);
  
  let gradeColor = "text-app-blue-500";
  let progressColor = "bg-app-blue-500";
  
  if (percentage >= 80) {
    gradeColor = "text-green-500";
    progressColor = "bg-green-500";
  } else if (percentage >= 60) {
    gradeColor = "text-amber-500";
    progressColor = "bg-amber-500";
  } else if (percentage < 40) {
    gradeColor = "text-red-500";
    progressColor = "bg-red-500";
  }

  return (
    <Card className="border-app-teal-100 shadow-lg animate-fade-in">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-app-blue-900 mb-6 text-center">Evaluation Results</h2>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground font-medium">Score</span>
            <span className={`text-2xl font-bold ${gradeColor}`}>
              {result.marksAwarded}/{totalMarks} ({percentage}%)
            </span>
          </div>
          <Progress value={percentage} className={`h-3 ${progressColor}`} />
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-app-blue-800 mb-3 flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              Key Points Covered
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              {result.keyPointsCovered.map((point, idx) => (
                <li key={idx} className="text-sm text-muted-foreground bg-green-50 p-2 rounded-md border border-green-100">
                  {point}
                </li>
              ))}
            </ul>
          </div>
          
          {result.keyPointsMissing.length > 0 && (
            <div>
              <h3 className="font-medium text-app-blue-800 mb-3 flex items-center">
                <X className="text-red-500 mr-2 h-5 w-5" />
                Key Points Missed
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                {result.keyPointsMissing.map((point, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground bg-red-50 p-2 rounded-md border border-red-100">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-app-blue-800 mb-3">Evaluation Comments</h3>
            <p className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-md border border-blue-100">
              {result.evaluationReason}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/30 py-4">
        <div className="w-full flex gap-3">
          <Button 
            onClick={() => window.print()} 
            variant="outline" 
            className="flex-1 border-app-blue-200 hover:bg-app-blue-50 hover:border-app-blue-300"
          >
            <Printer size={18} className="mr-2" /> Print Results
          </Button>
          <Button 
            onClick={onReset} 
            className="flex-1 bg-app-blue-500 hover:bg-app-blue-600 shadow-md"
          >
            <RefreshCw size={18} className="mr-2" /> Evaluate New Answer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResultsDisplay;
