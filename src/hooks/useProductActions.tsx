import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductAction {
  id: string;
  product_id: string;
  linked_feedback_id?: string;
  action_type: "intervention" | "review" | "training" | "compliance" | "partner" | "other";
  title: string;
  description?: string;
  assigned_to?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useProductActions(productId: string | undefined) {
  return useQuery({
    queryKey: productId ? ["product-actions", productId] : ["product-actions"],
    queryFn: async () => {
      let query = supabase
        .from("product_actions")
        .select("*")
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProductAction[];
    },
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: Omit<ProductAction, "id" | "created_at" | "updated_at" | "created_by" | "completed_at">) => {
      const { data, error } = await supabase
        .from("product_actions")
        .insert(action)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-actions", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-actions"] });
      toast.success("Action created successfully");
    },
    onError: (error) => {
      console.error("Error creating action:", error);
      toast.error("Failed to create action");
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId, ...updates }: Partial<ProductAction> & { id: string; productId: string }) => {
      // If marking as completed, set completed_at timestamp
      if (updates.status === "completed" && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("product_actions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-actions", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-actions"] });
      toast.success("Action updated successfully");
    },
    onError: (error) => {
      console.error("Error updating action:", error);
      toast.error("Failed to update action");
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from("product_actions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-actions", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-actions"] });
      toast.success("Action deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting action:", error);
      toast.error("Failed to delete action");
    },
  });
}