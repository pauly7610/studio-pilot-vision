import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";

interface FeedbackItem {
  product: string;
  theme: string;
  sentiment: "positive" | "negative" | "neutral";
  volume: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
}

const feedbackData: FeedbackItem[] = [
  {
    product: "Digital Wallet API",
    theme: "Integration Complexity",
    sentiment: "negative",
    volume: 23,
    impact: "HIGH",
    summary: "Documentation needs improvement for OAuth2 flow implementation",
  },
  {
    product: "Fraud Detection ML",
    theme: "Performance",
    sentiment: "positive",
    volume: 45,
    impact: "MEDIUM",
    summary: "95% accuracy rate exceeding customer expectations",
  },
  {
    product: "Loyalty Platform",
    theme: "Onboarding Issues",
    sentiment: "negative",
    volume: 31,
    impact: "HIGH",
    summary: "Merchant setup taking 2-3 weeks vs promised 48 hours",
  },
  {
    product: "Cross-Border Pay",
    theme: "Settlement Speed",
    sentiment: "positive",
    volume: 52,
    impact: "MEDIUM",
    summary: "Real-time settlement driving strong adoption",
  },
];

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return <ThumbsUp className="h-4 w-4 text-success" />;
    case "negative":
      return <ThumbsDown className="h-4 w-4 text-destructive" />;
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "HIGH":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "MEDIUM":
      return "bg-warning/10 text-warning border-warning/20";
    case "LOW":
      return "bg-success/10 text-success border-success/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const FeedbackIntelligence = () => {
  return (
    <Card className="card-elegant animate-in">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Customer Feedback Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbackData.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{item.product}</h4>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(item.sentiment)}
                  <span className="text-sm font-medium">{item.theme}</span>
                </div>
              </div>
              <Badge variant="outline" className={getImpactColor(item.impact)}>
                {item.impact}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">Volume: {item.volume} mentions</span>
              {item.impact === "HIGH" && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Action Required</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
