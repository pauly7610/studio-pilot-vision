import { HelpCircle, Brain, TrendingUp, Target, Users, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ModelTransparencyTooltipProps {
  modelVersion?: string;
  successProbability?: number;
  revenueProbability?: number;
  failureRisk?: number;
  readinessScore?: number;
  salesTraining?: number;
  partnerEnabled?: number;
}

export const ModelTransparencyTooltip = ({
  modelVersion = "v2.1",
  successProbability = 0,
  revenueProbability = 0,
  failureRisk = 0,
  readinessScore = 0,
  salesTraining = 0,
  partnerEnabled = 0,
}: ModelTransparencyTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button 
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View model transparency details"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-4">
          <div className="space-y-3">
            {/* Model Version */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Brain className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">ML Model {modelVersion}</p>
                <p className="text-xs text-muted-foreground">Gradient Boosting Ensemble</p>
              </div>
            </div>

            {/* Key Inputs */}
            <div>
              <p className="text-xs font-medium mb-2">Primary Inputs:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Readiness Score
                  </span>
                  <Badge variant="outline" className="text-xs">{Math.round(readinessScore)}%</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Sales Training
                  </span>
                  <Badge variant="outline" className="text-xs">{Math.round(salesTraining)}%</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Partner Enablement
                  </span>
                  <Badge variant="outline" className="text-xs">{Math.round(partnerEnabled)}%</Badge>
                </div>
              </div>
            </div>

            {/* Model Outputs */}
            <div>
              <p className="text-xs font-medium mb-2">Predictions:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Success Probability</span>
                  <span className="font-medium text-success">{Math.round(successProbability * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Revenue Achievement</span>
                  <span className="font-medium">{Math.round(revenueProbability * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Failure Risk</span>
                  <span className="font-medium text-destructive">{Math.round(failureRisk * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Historical Accuracy */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Historical Accuracy (R²)</span>
                <Badge variant="secondary" className="text-xs">0.87</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on 150+ historical product launches
              </p>
            </div>

            {/* Methodology */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Method:</span> Combines readiness metrics, historical analog performance, and market conditions using ensemble learning.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};