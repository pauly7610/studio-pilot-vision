import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useUploadDocument, useJobStatus } from "@/hooks/useAIInsights";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickDocumentDropProps {
  productId: string;
  productName: string;
  className?: string;
}

/**
 * A compact, always-visible drag-drop zone for quickly adding documents to a product.
 * Can be placed anywhere on a product page for instant document uploads.
 */
export function QuickDocumentDrop({ productId, productName, className }: QuickDocumentDropProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const uploadDocument = useUploadDocument();
  const { data: jobStatus } = useJobStatus(jobId);

  const isUploading = jobId && jobStatus && !["completed", "failed"].includes(jobStatus.status);
  const isComplete = jobStatus?.status === "completed";
  const isFailed = jobStatus?.status === "failed";

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate
    const allowedTypes = [".pdf", ".txt", ".md", ".docx"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    
    if (!allowedTypes.includes(ext)) {
      toast.error(`File type '${ext}' not supported. Use: PDF, TXT, MD, or DOCX`);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB`);
      return;
    }

    try {
      const result = await uploadDocument.mutateAsync({
        file,
        productId,
        productName,
      });
      setJobId(result.job_id);
      toast.info(`Processing "${file.name}" for ${productName}...`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }, [productId, productName, uploadDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.txt,.md,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file);
    };
    input.click();
  };

  const resetState = () => {
    setJobId(null);
  };

  // Completed state - show success briefly then reset
  if (isComplete) {
    setTimeout(resetState, 5000); // Auto-reset after 5s
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer overflow-hidden",
        isDragOver && "ring-2 ring-primary ring-offset-2",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={!isUploading ? handleClick : undefined}
    >
      {/* Idle state - ready to receive files */}
      {!jobId && (
        <div className={cn(
          "p-4 flex items-center gap-3 border-2 border-dashed rounded-lg transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
        )}>
          <div className={cn(
            "rounded-full p-2 transition-colors",
            isDragOver ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-5 w-5 transition-colors",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium transition-colors",
              isDragOver ? "text-primary" : "text-foreground"
            )}>
              {isDragOver ? "Drop to upload" : "Add document to AI"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Drag PDF, TXT, or MD here • Links to {productName}
            </p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </div>
      )}

      {/* Uploading state */}
      {isUploading && jobStatus && (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium flex-1 truncate">
              {jobStatus.filename}
            </span>
            <span className="text-xs text-muted-foreground">
              {jobStatus.progress}%
            </span>
          </div>
          <Progress value={jobStatus.progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground capitalize">
            {jobStatus.status.replace(/_/g, " ")}...
          </p>
        </div>
      )}

      {/* Success state */}
      {isComplete && jobStatus && (
        <div className="p-4 bg-green-500/10 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
              {jobStatus.filename} uploaded!
            </p>
            <p className="text-xs text-muted-foreground">
              {jobStatus.chroma_ingested} chunks added to AI
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); resetState(); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Upload more
          </button>
        </div>
      )}

      {/* Failed state */}
      {isFailed && jobStatus && (
        <div className="p-4 bg-red-500/10 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Upload failed
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 truncate">
              {jobStatus.error}
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); resetState(); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}
    </Card>
  );
}

