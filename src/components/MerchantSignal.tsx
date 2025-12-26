import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeedbackItem {
  id: string;
  source: string;
  sentiment_score: number | null;
  theme?: string;
  impact_level?: string;
  volume?: number;
  raw_text?: string;
  created_at?: string;
}

interface MerchantSignalProps {
  feedback: FeedbackItem[];
  compact?: boolean;
  showLabel?: boolean;
}

type SignalStatus = "positive" | "negative" | "neutral" | "no_data";

interface SignalMetrics {
  status: SignalStatus;
  averageSentiment: number;
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  recentTrend: "improving" | "declining" | "stable";
  topThemes: string[];
  highImpactCount: number;
}

const calculateSignalMetrics = (feedback: FeedbackItem[]): SignalMetrics => {
  if (!feedback || feedback.length === 0) {
    return {
      status: "no_data",
      averageSentiment: 0,
      totalFeedback: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      recentTrend: "stable",
      topThemes: [],
      highImpactCount: 0,
    };
  }

  let totalSentiment = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let highImpactCount = 0;
  const themeCounts: Record<string, number> = {};

  feedback.forEach((item) => {
    const score = item.sentiment_score ?? 0;
    totalSentiment += score;

    if (score > 0.3) positiveCount++;
    else if (score < -0.3) negativeCount++;
    else neutralCount++;

    if (item.impact_level === "HIGH") highImpactCount++;

    if (item.theme) {
      themeCounts[item.theme] = (themeCounts[item.theme] || 0) + (item.volume || 1);
    }
  });

  const averageSentiment = totalSentiment / feedback.length;
  
  // Determine overall status
  let status: SignalStatus;
  if (averageSentiment > 0.2) status = "positive";
  else if (averageSentiment < -0.2) status = "negative";
  else status = "neutral";

  // Calculate trend using date-based comparison (last 2 weeks vs previous 2 weeks)
  const sortedByDate = [...feedback]
    .filter(f => f.created_at)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const recentFeedback = sortedByDate.filter(f => 
    f.created_at && new Date(f.created_at) >= twoWeeksAgo
  );
  const olderFeedback = sortedByDate.filter(f => 
    f.created_at && new Date(f.created_at) >= fourWeeksAgo && new Date(f.created_at) < twoWeeksAgo
  );
  
  // Fallback to array splitting if no date data
  const effectiveRecent = recentFeedback.length > 0 ? recentFeedback : feedback.slice(0, Math.ceil(feedback.length / 2));
  const effectiveOlder = olderFeedback.length > 0 ? olderFeedback : feedback.slice(Math.ceil(feedback.length / 2));
  
  const recentAvg = effectiveRecent.length > 0 
    ? effectiveRecent.reduce((sum, f) => sum + (f.sentiment_score ?? 0), 0) / effectiveRecent.length 
    : 0;
  const olderAvg = effectiveOlder.length > 0 
    ? effectiveOlder.reduce((sum, f) => sum + (f.sentiment_score ?? 0), 0) / effectiveOlder.length 
    : 0;
  
  let recentTrend: "improving" | "declining" | "stable" = "stable";
  if (recentAvg - olderAvg > 0.1) recentTrend = "improving";
  else if (recentAvg - olderAvg < -0.1) recentTrend = "declining";

  // Get top themes
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  return {
    status,
    averageSentiment,
    totalFeedback: feedback.length,
    positiveCount,
    negativeCount,
    neutralCount,
    recentTrend,
    topThemes,
    highImpactCount,
  };
};

const signalConfig = {
  positive: {
    icon: ThumbsUp,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    label: "Positive Signal",
    description: "Account teams report positive customer sentiment",
  },
  negative: {
    icon: ThumbsDown,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    label: "Negative Signal",
    description: "Account teams report concerns from customers",
  },
  neutral: {
    icon: MessageSquare,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    label: "Mixed Signal",
    description: "Account teams report mixed customer feedback",
  },
  no_data: {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    label: "No Signal",
    description: "No customer feedback data available",
  },
};

