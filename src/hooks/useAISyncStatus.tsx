import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Backend API URL
const AI_INSIGHTS_URL = import.meta.env.VITE_AI_INSIGHTS_URL || "https://studio-pilot-vision.onrender.com";

export interface SyncJob {
  job_id: string;
  status: "queued" | "fetching" | "syncing_products" | "syncing_feedback" | "syncing_actions" | "building_knowledge_graph" | "completed" | "failed";
  progress: number;
  products_synced?: number;
  feedback_synced?: number;
  actions_synced?: number;
  error?: string;
}

export function useAISyncStatus() {
  const [activeSyncJob, setActiveSyncJob] = useState<SyncJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const queryClient = useQueryClient();

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${AI_INSIGHTS_URL}/api/sync/status/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sync status");
      }
      
      const status: SyncJob = await response.json();
      status.job_id = jobId;
      setActiveSyncJob(status);
      
      // Stop polling if completed or failed
      if (status.status === "completed" || status.status === "failed") {
        setIsPolling(false);
        
        // Invalidate AI-related queries on completion
        if (status.status === "completed") {
          queryClient.invalidateQueries({ queryKey: ["ai-insight"] });
          queryClient.invalidateQueries({ queryKey: ["ai-stats"] });
        }
        
        // Clear the job after a delay
        setTimeout(() => setActiveSyncJob(null), 5000);
      }
      
      return status;
    } catch (error) {
      console.error("Error polling sync status:", error);
      setIsPolling(false);
      return null;
    }
  }, [queryClient]);

  // Start polling when we have an active job
  useEffect(() => {
    if (!activeSyncJob?.job_id || !isPolling) return;
    
    const interval = setInterval(() => {
      pollJobStatus(activeSyncJob.job_id);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSyncJob?.job_id, isPolling, pollJobStatus]);

  // Trigger a manual sync
  const triggerSync = useCallback(async (adminKey: string): Promise<SyncJob | null> => {
    try {
      const response = await fetch(`${AI_INSIGHTS_URL}/api/sync/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({
          source: "products",
          run_cognify: true,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Sync failed" }));
        throw new Error(error.detail || "Failed to trigger sync");
      }
      
      const result = await response.json();
      const job: SyncJob = {
        job_id: result.job_id,
        status: "queued",
        progress: 0,
      };
      
      setActiveSyncJob(job);
      setIsPolling(true);
      
      return job;
    } catch (error) {
      console.error("Error triggering sync:", error);
      throw error;
    }
  }, []);

  // Watch for webhook-triggered syncs (via localStorage event)
  useEffect(() => {
    const handleSyncEvent = (event: StorageEvent) => {
      if (event.key === "ai_sync_job_id" && event.newValue) {
        setActiveSyncJob({
          job_id: event.newValue,
          status: "queued",
          progress: 0,
        });
        setIsPolling(true);
      }
    };
    
    window.addEventListener("storage", handleSyncEvent);
    return () => window.removeEventListener("storage", handleSyncEvent);
  }, []);

  return {
    activeSyncJob,
    isPolling,
    isSyncing: isPolling || (activeSyncJob?.status !== "completed" && activeSyncJob?.status !== "failed" && activeSyncJob !== null),
    triggerSync,
    pollJobStatus,
  };
}

// Helper to get human-readable status
export function getSyncStatusLabel(status: SyncJob["status"]): string {
  switch (status) {
    case "queued":
      return "Starting sync...";
    case "fetching":
      return "Fetching data...";
    case "syncing_products":
      return "Syncing products...";
    case "syncing_feedback":
      return "Syncing feedback...";
    case "syncing_actions":
      return "Syncing actions...";
    case "building_knowledge_graph":
      return "Building knowledge graph...";
    case "completed":
      return "Sync complete!";
    case "failed":
      return "Sync failed";
    default:
      return "Processing...";
  }
}

