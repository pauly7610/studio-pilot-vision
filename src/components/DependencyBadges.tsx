import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Globe, 
  Shield, 
  Scale, 
  Users, 
  Lock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DependencyType = "internal" | "external";

export interface Dependency {
  id: string;
  name: string;
  type: DependencyType;
  category: string;
  status: "blocked" | "pending" | "resolved";
  blockedSince?: string;
  notes?: string;
}

interface DependencyBadgesProps {
  dependencies: Dependency[];
  compact?: boolean;
  showOnlyBlockers?: boolean;
}

const getCategoryConfig = (category: string, type: DependencyType) => {
  const internalCategories: Record<string, { icon: typeof Shield; color: string; label: string }> = {
    legal: { icon: Scale, color: "bg-amber-500/10 text-amber-600 border-amber-500/30", label: "Legal" },
    cyber: { icon: Lock, color: "bg-red-500/10 text-red-600 border-red-500/30", label: "Cyber" },
    compliance: { icon: Shield, color: "bg-blue-500/10 text-blue-600 border-blue-500/30", label: "Compliance" },
    privacy: { icon: Shield, color: "bg-purple-500/10 text-purple-600 border-purple-500/30", label: "Privacy" },
    engineering: { icon: Users, color: "bg-slate-500/10 text-slate-600 border-slate-500/30", label: "Engineering" },
    ops: { icon: Building2, color: "bg-teal-500/10 text-teal-600 border-teal-500/30", label: "Ops" },
  };

  const externalCategories: Record<string, { icon: typeof Globe; color: string; label: string }> = {
    partner_rail: { icon: ExternalLink, color: "bg-orange-500/10 text-orange-600 border-orange-500/30", label: "Partner Rail" },
    vendor: { icon: Building2, color: "bg-pink-500/10 text-pink-600 border-pink-500/30", label: "Vendor" },
    api: { icon: Globe, color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30", label: "API" },
    integration: { icon: ExternalLink, color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30", label: "Integration" },
    regulatory: { icon: Scale, color: "bg-rose-500/10 text-rose-600 border-rose-500/30", label: "Regulatory" },
  };

  if (type === "internal") {
    return internalCategories[category.toLowerCase()] || { 
      icon: Building2, 
      color: "bg-muted text-muted-foreground border-border", 
      label: category 
    };
  }
  
  return externalCategories[category.toLowerCase()] || { 
    icon: Globe, 
    color: "bg-muted text-muted-foreground border-border", 
    label: category 
  };
};

const getStatusIndicator = (status: string) => {
  switch (status) {
    case "blocked":
      return { color: "text-destructive", icon: AlertTriangle, pulse: true };
    case "pending":
      return { color: "text-warning", icon: AlertTriangle, pulse: false };
    case "resolved":
      return { color: "text-success", icon: CheckCircle2, pulse: false };
    default:
      return { color: "text-muted-foreground", icon: AlertTriangle, pulse: false };
  }
};

const getBlockedDuration = (blockedSince?: string): string => {
  if (!blockedSince) return "";
  const days = Math.floor((Date.now() - new Date(blockedSince).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
};

export const DependencyBadges = ({ 
  dependencies, 
  compact = false,
  showOnlyBlockers = false 
}: DependencyBadgesProps) => {
  const filteredDeps = showOnlyBlockers 
    ? dependencies.filter(d => d.status === "blocked")
    : dependencies;

  if (filteredDeps.length === 0) return null;

  const internalDeps = filteredDeps.filter(d => d.type === "internal");
  const externalDeps = filteredDeps.filter(d => d.type === "external");
  const blockedCount = filteredDeps.filter(d => d.status === "blocked").length;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {blockedCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="bg-destructive/10 text-destructive border-destructive/30 text-xs animate-pulse"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {blockedCount} Blocker{blockedCount > 1 ? "s" : ""}
                </Badge>
              )}
              {internalDeps.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {internalDeps.length} Int
                </Badge>
              )}
              {externalDeps.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {externalDeps.length} Ext
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm p-3">
            <div className="space-y-3">
              <p className="font-semibold text-sm">Dependencies & Blockers</p>
              
              {internalDeps.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Internal
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {internalDeps.map((dep) => {
                      const config = getCategoryConfig(dep.category, dep.type);
                      const statusConfig = getStatusIndicator(dep.status);
                      const duration = getBlockedDuration(dep.blockedSince);
                      const CategoryIcon = config.icon;
                      
                      return (
                        <Badge 
                          key={dep.id} 
                          variant="outline" 
                          className={cn(config.color, "text-xs", statusConfig.pulse && "animate-pulse")}
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {config.label}
                          {dep.status === "blocked" && duration && (
                            <span className="ml-1 text-destructive">({duration})</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {externalDeps.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Globe className="h-3 w-3" /> External
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {externalDeps.map((dep) => {
                      const config = getCategoryConfig(dep.category, dep.type);
                      const statusConfig = getStatusIndicator(dep.status);
                      const duration = getBlockedDuration(dep.blockedSince);
                      const CategoryIcon = config.icon;
                      
                      return (
                        <Badge 
                          key={dep.id} 
                          variant="outline" 
                          className={cn(config.color, "text-xs", statusConfig.pulse && "animate-pulse")}
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {dep.name || config.label}
                          {dep.status === "blocked" && duration && (
                            <span className="ml-1 text-destructive">({duration})</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {blockedCount > 0 && (
                <div className="pt-1 border-t space-y-1">
                  <p className="text-xs text-destructive">
                    ⚠️ {blockedCount} blocking dependency - not the Foundry's fault
                  </p>
                  {externalDeps.filter(d => d.status === "blocked").length > 0 && (
                    <p className="text-xs text-orange-500 font-medium">
                      🔗 Blocked by: External Rail ({externalDeps.filter(d => d.status === "blocked").map(d => d.name).join(", ")})
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground italic">
                    Enables exec-level peer-to-peer partner conversations
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Dependencies</span>
        {blockedCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {blockedCount} Blocked
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {filteredDeps.map((dep) => {
          const config = getCategoryConfig(dep.category, dep.type);
          const statusConfig = getStatusIndicator(dep.status);
          const duration = getBlockedDuration(dep.blockedSince);
          const CategoryIcon = config.icon;
          const StatusIcon = statusConfig.icon;
          
          return (
            <TooltipProvider key={dep.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      config.color, 
                      "text-xs cursor-help",
                      statusConfig.pulse && "animate-pulse"
                    )}
                  >
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {dep.type === "external" ? dep.name : config.label}
                    {dep.status === "blocked" && (
                      <>
                        <StatusIcon className={cn("h-3 w-3 ml-1", statusConfig.color)} />
                        {duration && <span className="ml-0.5">{duration}</span>}
                      </>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-medium">{dep.name}</p>
                    <p className="text-muted-foreground">
                      {dep.type === "internal" ? "Internal" : "External"} • {dep.status}
                    </p>
                    {dep.notes && <p className="mt-1">{dep.notes}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};
