import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReadinessHistoryPoint {
  id: string;
  product_id: string;
  readiness_score: number;
  risk_band?: string;
  recorded_at: string;
  week_number?: number;
  year?: number;
}

export function useReadinessHistory(productId: string, weeks: number = 8) {
  return useQuery({
    queryKey: ["readiness-history", productId, weeks],
    queryFn: async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

        const { data, error } = await supabase
          .from("product_readiness_history")
          .select("*")
          .eq("product_id", productId)
          .gte("recorded_at", cutoffDate.toISOString())
          .order("recorded_at", { ascending: true });

        if (error) {
          console.warn("product_readiness_history table may not exist yet:", error.message);
          return [] as ReadinessHistoryPoint[];
        }
        return (data || []) as unknown as ReadinessHistoryPoint[];
      } catch {
        return [] as ReadinessHistoryPoint[];
      }
    },
    enabled: !!productId,
  });
}

export function useAllReadinessHistory(weeks: number = 8) {
  return useQuery({
    queryKey: ["all-readiness-history", weeks],
    queryFn: async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

        const { data, error } = await supabase
          .from("product_readiness_history")
          .select("*")
          .gte("recorded_at", cutoffDate.toISOString())
          .order("recorded_at", { ascending: true });

        if (error) {
          console.warn("product_readiness_history table may not exist yet:", error.message);
          return [] as ReadinessHistoryPoint[];
        }
        return (data || []) as unknown as ReadinessHistoryPoint[];
      } catch {
        return [] as ReadinessHistoryPoint[];
      }
    },
  });
}

// Helper to generate momentum data from readiness history
export function calculateMomentum(history: ReadinessHistoryPoint[]): {
  trend: "improving" | "declining" | "stable";
  delta: number;
  sparklineData: Array<{ value: number; date: string }>;
} {
  if (history.length < 2) {
    return {
      trend: "stable",
      delta: 0,
      sparklineData: history.map(h => ({ value: h.readiness_score, date: h.recorded_at })),
    };
  }

  const recentHalf = history.slice(Math.floor(history.length / 2));
  const olderHalf = history.slice(0, Math.floor(history.length / 2));

  const recentAvg = recentHalf.reduce((sum, h) => sum + h.readiness_score, 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((sum, h) => sum + h.readiness_score, 0) / olderHalf.length;

  const delta = recentAvg - olderAvg;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (delta > 3) trend = "improving";
  else if (delta < -3) trend = "declining";

  return {
    trend,
    delta: Math.round(delta * 10) / 10,
    sparklineData: history.map(h => ({ value: h.readiness_score, date: h.recorded_at })),
  };
}
