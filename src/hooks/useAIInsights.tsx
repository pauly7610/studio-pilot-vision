import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Backend API URL - handles all LLM calls server-side
// Uses environment variable with fallback to production URL
const AI_INSIGHTS_URL = import.meta.env.VITE_AI_INSIGHTS_URL || "https://studio-pilot-vision.onrender.com";

export interface InsightResponse {
  success: boolean;
  insight: string | null;
  sources?: Array<{
    text: string;
    metadata: Record<string, unknown>;
    score: number;
  }>;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface QueryRequest {
  query: string;
  product_id?: string;
  top_k?: number;
  include_sources?: boolean;
}

export interface ProductInsightRequest {
  product_id: string;
  insight_type: "summary" | "risks" | "opportunities" | "recommendations" | "competitive";
}

export interface PortfolioInsightRequest {
  query: string;
  filters?: Record<string, string>;
}

async function fetchInsight(endpoint: string, body: unknown): Promise<InsightResponse> {
  const response = await fetch(`${AI_INSIGHTS_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Failed to fetch insight");
  }

  return response.json();
}

export function useAIQuery() {
  return useMutation({
    mutationFn: async (request: QueryRequest) => {
      return fetchInsight("/query", request);
    },
  });
}

export function useProductInsight(productId: string, insightType: ProductInsightRequest["insight_type"] = "summary") {
  return useQuery({
    queryKey: ["ai-insight", "product", productId, insightType],
    queryFn: async () => {
      return fetchInsight("/product-insight", {
        product_id: productId,
        insight_type: insightType,
      });
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function usePortfolioInsight() {
  return useMutation({
    mutationFn: async (request: PortfolioInsightRequest) => {
      return fetchInsight("/portfolio-insight", request);
    },
  });
}

export function useIngestData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: "products" | "feedback" | "documents", productId?: string) => {
      const response = await fetch(`${AI_INSIGHTS_URL}/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source, product_id: productId }),
      });

      if (!response.ok) {
        throw new Error("Failed to ingest data");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insight"] });
    },
  });
}

export function useAIHealth() {
  return useQuery({
    queryKey: ["ai-health"],
    queryFn: async () => {
      const response = await fetch(`${AI_INSIGHTS_URL}/health`);
      if (!response.ok) {
        throw new Error("AI service unavailable");
      }
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds
    retry: false,
  });
}

export function useAIStats() {
  return useQuery({
    queryKey: ["ai-stats"],
    queryFn: async () => {
      const response = await fetch(`${AI_INSIGHTS_URL}/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export interface JiraUploadResponse {
  success: boolean;
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  status: "queued" | "parsing" | "processing" | "ingesting" | "completed" | "failed" | "extracting_text" | "ingesting_chromadb" | "ingesting_cognee" | "building_knowledge";
  progress: number;
  total_tickets?: number;
  ingested?: number;
  filename?: string;
  error?: string;
  summary?: {
    total_tickets: number;
    by_status: Record<string, number>;
    by_epic: Record<string, number>;
  };
  // Document upload specific
  extracted_chars?: number;
  chroma_ingested?: number;
  cognee_ingested?: boolean;
  cognee_error?: string;
  file_type?: string;
  message?: string;
}

export function useUploadJiraCSV() {
  return useMutation({
    mutationFn: async (file: File): Promise<JiraUploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${AI_INSIGHTS_URL}/upload/jira-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(error.detail || "Failed to upload CSV");
      }

      return response.json();
    },
  });
}

export interface DocumentUploadResponse {
  success: boolean;
  job_id: string;
  status: string;
  filename: string;
  file_size_mb: number;
  message: string;
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: async (file: File): Promise<DocumentUploadResponse> => {
      // Client-side validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
      }

      const allowedTypes = ['.pdf', '.txt', '.md', '.docx'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(ext)) {
        throw new Error(`File type '${ext}' not supported. Allowed: ${allowedTypes.join(', ')}`);
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${AI_INSIGHTS_URL}/upload/document`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(error.detail || "Failed to upload document");
      }

      return response.json();
    },
  });
}

export function useJobStatus(jobId: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["upload-job", jobId],
    queryFn: async (): Promise<JobStatusResponse> => {
      const response = await fetch(`${AI_INSIGHTS_URL}/upload/status/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }
      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when completed or failed
      if (data?.status === "completed" || data?.status === "failed") {
        // Invalidate stats when completed
        if (data?.status === "completed") {
          queryClient.invalidateQueries({ queryKey: ["ai-stats"] });
          queryClient.invalidateQueries({ queryKey: ["ai-insight"] });
        }
        return false;
      }
      return 1000; // Poll every second while processing
    },
  });
}
