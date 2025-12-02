import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, TrendingUp, TrendingDown, RotateCcw, ArrowRight } from "lucide-react";

interface WhatIfSimulatorProps {
  currentReadiness: {
    sales_training_pct: number;
    partner_enabled_pct: number;
    compliance_complete: boolean;
    onboarding_complete: boolean;
    documentation_score: number;
  };
  currentPrediction: {
    success_probability: number;
    revenue_probability: number;
    failure_risk: number;
  };
}

export const WhatIfSimulator = ({
  currentReadiness,
  currentPrediction,
}: WhatIfSimulatorProps) => {
  const [adjustedValues, setAdjustedValues] = useState({
    sales_training: currentReadiness.sales_training_pct,
    partner_enabled: currentReadiness.partner_enabled_pct,
    compliance: currentReadiness.compliance_complete ? 100 : 50,
    onboarding: currentReadiness.onboarding_complete ? 100 : 0,
    documentation: currentReadiness.documentation_score,
  });

  // Simplified prediction model (in real app, would call ML model)
  const simulatedPrediction = useMemo(() => {
    const avgReadiness =
      (adjustedValues.sales_training +
        adjustedValues.partner_enabled +
        adjustedValues.compliance +
        adjustedValues.onboarding +
        adjustedValues.documentation) /
      5;

    // Deterministic linear model for instant, predictable updates
    const readinessFactor = avgReadiness / 100;
    const successProb = Math.min(0.95, Math.max(0.1, 0.2 + readinessFactor * 0.75));
    const revenueProb = Math.min(0.9, successProb * 0.85);
    const failureRisk = Math.max(0.05, 1 - successProb);

    // Calculate risk band based on readiness
    let riskBand: "low" | "medium" | "high";
    if (avgReadiness >= 80) {
      riskBand = "low";
    } else if (avgReadiness >= 60) {
      riskBand = "medium";
    } else {
      riskBand = "high";
    }

    return {
      success_probability: successProb,
      revenue_probability: revenueProb,
      failure_risk: failureRisk,
      readiness_score: avgReadiness,
      risk_band: riskBand,
    };
  }, [adjustedValues]);

  const getDelta = (current: number, simulated: number) => {
    const delta = ((simulated - current) / current) * 100;
    return {
      value: Math.abs(delta),
      isPositive: delta > 0,
      isNeutral: Math.abs(delta) < 1,
    };
  };

  const successDelta = getDelta(
    currentPrediction.success_probability,
    simulatedPrediction.success_probability
  );
  const revenueDelta = getDelta(
    currentPrediction.revenue_probability,
    simulatedPrediction.revenue_probability
  );

  const handleReset = () => {
    setAdjustedValues({
      sales_training: currentReadiness.sales_training_pct,
      partner_enabled: currentReadiness.partner_enabled_pct,
      compliance: currentReadiness.compliance_complete ? 100 : 50,
      onboarding: currentReadiness.onboarding_complete ? 100 : 0,
      documentation: currentReadiness.documentation_score,
    });
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" aria-hidden="true" />
              What-If Scenario Simulator
            </CardTitle>
            <CardDescription className="mt-1">
              Adjust readiness factors to see impact on success predictions
            </CardDescription>
          </div>
          <Button variant="outline" size="default" onClick={handleReset} className="gap-2" aria-label="Reset to live data">
            <RotateCcw className="h-4 w-4" />
            Reset to Live Data
          </Button>
        </div>
        <div className="mt-3 px-3 py-2 rounded-md bg-warning/10 border border-warning/30">
          <p className="text-xs font-medium text-warning-foreground">
            ⚠️ Simulation only — does not change production data
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adjustment Sliders */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Sales Training Coverage</label>
              <Badge variant="secondary" className="text-xs">
                {Math.round(adjustedValues.sales_training)}%
              </Badge>
            </div>
            <Slider
              value={[adjustedValues.sales_training]}
              onValueChange={([value]) =>
                setAdjustedValues({ ...adjustedValues, sales_training: value })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
              aria-label="Adjust sales training coverage"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Partner Enablement</label>
              <Badge variant="secondary" className="text-xs">
                {Math.round(adjustedValues.partner_enabled)}%
              </Badge>
            </div>
            <Slider
              value={[adjustedValues.partner_enabled]}
              onValueChange={([value]) =>
                setAdjustedValues({ ...adjustedValues, partner_enabled: value })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
              aria-label="Adjust partner enablement"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Compliance Completion</label>
              <Badge variant="secondary" className="text-xs">
                {Math.round(adjustedValues.compliance)}%
              </Badge>
            </div>
            <Slider
              value={[adjustedValues.compliance]}
              onValueChange={([value]) =>
                setAdjustedValues({ ...adjustedValues, compliance: value })
              }
              min={0}
              max={100}
              step={25}
              className="w-full"
              aria-label="Adjust compliance completion"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Onboarding Completion</label>
              <Badge variant="secondary" className="text-xs">
                {Math.round(adjustedValues.onboarding)}%
              </Badge>
            </div>
            <Slider
              value={[adjustedValues.onboarding]}
              onValueChange={([value]) =>
                setAdjustedValues({ ...adjustedValues, onboarding: value })
              }
              min={0}
              max={100}
              step={50}
              className="w-full"
              aria-label="Adjust onboarding completion"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Documentation Quality</label>
              <Badge variant="secondary" className="text-xs">
                {Math.round(adjustedValues.documentation)}%
              </Badge>
            </div>
            <Slider
              value={[adjustedValues.documentation]}
              onValueChange={([value]) =>
                setAdjustedValues({ ...adjustedValues, documentation: value })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
              aria-label="Adjust documentation quality"
            />
          </div>
        </div>

        <Separator />

        {/* Prediction Comparison */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Predicted Impact</h4>

          {/* Overall Readiness */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Overall Readiness Score</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Current:</span>
                <span className="text-lg font-bold">
                  {Math.round(
                    (currentReadiness.sales_training_pct +
                      currentReadiness.partner_enabled_pct +
                      (currentReadiness.compliance_complete ? 100 : 50) +
                      (currentReadiness.onboarding_complete ? 100 : 0) +
                      currentReadiness.documentation_score) /
                      5
                  )}
                  %
                </span>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">&nbsp;</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Simulated:</span>
                <span className="text-lg font-bold text-primary">
                  {Math.round(simulatedPrediction.readiness_score)}%
                </span>
              </div>
            </div>
          </div>

          {/* Success Probability */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Success Probability</p>
              <span className="text-2xl font-bold">
                {Math.round(currentPrediction.success_probability * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              {successDelta.isNeutral ? (
                <Badge variant="secondary">No change</Badge>
              ) : successDelta.isPositive ? (
                <Badge className="bg-success/10 text-success border-success/20 gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{successDelta.value.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -{successDelta.value.toFixed(1)}%
                </Badge>
              )}
            </div>
            <span className="text-2xl font-bold text-success">
              {Math.round(simulatedPrediction.success_probability * 100)}%
            </span>
          </div>

          {/* Revenue Probability */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Revenue Achievement</p>
              <span className="text-2xl font-bold">
                {Math.round(currentPrediction.revenue_probability * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              {revenueDelta.isNeutral ? (
                <Badge variant="secondary">No change</Badge>
              ) : revenueDelta.isPositive ? (
                <Badge className="bg-success/10 text-success border-success/20 gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{revenueDelta.value.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -{revenueDelta.value.toFixed(1)}%
                </Badge>
              )}
            </div>
            <span className="text-2xl font-bold text-chart-3">
              {Math.round(simulatedPrediction.revenue_probability * 100)}%
            </span>
          </div>

          {/* Risk Band */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
              <Badge className={
                simulatedPrediction.risk_band === "low"
                  ? "bg-success/10 text-success border-success/20"
                  : simulatedPrediction.risk_band === "medium"
                  ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              }>
                {simulatedPrediction.risk_band === "low" ? "🟢 LOW RISK" : 
                 simulatedPrediction.risk_band === "medium" ? "🟡 MEDIUM RISK" : 
                 "🔴 HIGH RISK"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">💡 Insight:</span>{" "}
            {simulatedPrediction.readiness_score > 80
              ? "Excellent readiness! This product is well-positioned for successful commercialization."
              : simulatedPrediction.readiness_score > 60
              ? "Good progress. Focus on areas below 70% to further reduce risk."
              : "Priority improvements needed. Consider delaying launch until readiness exceeds 70%."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};