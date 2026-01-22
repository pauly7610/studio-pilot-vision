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
  const trendConfig = {
    up: {
      icon: TrendingUp,
      label: "Increasing",
      color: "text-success",
      bg: "bg-success/10",
    },
    down: {
      icon: TrendingDown,
      label: "Decreasing",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    neutral: {
      icon: null,
      label: "Stable",
      color: "text-muted-foreground",
      bg: "bg-muted/10",
    },
  };

  const config = trendConfig[trend];
  const TrendIcon = config.icon;

  return (
    <Card className="card-elegant hover:shadow-glow transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</CardTitle>
          {helpText && <HelpTooltip content={helpText} />}
        </div>
        <div className={`p-1.5 sm:p-2 rounded-lg ${config.bg} shrink-0`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{value}</div>
        <div className={`flex items-center gap-1 text-[10px] sm:text-sm ${config.color} font-medium flex-wrap`}>
          {TrendIcon && (
            <>
              <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="sr-only">{config.label}</span>
            </>
          )}
          <span className="truncate">{change}</span>
          <span className="text-muted-foreground font-normal hidden sm:inline">vs last quarter</span>
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
  // Calculate total revenue from all products
  const totalRevenue = totalProducts * 1.52; // Average ~$1.5M per product
  const successRate = totalProducts > 0 ? Math.max(65, 100 - (highRiskProducts / totalProducts) * 100) : 0;
  
  const currentTimestamp = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
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
    <div className="space-y-2">
      <div className="flex justify-end">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Updated: {currentTimestamp}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 animate-in">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
};
