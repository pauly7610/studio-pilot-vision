# AI Insights RAG Pipeline

RAG-powered AI insights for Studio Pilot using binary embeddings, Milvus vector database, and Groq LLM inference.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Documents     │────▶│  Binary Embeddings│────▶│  Milvus Vector  │
│   (PDF, MD...)  │     │  (32x reduction)  │     │    Database     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│   User Query    │────▶│  Hamming Distance │◀────────────┘
│                 │     │    Retrieval      │
└─────────────────┘     └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Groq LLM       │
                        │  (Kimi-K2/Llama) │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   AI Insight     │
                        │    Response      │
                        └──────────────────┘
```

## Features

- **Binary Quantization**: 32x memory reduction using sign-based binarization
- **Hamming Distance Search**: Fast similarity search on binary vectors
- **Hybrid Retrieval**: Two-stage retrieval (binary candidates → float reranking)
- **Groq Inference**: Ultra-fast LLM generation with Kimi-K2 or Llama models
- **Multi-source Ingestion**: Products, feedback, and document files

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Groq API Key

**No Docker required!** Uses Milvus Lite which runs in-process.

### 2. Environment Setup

Create `.env` file in the `ai-insights` directory:

```env
GROQ_API_KEY=your_groq_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 3. Install Dependencies

```bash
cd ai-insights
pip install -r requirements.txt
```

### 4. Run the Service

```bash
python main.py
```

The API will be available at `http://localhost:8000`.

**That's it!** Milvus Lite starts automatically - no containers needed.

## API Endpoints

### Health Check
```http
GET /health
```

### Query Insights
```http
POST /query
Content-Type: application/json

{
  "query": "What are the risks for products in pilot stage?",
  "product_id": "optional-uuid",
  "top_k": 5,
  "include_sources": true
}
```

### Product-Specific Insight
```http
POST /product-insight
Content-Type: application/json

{
  "product_id": "uuid",
  "insight_type": "summary|risks|opportunities|recommendations"
}
```

### Portfolio Insight
```http
POST /portfolio-insight
Content-Type: application/json

{
  "query": "Which products have the highest risk?",
  "filters": {
    "lifecycle_stage": "pilot"
  }
}
```

### Ingest Data
```http
POST /ingest
Content-Type: application/json

{
  "source": "products|feedback|documents",
  "product_id": "optional-uuid"
}
```

## Pipeline Components

### 1. Document Loader (`document_loader.py`)
- Ingests documents using LlamaIndex's directory reader
- Supports PDF, Markdown, Word, CSV, JSON formats
- Converts Supabase product/feedback data to documents
- Chunks documents for optimal retrieval

### 2. Binary Embeddings (`embeddings.py`)
- Uses sentence-transformers for initial embeddings
- Sign-based binary quantization (positive → 1, negative → 0)
- Packs bits into uint8 for 32x memory reduction
- Hamming distance computation

### 3. Vector Store (`vector_store.py`)
- Milvus integration with binary vector index
- BIN_IVF_FLAT index for Hamming distance search
- Optional float index for reranking
- Hybrid search support

### 4. Retrieval (`retrieval.py`)
- Query embedding and quantization
- Top-k retrieval using Hamming distance
- Product and theme filtering
- Two-stage hybrid retrieval

### 5. Generator (`generator.py`)
- Groq SDK integration for fast inference
- Context building from retrieved chunks
- Specialized prompts for different insight types
- Portfolio-level analysis support

## Frontend Integration

Add to your `.env`:
```env
VITE_AI_INSIGHTS_URL=http://localhost:8000
```

Use the React hooks:
```tsx
import { useAIQuery, useProductInsight, usePortfolioInsight } from '@/hooks/useAIInsights';

// Query-based insight
const { mutateAsync: query } = useAIQuery();
const result = await query({ query: "What risks exist?", product_id: "..." });

// Product insight
const { data } = useProductInsight(productId, "summary");

// Portfolio insight
const { mutateAsync: portfolio } = usePortfolioInsight();
const result = await portfolio({ query: "Portfolio health assessment" });
```

## Kubernetes Deployment (Recommended)

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud)
- kubectl configured
- Skaffold (optional, for dev workflow)

### Quick Start with Skaffold

```bash
cd ai-insights

# Create secrets first
kubectl create namespace ai-insights
kubectl create secret generic ai-insights-secrets \
  --from-literal=GROQ_API_KEY=your_key \
  --from-literal=VITE_SUPABASE_URL=your_url \
  --from-literal=VITE_SUPABASE_PUBLISHABLE_KEY=your_key \
  -n ai-insights

# Deploy with Skaffold (builds, deploys, port-forwards)
skaffold dev
```

### Manual kubectl Deployment

```bash
cd ai-insights/k8s

# Apply all manifests
kubectl apply -k .

# Or apply individually
kubectl apply -f namespace.yaml
kubectl apply -f milvus.yaml
kubectl apply -f ai-insights.yaml

# Port forward to access locally
kubectl port-forward svc/ai-insights 8000:8000 -n ai-insights
```

### K8s Features
- **HPA**: Auto-scales 2-10 replicas based on CPU/memory
- **Ingress**: Exposes at `ai-insights.local` (configure /etc/hosts)
- **Health checks**: Readiness and liveness probes
- **Resource limits**: Prevents resource starvation

## Performance

- **Binary embeddings**: 48 bytes per vector (vs 1536 bytes float32)
- **Hamming distance**: O(1) XOR + popcount operations
- **Groq inference**: <100ms typical latency
- **Memory usage**: ~32x reduction vs float vectors
