import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/hooks/useProducts";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";

interface ComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

export function ComparisonModal({ open, onOpenChange, products }: ComparisonModalProps) {
  if (products.length === 0) return null;

  // Prepare radar chart data for readiness breakdown
  const getRadarData = (product: Product) => {
    const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
    if (!readiness) return [];

    return [
      { metric: "Readiness", value: readiness.readiness_score || 0, fullMark: 100 },
      { metric: "Documentation", value: readiness.documentation_score || 0, fullMark: 100 },
      { metric: "Sales Training", value: readiness.sales_training_pct || 0, fullMark: 100 },
      { metric: "Partner Enabled", value: readiness.partner_enabled_pct || 0, fullMark: 100 },
      { metric: "Compliance", value: readiness.compliance_complete ? 100 : 0, fullMark: 100 },
      { metric: "Onboarding", value: readiness.onboarding_complete ? 100 : 0, fullMark: 100 },
    ];
  };

  // Get compliance data for each product
  const getComplianceData = (product: any) => {
    const compliance = product.compliance ? (Array.isArray(product.compliance) ? product.compliance : []) : [];
    return {
      total: compliance.length,
      complete: compliance.filter((c: any) => c.status === "complete").length,
      inProgress: compliance.filter((c: any) => c.status === "in_progress").length,
      pending: compliance.filter((c: any) => c.status === "pending").length,
    };
  };

  // Prepare comparison data for bar charts
  const comparisonData = products.map(product => {
    const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
    const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;
    
    return {
      name: product.name.substring(0, 15) + (product.name.length > 15 ? "..." : ""),
      readiness: readiness?.readiness_score || 0,
      success: (prediction?.success_probability || 0) * 100,
      revenue: (prediction?.revenue_probability || 0) * 100,
    };
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-success text-success-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "high": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "concept": return "bg-muted text-muted-foreground";
      case "early_pilot": return "bg-chart-4 text-foreground";
      case "pilot": return "bg-chart-3 text-success-foreground";
      case "commercial": return "bg-success text-success-foreground";
      case "sunset": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Product Comparison</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const readiness = Array.isArray(product.readiness) ? product.readiness[0] : product.readiness;
              const prediction = Array.isArray(product.prediction) ? product.prediction[0] : product.prediction;
              
              return (
                <Card key={product.id} className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStageColor(product.lifecycle_stage)}>
                        {product.lifecycle_stage}
                      </Badge>
                      {readiness && (
                        <RiskBadge risk={readiness.risk_band.toLowerCase() as "low" | "medium" | "high"} />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{product.product_type.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span className="font-medium">{product.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Readiness:</span>
                      <span className="font-semibold text-primary">
                        {readiness?.readiness_score || 0}%
                      </span>
                    </div>
                    {prediction && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Success:</span>
                          <div className="flex items-center gap-1">
                            {(prediction.success_probability || 0) > 0.5 ? (
                              <TrendingUp className="w-3 h-3 text-success" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-destructive" />
                            )}
                            <span className="font-medium">
                              {((prediction.success_probability || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue Prob:</span>
                          <span className="font-medium">
                            {((prediction.revenue_probability || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Metrics Comparison Bar Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metrics Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
                <Bar dataKey="readiness" fill="hsl(var(--chart-1))" name="Readiness Score" />
                <Bar dataKey="success" fill="hsl(var(--chart-3))" name="Success Probability" />
                <Bar dataKey="revenue" fill="hsl(var(--chart-4))" name="Revenue Probability" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar Charts for Readiness Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Readiness Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="space-y-2">
                  <h4 className="text-sm font-medium text-center">{product.name}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={getRadarData(product)}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </Card>

          {/* Compliance Status Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const complianceStats = getComplianceData(product);
                return (
                  <div key={product.id} className="space-y-3">
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-sm">Complete</span>
                        </div>
                        <Badge variant="secondary">{complianceStats.complete}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-warning" />
                          <span className="text-sm">In Progress</span>
                        </div>
                        <Badge variant="secondary">{complianceStats.inProgress}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Pending</span>
                        </div>
                        <Badge variant="secondary">{complianceStats.pending}</Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-sm">Total</span>
                        <span>{complianceStats.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}