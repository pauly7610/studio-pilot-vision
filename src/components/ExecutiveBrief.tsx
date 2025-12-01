import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { exportExecutivePDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import { useProductActions, useCreateAction } from "@/hooks/useProductActions";
import { ActionItem } from "@/components/ActionItem";
import { useEffect, useState } from "react";

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
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">AI Executive Brief</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {getCurrentWeek()}
          </Badge>
          <p className="text-xs text-muted-foreground">
            Generated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Portfolio health shows <span className="font-semibold text-success">{successRate}% launch success</span> rate
          across {totalProducts} products. Average revenue target is{" "}
          <span className="font-semibold text-primary">${avgRevenue.toFixed(1)}M</span> per product.
        </p>

        <div className="space-y-4">
          {topPerformers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <h4 className="font-semibold text-sm">Top Investment Candidates</h4>
              </div>
              <ul className="space-y-2 ml-6">
                {topPerformers.map((product) => (
                  <li key={product.id} className="text-sm">
                    <span className="font-medium text-foreground">{product.name}:</span>
                    <span className="text-muted-foreground">
                      {" "}
                      {Math.round(product.readinessScore)}% readiness, {Math.round(product.successProb || 0)}% success
                      probability
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {highRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h4 className="font-semibold text-sm">Action Required</h4>
              </div>
              <div className="space-y-3">
                {relevantActions
                  .sort((a, b) => {
                    // Sort by status: pending first, then in_progress, then completed
                    const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
                    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
                  })
                  .map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action} 
                      productId={action.product_id}
                    />
                  ))}
              </div>
            </div>
          )}

          {topPerformers.length === 0 && highRisk.length === 0 && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No products match the current filter criteria for executive insights.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground italic">
            Generated by MSIP AI Intelligence Engine • Last updated 2 hours ago
          </p>
        </div>
      </CardContent>
    </Card>
  );
};