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
      label: "Low Risk",
      color: "text-success",
      bg: "bg-success/10 border-success/20",
      pattern: "✓",
    },
    medium: {
      icon: AlertCircle,
      label: "Medium Risk",
      color: "text-warning",
      bg: "bg-warning/10 border-warning/20",
      pattern: "!",
    },
    high: {
      icon: AlertTriangle,
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
        highContrastMode ? 'border-2' : ''
      }`}
      aria-label={`Risk level: ${config.label}`}
    >
      <Icon className="h-3 w-3 mr-1" aria-hidden="true" />
      {config.label}
      {(highContrastMode || colorBlindMode !== "none") && (
        <span className="ml-1 font-bold" aria-hidden="true">
          {config.pattern}
        </span>
      )}
    </Badge>
  );
}
