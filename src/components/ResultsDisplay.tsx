
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EvaluationResult } from "@/types";
import { Check, X } from "lucide-react";

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
  if (percentage >= 80) {
    gradeColor = "text-green-500";
  } else if (percentage >= 60) {
    gradeColor = "text-amber-500";
  } else if (percentage < 40) {
    gradeColor = "text-red-500";
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-app-blue-900 mb-4">Evaluation Results</h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Score</span>
            <span className={`text-lg font-bold ${gradeColor}`}>
              {result.marksAwarded}/{totalMarks} ({percentage}%)
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-app-blue-800 mb-2 flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              Key Points Covered
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              {result.keyPointsCovered.map((point, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">{point}</li>
              ))}
            </ul>
          </div>
          
          {result.keyPointsMissing.length > 0 && (
            <div>
              <h3 className="font-medium text-app-blue-800 mb-2 flex items-center">
                <X className="text-red-500 mr-2 h-5 w-5" />
                Key Points Missed
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                {result.keyPointsMissing.map((point, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-app-blue-800 mb-2">Evaluation Comments</h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {result.evaluationReason}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/50 py-4">
        <div className="w-full flex gap-2">
          <Button 
            onClick={() => window.print()} 
            variant="outline" 
            className="flex-1"
          >
            Print Results
          </Button>
          <Button 
            onClick={onReset} 
            className="flex-1 bg-app-blue-500 hover:bg-app-blue-600"
          >
            Evaluate New Answer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResultsDisplay;
