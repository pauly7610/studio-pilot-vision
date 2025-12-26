import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Shield,
  Target,
} from "lucide-react";
import {
  useAIQuery,
  useProductInsight,
  usePortfolioInsight,
  useAIHealth,
  InsightResponse,
} from "@/hooks/useAIInsights";

interface AIInsightsPanelProps {
  productId?: string;
  productName?: string;
  compact?: boolean;
}

const insightTypeConfig = {
  summary: { icon: Lightbulb, label: "Executive Summary", color: "text-blue-500" },
  risks: { icon: Shield, label: "Risk Analysis", color: "text-destructive" },
  opportunities: { icon: TrendingUp, label: "Opportunities", color: "text-success" },
  recommendations: { icon: Target, label: "Recommendations", color: "text-warning" },
};

export const AIInsightsPanel = ({
  productId,
  productName,
  compact = false,
}: AIInsightsPanelProps) => {
  const [query, setQuery] = useState("");
  const [insightType, setInsightType] = useState<keyof typeof insightTypeConfig>("summary");
  const [currentInsight, setCurrentInsight] = useState<InsightResponse | null>(null);

  const { data: health } = useAIHealth();
  const aiQuery = useAIQuery();
  const portfolioInsight = usePortfolioInsight();

  const {
    data: productInsightData,
    isLoading: isProductInsightLoading,
    refetch: refetchProductInsight,
  } = useProductInsight(productId || "", insightType);

  const isServiceAvailable = health?.status === "healthy";

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;

    const result = await aiQuery.mutateAsync({
      query,
      product_id: productId,
      top_k: 5,
      include_sources: true,
    });

    setCurrentInsight(result);
  };

  const handlePortfolioQuery = async () => {
    if (!query.trim()) return;

    const result = await portfolioInsight.mutateAsync({
      query,
    });

    setCurrentInsight(result);
  };

  const InsightTypeIcon = insightTypeConfig[insightType].icon;

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Insight</span>
            {!isServiceAvailable && (
              <Badge variant="outline" className="text-xs">
                Offline
              </Badge>
            )}
          </div>

          {isProductInsightLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : productInsightData?.success ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {productInsightData.insight}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isServiceAvailable
                ? "Click to generate AI insight"
                : "AI service unavailable"}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
            {productName && (
              <span className="text-muted-foreground font-normal">
                for {productName}
              </span>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {isServiceAvailable ? (
              <Badge variant="outline" className="text-success border-success/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-destructive border-destructive/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Insight Types */}
        {productId && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Select
                value={insightType}
                onValueChange={(v) => setInsightType(v as keyof typeof insightTypeConfig)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(insightTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchProductInsight()}
                disabled={!isServiceAvailable || isProductInsightLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isProductInsightLoading ? "animate-spin" : ""}`}
                />
                Generate
              </Button>
            </div>

            {/* Product Insight Result */}
            {isProductInsightLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : productInsightData?.success ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <InsightTypeIcon
                    className={`h-4 w-4 ${insightTypeConfig[insightType].color}`}
                  />
                  <span className="text-sm font-medium">
                    {insightTypeConfig[insightType].label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {productInsightData.insight}
                </p>
                {productInsightData.usage && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tokens used: {productInsightData.usage.total_tokens}
                  </div>
                )}
              </div>
            ) : productInsightData?.error ? (
              <div className="bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
                {productInsightData.error}
              </div>
            ) : null}
          </div>
        )}

        {/* Custom Query */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Ask a Question</p>
          <div className="flex gap-2">
            <Textarea
              placeholder={
                productId
                  ? `Ask about ${productName || "this product"}...`
                  : "Ask about your product portfolio..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={productId ? handleQuerySubmit : handlePortfolioQuery}
              disabled={!query.trim() || !isServiceAvailable || aiQuery.isPending}
              className="flex-1"
            >
              {aiQuery.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {productId ? "Ask about Product" : "Ask about Portfolio"}
            </Button>
          </div>
        </div>

        {/* Custom Query Result */}
        {currentInsight && (
          <div className="border-t pt-4">
            {currentInsight.success ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{currentInsight.insight}</p>

                {currentInsight.sources && currentInsight.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium mb-2">Sources</p>
                    <div className="space-y-1">
                      {currentInsight.sources.map((source, i) => (
                        <div
                          key={i}
                          className="text-xs text-muted-foreground bg-background rounded p-2"
                        >
                          <span className="font-medium">
                            [{String(source.metadata?.source) || "Unknown"}]
                          </span>{" "}
                          {source.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
                {currentInsight.error || "Failed to generate insight"}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
