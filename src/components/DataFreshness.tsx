import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from "date-fns";

interface DataFreshnessProps {
  lastUpdated?: string;
  dataContractComplete?: boolean;
  mandatoryFieldsFilled?: number;
  totalMandatoryFields?: number;
  compact?: boolean;
}

type FreshnessStatus = "fresh" | "stale" | "outdated" | "synced";

const getFreshnessStatus = (
  lastUpdated?: string,
  dataContractComplete?: boolean
): FreshnessStatus => {
  if (dataContractComplete) {
    return "synced";
  }
  
  if (!lastUpdated) {
    return "outdated";
  }
  
  const hoursSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate < 24) return "fresh";
  if (hoursSinceUpdate < 72) return "stale";
  return "outdated";
};

const freshnessConfig = {
  synced: {
    label: "Central Sync Complete",
    shortLabel: "Synced",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    description: "Data Contract fulfilled — no manual status requests needed",
  },
  fresh: {
    label: "Data Fresh",
    shortLabel: "Fresh",
    icon: RefreshCw,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    borderColor: "border-chart-2/30",
    description: "Recently updated, data is current",
  },
  stale: {
    label: "Data Stale",
    shortLabel: "Stale",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    description: "Data may be outdated, consider refreshing",
  },
  outdated: {
    label: "Update Required",
    shortLabel: "Outdated",
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    description: "Data is outdated, update needed",
  },
};

export const DataFreshness = ({
  lastUpdated,
  dataContractComplete = false,
  mandatoryFieldsFilled = 0,
  totalMandatoryFields = 6,
  compact = false,
}: DataFreshnessProps) => {
  const status = getFreshnessStatus(lastUpdated, dataContractComplete);
  const config = freshnessConfig[status];
  const StatusIcon = config.icon;

  const formattedDate = lastUpdated 
    ? format(new Date(lastUpdated), "MMM dd, yyyy h:mm a")
    : "Never";
  
  const timeAgo = lastUpdated
    ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
    : "Unknown";

  const contractPercent = Math.round((mandatoryFieldsFilled / totalMandatoryFields) * 100);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                config.bgColor,
                config.color,
                config.borderColor,
                "text-xs cursor-help"
              )}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.shortLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Data Status</span>
                <Badge variant="outline" className={cn(config.bgColor, config.color, "text-xs")}>
                  {config.label}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground">{config.description}</p>
              
              <div className="space-y-1 text-xs pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{timeAgo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Contract:</span>
                  <span className="font-medium">{mandatoryFieldsFilled}/{totalMandatoryFields} ({contractPercent}%)</span>
                </div>
              </div>
              
              {status === "synced" && (
                <p className="text-xs text-success pt-2 border-t">
                  ✅ Regional Leads no longer need to field ad-hoc status requests
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full view
  return (
    <div className={cn("rounded-lg p-4 border", config.bgColor, config.borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-5 w-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last Synced:</span>
          <span className="font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Data Contract:</span>
          <Badge variant="outline" className={contractPercent === 100 ? "bg-success/10 text-success" : ""}>
            {mandatoryFieldsFilled}/{totalMandatoryFields} fields
          </Badge>
        </div>
      </div>
      
      {status === "synced" && (
        <div className="mt-3 pt-3 border-t text-xs text-success">
          ✅ Single source of truth — no manual status requests needed
        </div>
      )}
    </div>
  );
};
