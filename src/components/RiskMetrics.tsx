import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, Zap, TrendingDown, AlertTriangle } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface RiskMetricsProps {
  products: Product[];
}

export const RiskMetrics = ({ products }: RiskMetricsProps) => {
  // Calculate product metrics
  const productsWithReadiness = products.map((p) => ({
    ...p,
    readinessScore: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].readiness_score : 0,
    riskBand: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].risk_band : 'high',
    successProb: Array.isArray(p.prediction) && p.prediction[0] ? p.prediction[0].success_probability : 0,
  }));

  // High risk products
  const highRisk = productsWithReadiness
    .filter((p) => p.readinessScore < 65 || p.riskBand === 'high')
    .sort((a, b) => a.readinessScore - b.readinessScore)
    .slice(0, 5);

  // 1. Revenue at Risk
  const revenueAtRisk = productsWithReadiness
    .filter((p) => p.riskBand === 'high' || p.readinessScore < 50)
    .reduce((sum, p) => sum + (p.revenue_target || 0), 0) / 1_000_000;

  // 2. Late Escalation Cost
  const DAILY_DELAY_COST = 15000;
  const avgDelayDays = highRisk.length > 0 
    ? highRisk.reduce((sum, p) => {
        const delayDays = Math.max(0, Math.round((100 - p.readinessScore) / 5));
        return sum + delayDays;
      }, 0) / highRisk.length
    : 0;
  const lateEscalationCost = (avgDelayDays * DAILY_DELAY_COST * highRisk.length);
  const formattedEscalationCost = lateEscalationCost >= 1000000 
    ? `$${(lateEscalationCost / 1000000).toFixed(1)}M` 
    : lateEscalationCost >= 10000 
      ? `$${Math.round(lateEscalationCost / 1000)}K` 
      : `$${lateEscalationCost.toLocaleString()}`;

  // 3. Decision Impact Preview
  const inactionImpact = highRisk.slice(0, 3).map((p) => {
    const currentProb = p.successProb * 100;
    const projectedProb = Math.max(0, currentProb - 15);
    const revenueImpact = ((p.revenue_target || 0) * (currentProb - projectedProb) / 100) / 1_000_000;
    return {
      id: p.id,
      name: p.name,
      currentProb: Math.round(currentProb),
      projectedProb: Math.round(projectedProb),
      revenueImpact: revenueImpact.toFixed(1),
      riskBand: p.riskBand,
    };
  });

  // Total potential loss if no action
  const totalPotentialLoss = inactionImpact.reduce((sum, item) => sum + parseFloat(item.revenueImpact), 0);

  if (revenueAtRisk === 0 && lateEscalationCost === 0) {
    return null; // Don't show if no risk
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in">
      {/* Revenue at Risk */}
      <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-muted-foreground">Revenue at Risk</span>
              </div>
              <div className="text-3xl font-bold text-destructive">${revenueAtRisk.toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground mt-1">
                {productsWithReadiness.filter(p => p.riskBand === 'high').length} high-risk products
              </p>
            </div>
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Late Escalation Cost */}
      <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-muted-foreground">Escalation Cost</span>
              </div>
              <div className="text-3xl font-bold text-warning">{formattedEscalationCost}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ~{Math.round(avgDelayDays)} days avg delay • ${DAILY_DELAY_COST.toLocaleString()}/day per product
              </p>
            </div>
            <div className="p-2 rounded-full bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Impact Preview */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">3-Week Inaction Forecast</span>
          </div>
          
          {inactionImpact.length > 0 ? (
            <div className="space-y-2">
              {inactionImpact.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[120px] font-medium" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {item.currentProb}%
                    </span>
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-destructive font-medium text-xs">
                      {item.projectedProb}%
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-destructive border-destructive/30">
                      -${item.revenueImpact}M
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total potential loss</span>
                <span className="font-bold text-destructive">-${totalPotentialLoss.toFixed(1)}M</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No at-risk products</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
