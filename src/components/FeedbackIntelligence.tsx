import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Search, Filter, X, ExternalLink, BarChart3, FileDown, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeedbackAnalytics } from "@/components/FeedbackAnalytics";
import { exportFeedbackSummary } from "@/lib/productReportExport";
import { useAllFeedback, type FeedbackWithProduct } from "@/hooks/useProductFeedback";
import { useCreateAction } from "@/hooks/useProductActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackItem {
  id: string;
  product: string;
  productId: string;
  theme: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  volume: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  source: string;
  summary: string;
  fullText: string;
  dateReceived: string;
  resolvedAt?: string;
  linkedActionId?: string;
}

// Transform API data to component format
const transformFeedback = (data: FeedbackWithProduct[]): FeedbackItem[] => {
  return data.map((item) => {
    const score = item.sentiment_score || 0;
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    if (score > 0.3) sentiment = "positive";
    else if (score < -0.3) sentiment = "negative";
    
    return {
      id: item.id,
      product: item.products?.name || "Unknown Product",
      productId: item.product_id,
      theme: item.theme || "General",
      sentiment,
      sentimentScore: score,
      volume: item.volume || 1,
      impact: (item.impact_level?.toUpperCase() as "HIGH" | "MEDIUM" | "LOW") || "MEDIUM",
      source: item.source,
      summary: item.raw_text.substring(0, 100) + (item.raw_text.length > 100 ? "..." : ""),
      fullText: item.raw_text,
      dateReceived: new Date(item.created_at).toISOString().split("T")[0],
      resolvedAt: item.resolved_at,
      linkedActionId: item.linked_action_id,
    };
  });
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return <ThumbsUp className="h-4 w-4 text-success" aria-label="Positive sentiment" />;
    case "negative":
      return <ThumbsDown className="h-4 w-4 text-destructive" aria-label="Negative sentiment" />;
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" aria-label="Neutral sentiment" />;
  }
};

const getSentimentConfig = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return {
        icon: ThumbsUp,
        label: "Positive",
        color: "text-success",
        bg: "bg-success/10",
        borderColor: "border-success/20",
      };
    case "negative":
      return {
        icon: ThumbsDown,
        label: "Negative",
        color: "text-destructive",
        bg: "bg-destructive/10",
        borderColor: "border-destructive/20",
      };
    default:
      return {
        icon: MessageSquare,
        label: "Neutral",
        color: "text-warning",
        bg: "bg-warning/10",
        borderColor: "border-warning/20",
      };
  }
};

const getImpactConfig = (impact: string) => {
  switch (impact) {
    case "HIGH":
      return {
        icon: "🔴",
        label: "High Impact",
        className: "bg-destructive/10 text-destructive border-destructive/30 font-semibold",
      };
    case "MEDIUM":
      return {
        icon: "🟡",
        label: "Medium Impact",
        className: "bg-warning/10 text-warning border-warning/30 font-semibold",
      };
    case "LOW":
      return {
        icon: "🟢",
        label: "Low Impact",
        className: "bg-success/10 text-success border-success/30 font-semibold",
      };
    default:
      return {
        icon: "⚪",
        label: "Unknown Impact",
        className: "bg-muted text-muted-foreground font-semibold",
      };
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case "customer_survey":
      return "Customer Survey";
    case "support_ticket":
      return "Support Ticket";
    case "field_report":
      return "Field Report";
    default:
      return source;
  }
};

const getSentimentLabel = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    default:
      return "Neutral";
  }
};

