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
} from "lucide-react";
import { useUploadDocument, useJobStatus } from "@/hooks/useAIInsights";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const STATUS_MESSAGES: Record<string, { label: string; icon: React.ReactNode }> = {
  queued: { label: "Queued for processing...", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  parsing: { label: "Reading document...", icon: <FileText className="h-4 w-4 animate-pulse" /> },
  extracting_text: { label: "Extracting text...", icon: <FileText className="h-4 w-4 animate-pulse" /> },
  ingesting_chromadb: { label: "Adding to RAG search...", icon: <Database className="h-4 w-4 animate-pulse text-blue-500" /> },
  ingesting_cognee: { label: "Building knowledge graph...", icon: <Brain className="h-4 w-4 animate-pulse text-purple-500" /> },
  building_knowledge: { label: "Connecting relationships...", icon: <Sparkles className="h-4 w-4 animate-pulse text-amber-500" /> },
  completed: { label: "Upload complete!", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  failed: { label: "Upload failed", icon: <XCircle className="h-4 w-4 text-red-500" /> },
};

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  ".pdf": <File className="h-8 w-8 text-red-500" />,
  ".txt": <FileText className="h-8 w-8 text-gray-500" />,
  ".md": <FileText className="h-8 w-8 text-blue-500" />,
  ".docx": <File className="h-8 w-8 text-blue-600" />,
};

export function DocumentUpload({ trigger, onSuccess }: DocumentUploadProps) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDocument = useUploadDocument();
  const { data: jobStatus } = useJobStatus(jobId);

  const isProcessing = jobId && jobStatus && !["completed", "failed"].includes(jobStatus.status);
  const isCompleted = jobStatus?.status === "completed";
  const isFailed = jobStatus?.status === "failed";

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setJobId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = [".pdf", ".txt", ".md", ".docx"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(ext)) {
      toast.error(`File type '${ext}' not supported. Use: ${allowedTypes.join(", ")}`);
      return;
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB`);
      return;
    }

    setSelectedFile(file);
    setJobId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadDocument.mutateAsync(selectedFile);
      setJobId(result.job_id);
      toast.info(`Processing "${selectedFile.name}"...`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  // Handle completion
  const handleClose = () => {
    if (isCompleted && onSuccess) {
      onSuccess();
    }
    resetState();
    setOpen(false);
  };

  const fileExt = selectedFile?.name.toLowerCase().slice(selectedFile.name.lastIndexOf(".")) || "";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetState();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Document to AI
          </DialogTitle>
          <DialogDescription>
            Upload PDFs, text files, or markdown documents. They'll be processed and added to the AI knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drag & Drop Zone */}
          {!isProcessing && !isCompleted && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                selectedFile && "border-primary/50 bg-primary/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    {FILE_TYPE_ICONS[fileExt] || <File className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetState();
                    }}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isDragOver ? "Drop your file here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF, TXT, MD, DOCX • Max 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && jobStatus && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                {FILE_TYPE_ICONS[fileExt] || <File className="h-6 w-6" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{jobStatus.filename || selectedFile?.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {STATUS_MESSAGES[jobStatus.status]?.icon}
                    <span>{STATUS_MESSAGES[jobStatus.status]?.label || jobStatus.status}</span>
                  </div>
                </div>
              </div>

              <Progress value={jobStatus.progress} className="h-2" />

              <div className="flex gap-2 flex-wrap">
                {jobStatus.extracted_chars && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {jobStatus.extracted_chars.toLocaleString()} chars
                  </Badge>
                )}
                {jobStatus.chroma_ingested && (
                  <Badge variant="secondary" className="gap-1 text-blue-600">
                    <Database className="h-3 w-3" />
                    {jobStatus.chroma_ingested} chunks
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && jobStatus && (
            <div className="space-y-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Upload Successful!</p>
                  <p className="text-sm text-muted-foreground">{jobStatus.filename}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">RAG Search</p>
                    <p className="font-medium">{jobStatus.chroma_ingested} chunks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Knowledge Graph</p>
                    <p className="font-medium">{jobStatus.cognee_ingested ? "Connected" : "Skipped"}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                You can now ask AI questions about this document!
              </p>
            </div>
          )}

          {/* Failed State */}
          {isFailed && jobStatus && (
            <div className="space-y-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">Upload Failed</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{jobStatus.error}</p>
                </div>
              </div>
              <Button variant="outline" onClick={resetState} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {!isProcessing && !isCompleted && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadDocument.isPending}
                className="gap-2"
              >
                {uploadDocument.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Upload to AI
                  </>
                )}
              </Button>
            </>
          )}
          {isCompleted && (
            <Button onClick={handleClose} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

