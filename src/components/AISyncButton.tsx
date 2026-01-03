import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useAISyncStatus, getSyncStatusLabel } from "@/hooks/useAISyncStatus";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface AISyncButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AISyncButton({ variant = "outline", size = "sm" }: AISyncButtonProps) {
  const [open, setOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const { activeSyncJob, isSyncing, triggerSync } = useAISyncStatus();

  const handleSync = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter your admin API key");
      return;
    }

    try {
      await triggerSync(adminKey);
      toast.success("Sync started! Knowledge graph will be updated shortly.");
      // Don't close dialog so user can see progress
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to trigger sync");
    }
  };

  const isComplete = activeSyncJob?.status === "completed";
  const isFailed = activeSyncJob?.status === "failed";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          Sync to AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Data to AI Knowledge Graph
          </DialogTitle>
          <DialogDescription>
            Manually trigger a full sync of products, feedback, and actions to the AI knowledge graph.
            This requires admin access.
          </DialogDescription>
        </DialogHeader>

        {/* Sync Progress */}
        {activeSyncJob && (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-3">
              {isSyncing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : isFailed ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : null}
              <span className="font-medium">
                {getSyncStatusLabel(activeSyncJob.status)}
              </span>
            </div>
            
            {isSyncing && (
              <Progress value={activeSyncJob.progress} className="h-2 mb-3" />
            )}
            
            {isComplete && (
              <div className="text-sm text-muted-foreground space-y-1 bg-success/10 p-3 rounded-lg">
                <p>✓ Products synced: {activeSyncJob.products_synced ?? 0}</p>
                <p>✓ Feedback synced: {activeSyncJob.feedback_synced ?? 0}</p>
                <p>✓ Actions synced: {activeSyncJob.actions_synced ?? 0}</p>
              </div>
            )}
            
            {isFailed && activeSyncJob.error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {activeSyncJob.error}
              </p>
            )}
          </div>
        )}

        {/* Admin Key Input (only show if not currently syncing) */}
        {!isSyncing && !isComplete && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Admin API Key
              </Label>
              <Input
                id="admin-key"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your ADMIN_API_KEY"
              />
              <p className="text-xs text-muted-foreground">
                This is the same key configured in your Render environment variables.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {isComplete ? (
            <Button onClick={() => setOpen(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSync} disabled={isSyncing || !adminKey.trim()}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Sync
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

