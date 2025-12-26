import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DependencyType = "internal" | "external";
export type DependencyStatus = "blocked" | "pending" | "resolved";
export type DependencyCategory = 
  | "legal" | "cyber" | "compliance" | "privacy" | "engineering" | "ops"
  | "partner_rail" | "vendor" | "api" | "integration" | "regulatory";

export interface ProductDependency {
  id: string;
  product_id: string;
  name: string;
  type: DependencyType;
  category: DependencyCategory;
  status: DependencyStatus;
  blocked_since?: string;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDependencyRequest {
  product_id: string;
  name: string;
  type: DependencyType;
  category: DependencyCategory;
  status?: DependencyStatus;
  notes?: string;
}

export interface UpdateDependencyRequest {
  status?: DependencyStatus;
  notes?: string;
}

export function useProductDependencies(productId?: string) {
  return useQuery({
    queryKey: productId ? ["product-dependencies", productId] : ["product-dependencies"],
    queryFn: async () => {
      try {
        let query = supabase
          .from("product_dependencies")
          .select("*")
          .order("created_at", { ascending: false });

        if (productId) {
          query = query.eq("product_id", productId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("product_dependencies table may not exist yet:", error.message);
          return [] as ProductDependency[];
        }
        return (data || []) as unknown as ProductDependency[];
      } catch {
        return [] as ProductDependency[];
      }
    },
  });
}

export function useBlockedDependencies(productId?: string) {
  return useQuery({
    queryKey: productId ? ["blocked-dependencies", productId] : ["blocked-dependencies"],
    queryFn: async () => {
      try {
        let query = supabase
          .from("product_dependencies")
          .select("*")
          .eq("status", "blocked")
          .order("blocked_since", { ascending: true });

        if (productId) {
          query = query.eq("product_id", productId);
        }

        const { data, error } = await query;

        if (error) {
          return [] as ProductDependency[];
        }
        return (data || []) as unknown as ProductDependency[];
      } catch {
        return [] as ProductDependency[];
      }
    },
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependency: CreateDependencyRequest) => {
      const { data, error } = await supabase
        .from("product_dependencies")
        .insert({
          ...dependency,
          status: dependency.status || "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency added");
    },
    onError: (error) => {
      console.error("Error creating dependency:", error);
      toast.error("Failed to add dependency");
    },
  });
}

export function useUpdateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateDependencyRequest & { id: string }) => {
      const { data, error } = await supabase
        .from("product_dependencies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency updated");
    },
    onError: (error) => {
      console.error("Error updating dependency:", error);
      toast.error("Failed to update dependency");
    },
  });
}

export function useResolveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("product_dependencies")
        .update({
          status: "resolved",
          notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency resolved");
    },
    onError: (error) => {
      console.error("Error resolving dependency:", error);
      toast.error("Failed to resolve dependency");
    },
  });
}

export function useDeleteDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_dependencies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency removed");
    },
    onError: (error) => {
      console.error("Error deleting dependency:", error);
      toast.error("Failed to remove dependency");
    },
  });
}