export const MerchantSignal = ({ 
  feedback, 
  compact = false,
  showLabel = true 
}: MerchantSignalProps) => {
  const metrics = calculateSignalMetrics(feedback);
  const config = signalConfig[metrics.status];
  const SignalIcon = config.icon;

  const getTrendIcon = () => {
    switch (metrics.recentTrend) {
      case "improving":
        return <TrendingUp className="h-3 w-3 text-success" />;
      case "declining":
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border cursor-help",
                config.bgColor,
                config.color,
                config.borderColor
              )}
            >
              <SignalIcon className="h-3 w-3" />
              {showLabel && <span>{metrics.totalFeedback}</span>}
              {metrics.totalFeedback > 0 && getTrendIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Merchant Signal
                </span>
                <Badge variant="outline" className={cn(config.bgColor, config.color, "text-xs")}>
                  {config.label}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground">{config.description}</p>
              
              {metrics.totalFeedback > 0 && (
                <>
                  {/* Sentiment breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-success font-bold">{metrics.positiveCount}</div>
                      <div className="text-xs text-muted-foreground">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-warning font-bold">{metrics.neutralCount}</div>
                      <div className="text-xs text-muted-foreground">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-destructive font-bold">{metrics.negativeCount}</div>
                      <div className="text-xs text-muted-foreground">Negative</div>
                    </div>
                  </div>
                  
                  {/* Trend */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">Trend</span>
                    <span className={cn(
                      "flex items-center gap-1 font-medium",
                      metrics.recentTrend === "improving" ? "text-success" :
                      metrics.recentTrend === "declining" ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {getTrendIcon()}
                      {metrics.recentTrend.charAt(0).toUpperCase() + metrics.recentTrend.slice(1)}
                    </span>
                  </div>
                  
                  {/* High impact alerts */}
                  {metrics.highImpactCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                      <AlertCircle className="h-3 w-3" />
                      {metrics.highImpactCount} high-impact feedback item{metrics.highImpactCount > 1 ? "s" : ""}
                    </div>
                  )}
                  
                  {/* Top themes */}
                  {metrics.topThemes.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Top Themes</div>
                      <div className="flex flex-wrap gap-1">
                        {metrics.topThemes.map((theme) => (
                          <Badge key={theme} variant="outline" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full view
  return (
    <div className={cn("rounded-lg p-4 border", config.bgColor, config.borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SignalIcon className={cn("h-5 w-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.label}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {metrics.totalFeedback} feedback items
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
      
      {metrics.totalFeedback > 0 && (
        <div className="space-y-3">
          {/* Sentiment bar */}
          <div className="flex h-2 rounded-full overflow-hidden">
            <div 
              className="bg-success" 
              style={{ width: `${(metrics.positiveCount / metrics.totalFeedback) * 100}%` }}
            />
            <div 
              className="bg-warning" 
              style={{ width: `${(metrics.neutralCount / metrics.totalFeedback) * 100}%` }}
            />
            <div 
              className="bg-destructive" 
              style={{ width: `${(metrics.negativeCount / metrics.totalFeedback) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              Trend: {getTrendIcon()}
              <span className={cn(
                "font-medium",
                metrics.recentTrend === "improving" ? "text-success" :
                metrics.recentTrend === "declining" ? "text-destructive" : "text-muted-foreground"
              )}>
                {metrics.recentTrend.charAt(0).toUpperCase() + metrics.recentTrend.slice(1)}
              </span>
            </span>
            
            <span className="text-muted-foreground">
              Avg sentiment: {(metrics.averageSentiment * 100).toFixed(0)}%
            </span>
          </div>
          
          {metrics.highImpactCount > 0 && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                {metrics.highImpactCount} high-impact issue{metrics.highImpactCount > 1 ? "s" : ""} require attention
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
