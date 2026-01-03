import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Shield,
  Target,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import {
  useAIQuery,
  useProductInsight,
  usePortfolioInsight,
  useAIHealth,
  useUploadJiraCSV,
  useJobStatus,
  useAIStats,
  InsightResponse,
} from "@/hooks/useAIInsights";
import { toast } from "sonner";
import { DocumentUpload } from "@/components/DocumentUpload";

interface AIInsightsPanelProps {
  productId?: string;
  productName?: string;
  compact?: boolean;
}

const insightTypeConfig = {
  summary: { icon: Lightbulb, label: "Executive Summary", color: "text-blue-500" },
  risks: { icon: Shield, label: "Risk Analysis", color: "text-destructive" },
  opportunities: { icon: TrendingUp, label: "Opportunities", color: "text-success" },
  recommendations: { icon: Target, label: "Recommendations", color: "text-warning" },
};

export const AIInsightsPanel = ({
  productId,
  productName,
  compact = false,
}: AIInsightsPanelProps) => {
  const [query, setQuery] = useState("");
  const [insightType, setInsightType] = useState<keyof typeof insightTypeConfig>("summary");
  const [currentInsight, setCurrentInsight] = useState<InsightResponse | null>(null);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: health } = useAIHealth();
  const { data: stats } = useAIStats();
  const aiQuery = useAIQuery();
  const portfolioInsight = usePortfolioInsight();
  const uploadJira = useUploadJiraCSV();
  const { data: jobStatus } = useJobStatus(uploadJobId);

  // Handle job completion in useEffect to avoid setState during render
  useEffect(() => {
    if (!uploadJobId || !jobStatus) return;
    
    if (jobStatus.status === "completed") {
      toast.success(`Imported ${jobStatus.ingested} tickets from Jira`);
      setUploadJobId(null);
    } else if (jobStatus.status === "failed") {
      toast.error(jobStatus.error || "Failed to process CSV");
      setUploadJobId(null);
    }
  }, [jobStatus?.status, uploadJobId, jobStatus?.ingested, jobStatus?.error]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadJira.mutateAsync(file);
      setUploadJobId(result.job_id);
      toast.info("Processing CSV in background...");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload CSV");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isProcessingUpload = uploadJobId && jobStatus && !["completed", "failed"].includes(jobStatus.status);

  const {
    data: productInsightData,
    isLoading: isProductInsightLoading,
    refetch: refetchProductInsight,
  } = useProductInsight(productId || "", insightType);

  const isServiceAvailable = health?.status === "healthy";

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;

    const result = await aiQuery.mutateAsync({
      query,
      product_id: productId,
      top_k: 5,
      include_sources: true,
    });

    setCurrentInsight(result);
  };

  const handlePortfolioQuery = async () => {
    if (!query.trim()) return;

    const result = await portfolioInsight.mutateAsync({
      query,
    });

    setCurrentInsight(result);
  };

  const InsightTypeIcon = insightTypeConfig[insightType].icon;

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Insight</span>
            {!isServiceAvailable && (
              <Badge variant="outline" className="text-xs">
                Offline
              </Badge>
            )}
          </div>

          {isProductInsightLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : productInsightData?.success ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {productInsightData.insight}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isServiceAvailable
                ? "Click to generate AI insight"
                : "AI service unavailable"}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <span>AI Insights</span>
            {productName && (
              <span className="text-muted-foreground font-normal text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                for {productName}
              </span>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {isServiceAvailable ? (
              <Badge variant="outline" className="text-success border-success/30 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Data Sources - Only show on portfolio view */}
        {!productId && (
          <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-muted-foreground/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data Sources</span>
              </div>
              {stats?.total_vectors !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {stats.total_vectors} documents indexed
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="jira-csv-upload"
              />
              {isProcessingUpload ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="capitalize">{jobStatus?.status}...</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${jobStatus?.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {jobStatus?.progress}%
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isServiceAvailable || uploadJira.isPending}
                      className="gap-2"
                    >
                      {uploadJira.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Jira CSV
                    </Button>
                    <DocumentUpload />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload Jira exports or documents (PDF, TXT, MD) to train the AI
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Insight Types */}
        {productId && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Select
                value={insightType}
                onValueChange={(v) => setInsightType(v as keyof typeof insightTypeConfig)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(insightTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchProductInsight()}
                disabled={!isServiceAvailable || isProductInsightLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isProductInsightLoading ? "animate-spin" : ""}`}
                />
                Generate
              </Button>
            </div>

            {/* Product Insight Result */}
            {isProductInsightLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : productInsightData?.success ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <InsightTypeIcon
                    className={`h-4 w-4 ${insightTypeConfig[insightType].color}`}
                  />
                  <span className="text-sm font-medium">
                    {insightTypeConfig[insightType].label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {productInsightData.insight}
                </p>
                {productInsightData.usage && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tokens used: {productInsightData.usage.total_tokens}
                  </div>
                )}
              </div>
            ) : productInsightData?.error ? (
              <div className="bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
                {productInsightData.error}
              </div>
            ) : null}
          </div>
        )}

        {/* Custom Query */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Ask a Question</p>
          <div className="flex gap-2">
            <Textarea
              placeholder={
                productId
                  ? `Ask about ${productName || "this product"}...`
                  : "Ask about your product portfolio..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={productId ? handleQuerySubmit : handlePortfolioQuery}
              disabled={!query.trim() || !isServiceAvailable || aiQuery.isPending}
              className="flex-1"
            >
              {aiQuery.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {productId ? "Ask about Product" : "Ask about Portfolio"}
            </Button>
          </div>
        </div>

        {/* Custom Query Result */}
        {currentInsight && (
          <div className="border-t pt-4">
            {currentInsight.success ? (
              <div className="space-y-4">
                {/* Formatted AI Response */}
                <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">AI Analysis</span>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {currentInsight.insight?.split('\n').map((paragraph, idx) => {
                      if (!paragraph.trim()) return null;
                      
                      // Handle numbered lists (1. 2. etc.)
                      const numberedMatch = paragraph.match(/^(\d+)\.\s+\*\*(.+?)\*\*:?\s*(.*)$/);
                      if (numberedMatch) {
                        return (
                          <div key={idx} className="flex gap-3 mb-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {numberedMatch[1]}
                            </span>
                            <div>
                              <span className="font-semibold text-foreground">{numberedMatch[2]}</span>
                              {numberedMatch[3] && <span className="text-muted-foreground"> {numberedMatch[3]}</span>}
                            </div>
                          </div>
                        );
                      }
                      
                      // Handle bullet points
                      if (paragraph.trim().startsWith('- **')) {
                        const bulletMatch = paragraph.match(/^-\s+\*\*(.+?)\*\*:?\s*(.*)$/);
                        if (bulletMatch) {
                          return (
                            <div key={idx} className="flex gap-2 mb-2 ml-2">
                              <span className="text-primary">•</span>
                              <div>
                                <span className="font-semibold">{bulletMatch[1]}</span>
                                {bulletMatch[2] && <span className="text-muted-foreground">: {bulletMatch[2]}</span>}
                              </div>
                            </div>
                          );
                        }
                      }
                      
                      // Handle regular bold text
                      const formattedText = paragraph.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <p 
                          key={idx} 
                          className="text-sm text-muted-foreground mb-2 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formattedText }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Sources Section */}
                {currentInsight.sources && currentInsight.sources.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Sources Referenced ({currentInsight.sources.length})
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {currentInsight.sources.slice(0, 6).map((source, i) => {
                        const productName = source.text?.match(/Product:\s*([^,]+)/)?.[1] || 'Unknown Product';
                        const stage = source.text?.match(/Stage:\s*([^,]+)/)?.[1] || '';
                        const revenue = source.text?.match(/Revenue Target:\s*\$?([\d,]+)/)?.[1] || '';
                        
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-background rounded-md p-3 border border-border/50 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{i + 1}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{productName}</p>
                                {stage && (
                                  <p className="text-xs text-muted-foreground">Stage: {stage}</p>
                                )}
                              </div>
                            </div>
                            {revenue && (
                              <Badge variant="outline" className="text-xs">
                                ${revenue}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      {currentInsight.sources.length > 6 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{currentInsight.sources.length - 6} more sources
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
                {currentInsight.error || "Failed to generate insight"}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
