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
  owner_email?: string;
  external_contact?: string;
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
  owner_email?: string;
  external_contact?: string;
}

export interface UpdateDependencyRequest {
  status?: DependencyStatus;
  notes?: string;
  owner_email?: string;
  external_contact?: string;
}

export function useProductDependencies(productId?: string) {
  return useQuery({
    queryKey: productId ? ["product-dependencies", productId] : ["product-dependencies"],
    queryFn: async () => {
      let query = supabase
        .from("product_dependencies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (productId) {
        query = query.eq("product_id", productId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching dependencies:", error);
        // Return empty array on error (table might not exist yet)
        return [] as ProductDependency[];
      }
      
      return (data || []) as ProductDependency[];
    },
  });
}

export function useBlockedDependencies(productId?: string) {
  return useQuery({
    queryKey: productId ? ["blocked-dependencies", productId] : ["blocked-dependencies"],
    queryFn: async () => {
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
        console.error("Error fetching blocked dependencies:", error);
        return [] as ProductDependency[];
      }
      
      return (data || []) as ProductDependency[];
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
          product_id: dependency.product_id,
          name: dependency.name,
          type: dependency.type,
          category: dependency.category,
          status: dependency.status || "pending",
          notes: dependency.notes,
          owner_email: dependency.owner_email,
          external_contact: dependency.external_contact,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating dependency:", error);
        throw error;
      }

      return data as ProductDependency;
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

      if (error) {
        console.error("Error updating dependency:", error);
        throw error;
      }

      return data as ProductDependency;
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
          notes: notes,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error resolving dependency:", error);
        throw error;
      }

      return data as ProductDependency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency resolved! 🎉");
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

      if (error) {
        console.error("Error deleting dependency:", error);
        throw error;
      }
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

// Helper to get dependency stats for a product
export function useDependencyStats(productId: string) {
  const { data: dependencies = [] } = useProductDependencies(productId);
  
  const stats = {
    total: dependencies.length,
    blocked: dependencies.filter(d => d.status === "blocked").length,
    pending: dependencies.filter(d => d.status === "pending").length,
    resolved: dependencies.filter(d => d.status === "resolved").length,
    internal: dependencies.filter(d => d.type === "internal").length,
    external: dependencies.filter(d => d.type === "external").length,
  };
  
  return stats;
}
