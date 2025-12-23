import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, TrendingUp, HelpCircle } from "lucide-react";

interface ConfidenceScoreProps {
  score: number; // 0-100 or 0-1
  label?: string;
  associatedValue?: string;
  associatedValueLabel?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  justification?: string;
}

type ConfidenceLevel = "very_low" | "low" | "medium" | "high" | "very_high";

const getConfidenceLevel = (score: number): ConfidenceLevel => {
  // Normalize to 0-100 if passed as decimal
  const normalizedScore = score <= 1 ? score * 100 : score;
  
  if (normalizedScore >= 80) return "very_high";
  if (normalizedScore >= 60) return "high";
  if (normalizedScore >= 40) return "medium";
  if (normalizedScore >= 20) return "low";
  return "very_low";
};

const confidenceConfig: Record<ConfidenceLevel, { 
  label: string; 
  color: string; 
  bgColor: string;
  description: string;
}> = {
  very_high: {
    label: "Very High",
    color: "bg-success",
    bgColor: "bg-success/20",
    description: "Strong confidence - Strategic bet, clear the path",
  },
  high: {
    label: "High",
    color: "bg-chart-2",
    bgColor: "bg-chart-2/20",
    description: "Good confidence - Proceed with standard oversight",
  },
  medium: {
    label: "Medium",
    color: "bg-warning",
    bgColor: "bg-warning/20",
    description: "Moderate confidence - Monitor closely",
  },
  low: {
    label: "Low",
    color: "bg-orange-500",
    bgColor: "bg-orange-500/20",
    description: "Low confidence - Speculative, don't over-invest yet",
  },
  very_low: {
    label: "Very Low",
    color: "bg-destructive",
    bgColor: "bg-destructive/20",
    description: "Very low confidence - High uncertainty, requires validation",
  },
};

export const ConfidenceScore = ({
  score,
  label = "Confidence",
  associatedValue,
  associatedValueLabel,
  showLabel = true,
  size = "md",
  justification,
}: ConfidenceScoreProps) => {
  const normalizedScore = score <= 1 ? score * 100 : score;
  const level = getConfidenceLevel(normalizedScore);
  const config = confidenceConfig[level];
  const filledDots = Math.round(normalizedScore / 20); // 0-5 dots

  const sizeConfig = {
    sm: { dot: "h-1.5 w-1.5", gap: "gap-0.5", text: "text-xs" },
    md: { dot: "h-2 w-2", gap: "gap-1", text: "text-sm" },
    lg: { dot: "h-3 w-3", gap: "gap-1.5", text: "text-base" },
  };

  const sizes = sizeConfig[size];

  // Determine investment recommendation
  const getRecommendation = () => {
    if (associatedValue) {
      const isHighValue = associatedValue.includes("M") || parseFloat(associatedValue.replace(/[^0-9.]/g, "")) > 5;
      
      if (isHighValue && normalizedScore < 40) {
        return { type: "speculative", text: "Speculative - Don't over-invest yet", icon: AlertTriangle };
      }
      if (isHighValue && normalizedScore >= 60) {
        return { type: "strategic", text: "Strategic Bet - Clear the path", icon: TrendingUp };
      }
    }
    return null;
  };

  const recommendation = getRecommendation();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {showLabel && (
              <span className={cn("text-muted-foreground", sizes.text)}>
                {label}
              </span>
            )}
            
            {/* 5-Dot Scale */}
            <div className={cn("flex items-center", sizes.gap)}>
              {[1, 2, 3, 4, 5].map((dot) => (
                <div
                  key={dot}
                  className={cn(
                    sizes.dot,
                    "rounded-full transition-all",
                    dot <= filledDots ? config.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            {/* Percentage */}
            <span className={cn("font-medium", sizes.text)}>
              {Math.round(normalizedScore)}%
            </span>
            
            {/* Warning indicator for speculative bets */}
            {recommendation?.type === "speculative" && (
              <AlertTriangle className="h-3 w-3 text-warning" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{label}</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded",
                config.bgColor
              )}>
                {config.label}
              </span>
            </div>
            
            {/* Visual scale */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((dot) => (
                <div
                  key={dot}
                  className={cn(
                    "h-3 w-3 rounded-full",
                    dot <= filledDots ? config.color : "bg-muted"
                  )}
                />
              ))}
              <span className="ml-2 text-sm font-medium">
                {Math.round(normalizedScore)}%
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
            
            {/* Associated value context */}
            {associatedValue && associatedValueLabel && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{associatedValueLabel}</span>
                  <span className="font-medium">{associatedValue}</span>
                </div>
              </div>
            )}
            
            {/* Investment recommendation */}
            {recommendation && (
              <div className={cn(
                "flex items-center gap-2 text-xs font-medium pt-2 border-t",
                recommendation.type === "speculative" ? "text-warning" : "text-success"
              )}>
                <recommendation.icon className="h-3 w-3" />
                {recommendation.text}
              </div>
            )}
            
            {/* Justification from PM */}
            {justification && (
              <div className="pt-2 border-t">
                <div className="flex items-start gap-1.5 text-xs">
                  <HelpCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground italic">"{justification}"</p>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Compound component for showing value + confidence together
interface ValueWithConfidenceProps {
  value: string;
  valueLabel?: string;
  confidence: number;
  confidenceJustification?: string;
  size?: "sm" | "md" | "lg";
}

export const ValueWithConfidence = ({
  value,
  valueLabel = "Estimate",
  confidence,
  confidenceJustification,
  size = "md",
}: ValueWithConfidenceProps) => {
  const sizeConfig = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{valueLabel}</p>
        <p className={cn("font-bold text-primary", sizeConfig[size])}>{value}</p>
      </div>
      <ConfidenceScore
        score={confidence}
        label=""
        showLabel={false}
        size={size}
        associatedValue={value}
        associatedValueLabel={valueLabel}
        justification={confidenceJustification}
      />
    </div>
  );
};
