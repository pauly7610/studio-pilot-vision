import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "./HelpTooltip";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  helpText?: string;
}

const MetricCard = ({ title, value, change, trend, icon, helpText }: MetricCardProps) => {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const bgColor = trend === "up" ? "bg-success/10" : trend === "down" ? "bg-destructive/10" : "bg-muted/10";

  return (
    <Card className="card-elegant hover:shadow-glow transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {helpText && <HelpTooltip content={helpText} />}
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          {trend === "up" ? <TrendingUp className="h-4 w-4" /> : trend === "down" ? <TrendingDown className="h-4 w-4" /> : null}
          <span className="font-medium">{change}</span>
          <span className="text-muted-foreground">vs last quarter</span>
        </div>
      </CardContent>
    </Card>
  );
};

interface PortfolioMetricsProps {
  totalProducts: number;
  highRiskProducts: number;
}

export const PortfolioMetrics = ({ totalProducts, highRiskProducts }: PortfolioMetricsProps) => {
  // Calculate total revenue from all products (mock calculation for demo)
  const totalRevenue = totalProducts * 1.52; // Average ~$1.5M per product
  const successRate = totalProducts > 0 ? Math.max(65, 100 - (highRiskProducts / totalProducts) * 100) : 0;
  
  const metrics = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(1)}M`,
      change: "+18.2%",
      trend: "up" as "up" | "down" | "neutral",
      icon: <DollarSign className="h-4 w-4 text-success" />,
      helpText: "Combined revenue target across all active products in the portfolio",
    },
    {
      title: "Active Products",
      value: totalProducts.toString(),
      change: totalProducts > 0 ? `${totalProducts} in portfolio` : "No products",
      trend: "neutral" as "up" | "down" | "neutral",
      icon: <Target className="h-4 w-4 text-primary" />,
      helpText: "Total number of products currently being managed across all lifecycle stages",
    },
    {
      title: "Launch Success Rate",
      value: `${Math.round(successRate)}%`,
      change: successRate >= 75 ? "+5.2%" : "-4.3%",
      trend: (successRate >= 75 ? "up" : "down") as "up" | "down" | "neutral",
      icon: <CheckCircle2 className="h-4 w-4 text-warning" />,
      helpText: "Percentage of products with readiness score >75% and low/medium risk band",
    },
    {
      title: "High Risk Products",
      value: highRiskProducts.toString(),
      change: highRiskProducts > 0 ? `${highRiskProducts} require attention` : "All on track",
      trend: "neutral" as "up" | "down" | "neutral",
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      helpText: "Products with readiness score <60% or high risk band requiring governance intervention",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};
