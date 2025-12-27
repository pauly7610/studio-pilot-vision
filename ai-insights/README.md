# AI Insights - RAG Pipeline + Cognee Knowledge Graph

Dual-layer AI system combining RAG-powered insights with Cognee's persistent knowledge graph for historical memory and reasoning.

## Architecture

### Dual-Layer AI System

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: RAG Pipeline                         │
│  ┌─────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐ │
│  │ Data Sources│─▶│Embeddings│─▶│ChromaDB │─▶│ Groq LLM     │ │
│  │• Jira CSV   │  │(MiniLM)  │  │ Vector  │  │(Llama 3.3)   │ │
│  │• Documents  │  └──────────┘  │  Store  │  └──────────────┘ │
│  └─────────────┘                └─────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 2: Cognee Knowledge Graph                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Knowledge Graph (10 Entities, 9 Relationships)           │  │
│  │ • Product → HAS_RISK → RiskSignal                        │  │
│  │ • Product → DEPENDS_ON → Dependency                      │  │
│  │ • RiskSignal → TRIGGERS → GovernanceAction               │  │
│  │ • GovernanceAction → RESULTS_IN → Outcome                │  │
│  │ • Decision → REFERENCES → Product/Risk/Outcome           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Features:                                                       │
│  ✓ Historical state preservation (temporal versioning)          │
│  ✓ Causal relationship tracking                                 │
│  ✓ Explainable AI with confidence scoring                       │
│  ✓ Natural language queries with reasoning traces               │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### RAG Pipeline (Layer 1)
- **ChromaDB**: Cross-platform vector database (works on Windows, Mac, Linux)
- **Sentence Transformers**: High-quality embeddings with all-MiniLM-L6-v2
- **Groq Inference**: Ultra-fast LLM generation with Llama 3.3 70B
- **Multi-source Ingestion**: Products, feedback, Jira CSV, and document files
- **Background Jobs**: Async processing for large data imports

### Cognee Knowledge Graph (Layer 2)
- **Persistent Memory**: Historical portfolio states with temporal versioning
- **Structured Relationships**: 10 entity types, 9 relationship types
- **Explainable AI**: Confidence scoring with 4 components (data freshness, relationship strength, historical accuracy, entity completeness)
- **Natural Language Queries**: "What's blocking Q1 revenue growth?" → Structured answer with sources
- **Reasoning Traces**: Step-by-step explanation of how answers are derived
- **Causal Tracking**: Risk → Action → Outcome chains
- **Recommendations**: AI-suggested actions based on historical patterns
- **Forecasting**: "If no action taken" scenario predictions

## MVP Limitations & Production Path

### Current MVP: ChromaDB with Cosine Similarity

This MVP uses **ChromaDB** for cross-platform compatibility during development. Trade-offs:

| Aspect | MVP (ChromaDB) | Impact |
|--------|----------------|--------|
| Vector type | Float32 (384 dims) | ~1.5KB per document |
| Search algorithm | HNSW + Cosine | Good accuracy, standard speed |
| Platform support | ✅ Windows/Mac/Linux | Easy local development |
| Binary quantization | ❌ Not used | Code exists but not leveraged |

### Production Recommendation: Milvus with Binary Quantization

For production deployment, **Milvus** is the recommended vector database:

| Aspect | Milvus (Production) | Benefit |
|--------|---------------------|---------|
| Vector type | Binary (48 bytes) | **32x memory reduction** |
| Search algorithm | Hamming distance | **O(1) XOR + popcount** - extremely fast |
| Scale | Billions of vectors | Enterprise-grade horizontal scaling |
| Hybrid search | Binary candidates → float rerank | Best of both worlds |

**Why Milvus for Production:**
1. **Cost efficiency** — 32x less memory means 32x lower infrastructure costs at scale
2. **Speed** — Hamming distance on binary vectors is hardware-accelerated (POPCNT instruction)
3. **Enterprise features** — RBAC, multi-tenancy, backup/restore, Kubernetes operator
4. **Proven at scale** — Used by Shopify, Nvidia, eBay for billion-scale vector search

**Migration path:** The `embeddings.py` module already generates binary embeddings. Switching to Milvus requires only changing `vector_store.py` to use `pymilvus` instead of `chromadb`.

### Why ChromaDB for MVP
- **Zero setup** — No Docker, no external services
- **Windows compatible** — Milvus Lite doesn't work on Windows
- **Fast iteration** — In-process database for rapid development
- **Good enough** — For <100K documents, performance difference is negligible

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Groq API Key (free at console.groq.com)

**No Docker required!** ChromaDB runs in-process.

### 2. Environment Setup

Create `.env` file in the `ai-insights` directory:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
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

The API will be available at `http://localhost:8001`.

**That's it!** ChromaDB starts automatically - no containers needed.

## API Endpoints

### RAG Pipeline Endpoints

#### Health Check
```http
GET /health
```

#### Query Insights
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

#### Product-Specific Insight
```http
POST /product-insight
Content-Type: application/json

{
  "product_id": "uuid",
  "insight_type": "summary|risks|opportunities|recommendations"
}
```

#### Portfolio Insight
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

