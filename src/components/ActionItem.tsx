import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, Circle } from "lucide-react";
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

  const getStatusIcon = () => {
    switch (action.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" aria-label="Resolved" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-warning" aria-label="In Progress" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" aria-label="Open" />;
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
    <div className={`border rounded-lg p-3 ${action.status === "completed" ? "bg-muted/20" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 space-y-2">
          <p className={`text-sm font-medium ${getStatusColor()}`}>{action.title}</p>
          
          {action.description && !isEditingNote && (
            <p className="text-xs text-muted-foreground">{action.description}</p>
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
                className="h-7 text-xs"
                onClick={() => handleStatusChange("in_progress")}
              >
                Mark In Progress
              </Button>
            )}
            {action.status !== "completed" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleStatusChange("completed")}
              >
                Mark Resolved
              </Button>
            )}
            {!isEditingNote && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setIsEditingNote(true)}
              >
                📝 {action.description ? "Edit Note" : "Add Note"}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Updated: {new Date(action.updated_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
