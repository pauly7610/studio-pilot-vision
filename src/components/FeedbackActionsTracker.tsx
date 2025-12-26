import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquareWarning, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Users,
  Building2,
  Headphones,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllFeedback, type FeedbackWithProduct } from "@/hooks/useProductFeedback";
import { useProductActions, type ProductAction } from "@/hooks/useProductActions";

interface FeedbackAction {
  id: string;
  feedbackId?: string;
  productName: string;
  productId: string;
  feedbackSource: string;
  issueType: string;
  summary: string;
  raisedBy: string;
  raisedDate: string;
  status: "open" | "in_review" | "resolved";
  linkedAction: string | null;
  impact: "high" | "medium" | "low";
  resolution?: string;
  resolvedDate?: string;
}

// Map source to category
const mapSourceToCategory = (source: string): string => {
  if (source.includes("survey")) return "client";
  if (source.includes("partner")) return "partner";
  if (source.includes("ops") || source.includes("internal")) return "ops";
  if (source.includes("field") || source.includes("report")) return "field";
  return "client";
};

// Infer issue type from theme
const inferIssueType = (theme?: string): string => {
  if (!theme) return "other";
  const t = theme.toLowerCase();
  if (t.includes("risk") || t.includes("security")) return "risk";
  if (t.includes("ux") || t.includes("ui") || t.includes("interface")) return "ux";
  if (t.includes("compliance") || t.includes("legal")) return "compliance";
  if (t.includes("performance") || t.includes("latency") || t.includes("speed")) return "performance";
  if (t.includes("integration") || t.includes("api") || t.includes("documentation")) return "integration";
  return "other";
};

// Transform API data to component format
const transformToFeedbackActions = (
  feedback: FeedbackWithProduct[],
  actions: ProductAction[]
): FeedbackAction[] => {
  return feedback.map((f) => {
    const linkedAction = actions.find(a => a.linked_feedback_id === f.id);
    const score = f.sentiment_score || 0;
    
    // Determine status based on resolution and linked action
    let status: "open" | "in_review" | "resolved" = "open";
    if (f.resolved_at) {
      status = "resolved";
    } else if (linkedAction) {
      status = linkedAction.status === "completed" ? "resolved" : "in_review";
    } else if (score < -0.5 && f.impact_level === "HIGH") {
      status = "open"; // High impact negative = needs attention
    }
    
    return {
      id: f.id,
      feedbackId: f.id,
      productName: f.products?.name || "Unknown Product",
      productId: f.product_id,
      feedbackSource: mapSourceToCategory(f.source),
      issueType: inferIssueType(f.theme),
      summary: f.raw_text.substring(0, 150) + (f.raw_text.length > 150 ? "..." : ""),
      raisedBy: `Source: ${f.source}`,
      raisedDate: new Date(f.created_at).toISOString().split("T")[0],
      status,
      linkedAction: linkedAction?.title || null,
      impact: f.impact_level === "HIGH" ? "high" : f.impact_level === "LOW" ? "low" : "medium",
      resolution: linkedAction?.status === "completed" ? linkedAction.description || "Resolved" : undefined,
      resolvedDate: f.resolved_at ? new Date(f.resolved_at).toISOString().split("T")[0] : linkedAction?.completed_at ? new Date(linkedAction.completed_at).toISOString().split("T")[0] : undefined,
    };
  });
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case "client":
      return <Building2 className="h-4 w-4" />;
    case "partner":
      return <Users className="h-4 w-4" />;
    case "ops":
      return <Headphones className="h-4 w-4" />;
    case "field":
      return <MessageSquareWarning className="h-4 w-4" />;
    default:
      return <MessageSquareWarning className="h-4 w-4" />;
  }
};

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    client: "Client",
    partner: "Partner",
    ops: "Internal Ops",
    field: "Field Report",
  };
  return labels[source] || source;
};

