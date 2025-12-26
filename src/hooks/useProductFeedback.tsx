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
  impact_level?: "HIGH" | "MEDIUM" | "LOW";
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
        .insert(feedback)
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
      const { data, error } = await supabase
        .from("product_feedback")
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes,
          linked_action_id,
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

export function useFeedbackEscalations(productId?: string) {
  return useQuery({
    queryKey: productId ? ["feedback-escalations", productId] : ["feedback-escalations"],
    queryFn: async () => {
      // Note: feedback_escalations table created by migration 20251224
      // This will return empty array if table doesn't exist yet
      try {
        let query = supabase
          .from("feedback_escalations")
          .select("*")
          .is("resolved_at", null)
          .order("triggered_at", { ascending: false });

        if (productId) {
          query = query.eq("product_id", productId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("feedback_escalations table may not exist yet:", error.message);
          return [] as FeedbackEscalation[];
        }
        return (data || []) as unknown as FeedbackEscalation[];
      } catch {
        return [] as FeedbackEscalation[];
      }
    },
  });
}

export function useAcknowledgeEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from("feedback_escalations")
        .update({
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-escalations"] });
      toast.success("Escalation acknowledged");
    },
    onError: (error) => {
      console.error("Error acknowledging escalation:", error);
      toast.error("Failed to acknowledge escalation");
    },
  });
}

export function useResolveEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("feedback_escalations")
        .update({
          resolved_at: new Date().toISOString(),
          notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-escalations"] });
      toast.success("Escalation resolved");
    },
    onError: (error) => {
      console.error("Error resolving escalation:", error);
      toast.error("Failed to resolve escalation");
    },
  });
}
