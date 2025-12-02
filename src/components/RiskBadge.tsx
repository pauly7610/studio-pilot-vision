import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface RiskBadgeProps {
  risk: "low" | "medium" | "high";
  className?: string;
}

export function RiskBadge({ risk, className = "" }: RiskBadgeProps) {
  const { highContrastMode, colorBlindMode } = useAccessibility();

  const riskConfig = {
    low: {
      icon: CheckCircle,
      emoji: "🟢",
      label: "Low Risk",
      color: "text-success",
      bg: "bg-success/10 border-success/20",
      pattern: "✓",
    },
    medium: {
      icon: AlertCircle,
      emoji: "🟡",
      label: "Medium Risk",
      color: "text-warning",
      bg: "bg-warning/10 border-warning/20",
      pattern: "!",
    },
    high: {
      icon: AlertTriangle,
      emoji: "🔴",
      label: "High Risk",
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
      pattern: "⚠",
    },
  };

  const config = riskConfig[risk];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.bg} ${config.color} ${className} ${
        highContrastMode ? 'border-2 font-bold' : 'font-semibold'
      }`}
      aria-label={`Risk level: ${config.label}`}
    >
      <span className="text-base mr-1.5" aria-hidden="true">{config.emoji}</span>
      <Icon className="h-3 w-3 mr-1" aria-hidden="true" />
      {config.label}
      {(highContrastMode || colorBlindMode !== "none") && (
        <span className="ml-1.5 font-bold text-base" aria-hidden="true">
          {config.pattern}
        </span>
      )}
    </Badge>
  );
}
