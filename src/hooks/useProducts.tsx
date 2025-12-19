import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  product_type: string;
  region: string;
  lifecycle_stage: string;
  launch_date: string | null;
  revenue_target: number | null;
  owner_email: string;
  readiness?: any;
  prediction?: any;
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
          compliance:product_compliance(*)
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
