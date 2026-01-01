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

// Note: product_dependencies table doesn't exist in current schema
// These hooks return empty data until the table is created
export function useProductDependencies(productId?: string) {
  return useQuery({
    queryKey: productId ? ["product-dependencies", productId] : ["product-dependencies"],
    queryFn: async () => {
      // Table doesn't exist in schema - return empty array
      console.warn("product_dependencies table not in schema - returning empty array");
      return [] as ProductDependency[];
    },
  });
}

export function useBlockedDependencies(productId?: string) {
  return useQuery({
    queryKey: productId ? ["blocked-dependencies", productId] : ["blocked-dependencies"],
    queryFn: async () => {
      // Table doesn't exist in schema - return empty array
      return [] as ProductDependency[];
    },
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependency: CreateDependencyRequest) => {
      console.warn("product_dependencies table not in schema - operation skipped");
      throw new Error("product_dependencies table not available");
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
      toast.error("Dependency tracking not available");
    },
  });
}

export function useUpdateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateDependencyRequest & { id: string }) => {
      console.warn("product_dependencies table not in schema - operation skipped");
      throw new Error("product_dependencies table not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency updated");
    },
    onError: (error) => {
      console.error("Error updating dependency:", error);
      toast.error("Dependency tracking not available");
    },
  });
}

export function useResolveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      console.warn("product_dependencies table not in schema - operation skipped");
      throw new Error("product_dependencies table not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency resolved");
    },
    onError: (error) => {
      console.error("Error resolving dependency:", error);
      toast.error("Dependency tracking not available");
    },
  });
}

export function useDeleteDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.warn("product_dependencies table not in schema - operation skipped");
      throw new Error("product_dependencies table not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Dependency removed");
    },
    onError: (error) => {
      console.error("Error deleting dependency:", error);
      toast.error("Dependency tracking not available");
    },
  });
}