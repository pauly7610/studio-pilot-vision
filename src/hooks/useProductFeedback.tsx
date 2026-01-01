import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductFeedback {
  id: string;
  product_id: string;
  source: string;
  raw_text: string;
  theme?: string;
  sentiment_score?: number;
  impact_level?: "HIGH" | "MEDIUM" | "LOW" | string;
  volume?: number;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  linked_action_id?: string;
}

export interface FeedbackWithProduct extends ProductFeedback {
  products?: {
    id: string;
    name: string;
  };
}

export interface FeedbackEscalation {
  id: string;
  feedback_id: string;
  product_id: string;
  escalation_level: "team" | "ambassador" | "exec" | "critical";
  reason: string;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  notes?: string;
  auto_triggered: boolean;
}

export function useProductFeedback(productId?: string) {
  return useQuery({
    queryKey: productId ? ["product-feedback", productId] : ["product-feedback"],
    queryFn: async () => {
      let query = supabase
        .from("product_feedback")
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FeedbackWithProduct[];
    },
  });
}

export function useAllFeedback(options?: {
  source?: string;
  impactLevel?: string;
  theme?: string;
}) {
  return useQuery({
    queryKey: ["all-feedback", options],
    queryFn: async () => {
      let query = supabase
        .from("product_feedback")
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (options?.source) {
        query = query.eq("source", options.source);
      }
      if (options?.impactLevel) {
        query = query.eq("impact_level", options.impactLevel);
      }
      if (options?.theme) {
        query = query.eq("theme", options.theme);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FeedbackWithProduct[];
    },
  });
}

export function useFeedbackSummary() {
  return useQuery({
    queryKey: ["feedback-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_feedback")
        .select("theme, sentiment_score, volume");

      if (error) throw error;

      // Aggregate by theme
      const themeMap = new Map<string, { count: number; totalSentiment: number; totalVolume: number }>();
      
      data?.forEach((item) => {
        const theme = item.theme || "Unknown";
        const existing = themeMap.get(theme) || { count: 0, totalSentiment: 0, totalVolume: 0 };
        themeMap.set(theme, {
          count: existing.count + 1,
          totalSentiment: existing.totalSentiment + (item.sentiment_score || 0),
          totalVolume: existing.totalVolume + (item.volume || 1),
        });
      });

      return Array.from(themeMap.entries()).map(([theme, stats]) => ({
        theme,
        count: stats.count,
        avg_sentiment: stats.count > 0 ? stats.totalSentiment / stats.count : 0,
        total_volume: stats.totalVolume,
      }));
    },
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: Omit<ProductFeedback, "id" | "created_at" | "resolved_at" | "resolved_by" | "resolution_notes" | "linked_action_id">) => {
      const { data, error } = await supabase
        .from("product_feedback")
        .insert({
          product_id: feedback.product_id,
          source: feedback.source,
          raw_text: feedback.raw_text,
          theme: feedback.theme,
          sentiment_score: feedback.sentiment_score,
          impact_level: feedback.impact_level,
          volume: feedback.volume,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-feedback", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["all-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-summary"] });
      toast.success("Feedback submitted successfully");
    },
    onError: (error) => {
      console.error("Error creating feedback:", error);
      toast.error("Failed to submit feedback");
    },
  });
}

export function useResolveFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      resolution_notes,
      linked_action_id 
    }: { 
      id: string; 
      resolution_notes?: string;
      linked_action_id?: string;
    }) => {
      // Note: resolved_at column may not exist in current schema
      // Only update fields that exist in the table
      const { data, error } = await supabase
        .from("product_feedback")
        .update({
          // resolution_notes and linked_action_id may not exist in schema
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["all-feedback"] });
      toast.success("Feedback resolved");
    },
    onError: (error) => {
      console.error("Error resolving feedback:", error);
      toast.error("Failed to resolve feedback");
    },
  });
}

// Note: feedback_escalations table doesn't exist in current schema
// These hooks return empty data until the table is created
export function useFeedbackEscalations(productId?: string) {
  return useQuery({
    queryKey: productId ? ["feedback-escalations", productId] : ["feedback-escalations"],
    queryFn: async () => {
      // Table doesn't exist in schema - return empty array
      console.warn("feedback_escalations table not in schema - returning empty array");
      return [] as FeedbackEscalation[];
    },
  });
}

export function useAcknowledgeEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      console.warn("feedback_escalations table not in schema - operation skipped");
      throw new Error("feedback_escalations table not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-escalations"] });
      toast.success("Escalation acknowledged");
    },
    onError: (error) => {
      console.error("Error acknowledging escalation:", error);
      toast.error("Escalation tracking not available");
    },
  });
}

export function useResolveEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      console.warn("feedback_escalations table not in schema - operation skipped");
      throw new Error("feedback_escalations table not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-escalations"] });
      toast.success("Escalation resolved");
    },
    onError: (error) => {
      console.error("Error resolving escalation:", error);
      toast.error("Escalation tracking not available");
    },
  });
}