import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataHealthScoreProps {
  product: {
    owner_email?: string;
    region?: string;
    budget_code?: string;
    pii_flag?: boolean;
    gating_status?: string;
    success_metric?: string;
  };
  compact?: boolean;
}

type HealthStatus = "green" | "yellow" | "red";

interface FieldStatus {
  name: string;
  filled: boolean;
}

export const DataHealthScore = ({ product, compact = false }: DataHealthScoreProps) => {
  // Check 6 mandatory fields for Data Contract compliance
  const mandatoryFields: FieldStatus[] = [
    { name: "Product Owner", filled: !!product.owner_email && product.owner_email.length > 0 },
    { name: "Region", filled: !!product.region && product.region.length > 0 },
    { name: "Budget Code", filled: !!product.budget_code && product.budget_code.length > 0 },
    { name: "PII/Privacy Flag", filled: product.pii_flag !== undefined && product.pii_flag !== null },
    { name: "Gating Status", filled: !!product.gating_status && product.gating_status !== "Pending Review" },
    { name: "Success Metric", filled: !!product.success_metric && product.success_metric.length > 0 },
  ];

  const filledCount = mandatoryFields.filter(f => f.filled).length;
  const totalFields = mandatoryFields.length;

  // Determine health status
  const getHealthStatus = (): HealthStatus => {
    if (filledCount === totalFields) return "green";
    if (filledCount >= 4) return "yellow";
    return "red";
  };

  const healthStatus = getHealthStatus();

  const statusConfig = {
    green: {
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
      icon: CheckCircle2,
      label: "Complete",
    },
    yellow: {
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      icon: AlertCircle,
      label: "Partial",
    },
    red: {
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      icon: XCircle,
      label: "Incomplete",
    },
  };

  const config = statusConfig[healthStatus];
  const StatusIcon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                config.bgColor,
                config.color,
                config.borderColor
              )}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{filledCount}/{totalFields}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Data Contract Status: {config.label}</p>
              <div className="space-y-1">
                {mandatoryFields.map((field) => (
                  <div key={field.name} className="flex items-center gap-2 text-xs">
                    {field.filled ? (
                      <CheckCircle2 className="h-3 w-3 text-success" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className={field.filled ? "text-muted-foreground" : "font-medium"}>
                      {field.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "rounded-lg p-3 border",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-semibold", config.color)}>
          Data Health: {config.label}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {filledCount}/{totalFields} fields
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {mandatoryFields.map((field) => (
          <div key={field.name} className="flex items-center gap-1.5 text-xs">
            {field.filled ? (
              <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
            ) : (
              <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
            )}
            <span className={field.filled ? "text-muted-foreground" : "font-medium text-foreground"}>
              {field.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
