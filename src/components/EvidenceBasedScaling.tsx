import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, MessageSquare, AlertTriangle, CheckCircle2, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketEvidence {
  id: string;
  product_id: string;
  sentiment_score: number;
  merchant_adoption_rate: number;
  sample_size: number;
  measurement_date: string;
  notes: string | null;
  product?: {
    name: string;
    lifecycle_stage: string;
    region: string;
  };
}

const getSentimentLabel = (score: number) => {
  if (score >= 0.6) return { label: "Positive", color: "text-success", icon: TrendingUp };
  if (score >= 0.2) return { label: "Neutral", color: "text-warning", icon: TrendingUp };
  if (score >= -0.2) return { label: "Mixed", color: "text-muted-foreground", icon: TrendingDown };
  return { label: "Negative", color: "text-destructive", icon: TrendingDown };
};

const getAdoptionStatus = (rate: number) => {
  if (rate >= 40) return { label: "Strong", color: "bg-success/10 text-success border-success/30" };
  if (rate >= 20) return { label: "Growing", color: "bg-chart-2/10 text-chart-2 border-chart-2/30" };
  if (rate >= 10) return { label: "Early", color: "bg-warning/10 text-warning border-warning/30" };
  return { label: "Nascent", color: "bg-muted text-muted-foreground border-border" };
};

export const EvidenceBasedScaling = () => {
  const { data: evidence, isLoading } = useQuery({
    queryKey: ["market-evidence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_market_evidence")
        .select(`
          *,
          product:products(name, lifecycle_stage, region)
        `)
        .order("measurement_date", { ascending: false });

      if (error) throw error;
      return data as MarketEvidence[];
    },
  });

  if (isLoading) {
    return (
      <Card className="card-elegant">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by product, show latest measurement
  const latestByProduct = evidence?.reduce((acc, item) => {
    if (!acc[item.product_id] || new Date(item.measurement_date) > new Date(acc[item.product_id].measurement_date)) {
      acc[item.product_id] = item;
    }
    return acc;
  }, {} as Record<string, MarketEvidence>) || {};

  const productEvidence = Object.values(latestByProduct);

  // Calculate summary metrics
  const avgSentiment = productEvidence.length > 0
    ? productEvidence.reduce((sum, e) => sum + (e.sentiment_score || 0), 0) / productEvidence.length
    : 0;
  const avgAdoption = productEvidence.length > 0
    ? productEvidence.reduce((sum, e) => sum + (e.merchant_adoption_rate || 0), 0) / productEvidence.length
    : 0;
  const totalSampleSize = productEvidence.reduce((sum, e) => sum + (e.sample_size || 0), 0);

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Evidence-Based Scaling</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Post-Production Loop
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          In-market performance tracking for live pilots and commercial products
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Avg Sentiment</span>
            </div>
            <p className={`text-2xl font-bold ${getSentimentLabel(avgSentiment).color}`}>
              {avgSentiment >= 0 ? "+" : ""}{(avgSentiment * 100).toFixed(0)}%
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground">Avg Adoption</span>
            </div>
            <p className="text-2xl font-bold text-chart-2">
              {avgAdoption.toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sample Size</span>
            </div>
            <p className="text-2xl font-bold">
              {totalSampleSize.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Product Evidence List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            Live Pilot Performance
            <Badge variant="outline" className="text-xs">{productEvidence.length} tracked</Badge>
          </h3>
          
          {productEvidence.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No market evidence data available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {productEvidence.map((item) => {
                const sentiment = getSentimentLabel(item.sentiment_score || 0);
                const adoption = getAdoptionStatus(item.merchant_adoption_rate || 0);
                const SentimentIcon = sentiment.icon;
                const hasIssues = (item.sentiment_score || 0) < 0;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      hasIssues ? "border-warning/50 bg-warning/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.product?.name}</h4>
                          {hasIssues && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.product?.region} • {item.sample_size.toLocaleString()} responses
                        </p>
                      </div>
                      <Badge variant="outline" className={adoption.color}>
                        {adoption.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Sentiment */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">In-Market Sentiment</span>
                          <span className={`font-medium ${sentiment.color} flex items-center gap-1`}>
                            <SentimentIcon className="h-3 w-3" />
                            {sentiment.label}
                          </span>
                        </div>
                        <Progress 
                          value={((item.sentiment_score || 0) + 1) * 50} 
                          className="h-2"
                        />
                      </div>

                      {/* Adoption Rate */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Merchant Adoption</span>
                          <span className="font-medium">{(item.merchant_adoption_rate || 0).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={item.merchant_adoption_rate || 0} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scaling Readiness Indicator */}
        {productEvidence.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Scaling Readiness Assessment</h4>
            <div className="flex flex-wrap gap-2">
              {productEvidence
                .filter(e => (e.sentiment_score || 0) >= 0.5 && (e.merchant_adoption_rate || 0) >= 30)
                .map(e => (
                  <Badge key={e.id} className="bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {e.product?.name}: Ready to Scale
                  </Badge>
                ))}
              {productEvidence
                .filter(e => (e.sentiment_score || 0) < 0)
                .map(e => (
                  <Badge key={e.id} className="bg-warning/10 text-warning border-warning/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {e.product?.name}: Needs Attention
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
