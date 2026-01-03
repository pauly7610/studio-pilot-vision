import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  File,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Database,
  Brain,
  AlertCircle,
  Files,
  ScanText,
} from "lucide-react";
import { useUploadDocument, useJobStatus } from "@/hooks/useAIInsights";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BulkDocumentUploadProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  productId?: string;
  productName?: string;
  maxFiles?: number;
}

interface FileUploadState {
  file: File;
  jobId: string | null;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  error?: string;
  chromaChunks?: number;
  cogneeIngested?: boolean;
  ocrApplied?: boolean;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  ".pdf": <File className="h-5 w-5 text-red-500" />,
  ".txt": <FileText className="h-5 w-5 text-gray-500" />,
  ".md": <FileText className="h-5 w-5 text-blue-500" />,
  ".docx": <File className="h-5 w-5 text-blue-600" />,
};

export function BulkDocumentUpload({ 
  trigger, 
  onSuccess, 
  productId, 
  productName,
  maxFiles = 10 
}: BulkDocumentUploadProps) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDocument = useUploadDocument();

  const resetState = useCallback(() => {
    setFiles([]);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFilesSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const allowedTypes = [".pdf", ".txt", ".md", ".docx"];
    const maxSize = 10 * 1024 * 1024;
    const newFiles: FileUploadState[] = [];
    const errors: string[] = [];
    
    Array.from(selectedFiles).slice(0, maxFiles).forEach(file => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      
      if (!allowedTypes.includes(ext)) {
        errors.push(`${file.name}: unsupported type`);
        return;
      }
      
      if (file.size > maxSize) {
        errors.push(`${file.name}: too large (max 10MB)`);
        return;
      }
      
      // Check for duplicates
      if (files.some(f => f.file.name === file.name)) {
        errors.push(`${file.name}: already added`);
        return;
      }
      
      newFiles.push({
        file,
        jobId: null,
        status: "pending",
      });
    });
    
    if (errors.length > 0) {
      toast.error(`Some files skipped:\n${errors.join("\n")}`);
    }
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    }
  }, [files, maxFiles]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFilesSelect(e.dataTransfer.files);
    },
    [handleFilesSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    
    // Process files sequentially to avoid overwhelming the backend
    for (let i = 0; i < files.length; i++) {
      const fileState = files[i];
      if (fileState.status !== "pending") continue;
      
      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: "uploading" as const } : f
      ));
      
      try {
        const result = await uploadDocument.mutateAsync({
          file: fileState.file,
          productId,
          productName,
        });
        
        // Update with job ID
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, jobId: result.job_id, status: "processing" as const } : f
        ));
        
        // Poll for completion (simplified - in production you'd use useJobStatus for each)
        const pollForCompletion = async (jobId: string): Promise<void> => {
          const AI_INSIGHTS_URL = import.meta.env.VITE_AI_INSIGHTS_URL || "https://studio-pilot-vision.onrender.com";
          
          for (let attempt = 0; attempt < 60; attempt++) { // Max 60 seconds
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(`${AI_INSIGHTS_URL}/upload/status/${jobId}`);
            if (!response.ok) continue;
            
            const status = await response.json();
            
            if (status.status === "completed") {
              setFiles(prev => prev.map((f, idx) => 
                idx === i ? { 
                  ...f, 
                  status: "completed" as const,
                  chromaChunks: status.chroma_ingested,
                  cogneeIngested: status.cognee_ingested,
                  ocrApplied: status.ocr_applied,
                } : f
              ));
              successCount++;
              return;
            }
            
            if (status.status === "failed") {
              setFiles(prev => prev.map((f, idx) => 
                idx === i ? { ...f, status: "failed" as const, error: status.error } : f
              ));
              failCount++;
              return;
            }
          }
          
          // Timeout
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: "failed" as const, error: "Processing timeout" } : f
          ));
          failCount++;
        };
        
        await pollForCompletion(result.job_id);
        
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: "failed" as const, 
            error: error instanceof Error ? error.message : "Upload failed" 
          } : f
        ));
        failCount++;
      }
    }
    
    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? "s" : ""} uploaded successfully!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} document${failCount > 1 ? "s" : ""} failed`);
    }
  };

  const handleClose = () => {
    const hasCompleted = files.some(f => f.status === "completed");
    if (hasCompleted && onSuccess) {
      onSuccess();
    }
    resetState();
    setOpen(false);
  };

  const pendingCount = files.filter(f => f.status === "pending").length;
  const completedCount = files.filter(f => f.status === "completed").length;
  const failedCount = files.filter(f => f.status === "failed").length;
  const processingCount = files.filter(f => f.status === "processing" || f.status === "uploading").length;
  const totalProgress = files.length > 0 
    ? ((completedCount + failedCount) / files.length) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen && !isUploading) {
        resetState();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Files className="h-4 w-4" />
            Bulk Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5 text-primary" />
            Bulk Document Upload
          </DialogTitle>
          <DialogDescription>
            Upload multiple documents at once (max {maxFiles} files). They'll be processed and added to the AI knowledge base.
            {productName && (
              <span className="block mt-1 text-primary font-medium">
                📎 Linking to: {productName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drag & Drop Zone */}
          {!isUploading && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                files.length > 0 && "border-primary/30 bg-primary/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx"
                multiple
                onChange={(e) => handleFilesSelect(e.target.files)}
                className="hidden"
              />

              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isDragOver ? "Drop files here" : "Drag & drop or click to select"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, TXT, MD, DOCX • Max 10MB each • Up to {maxFiles} files
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </span>
                {isUploading && (
                  <span className="text-sm text-muted-foreground">
                    {processingCount} processing...
                  </span>
                )}
              </div>

              {isUploading && (
                <Progress value={totalProgress} className="h-2" />
              )}

              <ScrollArea className="h-[200px] rounded-lg border p-2">
                <div className="space-y-2">
                  {files.map((fileState, index) => {
                    const ext = fileState.file.name.toLowerCase().slice(fileState.file.name.lastIndexOf("."));
                    
                    return (
                      <div
                        key={`${fileState.file.name}-${index}`}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                          fileState.status === "completed" && "bg-green-500/5 border-green-500/20",
                          fileState.status === "failed" && "bg-red-500/5 border-red-500/20",
                          fileState.status === "processing" && "bg-blue-500/5 border-blue-500/20",
                          fileState.status === "uploading" && "bg-amber-500/5 border-amber-500/20",
                        )}
                      >
                        {FILE_TYPE_ICONS[ext] || <File className="h-5 w-5" />}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileState.file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {fileState.status === "completed" && fileState.chromaChunks && (
                              <Badge variant="secondary" className="text-[10px] gap-0.5 px-1">
                                <Database className="h-2.5 w-2.5" />
                                {fileState.chromaChunks}
                              </Badge>
                            )}
                            {fileState.ocrApplied && (
                              <Badge variant="secondary" className="text-[10px] gap-0.5 px-1 text-orange-600">
                                <ScanText className="h-2.5 w-2.5" />
                                OCR
                              </Badge>
                            )}
                          </div>
                          {fileState.error && (
                            <p className="text-xs text-red-500 truncate">{fileState.error}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {fileState.status === "pending" && !isUploading && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                            >
                              <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                          {(fileState.status === "uploading" || fileState.status === "processing") && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {fileState.status === "completed" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {fileState.status === "failed" && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Summary */}
          {completedCount > 0 && !isUploading && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {completedCount} document{completedCount > 1 ? "s" : ""} uploaded successfully!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    They're now searchable by AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2">
          <div>
            {files.length > 0 && !isUploading && pendingCount > 0 && (
              <Button variant="ghost" onClick={resetState}>
                Clear All
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
            >
              {completedCount > 0 ? "Done" : "Cancel"}
            </Button>
            {pendingCount > 0 && (
              <Button
                onClick={handleUploadAll}
                disabled={isUploading || pendingCount === 0}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading {processingCount}/{files.length}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Upload {pendingCount} File{pendingCount > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

