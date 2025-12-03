import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface FeedbackItem {
  product: string;
  productId: string;
  theme: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  volume: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  source: string;
}

interface FeedbackAnalyticsProps {
  feedbackData: FeedbackItem[];
}

const COLORS = {
  positive: "hsl(var(--success))",
  negative: "hsl(var(--destructive))",
  neutral: "hsl(var(--warning))",
};

export const FeedbackAnalytics = ({ feedbackData }: FeedbackAnalyticsProps) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    const positiveCount = feedbackData.filter(f => f.sentiment === "positive").length;
    const negativeCount = feedbackData.filter(f => f.sentiment === "negative").length;
    const neutralCount = feedbackData.filter(f => f.sentiment === "neutral").length;
    
    const totalVolume = feedbackData.reduce((sum, f) => sum + f.volume, 0);
    const avgSentiment = feedbackData.length > 0 
      ? feedbackData.reduce((sum, f) => sum + f.sentimentScore, 0) / feedbackData.length 
      : 0;

    // Group by product
    const byProduct: Record<string, { positive: number; negative: number; neutral: number }> = {};
    feedbackData.forEach(f => {
      if (!byProduct[f.product]) {
        byProduct[f.product] = { positive: 0, negative: 0, neutral: 0 };
      }
      byProduct[f.product][f.sentiment]++;
    });

    // Group by theme
    const byTheme: Record<string, number> = {};
    feedbackData.forEach(f => {
      byTheme[f.theme] = (byTheme[f.theme] || 0) + f.volume;
    });

    // High impact issues
    const highImpactCount = feedbackData.filter(f => f.impact === "HIGH").length;

    return {
      positiveCount,
      negativeCount,
      neutralCount,
      totalVolume,
      avgSentiment,
      byProduct: Object.entries(byProduct).map(([name, counts]) => ({ name, ...counts })),
      byTheme: Object.entries(byTheme)
        .map(([name, volume]) => ({ name, volume }))
        .sort((a, b) => b.volume - a.volume),
      highImpactCount,
    };
  }, [feedbackData]);

  const sentimentPieData = [
    { name: "Positive", value: analytics.positiveCount, color: COLORS.positive },
    { name: "Negative", value: analytics.negativeCount, color: COLORS.negative },
    { name: "Neutral", value: analytics.neutralCount, color: COLORS.neutral },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-success/10">
              <ThumbsUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{analytics.positiveCount}</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <ThumbsDown className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{analytics.negativeCount}</p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalVolume}</p>
              <p className="text-xs text-muted-foreground">Total Mentions</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{analytics.highImpactCount}</p>
              <p className="text-xs text-muted-foreground">High Impact</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sentimentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sentimentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {sentimentPieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Themes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Themes by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.byTheme.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  width={100}
                  tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + "..." : value}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment by Product */}
      {analytics.byProduct.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sentiment by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.byProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + "..." : value}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="positive" stackId="a" fill={COLORS.positive} name="Positive" />
                <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} name="Neutral" />
                <Bar dataKey="negative" stackId="a" fill={COLORS.negative} name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
