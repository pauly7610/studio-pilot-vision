import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MomentumIndicatorProps {
  data: Array<{ value: number; date?: string }>;
  currentValue: number;
  previousValue?: number;
  label?: string;
  unit?: string;
  deltaLabel?: string;
  compact?: boolean;
}

type MomentumStatus = "improving" | "declining" | "stable";

export const MomentumIndicator = ({
  data,
  currentValue,
  previousValue,
  label = "Status",
  unit = "%",
  deltaLabel = "vs. last week",
  compact = false,
}: MomentumIndicatorProps) => {
  // Calculate momentum direction
  const getMomentumStatus = (): MomentumStatus => {
    if (data.length < 2) return "stable";
    
    const recentValues = data.slice(-3);
    const oldValues = data.slice(0, 3);
    
    const recentAvg = recentValues.reduce((sum, d) => sum + d.value, 0) / recentValues.length;
    const oldAvg = oldValues.reduce((sum, d) => sum + d.value, 0) / oldValues.length;
    
    const diff = recentAvg - oldAvg;
    if (diff > 2) return "improving";
    if (diff < -2) return "declining";
    return "stable";
  };

  const momentum = getMomentumStatus();
  
  // Calculate delta from previous period
  const delta = previousValue !== undefined ? currentValue - previousValue : 0;
  const deltaPercent = previousValue && previousValue > 0 
    ? ((delta / previousValue) * 100).toFixed(1) 
    : "0";

  const momentumConfig = {
    improving: {
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
      icon: ArrowUp,
      label: "Improving",
      sparklineColor: "hsl(142, 76%, 36%)", // success green
    },
    declining: {
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      icon: ArrowDown,
      label: "Declining",
      sparklineColor: "hsl(0, 84%, 60%)", // destructive red
    },
    stable: {
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      icon: Minus,
      label: "Stable",
      sparklineColor: "hsl(48, 96%, 53%)", // warning yellow
    },
  };

  const config = momentumConfig[momentum];
  const DirectionIcon = config.icon;

  // Determine if intervention is needed
  const needsIntervention = momentum === "declining";
  const needsDeepDive = momentum === "declining" && currentValue < 70;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border cursor-help",
                config.bgColor,
                config.color,
                config.borderColor,
                needsDeepDive && "animate-pulse"
              )}
            >
              <DirectionIcon className="h-3 w-3" />
              <span>{delta >= 0 ? "+" : ""}{delta.toFixed(0)}{unit}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">{label} Momentum</span>
                <span className={cn("text-sm font-medium", config.color)}>
                  {config.label}
                </span>
              </div>
              
              {/* Sparkline */}
              {data.length >= 2 && (
                <div className="h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={config.sparklineColor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Delta metric */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{deltaLabel}</span>
                <span className={cn("font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
                  {delta >= 0 ? "+" : ""}{deltaPercent}%
                </span>
              </div>
              
              {needsDeepDive && (
                <div className="text-xs text-destructive font-medium pt-1 border-t">
                  ⚠️ Requires deep dive - declining trend
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg p-3 border",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <DirectionIcon className={cn("h-4 w-4", config.color)} />
          <span className={cn("text-sm font-semibold", config.color)}>
            {config.label}
          </span>
        </div>
        <div className={cn("text-sm font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}{unit} {deltaLabel}
        </div>
      </div>
      
      {/* Sparkline */}
      {data.length >= 2 && (
        <div className="h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={config.sparklineColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {needsDeepDive && (
        <div className="mt-2 pt-2 border-t text-xs text-destructive font-medium">
          ⚠️ Declining trend requires immediate attention
        </div>
      )}
    </div>
  );
};
