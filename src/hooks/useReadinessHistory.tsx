import { useQuery } from "@tanstack/react-query";

export interface ReadinessHistoryPoint {
  id: string;
  product_id: string;
  readiness_score: number;
  risk_band?: string;
  recorded_at: string;
  week_number?: number;
  year?: number;
}

// Note: product_readiness_history table doesn't exist in current schema
// These hooks return empty data until the table is created
export function useReadinessHistory(productId: string, weeks: number = 8) {
  return useQuery({
    queryKey: ["readiness-history", productId, weeks],
    queryFn: async () => {
      // Table doesn't exist in schema - return empty array
      console.warn("product_readiness_history table not in schema - returning empty array");
      return [] as ReadinessHistoryPoint[];
    },
    enabled: !!productId,
  });
}

export function useAllReadinessHistory(weeks: number = 8) {
  return useQuery({
    queryKey: ["all-readiness-history", weeks],
    queryFn: async () => {
      // Table doesn't exist in schema - return empty array
      return [] as ReadinessHistoryPoint[];
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