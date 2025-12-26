import { AlertTriangle, AlertCircle, Users, UserCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EscalationPathProps {
  riskBand: string;
  cyclesInCurrentStatus?: number;
  gatingStatus?: string;
  gatingStatusSince?: string;
  lifecycleStage?: string;
  compact?: boolean;
}

type EscalationLevel = "none" | "ambassador_review" | "exec_steerco" | "critical";

interface EscalationConfig {
  level: EscalationLevel;
  label: string;
  action: string;
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
  borderColor: string;
  owner: string;
}

const calculateEscalationLevel = (
  riskBand: string,
  cyclesInCurrentStatus: number,
  gatingStatus?: string
): EscalationLevel => {
  const isHighRisk = riskBand?.toLowerCase() === "high";
  const isMediumRisk = riskBand?.toLowerCase() === "medium";
  
  // Critical: High risk for 3+ cycles
  if (isHighRisk && cyclesInCurrentStatus >= 3) {
    return "critical";
  }
  
  // Exec SteerCo: High risk for 2 cycles OR stuck in legal/privacy
  if (isHighRisk && cyclesInCurrentStatus >= 2) {
    return "exec_steerco";
  }
  
  // Ambassador Review: Medium risk for 2+ cycles
  if (isMediumRisk && cyclesInCurrentStatus >= 2) {
    return "ambassador_review";
  }
  
  // Ambassador Review: Any gating bottleneck > 4 weeks
  if (gatingStatus && (gatingStatus.includes("Legal") || gatingStatus.includes("Privacy"))) {
    return "ambassador_review";
  }
  
  return "none";
};

const escalationConfigs: Record<EscalationLevel, EscalationConfig> = {
  none: {
    level: "none",
    label: "On Track",
    action: "Continue monitoring",
    icon: UserCheck,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    owner: "Regional Lead",
  },
  ambassador_review: {
    level: "ambassador_review",
    label: "⚠️ Ambassador Deep Dive",
    action: "Schedule review with Studio Ambassador",
    icon: Users,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    owner: "Studio Ambassador",
  },
  exec_steerco: {
    level: "exec_steerco",
    label: "🚨 Exec SteerCo",
    action: "Escalate to Executive Steering Committee",
    icon: AlertCircle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    owner: "VP Product",
  },
  critical: {
    level: "critical",
    label: "🔴 Critical Intervention",
    action: "Immediate executive intervention required",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    owner: "VP Product + Regional VP",
  },
};

const getNextMilestone = (lifecycleStage?: string, riskBand?: string): string => {
  if (riskBand?.toLowerCase() === "high") {
    return "Risk Mitigation Plan Due";
  }
  
  switch (lifecycleStage) {
    case "concept":
      return "Business Case Approval";
    case "early_pilot":
      return "Pilot Launch Gate";
    case "pilot":
      return "Commercial Readiness Review";
    case "commercial":
      return "Scale Decision";
    case "sunset":
      return "Sunset Completion";
    default:
      return "Next Gate Review";
  }
};

export const EscalationPath = ({
  riskBand,
  cyclesInCurrentStatus = 0,
  gatingStatus,
  gatingStatusSince,
  lifecycleStage,
  compact = false,
}: EscalationPathProps) => {
  // Calculate weeks in current gating status
  const weeksInGating = gatingStatusSince
    ? Math.floor((Date.now() - new Date(gatingStatusSince).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : 0;

  // Use weeks as proxy for cycles if not provided
  const effectiveCycles = cyclesInCurrentStatus || Math.floor(weeksInGating / 2);
  
  const escalationLevel = calculateEscalationLevel(riskBand, effectiveCycles, gatingStatus);
  const config = escalationConfigs[escalationLevel];
  const EscalationIcon = config.icon;
  const nextMilestone = getNextMilestone(lifecycleStage, riskBand);

  if (compact) {
    if (escalationLevel === "none") {
      return null; // Don't show badge for on-track items
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Badge
                variant="outline"
                className={cn(
                  config.bgColor,
                  config.color,
                  config.borderColor,
                  "text-xs cursor-help",
                  escalationLevel === "critical" && "animate-pulse"
                )}
              >
                <EscalationIcon className="h-3 w-3 mr-1" />
                {escalationLevel === "ambassador_review" ? "Review" : 
                 escalationLevel === "exec_steerco" ? "SteerCo" : "Critical"}
              </Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Escalation Triggered</span>
                <Badge variant="outline" className={cn(config.bgColor, config.color, "text-xs")}>
                  {config.label}
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Action:</span>
                  <span className="font-medium">{config.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="font-medium">{config.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Next Milestone:</span>
                  <span className="font-medium">{nextMilestone}</span>
                </div>
                {effectiveCycles > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cycles in status:</span>
                    <span className="font-medium">{effectiveCycles}</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Three-Tier Governance Model ensures accountability
              </p>
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
          <EscalationIcon className={cn("h-5 w-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.label}</span>
        </div>
        {escalationLevel !== "none" && (
          <Badge variant="outline" className="text-xs">
            {effectiveCycles} cycle{effectiveCycles !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Action Required:</span>
          <span className="font-medium">{config.action}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Owner:</span>
          <Badge variant="outline">{config.owner}</Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm pt-2 border-t">
          <span className="text-muted-foreground">Next Milestone:</span>
          <div className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{nextMilestone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
