import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Search, Filter, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";

interface FeedbackItem {
  product: string;
  productId: string;
  theme: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  volume: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  source: "customer_survey" | "support_ticket" | "field_report";
  summary: string;
  fullText: string;
  dateReceived: string;
}

const feedbackData: FeedbackItem[] = [
  {
    product: "Digital Wallet API",
    productId: "e26a7fba-f201-46f1-9ab9-d4c8e5a28506",
    theme: "Integration Complexity",
    sentiment: "negative",
    sentimentScore: -0.65,
    volume: 23,
    impact: "HIGH",
    source: "support_ticket",
    summary: "Documentation needs improvement for OAuth2 flow implementation",
    fullText: "Our development team has spent over 40 hours trying to implement the OAuth2 authentication flow. The documentation is incomplete and the code examples don't match the current API version. We've had to rely on community forums and reverse-engineering the SDK. This is significantly delaying our integration timeline and affecting our go-to-market strategy.",
    dateReceived: "2024-11-28",
  },
  {
    product: "Fraud Detection ML",
    productId: "146db1a4-b5eb-4431-a119-b60f409a6e86",
    theme: "Performance",
    sentiment: "positive",
    sentimentScore: 0.82,
    volume: 45,
    impact: "MEDIUM",
    source: "customer_survey",
    summary: "95% accuracy rate exceeding customer expectations",
    fullText: "The fraud detection system has been exceptional. We're seeing a 95% accuracy rate in identifying fraudulent transactions, which is well above our expectations. False positives have decreased by 60% compared to our previous solution, significantly improving customer experience. The real-time processing has also been impressive - average detection time is under 200ms.",
    dateReceived: "2024-11-25",
  },
  {
    product: "Loyalty Platform",
    productId: "3aea2098-91dc-4ee4-ae3b-8d2610a3a982",
    theme: "Onboarding Issues",
    sentiment: "negative",
    sentimentScore: -0.72,
    volume: 31,
    impact: "HIGH",
    source: "field_report",
    summary: "Merchant setup taking 2-3 weeks vs promised 48 hours",
    fullText: "Multiple merchants have reported that the onboarding process is taking significantly longer than promised. What was advertised as a 48-hour setup is routinely taking 2-3 weeks. The main bottlenecks appear to be manual compliance checks and integration testing. This is causing serious issues with our sales pipeline as merchants are losing confidence. Two enterprise deals have been postponed due to these delays.",
    dateReceived: "2024-11-26",
  },
  {
    product: "Cross-Border Pay",
    productId: "becfa608-c548-4ce8-9f77-7e1dca796ff8",
    theme: "Settlement Speed",
    sentiment: "positive",
    sentimentScore: 0.78,
    volume: 52,
    impact: "MEDIUM",
    source: "customer_survey",
    summary: "Real-time settlement driving strong adoption",
    fullText: "The real-time settlement feature is a game-changer for our business. We're now able to process cross-border payments and settle funds within minutes instead of days. This has dramatically improved our cash flow management and reduced currency risk. Customer satisfaction scores have increased by 35% since we switched to this platform. The transparency of the transaction tracking is also excellent.",
    dateReceived: "2024-11-27",
  },
];

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
  }, [searchQuery, sentimentFilter, impactFilter, sourceFilter]);

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

  return (
    <Card className="card-elegant animate-in">
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
              Customer Feedback Intelligence
            </CardTitle>
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
        {filteredFeedback.length === 0 ? (
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
                  {selectedFeedback.impact === "HIGH" && (
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
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
};
