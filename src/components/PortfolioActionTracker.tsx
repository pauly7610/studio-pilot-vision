import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Filter,
  ArrowRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductActions } from "@/hooks/useProductActions";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "critical":
      return { label: "Critical", className: "bg-destructive text-destructive-foreground" };
    case "high":
      return { label: "High", className: "bg-destructive/10 text-destructive border-destructive/30" };
    case "medium":
      return { label: "Medium", className: "bg-warning/10 text-warning border-warning/30" };
    case "low":
      return { label: "Low", className: "bg-muted text-muted-foreground" };
    default:
      return { label: priority, className: "bg-muted text-muted-foreground" };
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { icon: AlertTriangle, label: "Pending", className: "bg-destructive/10 text-destructive" };
    case "in_progress":
      return { icon: Clock, label: "In Progress", className: "bg-warning/10 text-warning" };
    case "completed":
      return { icon: CheckCircle2, label: "Completed", className: "bg-success/10 text-success" };
    case "cancelled":
      return { icon: Clock, label: "Cancelled", className: "bg-muted text-muted-foreground" };
    default:
      return { icon: Clock, label: status, className: "bg-muted text-muted-foreground" };
  }
};

export const PortfolioActionTracker = () => {
  const navigate = useNavigate();
  const { data: actions = [], isLoading: actionsLoading } = useProductActions(undefined);
  const { data: products = [] } = useProducts();
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Create product lookup
  const productLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    products.forEach((p: any) => {
      lookup[p.id] = p.name;
    });
    return lookup;
  }, [products]);

  // Filter actions
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "active" && (action.status === "pending" || action.status === "in_progress")) ||
        (statusFilter !== "active" && action.status === statusFilter);
      
      const matchesPriority = priorityFilter === "all" || action.priority === priorityFilter;
      
      return matchesStatus && matchesPriority;
    });
  }, [actions, statusFilter, priorityFilter]);

  // Summary counts
  const pendingCount = actions.filter(a => a.status === "pending").length;
  const inProgressCount = actions.filter(a => a.status === "in_progress").length;
  const completedCount = actions.filter(a => a.status === "completed").length;
  const criticalCount = actions.filter(a => a.priority === "critical" && a.status !== "completed").length;

  return (
    <Card className="card-elegant animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Portfolio Action Tracker
          </CardTitle>
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-semibold text-destructive">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning">{inProgressCount} In Progress</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success">{completedCount} Completed</span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive-foreground" />
              <span className="text-xs font-semibold text-destructive-foreground">{criticalCount} Critical</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {actionsLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading actions...</p>
        ) : filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No actions match filters</p>
          </div>
        ) : (
          filteredActions.map((action) => {
            const statusConfig = getStatusConfig(action.status);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(action.priority);

            return (
              <div
                key={action.id}
                className={`border rounded-lg p-3 transition-all hover:border-primary/50 ${
                  action.status === "completed" ? "opacity-70 bg-muted/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={priorityConfig.className}>
                      {priorityConfig.label}
                    </Badge>
                    <Badge className={`text-xs ${statusConfig.className}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(action.created_at), "MMM dd")}
                  </span>
                </div>

                <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-primary hover:text-primary"
                    onClick={() => navigate(`/product/${action.product_id}`)}
                  >
                    {productLookup[action.product_id] || "Unknown Product"}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  {action.assigned_to && (
                    <span className="text-xs text-muted-foreground">
                      Assigned: {action.assigned_to}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
