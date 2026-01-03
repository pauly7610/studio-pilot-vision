import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  product_type: string;
  region: string;
  lifecycle_stage: string;
  launch_date: string | null;
  revenue_target: number | null;
  owner_email: string;
  success_metric?: string;
  gating_status?: string;
  gating_status_since?: string;
  governance_tier?: string;
  budget_code?: string;
  pii_flag?: boolean;
  created_at?: string;
  updated_at?: string;
  // Confidence scores (from migration 20251223)
  revenue_confidence?: number;
  revenue_confidence_justification?: string;
  timeline_confidence?: number;
  timeline_confidence_justification?: string;
  // TTM velocity tracking (from migration 20251223)
  ttm_target_days?: number;
  ttm_actual_days?: number;
  ttm_delta_vs_last_week?: number;
  // Related data
  readiness?: any;
  prediction?: any;
  compliance?: any;
  market_evidence?: any;
  partners?: any[];
  dependencies?: any[];
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          readiness:product_readiness(*),
          prediction:product_predictions(*),
          compliance:product_compliance(*),
          market_evidence:product_market_evidence(*),
          partners:product_partners(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          readiness:product_readiness(*),
          compliance:product_compliance(*),
          partners:product_partners(*),
          training:sales_training(*),
          predictions:product_predictions(*),
          feedback:product_feedback(*)
        `)
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export interface CreateProductInput {
  name: string;
  product_type: string;
  region: string;
  lifecycle_stage: string;
  owner_email: string;
  launch_date?: string;
  revenue_target?: number;
  success_metric?: string;
  governance_tier?: string;
  budget_code?: string;
  pii_flag?: boolean;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const { data, error } = await supabase
        .from("products")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Product "${data.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}
