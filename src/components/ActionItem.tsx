import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateAction } from "@/hooks/useProductActions";
import { ProductAction } from "@/hooks/useProductActions";

interface ActionItemProps {
  action: ProductAction;
  productId: string;
}

export const ActionItem = ({ action, productId }: ActionItemProps) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(action.description || "");
  const updateAction = useUpdateAction();

  const handleStatusChange = (newStatus: "pending" | "in_progress" | "completed") => {
    updateAction.mutate({
      id: action.id,
      productId,
      status: newStatus,
    });
  };

  const handleSaveNote = () => {
    updateAction.mutate({
      id: action.id,
      productId,
      description: note,
    });
    setIsEditingNote(false);
  };

  const getStatusBadge = () => {
    switch (action.status) {
      case "completed":
        return (
          <Badge className="bg-muted text-muted-foreground border-muted-foreground/20">
            ✅ Resolved
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            ⏳ In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            ○ Open
          </Badge>
        );
    }
  };

  const getStatusColor = () => {
    switch (action.status) {
      case "completed":
        return "text-muted-foreground line-through opacity-60";
      case "in_progress":
        return "text-foreground";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      action.status === "completed" ? "bg-muted/30 border-muted" : "bg-card border-border"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className={`text-sm font-medium mb-2 ${getStatusColor()}`}>{action.title}</p>
          {getStatusBadge()}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Last Updated
          </p>
          <p className="text-xs font-medium">
            {new Date(action.updated_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(action.updated_at).toLocaleTimeString('en-US', { 
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {action.description && !isEditingNote && (
          <div className="bg-muted/50 rounded p-2 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Note:</p>
            <p className="text-xs text-foreground">{action.description}</p>
          </div>
        )}

        {isEditingNote && (
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal notes..."
              className="text-xs min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={handleSaveNote}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditingNote(false);
                  setNote(action.description || "");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {action.status !== "in_progress" && action.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => handleStatusChange("in_progress")}
            >
              Mark In Progress
            </Button>
          )}
          {action.status !== "completed" && (
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs"
              onClick={() => handleStatusChange("completed")}
            >
              Mark Resolved
            </Button>
          )}
          {!isEditingNote && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setIsEditingNote(true)}
            >
              📝 {action.description ? "Edit Note" : "Add Note"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
