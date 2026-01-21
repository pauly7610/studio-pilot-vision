import { useState, useCallback, useRef } from "react";

// Backend API URL - uses environment variable with fallback to production
const AI_INSIGHTS_URL = import.meta.env.VITE_AI_INSIGHTS_URL || "https://studio-pilot-vision.onrender.com";

/**
 * SSE Event types from the streaming endpoint
 */
export type StreamEventType = "intent" | "cognee" | "rag" | "merged" | "error" | "complete";

/**
 * Intent classification result
 */
export interface IntentEvent {
  intent: string;
  confidence: number;
  explanation: string;
}

/**
 * Partial result from Cognee or RAG
 */
export interface PartialResult {
  answer?: string;
  confidence?: number;
  sources?: Array<{
    entity_id: string;
    entity_type: string;
    entity_name?: string;
    confidence: number;
  }>;
}

/**
 * Final merged result
 */
export interface MergedResult {
  answer: string;
  confidence: number;
  sources: Array<{
    entity_id: string;
    entity_type: string;
    entity_name?: string;
    content?: string;
    confidence: number;
    source_type: string;
  }>;
  reasoning_trace?: Array<{
    step: number;
    action: string;
    confidence: number;
    entities_found?: number;
  }>;
  recommended_actions?: Array<{
    action_type: string;
    tier: string;
    rationale: string;
    confidence: number;
  }>;
  forecast?: {
    scenario: string;
    impact: string;
    probability: number;
    time_horizon: string;
  };
  confidence_breakdown?: {
    overall: number;
    data_freshness?: number;
    source_reliability?: number;
    historical_accuracy?: number;
    entity_grounding?: number;
    explanation?: string;
  };
}

/**
 * Streaming state for progressive UI updates
 */
export interface StreamingState {
  // Current phase of the query
  phase: "idle" | "classifying" | "querying" | "merging" | "complete" | "error";
  
  // Intent classification (arrives first, ~100ms)
  intent: IntentEvent | null;
  
  // Partial results as they arrive
  cogneeResult: PartialResult | null;
  ragResult: PartialResult | null;
  
  // Final merged result
  mergedResult: MergedResult | null;
  
  // Error if any
  error: string | null;
  
  // Timestamps for performance tracking
  startTime: number | null;
  intentTime: number | null;
  completeTime: number | null;
}

const initialState: StreamingState = {
  phase: "idle",
  intent: null,
  cogneeResult: null,
  ragResult: null,
  mergedResult: null,
  error: null,
  startTime: null,
  intentTime: null,
  completeTime: null,
};

/**
 * Hook for streaming AI queries with Server-Sent Events (SSE)
 * 
 * Provides progressive UI updates as the query processes:
 * 1. Intent classification (immediate feedback, ~100ms)
 * 2. Cognee/RAG partial results (as they complete)
 * 3. Final merged answer
 * 
 * Usage:
 * ```tsx
 * const { state, query, reset } = useStreamingAIQuery();
 * 
 * // In your component:
 * {state.phase === "classifying" && <Spinner>Analyzing query...</Spinner>}
 * {state.intent && <Badge>{state.intent.intent}</Badge>}
 * {state.phase === "querying" && <Progress>Searching knowledge base...</Progress>}
 * {state.mergedResult && <Answer>{state.mergedResult.answer}</Answer>}
 * ```
 */
export function useStreamingAIQuery() {
  const [state, setState] = useState<StreamingState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Reset state to initial
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(initialState);
    setIsLoading(false);
  }, []);

  /**
   * Execute a streaming query
   */
  const query = useCallback(async (
    queryText: string,
    context?: Record<string, unknown>,
    options?: { includePartial?: boolean }
  ) => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startTime = Date.now();
    
    setState({
      ...initialState,
      phase: "classifying",
      startTime,
    });
    setIsLoading(true);

    try {
      const response = await fetch(`${AI_INSIGHTS_URL}/ai/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryText,
          context: context || {},
          include_partial: options?.includePartial ?? true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if we got a streaming response
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/event-stream")) {
        // Fallback: not a streaming response, parse as JSON
        const data = await response.json();
        setState(prev => ({
          ...prev,
          phase: "complete",
          mergedResult: data,
          completeTime: Date.now(),
        }));
        setIsLoading(false);
        return;
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE events (separated by \n\n)
        const events = buffer.split("\n\n");
        buffer = events.pop() || ""; // Keep incomplete event in buffer
        
        for (const eventStr of events) {
          if (!eventStr.trim()) continue;
          
          // Parse SSE format: "data: {...json...}"
          const dataMatch = eventStr.match(/^data:\s*(.+)$/m);
          if (!dataMatch) continue;
          
          try {
            const event = JSON.parse(dataMatch[1]);
            const eventType = event.type as StreamEventType;
            const payload = event.payload;
            
            switch (eventType) {
              case "intent":
                setState(prev => ({
                  ...prev,
                  phase: "querying",
                  intent: payload as IntentEvent,
                  intentTime: Date.now(),
                }));
                break;
                
              case "cognee":
                setState(prev => ({
                  ...prev,
                  cogneeResult: payload as PartialResult,
                }));
                break;
                
              case "rag":
                setState(prev => ({
                  ...prev,
                  ragResult: payload as PartialResult,
                }));
                break;
                
              case "merged":
                setState(prev => ({
                  ...prev,
                  phase: "merging",
                  mergedResult: payload as MergedResult,
                }));
                break;
                
              case "error":
                setState(prev => ({
                  ...prev,
                  phase: "error",
                  error: payload?.message || payload?.error || "Unknown error",
                }));
                break;
                
              case "complete":
                setState(prev => ({
                  ...prev,
                  phase: "complete",
                  completeTime: Date.now(),
                }));
                break;
            }
          } catch (parseError) {
            console.warn("Failed to parse SSE event:", eventStr, parseError);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Request was cancelled, don't update state
        return;
      }
      
      console.error("Streaming query error:", error);
      setState(prev => ({
        ...prev,
        phase: "error",
        error: (error as Error).message || "Failed to connect to AI backend",
      }));
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  /**
   * Get performance metrics from the current query
   */
  const getMetrics = useCallback(() => {
    if (!state.startTime) return null;
    
    return {
      intentLatencyMs: state.intentTime ? state.intentTime - state.startTime : null,
      totalLatencyMs: state.completeTime ? state.completeTime - state.startTime : null,
    };
  }, [state.startTime, state.intentTime, state.completeTime]);

  return {
    state,
    isLoading,
    query,
    reset,
    getMetrics,
  };
}

/**
 * Helper to get a human-readable phase description
 */
export function getPhaseDescription(phase: StreamingState["phase"]): string {
  switch (phase) {
    case "idle":
      return "Ready";
    case "classifying":
      return "Analyzing query...";
    case "querying":
      return "Searching knowledge base...";
    case "merging":
      return "Synthesizing answer...";
    case "complete":
      return "Complete";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}
