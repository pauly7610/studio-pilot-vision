import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  CloudOff,
  Loader2,
  Database,
  Brain,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AI_INSIGHTS_URL = import.meta.env.VITE_AI_INSIGHTS_URL || "https://studio-pilot-vision.onrender.com";

interface HealthStatus {
  status: string;
  chromadb: boolean;
  cognee: boolean;
  groq: boolean;
  timestamp: string;
  stats?: {
    total_documents?: number;
    total_chunks?: number;
  };
}

interface SyncStatusIndicatorProps {
  compact?: boolean;
}

export function SyncStatusIndicator({ compact = false }: SyncStatusIndicatorProps) {
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check AI backend health
  const { data: health, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["ai-health-indicator"],
    queryFn: async (): Promise<HealthStatus> => {
      const response = await fetch(`${AI_INSIGHTS_URL}/health`);
      if (!response.ok) {
        throw new Error("AI service unavailable");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: 1,
  });

  // Update last sync time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastSyncTime(new Date(dataUpdatedAt).toLocaleTimeString());
    }
  }, [dataUpdatedAt]);

  // Determine overall status
  const getStatus = () => {
    if (!isOnline) return { status: "offline", color: "text-muted-foreground", bg: "bg-muted" };
    if (isLoading) return { status: "connecting", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (isError) return { status: "error", color: "text-destructive", bg: "bg-destructive/10" };
    if (health?.status === "ok" || health?.status === "healthy") {
      return { status: "connected", color: "text-success", bg: "bg-success/10" };
    }
    return { status: "degraded", color: "text-warning", bg: "bg-warning/10" };
  };

  const status = getStatus();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
              status.bg
            )}>
              {status.status === "connecting" && (
                <Loader2 className={cn("h-4 w-4 animate-spin", status.color)} />
              )}
              {status.status === "connected" && (
                <Cloud className={cn("h-4 w-4", status.color)} />
              )}
              {status.status === "offline" && (
                <CloudOff className={cn("h-4 w-4", status.color)} />
              )}
              {status.status === "error" && (
                <AlertCircle className={cn("h-4 w-4", status.color)} />
              )}
              {status.status === "degraded" && (
                <AlertCircle className={cn("h-4 w-4", status.color)} />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3 max-w-xs">
            <SyncStatusDetails health={health} status={status} lastSyncTime={lastSyncTime} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 cursor-help transition-colors",
              status.bg,
              status.color,
              "border-current/20"
            )}
          >
            {status.status === "connecting" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Connecting</span>
              </>
            )}
            {status.status === "connected" && (
              <>
                <Cloud className="h-3 w-3" />
                <span className="hidden sm:inline">AI Ready</span>
              </>
            )}
            {status.status === "offline" && (
              <>
                <CloudOff className="h-3 w-3" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
            {status.status === "error" && (
              <>
                <AlertCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Error</span>
              </>
            )}
            {status.status === "degraded" && (
              <>
                <AlertCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Degraded</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 max-w-xs">
          <SyncStatusDetails health={health} status={status} lastSyncTime={lastSyncTime} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SyncStatusDetails({ 
  health, 
  status, 
  lastSyncTime 
}: { 
  health?: HealthStatus; 
  status: { status: string; color: string }; 
  lastSyncTime: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold">AI Backend Status</span>
        <Badge variant="outline" className={cn("text-xs", status.color)}>
          {status.status}
        </Badge>
      </div>
      
      {health && (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="h-3 w-3" />
              ChromaDB
            </span>
            {health.chromadb ? (
              <CheckCircle2 className="h-3 w-3 text-success" />
            ) : (
              <AlertCircle className="h-3 w-3 text-destructive" />
            )}
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Brain className="h-3 w-3" />
              Cognee
            </span>
            {health.cognee ? (
              <CheckCircle2 className="h-3 w-3 text-success" />
            ) : (
              <AlertCircle className="h-3 w-3 text-destructive" />
            )}
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Groq LLM
            </span>
            {health.groq ? (
              <CheckCircle2 className="h-3 w-3 text-success" />
            ) : (
              <AlertCircle className="h-3 w-3 text-destructive" />
            )}
          </div>

          {health.stats?.total_documents !== undefined && (
            <div className="pt-1.5 border-t mt-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Indexed Documents</span>
                <span className="font-medium">{health.stats.total_documents}</span>
              </div>
              {health.stats.total_chunks !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vector Chunks</span>
                  <span className="font-medium">{health.stats.total_chunks.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {lastSyncTime && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
          <Clock className="h-3 w-3" />
          Last checked: {lastSyncTime}
        </div>
      )}
    </div>
  );
}

export default SyncStatusIndicator;

