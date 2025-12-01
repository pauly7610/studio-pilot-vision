import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductMetric {
  id: string;
  product_id: string;
  date: string;
  actual_revenue: number | null;
  adoption_rate: number | null;
  active_users: number | null;
  transaction_volume: number | null;
  churn_rate: number | null;
  created_at: string | null;
}

export function useProductMetrics(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-metrics", productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("product_metrics")
        .select("*")
        .eq("product_id", productId)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as ProductMetric[];
    },
    enabled: !!productId,
  });
}
