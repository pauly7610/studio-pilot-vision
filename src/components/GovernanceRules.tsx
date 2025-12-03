import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface GovernanceRulesProps {
  products: Product[];
}

interface FlaggedProduct {
  product: Product;
  rule: string;
  severity: "high" | "medium";
}

export const GovernanceRules = ({ products }: GovernanceRulesProps) => {
  // Define governance rules
  const rules = [
    {
      id: "high-risk-low-revenue",
      name: "High Risk + Low Revenue",
      description: "Auto-flag products with Risk > 25% and Revenue < $2M",
      icon: AlertTriangle,
      check: (p: Product) => {
        const readiness = Array.isArray(p.readiness) ? p.readiness[0] : p.readiness;
        const prediction = Array.isArray(p.prediction) ? p.prediction[0] : p.prediction;
        return (prediction?.failure_risk || 0) > 0.25 && (p.revenue_target || 0) < 2_000_000;
      },
      severity: "high" as const,
    },
    {
      id: "zero-readiness-market-test",
      name: "Low Readiness at Pilot",
      description: "Escalate if <50% readiness at Pilot stage",
      icon: TrendingDown,
      check: (p: Product) => {
        const readiness = Array.isArray(p.readiness) ? p.readiness[0] : p.readiness;
        return p.lifecycle_stage === "pilot" && (readiness?.readiness_score || 0) < 50;
      },
      severity: "high" as const,
    },
    {
      id: "stale-early-pilot",
      name: "Stale Early Pilot",
      description: "Flag early pilots older than 6 months without progression",
      icon: Clock,
      check: (p: Product) => {
        if (p.lifecycle_stage !== "early_pilot") return false;
        if (!p.launch_date) return false;
        const launchDate = new Date(p.launch_date);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return launchDate < sixMonthsAgo;
      },
      severity: "medium" as const,
    },
  ];

  // Check which products are flagged by which rules
  const flaggedProducts: FlaggedProduct[] = [];
  
  products.forEach((product) => {
    rules.forEach((rule) => {
      if (rule.check(product)) {
        flaggedProducts.push({
          product,
          rule: rule.name,
          severity: rule.severity,
        });
      }
    });
  });

  const highSeverityCount = flaggedProducts.filter(f => f.severity === "high").length;
  const mediumSeverityCount = flaggedProducts.filter(f => f.severity === "medium").length;

  return (
    <Card className="card-elegant">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Governance Rules</CardTitle>
          </div>
          <div className="flex gap-2">
            {highSeverityCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highSeverityCount} Critical
              </Badge>
            )}
            {mediumSeverityCount > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                {mediumSeverityCount} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Rules */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Rules</p>
          {rules.map((rule) => {
            const matchCount = products.filter(rule.check).length;
            const RuleIcon = rule.icon;
            return (
              <div 
                key={rule.id} 
                className={`flex items-start gap-3 p-2 rounded-lg border ${
                  matchCount > 0 
                    ? rule.severity === "high" 
                      ? "bg-destructive/5 border-destructive/20" 
                      : "bg-warning/5 border-warning/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                <RuleIcon className={`h-4 w-4 mt-0.5 ${
                  matchCount > 0 
                    ? rule.severity === "high" ? "text-destructive" : "text-warning"
                    : "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{rule.name}</p>
                    {matchCount > 0 && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs shrink-0 ${
                          rule.severity === "high" 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : "bg-warning/10 text-warning border-warning/20"
                        }`}
                      >
                        {matchCount} flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flagged Products Summary */}
        {flaggedProducts.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Flagged Products
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {flaggedProducts.slice(0, 5).map((flagged, idx) => (
                <div key={`${flagged.product.id}-${idx}`} className="flex items-center justify-between text-xs">
                  <span className="truncate">{flagged.product.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      flagged.severity === "high" 
                        ? "bg-destructive/10 text-destructive" 
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {flagged.rule}
                  </Badge>
                </div>
              ))}
              {flaggedProducts.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{flaggedProducts.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {flaggedProducts.length === 0 && (
          <div className="text-center py-4">
            <Shield className="h-8 w-8 text-success mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">All products within governance thresholds</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};