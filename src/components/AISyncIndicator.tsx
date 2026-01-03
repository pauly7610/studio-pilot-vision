import { useAISyncStatus, getSyncStatusLabel } from "@/hooks/useAISyncStatus";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISyncIndicatorProps {
  compact?: boolean;
}

export function AISyncIndicator({ compact = false }: AISyncIndicatorProps) {
  const { activeSyncJob, isSyncing } = useAISyncStatus();

  // Don't show anything if not syncing and no recent job
  if (!activeSyncJob) {
    return null;
  }

  const isComplete = activeSyncJob.status === "completed";
  const isFailed = activeSyncJob.status === "failed";

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {isSyncing ? (
                <Badge variant="secondary" className="gap-1.5 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Syncing</span>
                </Badge>
              ) : isComplete ? (
                <Badge variant="outline" className="gap-1.5 bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-xs">Synced</span>
                </Badge>
              ) : isFailed ? (
                <Badge variant="outline" className="gap-1.5 bg-destructive/10 text-destructive border-destructive/20">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Failed</span>
                </Badge>
              ) : null}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium">AI Knowledge Sync</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getSyncStatusLabel(activeSyncJob.status)}
              </p>
              {isSyncing && (
                <Progress value={activeSyncJob.progress} className="h-1.5" />
              )}
              {isComplete && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {activeSyncJob.products_synced !== undefined && (
                    <p>Products: {activeSyncJob.products_synced}</p>
                  )}
                  {activeSyncJob.feedback_synced !== undefined && (
                    <p>Feedback: {activeSyncJob.feedback_synced}</p>
                  )}
                  {activeSyncJob.actions_synced !== undefined && (
                    <p>Actions: {activeSyncJob.actions_synced}</p>
                  )}
                </div>
              )}
              {isFailed && activeSyncJob.error && (
                <p className="text-xs text-destructive">{activeSyncJob.error}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full display
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : isFailed ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Brain className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-medium">
          {getSyncStatusLabel(activeSyncJob.status)}
        </span>
      </div>
      
      {isSyncing && (
        <div className="flex-1 max-w-32">
          <Progress value={activeSyncJob.progress} className="h-1.5" />
        </div>
      )}
      
      {isComplete && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {activeSyncJob.products_synced !== undefined && (
            <span>{activeSyncJob.products_synced} products</span>
          )}
          {activeSyncJob.feedback_synced !== undefined && (
            <span>• {activeSyncJob.feedback_synced} feedback</span>
          )}
        </div>
      )}
    </div>
  );
}

