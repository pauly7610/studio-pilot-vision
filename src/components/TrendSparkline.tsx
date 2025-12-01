import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendSparklineProps {
  data: Array<{ value: number }>;
  color?: string;
  height?: number;
  showTrendIcon?: boolean;
}

export const TrendSparkline = ({ 
  data, 
  color = "hsl(var(--primary))", 
  height = 40,
  showTrendIcon = true 
}: TrendSparklineProps) => {
  if (!data || data.length < 2) {
    return null;
  }

  // Calculate trend
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const trend = lastValue - firstValue;
  const trendPercent = firstValue > 0 ? ((trend / firstValue) * 100).toFixed(1) : 0;

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-success" aria-hidden="true" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-destructive" aria-hidden="true" />;
    return <Minus className="h-3 w-3 text-muted-foreground" aria-hidden="true" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return "text-success";
    if (trend < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Trend sparkline showing ${trend > 0 ? 'increase' : trend < 0 ? 'decrease' : 'no change'} of ${Math.abs(Number(trendPercent))}%`}>
      <ResponsiveContainer width={60} height={height}>
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {showTrendIcon && (
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {trend > 0 ? '+' : ''}{trendPercent}%
          </span>
        </div>
      )}
    </div>
  );
};