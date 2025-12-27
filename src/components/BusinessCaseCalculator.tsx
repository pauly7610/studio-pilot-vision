import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const BusinessCaseCalculator = () => {
  const [numPMs, setNumPMs] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(60);
  const [hoursPerWeek, setHoursPerWeek] = useState(8);
  const [numProducts, setNumProducts] = useState(20);
  const [avgDelayDays, setAvgDelayDays] = useState(10);
  const [dailyDelayCost, setDailyDelayCost] = useState(12000);
  const [avgProductRevenue, setAvgProductRevenue] = useState(1000000);

  const timeSavingsReduction = 0.6;
  const delaySavingsReduction = 0.5;
  const revenueUplift = 0.15;
  const weeksPerYear = 52;

  const annualTimeSavings = numPMs * hoursPerWeek * timeSavingsReduction * hourlyRate * weeksPerYear;
  const annualDelaySavings = numProducts * avgDelayDays * delaySavingsReduction * dailyDelayCost;
  const annualRevenueUplift = numProducts * avgProductRevenue * revenueUplift;
  const totalAnnualBenefit = annualTimeSavings + annualDelaySavings + annualRevenueUplift;

  const implementationCost = 350000;
  const annualOpEx = 130000;
  const totalYear1Cost = implementationCost + annualOpEx;

  const netBenefit = totalAnnualBenefit - totalYear1Cost;
  const roi = ((netBenefit / totalYear1Cost) * 100).toFixed(0);
  const paybackWeeks = ((totalYear1Cost / totalAnnualBenefit) * weeksPerYear).toFixed(1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>ROI Business Case Calculator</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize the inputs to calculate the financial impact of MSIP for your organization
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Team Size & Productivity</h3>
              
              <div className="space-y-2">
                <Label htmlFor="numPMs">Number of Product Managers</Label>
                <Input
                  id="numPMs"
                  type="number"
                  value={numPMs}
                  onChange={(e) => setNumPMs(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($/hour)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoursPerWeek">Hours/Week on Manual Reporting</Label>
                <Input
                  id="hoursPerWeek"
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  min={1}
                  max={40}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Portfolio Metrics</h3>
              
              <div className="space-y-2">
                <Label htmlFor="numProducts">Number of Products</Label>
                <Input
                  id="numProducts"
                  type="number"
                  value={numProducts}
                  onChange={(e) => setNumProducts(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avgDelayDays">Average Delay Days (per product)</Label>
                <Input
                  id="avgDelayDays"
                  type="number"
                  value={avgDelayDays}
                  onChange={(e) => setAvgDelayDays(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyDelayCost">Daily Delay Cost ($)</Label>
                <Input
                  id="dailyDelayCost"
                  type="number"
                  value={dailyDelayCost}
                  onChange={(e) => setDailyDelayCost(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avgProductRevenue">Avg Product Revenue ($)</Label>
                <Input
                  id="avgProductRevenue"
                  type="number"
                  value={avgProductRevenue}
                  onChange={(e) => setAvgProductRevenue(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4">Financial Impact (Year 1)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Time Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    ${(annualTimeSavings / 1000).toFixed(0)}K
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    60% reduction in manual reporting
                  </p>
                </CardContent>
              </Card>

              <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-muted-foreground">Delay Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-warning">
                    ${(annualDelaySavings / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    50% reduction in project delays
                  </p>
                </CardContent>
              </Card>

              <Card className="border-success/30 bg-gradient-to-br from-success/5 to-transparent">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Revenue Uplift</span>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    ${(annualRevenueUplift / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    15% portfolio revenue increase
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Annual Benefit</span>
                <span className="text-2xl font-bold text-primary">
                  ${(totalAnnualBenefit / 1000000).toFixed(1)}M
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Implementation Cost</span>
                <span className="font-medium">-${(implementationCost / 1000).toFixed(0)}K</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Annual Operating Cost</span>
                <span className="font-medium">-${(annualOpEx / 1000).toFixed(0)}K</span>
              </div>

              <div className="pt-4 border-t border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Net Benefit (Year 1)</span>
                  <span className="text-3xl font-bold text-success">
                    ${(netBenefit / 1000000).toFixed(1)}M
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">ROI</div>
                    <Badge variant="outline" className="text-lg px-3 py-1 border-success text-success">
                      {roi}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Payback Period</div>
                    <Badge variant="outline" className="text-lg px-3 py-1 border-primary text-primary">
                      {paybackWeeks} weeks
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Assumptions:</strong> 60% time savings on manual reporting, 50% reduction in project delays, 
                15% portfolio revenue increase through better prioritization. Implementation: $350K (one-time), 
                Operating: $130K/year (infrastructure + maintenance).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