const getIssueTypeConfig = (type: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    risk: { label: "Risk", className: "bg-destructive/10 text-destructive border-destructive/30" },
    ux: { label: "UX", className: "bg-primary/10 text-primary border-primary/30" },
    compliance: { label: "Compliance", className: "bg-warning/10 text-warning border-warning/30" },
    performance: { label: "Performance", className: "bg-info/10 text-info border-info/30" },
    integration: { label: "Integration", className: "bg-muted text-muted-foreground border-muted-foreground/30" },
  };
  return configs[type] || { label: type, className: "bg-muted text-muted-foreground" };
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "open":
      return { icon: AlertTriangle, label: "Open", className: "bg-destructive/10 text-destructive" };
    case "in_review":
      return { icon: Clock, label: "In Review", className: "bg-warning/10 text-warning" };
    case "resolved":
      return { icon: CheckCircle2, label: "Resolved", className: "bg-success/10 text-success" };
    default:
      return { icon: Clock, label: status, className: "bg-muted text-muted-foreground" };
  }
};

export const FeedbackActionsTracker = () => {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [issueFilter, setIssueFilter] = useState<string>("all");

  // Fetch data from API
  const { data: apiFeedback, isLoading: feedbackLoading } = useAllFeedback();
  const { data: apiActions, isLoading: actionsLoading } = useProductActions(undefined);

  const isLoading = feedbackLoading || actionsLoading;

  // Transform API data
  const feedbackActions = useMemo(() => {
    if (!apiFeedback) return [];
    return transformToFeedbackActions(apiFeedback, apiActions || []);
  }, [apiFeedback, apiActions]);

  const filteredActions = useMemo(() => {
    return feedbackActions.filter((item) => {
      const matchesSource = sourceFilter === "all" || item.feedbackSource === sourceFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesIssue = issueFilter === "all" || item.issueType === issueFilter;
      return matchesSource && matchesStatus && matchesIssue;
    });
  }, [feedbackActions, sourceFilter, statusFilter, issueFilter]);

  const openCount = feedbackActions.filter(a => a.status === "open").length;
  const inReviewCount = feedbackActions.filter(a => a.status === "in_review").length;
  const resolvedCount = feedbackActions.filter(a => a.status === "resolved").length;

  // Loading state
  if (isLoading) {
    return (
      <Card className="card-elegant animate-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-primary" />
            Feedback & Actions Loop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-3">
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-3 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-primary" />
            Feedback & Actions Loop
          </CardTitle>
        </div>
        
        {/* Status Summary */}
        <div className="flex gap-3 mt-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-semibold text-destructive">{openCount} Open</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning">{inReviewCount} In Review</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success">{resolvedCount} Resolved</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="ops">Internal Ops</SelectItem>
              <SelectItem value="field">Field Report</SelectItem>
            </SelectContent>
          </Select>

          <Select value={issueFilter} onValueChange={setIssueFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Issue Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="risk">Risk</SelectItem>
              <SelectItem value="ux">UX</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredActions.map((action) => {
          const statusConfig = getStatusConfig(action.status);
          const StatusIcon = statusConfig.icon;
          const issueConfig = getIssueTypeConfig(action.issueType);

          return (
            <div
              key={action.id}
              className={`border rounded-lg p-3 transition-all ${
                action.status === "resolved" ? "opacity-70 bg-muted/30" : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getSourceIcon(action.feedbackSource)}
                  <span className="text-xs font-medium text-muted-foreground">
                    {getSourceLabel(action.feedbackSource)}
                  </span>
                  <Badge variant="outline" className={`text-xs ${issueConfig.className}`}>
                    {issueConfig.label}
                  </Badge>
                </div>
                <Badge className={`text-xs ${statusConfig.className}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              <h4 className="font-semibold text-sm mb-1">{action.productName}</h4>
              <p className="text-xs text-muted-foreground mb-2">{action.summary}</p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Raised by: <span className="font-medium">{action.raisedBy}</span>
                </span>
                <span className="text-muted-foreground">{action.raisedDate}</span>
              </div>

              {action.linkedAction && (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-center gap-2 text-xs">
                    <ChevronRight className="h-3 w-3 text-primary" />
                    <span className="text-primary font-medium">Linked Action:</span>
                    <span className="text-muted-foreground">{action.linkedAction}</span>
                  </div>
                </>
              )}

              {action.status === "resolved" && action.resolution && (
                <div className="mt-2 p-2 rounded bg-success/5 border border-success/20">
                  <p className="text-xs text-success">
                    <strong>Resolution:</strong> {action.resolution}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolved: {action.resolvedDate}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredActions.length === 0 && (
          <div className="text-center py-8">
            <MessageSquareWarning className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No feedback items match filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