#### Ingest Data
```http
POST /ingest
Content-Type: application/json

{
  "source": "products|feedback|documents",
  "product_id": "optional-uuid"
}
```

#### Upload Jira CSV (Background Job)
```http
POST /upload/jira-csv
Content-Type: multipart/form-data

file: your-jira-export.csv
```

Returns immediately with `job_id`. Poll for status:

```http
GET /upload/status/{job_id}
```

### Cognee Knowledge Graph Endpoints

#### Query Knowledge Graph
```http
POST /cognee/query
Content-Type: application/json

{
  "query": "What's blocking Q1 revenue growth?",
  "context": {
    "region": "North America"
  }
}
```

Response includes:
- Natural language answer
- Confidence score (0-100%)
- Source entities with citations
- Step-by-step reasoning trace
- Recommended actions
- Forecast (if applicable)

#### Ingest Product Snapshot
```http
POST /cognee/ingest/products
```

Triggers background job to ingest current product state into knowledge graph.

#### Ingest Governance Actions
```http
POST /cognee/ingest/actions
```

Triggers background job to ingest governance actions and create outcome entities.

#### Check Ingestion Status
```http
GET /cognee/ingest/status/{job_id}
```

Returns status of Cognee ingestion job.

## Pipeline Components

### RAG Pipeline Components

#### 1. Document Loader (`document_loader.py`)
- Ingests documents using LlamaIndex's directory reader
- Supports PDF, Markdown, Word, CSV, JSON formats
- Converts Supabase product/feedback data to documents
- Chunks documents for optimal retrieval

#### 2. Embeddings (`embeddings.py`)
- Uses sentence-transformers (all-MiniLM-L6-v2)
- 384-dimensional dense embeddings
- Optimized for semantic similarity

#### 3. Vector Store (`vector_store.py`)
- ChromaDB integration (cross-platform)
- Cosine similarity search
- Persistent storage in `./chroma_data`
- Auto-creates collection on startup

#### 4. Retrieval (`retrieval.py`)
- Query embedding generation
- Top-k retrieval using cosine similarity
- Product and theme filtering
- Context assembly for LLM

#### 5. Generator (`generator.py`)
- Groq SDK integration for fast inference
- Context building from retrieved chunks
- Specialized prompts for different insight types
- Portfolio-level analysis support

#### 6. Jira Parser (`jira_parser.py`)
- Parses standard Jira CSV exports
- Extracts: Issue key, Summary, Status, Assignee, Epic, Sprint
- Auto-matches tickets to products via Epic name
- Generates document chunks for RAG ingestion

### Cognee Knowledge Graph Components

#### 7. Cognee Client (`cognee_client.py`)
- Connection management and initialization
- Entity creation and management
- Relationship handling
- Query interface with async support

#### 8. Schema Definitions (`cognee_schema.py`)
- 10 entity types with Pydantic models
- 9 relationship types with properties
- Type-safe enums for all fields
- Helper functions for entity creation

#### 9. Query Interface (`cognee_query.py`)
- Natural language query processing
- Intent parsing (blockers, risks, revenue_impact, etc.)
- Confidence scoring with 4 components
- Source attribution and explainability
- Reasoning trace generation
- Recommendation engine
- Forecast generation

#### 10. Ingestion Pipelines (`ingestion/`)
- **Product Snapshot**: Weekly product state ingestion with temporal versioning
- **Governance Actions**: Real-time action ingestion with outcome tracking

## Documentation

- **`COGNEE_INTEGRATION.md`**: Complete Cognee architecture, knowledge graph model, API specs, and troubleshooting
- **`COGNEE_IMPLEMENTATION_SUMMARY.md`**: Implementation summary with testing checklist and deployment notes

## Frontend Integration

Add to your `.env`:
```env
VITE_AI_INSIGHTS_URL=http://localhost:8001
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

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud)
- kubectl configured

### Deploy

```bash
cd ai-insights/k8s

# Create namespace and secrets
kubectl create namespace ai-insights
kubectl create secret generic ai-insights-secrets \
  --from-literal=GROQ_API_KEY=your_key \
  -n ai-insights

# Apply manifests
kubectl apply -f namespace.yaml
kubectl apply -f ai-insights.yaml

# Port forward to access locally
kubectl port-forward svc/ai-insights 8001:8001 -n ai-insights
```

### K8s Features
- **HPA**: Auto-scales 2-10 replicas based on CPU/memory
- **Health checks**: Readiness and liveness probes at `/health`
- **Resource limits**: Prevents resource starvation

## Production Considerations

### For Mastercard Deployment

| Component | Dev (Current) | Production |
|-----------|---------------|------------|
| **LLM** | Groq (external) | Azure OpenAI (enterprise) |
| **Vector DB** | ChromaDB (local) | Milvus Enterprise (on-prem) |
| **Job Queue** | In-memory dict | Redis |
| **Auth** | None | SSO/LDAP |

### Compliance
- No PII in RAG pipeline (product names, revenue = OK)
- Audit logging for all queries
- Data encryption at rest (AES-256)

## Performance

- **Embeddings**: 384-dimensional MiniLM vectors
- **ChromaDB**: HNSW index with cosine similarity
- **Groq inference**: <100ms typical latency
- **Background jobs**: Non-blocking CSV processing
