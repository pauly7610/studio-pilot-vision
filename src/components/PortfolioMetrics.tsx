import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, change, trend, icon }: MetricCardProps) => {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const bgColor = trend === "up" ? "bg-success/10" : trend === "down" ? "bg-destructive/10" : "bg-muted/10";

  return (
    <Card className="card-elegant hover:shadow-glow transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
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
  const metrics = [
    {
      title: "Total Revenue",
      value: "$24.3M",
      change: "+18.2%",
      trend: "up" as const,
      icon: <DollarSign className="h-4 w-4 text-success" />,
    },
    {
      title: "Active Products",
      value: totalProducts.toString(),
      change: totalProducts > 0 ? `${totalProducts} in portfolio` : "No products",
      trend: "neutral" as const,
      icon: <Target className="h-4 w-4 text-primary" />,
    },
    {
      title: "Launch Success Rate",
      value: "78%",
      change: "-4.3%",
      trend: "down" as const,
      icon: <CheckCircle2 className="h-4 w-4 text-warning" />,
    },
    {
      title: "High Risk Products",
      value: highRiskProducts.toString(),
      change: highRiskProducts > 0 ? `${highRiskProducts} require attention` : "All on track",
      trend: "neutral" as const,
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
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
