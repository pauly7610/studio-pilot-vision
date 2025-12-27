import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, TrendingUp, AlertTriangle, Target, DollarSign, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { exportExecutivePDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import { useProductActions, useCreateAction } from "@/hooks/useProductActions";
import { ActionItem } from "@/components/ActionItem";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface ExecutiveBriefProps {
  products: Product[];
}

export const ExecutiveBrief = ({ products }: ExecutiveBriefProps) => {
  const [actionsCreated, setActionsCreated] = useState(false);
  const createAction = useCreateAction();
  
  // Calculate portfolio metrics
  const totalProducts = products.length;
  
  const productsWithReadiness = products.map((p) => ({
    ...p,
    readinessScore: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].readiness_score : 0,
    riskBand: Array.isArray(p.readiness) && p.readiness[0] ? p.readiness[0].risk_band : 'high',
    successProb: Array.isArray(p.prediction) && p.prediction[0] ? p.prediction[0].success_probability : 0,
  }));

  // Top performers (high readiness + high success probability)
  const topPerformers = productsWithReadiness
    .filter((p) => p.readinessScore >= 85 && p.successProb >= 80)
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 3);

  // High risk products (low readiness or high risk band)
  const highRisk = productsWithReadiness
    .filter((p) => p.readinessScore < 65 || p.riskBand === 'high')
    .sort((a, b) => a.readinessScore - b.readinessScore)
    .slice(0, 3);

  // Calculate success rate
  const successRate = productsWithReadiness.length > 0
    ? Math.round((productsWithReadiness.filter((p) => p.successProb >= 75).length / productsWithReadiness.length) * 100)
    : 0;

  // Calculate average revenue target
  const avgRevenue = productsWithReadiness.length > 0
    ? productsWithReadiness.reduce((sum, p) => sum + (p.revenue_target || 0), 0) / productsWithReadiness.length / 1_000_000
    : 0;

  // === NEW METRICS ===
  
  // 1. Revenue at Risk - sum of revenue_target for high-risk products
  const revenueAtRisk = productsWithReadiness
    .filter((p) => p.riskBand === 'high' || p.readinessScore < 50)
    .reduce((sum, p) => sum + (p.revenue_target || 0), 0) / 1_000_000;

  // 2. Late Escalation Cost - estimate based on delayed days and daily burn rate
  // Assumption: Each day of delay costs ~$15K per product (resource allocation, market timing)
  const DAILY_DELAY_COST = 15000;
  const avgDelayDays = highRisk.length > 0 
    ? highRisk.reduce((sum, p) => {
        // Estimate delay based on readiness gap (100 - readiness) / 5 = days behind
        const delayDays = Math.max(0, Math.round((100 - p.readinessScore) / 5));
        return sum + delayDays;
      }, 0) / highRisk.length
    : 0;
  const lateEscalationCost = (avgDelayDays * DAILY_DELAY_COST * highRisk.length) / 1000; // in $K

  // 3. Decision Impact Preview - what happens if we do nothing
  const inactionImpact = highRisk.slice(0, 3).map((p) => {
    const currentProb = p.successProb * 100;
    // Each week of inaction drops success probability by ~5%
    const projectedProb = Math.max(0, currentProb - 15); // 3 weeks projection
    const revenueImpact = ((p.revenue_target || 0) * (currentProb - projectedProb) / 100) / 1_000_000;
    return {
      name: p.name,
      currentProb: Math.round(currentProb),
      projectedProb: Math.round(projectedProb),
      revenueImpact: revenueImpact.toFixed(1),
    };
  });

  const handleExportPDF = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }
    exportExecutivePDF(products);
    toast.success("Executive brief exported as PDF");
  };

  const getCurrentWeek = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `Week of ${date.toLocaleDateString('en-US', options)}`;
  };

  // Get all actions for high-risk products
  const highRiskProductIds = highRisk.map(p => p.id);
  const { data: allActions = [] } = useProductActions(undefined);
  
  // Filter actions for high-risk products
  const relevantActions = allActions.filter(action => 
    highRiskProductIds.includes(action.product_id)
  );

  // Auto-create actions for high-risk products (one-time per session)
  useEffect(() => {
    if (highRisk.length > 0 && !actionsCreated) {
      highRisk.forEach((product) => {
        // Check if action already exists for this product
        const existingAction = allActions.find(
          a => a.product_id === product.id && a.action_type === "intervention"
        );
        
        if (!existingAction) {
          const actionTitle = product.readinessScore < 60 
            ? `Governance intervention required for ${product.name}`
            : `Monitor ${product.name} closely`;
          
          createAction.mutate({
            product_id: product.id,
            action_type: "intervention",
            title: actionTitle,
            description: `${Math.round(product.readinessScore)}% readiness, ${product.riskBand} risk band`,
            status: "pending",
            priority: product.readinessScore < 60 ? "high" : "medium",
          });
        }
      });
      setActionsCreated(true);
    }
  }, [highRisk, actionsCreated, allActions, createAction]);

  return (
    <Card className="card-elegant animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Executive Brief</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleExportPDF}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="font-semibold">{successRate}%</span>
            <span className="text-muted-foreground text-xs">success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-semibold">${avgRevenue.toFixed(1)}M</span>
            <span className="text-muted-foreground text-xs">avg target</span>
          </div>
        </div>

        {/* Revenue at Risk & Late Escalation Cost */}
        {(revenueAtRisk > 0 || lateEscalationCost > 0) && (
          <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <DollarSign className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-muted-foreground">Revenue at Risk</span>
              </div>
              <span className="text-lg font-bold text-destructive">${revenueAtRisk.toFixed(1)}M</span>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <Clock className="h-3 w-3 text-warning" />
                <span className="text-[10px] text-muted-foreground">Escalation Cost</span>
              </div>
              <span className="text-lg font-bold text-warning">${lateEscalationCost.toFixed(0)}K</span>
              <span className="text-[10px] text-muted-foreground ml-1">({Math.round(avgDelayDays)}d avg)</span>
            </div>
          </div>
        )}

        {/* Decision Impact Preview */}
        {inactionImpact.length > 0 && (
          <div className="p-2 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-medium">If No Action (3-week forecast)</span>
            </div>
            <div className="space-y-1.5">
              {inactionImpact.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[100px]" title={item.name}>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">{item.currentProb}%</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-destructive font-medium">{item.projectedProb}%</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-destructive border-destructive/30">
                      -${item.revenueImpact}M
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performers - Compact */}
        {topPerformers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-medium text-muted-foreground">Top Candidates</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topPerformers.map((product) => (
                <Badge key={product.id} variant="secondary" className="text-xs font-normal">
                  {product.name} • {Math.round(product.readinessScore)}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* High Risk - Compact */}
        {highRisk.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">Action Required ({relevantActions.filter(a => a.status !== 'completed').length})</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {relevantActions
                .filter(a => a.status !== 'completed')
                .slice(0, 3)
                .map((action) => (
                  <ActionItem 
                    key={action.id} 
                    action={action} 
                    productId={action.product_id}
                    compact
                  />
                ))}
            </div>
          </div>
        )}

        {topPerformers.length === 0 && highRisk.length === 0 && (
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No insights for current filters</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground pt-2 border-t">
          MSIP AI • {getCurrentWeek()}
        </p>
      </CardContent>
    </Card>
  );
};