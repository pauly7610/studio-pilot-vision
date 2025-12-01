import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClipboardList, Plus, CheckCircle2, Clock, AlertCircle, X } from "lucide-react";
import { useProductActions, useCreateAction, useUpdateAction, ProductAction } from "@/hooks/useProductActions";
import { format } from "date-fns";

interface ActionTrackingProps {
  productId: string;
}

export const ActionTracking = ({ productId }: ActionTrackingProps) => {
  const { data: actions = [], isLoading } = useProductActions(productId);
  const createAction = useCreateAction();
  const updateAction = useUpdateAction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    action_type: "intervention" as const,
    priority: "medium" as const,
    assigned_to: "",
    due_date: "",
  });

  const handleCreateAction = () => {
    if (!newAction.title.trim()) return;

    createAction.mutate(
      {
        product_id: productId,
        ...newAction,
        status: "pending",
        due_date: newAction.due_date || undefined,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNewAction({
            title: "",
            description: "",
            action_type: "intervention",
            priority: "medium",
            assigned_to: "",
            due_date: "",
          });
        },
      }
    );
  };

  const handleStatusChange = (action: ProductAction, newStatus: ProductAction["status"]) => {
    updateAction.mutate({
      id: action.id,
      productId: action.product_id,
      status: newStatus,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-warning" aria-hidden="true" />;
      case "cancelled":
        return <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
      default:
        return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "in_progress":
        return "bg-warning/10 text-warning border-warning/20";
      case "cancelled":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const pendingActions = actions.filter((a) => a.status === "pending" || a.status === "in_progress");
  const completedActions = actions.filter((a) => a.status === "completed");

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            Action Tracking
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" aria-label="Add new action">
                <Plus className="h-4 w-4" />
                Add Action
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Action</DialogTitle>
                <DialogDescription>
                  Track governance interventions and improvement tasks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newAction.title}
                    onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                    placeholder="e.g., Complete compliance certification"
                    maxLength={200}
                    aria-required="true"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAction.description}
                    onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                    placeholder="Additional details about the action..."
                    maxLength={1000}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="action_type">Action Type</Label>
                    <Select
                      value={newAction.action_type}
                      onValueChange={(value: any) =>
                        setNewAction({ ...newAction, action_type: value })
                      }
                    >
                      <SelectTrigger id="action_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intervention">Intervention</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAction.priority}
                      onValueChange={(value: any) => setNewAction({ ...newAction, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    <Input
                      id="assigned_to"
                      value={newAction.assigned_to}
                      onChange={(e) => setNewAction({ ...newAction, assigned_to: e.target.value })}
                      placeholder="Email or name"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newAction.due_date}
                      onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAction} disabled={!newAction.title.trim()}>
                  Create Action
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading actions...</p>
        ) : actions.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-medium mb-1">No actions yet</p>
            <p className="text-xs text-muted-foreground">Create your first action to track interventions</p>
          </div>
        ) : (
          <>
            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  Active Actions
                  <Badge variant="outline" className="text-xs">
                    {pendingActions.length}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{action.title}</h4>
                            <Badge variant="outline" className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                          </div>
                          {action.description && (
                            <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="capitalize">{action.action_type}</span>
                            {action.assigned_to && <span>Assigned: {action.assigned_to}</span>}
                            {action.due_date && (
                              <span>Due: {format(new Date(action.due_date), "MMM dd, yyyy")}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(action.status)}
                          <Badge variant="outline" className={getStatusColor(action.status)}>
                            {action.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(action, "in_progress")}
                          disabled={action.status === "in_progress"}
                          aria-label="Mark as in progress"
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(action, "completed")}
                          className="bg-success hover:bg-success/90"
                          aria-label="Mark as completed"
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Actions */}
            {completedActions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  Completed Actions
                  <Badge variant="outline" className="text-xs">
                    {completedActions.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {completedActions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                            <h4 className="font-medium text-sm">{action.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Completed{" "}
                            {action.completed_at &&
                              format(new Date(action.completed_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};