export const FeedbackIntelligence = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isCreateActionOpen, setIsCreateActionOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");

  // Fetch feedback from API
  const { data: apiFeedback, isLoading, error } = useAllFeedback();
  const createAction = useCreateAction();

  // Transform API data
  const feedbackData = useMemo(() => {
    if (!apiFeedback) return [];
    return transformFeedback(apiFeedback);
  }, [apiFeedback]);

  // Filter and search feedback
  const filteredFeedback = useMemo(() => {
    return feedbackData.filter((item) => {
      // Search filter
      const matchesSearch = 
        searchQuery === "" ||
        item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fullText.toLowerCase().includes(searchQuery.toLowerCase());

      // Sentiment filter
      const matchesSentiment = 
        sentimentFilter === "all" || item.sentiment === sentimentFilter;

      // Impact filter
      const matchesImpact = 
        impactFilter === "all" || item.impact === impactFilter;

      // Source filter
      const matchesSource = 
        sourceFilter === "all" || item.source === sourceFilter;

      return matchesSearch && matchesSentiment && matchesImpact && matchesSource;
    });
  }, [feedbackData, searchQuery, sentimentFilter, impactFilter, sourceFilter]);

  const activeFilterCount = [
    sentimentFilter !== "all",
    impactFilter !== "all",
    sourceFilter !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchQuery("");
    setSentimentFilter("all");
    setImpactFilter("all");
    setSourceFilter("all");
  };

  const handleFeedbackClick = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setIsSheetOpen(true);
  };

  const handleCreateAction = () => {
    if (!selectedFeedback || !actionTitle.trim()) return;
    
    createAction.mutate({
      product_id: selectedFeedback.productId,
      linked_feedback_id: selectedFeedback.id,
      action_type: "intervention",
      title: actionTitle,
      description: actionDescription || `Action created from feedback: ${selectedFeedback.summary}`,
      status: "pending",
      priority: selectedFeedback.impact === "HIGH" ? "high" : selectedFeedback.impact === "MEDIUM" ? "medium" : "low",
    }, {
      onSuccess: () => {
        setIsCreateActionOpen(false);
        setActionTitle("");
        setActionDescription("");
      }
    });
  };

  const openCreateActionDialog = () => {
    if (selectedFeedback) {
      setActionTitle(`Address: ${selectedFeedback.theme}`);
      setActionDescription(`Feedback source: ${getSourceLabel(selectedFeedback.source)}\n\nOriginal feedback:\n${selectedFeedback.fullText}`);
      setIsCreateActionOpen(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="card-elegant animate-in">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Customer Feedback Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3 mb-4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="card-elegant animate-in">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Customer Feedback Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Failed to load feedback</p>
            <p className="text-xs text-muted-foreground">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant animate-in">
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
              Customer Feedback Intelligence
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={showAnalytics ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="gap-2"
                aria-label="Toggle analytics view"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportFeedbackSummary(feedbackData)}
                className="gap-2"
                aria-label="Export feedback summary"
              >
                <FileDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search feedback by product, theme, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search feedback"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t animate-in">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px] h-9" aria-label="Filter by source">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="customer_survey">Customer Survey</SelectItem>
                  <SelectItem value="support_ticket">Support Ticket</SelectItem>
                  <SelectItem value="field_report">Field Report</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-[150px] h-9" aria-label="Filter by sentiment">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>

              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-[150px] h-9" aria-label="Filter by impact">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="HIGH">High Impact</SelectItem>
                  <SelectItem value="MEDIUM">Medium Impact</SelectItem>
                  <SelectItem value="LOW">Low Impact</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="gap-2"
                  aria-label="Clear all filters"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Results Count */}
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            Showing {filteredFeedback.length} of {feedbackData.length} feedback items
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAnalytics ? (
          <FeedbackAnalytics feedbackData={filteredFeedback} />
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-medium mb-1">No feedback found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          filteredFeedback.map((item, index) => (
          <div
            key={index}
            onClick={() => handleFeedbackClick(item)}
            className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/50"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFeedbackClick(item);
              }
            }}
            aria-label={`View details for ${item.product} feedback`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{item.product}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getSourceLabel(item.source)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const sentimentConfig = getSentimentConfig(item.sentiment);
                    const SentimentIcon = sentimentConfig.icon;
                    return (
                      <Badge 
                        variant="outline" 
                        className={`${sentimentConfig.bg} ${sentimentConfig.color} ${sentimentConfig.borderColor} text-xs`}
                      >
                        <SentimentIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        {sentimentConfig.label}
                      </Badge>
                    );
                  })()}
                  <span className="text-sm font-medium text-muted-foreground">•</span>
                  <span className="text-sm font-medium">{item.theme}</span>
                </div>
              </div>
              {(() => {
                const impactConfig = getImpactConfig(item.impact);
                return (
                  <Badge variant="outline" className={impactConfig.className}>
                    <span className="mr-1" aria-hidden="true">{impactConfig.icon}</span>
                    {impactConfig.label}
                  </Badge>
                );
              })()}
            </div>

            <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">Volume: {item.volume} mentions</span>
              <span className="text-xs text-primary font-medium flex items-center gap-1">
                View Details
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))
        )}

        {/* Feedback Detail Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedFeedback && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {getSentimentIcon(selectedFeedback.sentiment)}
                    Feedback Details
                  </SheetTitle>
                  <SheetDescription>
                    {getSourceLabel(selectedFeedback.source)} • {selectedFeedback.dateReceived}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Linked Product */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Product</h4>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSheetOpen(false);
                        navigate(`/product/${selectedFeedback.productId}`);
                      }}
                      className="w-full justify-between"
                    >
                      {selectedFeedback.product}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Theme */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Detected Theme</h4>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {selectedFeedback.theme}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Sentiment Analysis */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Sentiment Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Classification:</span>
                        <Badge
                          variant="outline"
                          className={
                            selectedFeedback.sentiment === "positive"
                              ? "bg-success/10 text-success"
                              : selectedFeedback.sentiment === "negative"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-warning/10 text-warning"
                          }
                        >
                          {getSentimentLabel(selectedFeedback.sentiment)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sentiment Score:</span>
                        <span className="text-sm font-mono font-semibold">
                          {selectedFeedback.sentimentScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Commercial Impact */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Commercial Impact</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Impact Level:</span>
                        {(() => {
                          const impactConfig = getImpactConfig(selectedFeedback.impact);
                          return (
                            <Badge variant="outline" className={impactConfig.className}>
                              <span className="mr-1" aria-hidden="true">{impactConfig.icon}</span>
                              {impactConfig.label}
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Volume:</span>
                        <span className="text-sm font-semibold">{selectedFeedback.volume} mentions</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Full Feedback Text */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Full Feedback</h4>
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <p className="text-sm leading-relaxed">{selectedFeedback.fullText}</p>
                    </div>
                  </div>

                  {/* Action Indicator */}
                  {selectedFeedback.impact === "HIGH" && !selectedFeedback.linkedActionId && (
                    <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Action Required</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          High-impact feedback requires immediate review and response
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resolution Status */}
                  {selectedFeedback.resolvedAt && (
                    <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <ThumbsUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success">Resolved</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Resolved on {new Date(selectedFeedback.resolvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Create Action Button */}
                  {!selectedFeedback.linkedActionId && !selectedFeedback.resolvedAt && (
                    <Button 
                      onClick={openCreateActionDialog}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Action from Feedback
                    </Button>
                  )}

                  {selectedFeedback.linkedActionId && (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        Action Already Linked
                      </Badge>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create Action Dialog */}
        <Dialog open={isCreateActionOpen} onOpenChange={setIsCreateActionOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Action from Feedback
              </DialogTitle>
              <DialogDescription>
                Create an action item linked to this feedback. The action will be tracked until resolved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="action-title">Action Title</Label>
                <Input
                  id="action-title"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="Enter action title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-description">Description</Label>
                <Textarea
                  id="action-description"
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Describe the action to be taken..."
                  rows={5}
                />
              </div>
              {selectedFeedback && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Priority:</span>
                  <Badge variant="outline" className={
                    selectedFeedback.impact === "HIGH" 
                      ? "bg-destructive/10 text-destructive" 
                      : selectedFeedback.impact === "MEDIUM"
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                  }>
                    {selectedFeedback.impact === "HIGH" ? "High" : selectedFeedback.impact === "MEDIUM" ? "Medium" : "Low"}
                  </Badge>
                  <span className="text-xs">(based on feedback impact)</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateActionOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAction}
                disabled={!actionTitle.trim() || createAction.isPending}
              >
                {createAction.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Action"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
