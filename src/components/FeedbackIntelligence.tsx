import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Search, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackItem {
  product: string;
  productId: string;
  theme: string;
  sentiment: "positive" | "negative" | "neutral";
  volume: number;
  impact: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
}

const feedbackData: FeedbackItem[] = [
  {
    product: "Digital Wallet API",
    productId: "e26a7fba-f201-46f1-9ab9-d4c8e5a28506",
    theme: "Integration Complexity",
    sentiment: "negative",
    volume: 23,
    impact: "HIGH",
    summary: "Documentation needs improvement for OAuth2 flow implementation",
  },
  {
    product: "Fraud Detection ML",
    productId: "146db1a4-b5eb-4431-a119-b60f409a6e86",
    theme: "Performance",
    sentiment: "positive",
    volume: 45,
    impact: "MEDIUM",
    summary: "95% accuracy rate exceeding customer expectations",
  },
  {
    product: "Loyalty Platform",
    productId: "3aea2098-91dc-4ee4-ae3b-8d2610a3a982",
    theme: "Onboarding Issues",
    sentiment: "negative",
    volume: 31,
    impact: "HIGH",
    summary: "Merchant setup taking 2-3 weeks vs promised 48 hours",
  },
  {
    product: "Cross-Border Pay",
    productId: "becfa608-c548-4ce8-9f77-7e1dca796ff8",
    theme: "Settlement Speed",
    sentiment: "positive",
    volume: 52,
    impact: "MEDIUM",
    summary: "Real-time settlement driving strong adoption",
  },
];

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return <ThumbsUp className="h-4 w-4 text-success" />;
    case "negative":
      return <ThumbsDown className="h-4 w-4 text-destructive" />;
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "HIGH":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "MEDIUM":
      return "bg-warning/10 text-warning border-warning/20";
    case "LOW":
      return "bg-success/10 text-success border-success/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const FeedbackIntelligence = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search feedback
  const filteredFeedback = useMemo(() => {
    return feedbackData.filter((item) => {
      // Search filter
      const matchesSearch = 
        searchQuery === "" ||
        item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());

      // Sentiment filter
      const matchesSentiment = 
        sentimentFilter === "all" || item.sentiment === sentimentFilter;

      // Impact filter
      const matchesImpact = 
        impactFilter === "all" || item.impact === impactFilter;

      return matchesSearch && matchesSentiment && matchesImpact;
    });
  }, [searchQuery, sentimentFilter, impactFilter]);

  const activeFilterCount = [
    sentimentFilter !== "all",
    impactFilter !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchQuery("");
    setSentimentFilter("all");
    setImpactFilter("all");
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
            onClick={() => navigate(`/product/${item.productId}`)}
            className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/50"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{item.product}</h4>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(item.sentiment)}
                  <span className="text-sm font-medium">{item.theme}</span>
                </div>
              </div>
              <Badge variant="outline" className={getImpactColor(item.impact)}>
                {item.impact}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">Volume: {item.volume} mentions</span>
              {item.impact === "HIGH" && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Action Required</span>
                </div>
              )}
            </div>
          </div>
        ))
        )}
      </CardContent>
    </Card>
  );
};
