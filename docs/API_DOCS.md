# API Documentation - Studio Pilot Vision

## Base URLs

- **Production:** `https://studio-pilot-vision.onrender.com`
- **Swagger UI:** `https://studio-pilot-vision.onrender.com/docs`
- **ReDoc:** `https://studio-pilot-vision.onrender.com/redoc`
- **OpenAPI JSON:** `https://studio-pilot-vision.onrender.com/openapi.json`

## Authentication

Most write endpoints require the `X-Admin-Key` header:

```http
X-Admin-Key: your-admin-key-here
```

Read endpoints (queries) are generally public.

---

## Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Health** | `/health` | GET | Detailed health status |
| **Health** | `/metrics` | GET | Prometheus metrics |
| **AI Queries** | `/ai/query` | POST | Unified AI query (production) |
| **AI Queries** | `/query` | POST | RAG-only query |
| **AI Queries** | `/product-insight` | POST | Product-specific insights |
| **AI Queries** | `/portfolio-insight` | POST | Portfolio-level insights |
| **Cognee** | `/cognee/query` | POST | Knowledge graph query |
| **Cognee** | `/cognee/ingest/products` | POST | Ingest products to graph |
| **Cognee** | `/cognee/ingest/actions` | POST | Ingest actions to graph |
| **Cognee** | `/cognee/ingest/status/{job_id}` | GET | Check ingestion job status |
| **Upload** | `/upload/document` | POST | Upload PDF/TXT/MD/DOCX |
| **Upload** | `/upload/jira-csv` | POST | Upload Jira CSV |
| **Upload** | `/upload/status/{job_id}` | GET | Check upload job status |
| **Sync** | `/api/sync/webhook` | POST | Supabase webhook receiver |
| **Sync** | `/api/sync/ingest` | POST | Manual full sync |
| **Sync** | `/api/sync/status/{job_id}` | GET | Check sync job status |
| **Admin** | `/admin/cognee/cognify` | POST | Run Cognee cognify process |
| **Admin** | `/admin/cognee/status` | GET | Cognee status |
| **Admin** | `/admin/cognee/reset` | POST | Reset Cognee (destructive!) |

---

## Health & Monitoring

### `GET /health`

Returns detailed health status of all services.

**Response:**
```json
{
  "status": "healthy",
  "vector_store": {
    "connected": true,
    "document_count": 1234
  },
  "groq_configured": true,
  "cognee_initialized": true
}
```

**Status Codes:**
- `200` - All services healthy
- `503` - One or more services degraded

---

### `GET /metrics`

Prometheus metrics in text format.

**Response:**
```text
# HELP ai_insights_requests_total Total number of requests
# TYPE ai_insights_requests_total counter
ai_insights_requests_total{method="POST",endpoint="/ai/query"} 1234

# HELP ai_insights_request_duration_seconds Request duration
# TYPE ai_insights_request_duration_seconds histogram
ai_insights_request_duration_seconds_bucket{le="0.1"} 500
ai_insights_request_duration_seconds_bucket{le="0.5"} 950
ai_insights_request_duration_seconds_bucket{le="1.0"} 1200
```

---

## AI Query Endpoints

### `POST /ai/query` (Production Endpoint)

**Unified AI query endpoint** combining RAG + Cognee with intelligent routing.

**Request:**
```json
{
  "query": "What blockers does Product X have?",
  "context": {
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Product X has 3 active blockers: Partner API delay (external), Resource constraint (internal), Security review pending (internal).",
  "confidence": 0.85,
  "confidence_breakdown": {
    "freshness": 0.9,
    "reliability": 0.85,
    "grounding": 0.95,
    "coherence": 0.75
  },
  "sources": [
    {
      "type": "Product",
      "id": "550e8400",
      "name": "Mastercard Send",
      "metadata": {
        "last_updated": "2025-01-04T10:00:00Z"
      }
    },
    {
      "type": "Dependency",
      "id": "dep_123",
      "name": "Partner API Integration",
      "metadata": {
        "status": "blocked"
      }
    }
  ],
  "reasoning_trace": [
    {
      "step": 1,
      "action": "Retrieved product from database",
      "details": "Found Product X (Mastercard Send)"
    },
    {
      "step": 2,
      "action": "Found 3 dependencies marked as blockers",
      "details": "Filtered by dependency_type='blocker' and status='active'"
    },
    {
      "step": 3,
      "action": "Ranked by severity: Partner API (critical), Resource (high), Security (medium)",
      "details": "Used severity scoring algorithm"
    }
  ],
  "recommended_actions": [
    {
      "action": "Escalate Partner API delay to VP Product",
      "priority": "high",
      "reason": "Blocking Q1 launch date"
    }
  ],
  "forecasts": [
    {
      "scenario": "No action taken",
      "likelihood": 0.75,
      "impact": "2-week schedule delay",
      "recommendation": "Escalate within 48 hours"
    }
  ],
  "source_type": "hybrid",
  "guardrails": {
    "answer_type": "grounded",
    "warnings": [],
    "completeness": 0.95,
    "sources_cited": 2
  },
  "query_metadata": {
    "intent": "blockers",
    "route": "hybrid",
    "cache_hit": false,
    "latency_ms": 245
  }
}
```

**Status Codes:**
- `200` - Query processed successfully
- `400` - Invalid query format
- `500` - Internal server error
- `503` - AI services unavailable

**Example cURL:**
```bash
curl -X POST https://studio-pilot-vision.onrender.com/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the top risks for products in North America?",
    "context": {"region": "North America"}
  }'
```

---

### `POST /query`

**RAG-only query** endpoint (no Cognee, faster but less context).

**Request:**
```json
{
  "query": "What is the readiness score for Product X?",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "top_k": 5,
  "include_sources": true
}
```

**Response:**
```json
{
  "success": true,
  "insight": "Product X (Mastercard Send) has a readiness score of 75%, indicating Yellow status...",
  "sources": [
    {
      "text": "Mastercard Send readiness assessment...",
      "metadata": {
        "source": "product_readiness_report.pdf",
        "page": 3
      }
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225
  }
}
```

---

### `POST /product-insight`

**Product-specific insights** with structured queries.

**Request:**
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "insight_type": "risks"
}
```

**Insight Types:**
- `summary` - Overall product summary
- `risks` - Risk analysis
- `opportunities` - Growth opportunities
- `recommendations` - Actionable recommendations

**Response:**
```json
{
  "success": true,
  "insight": "Product X faces 3 high-priority risks: ...",
  "sources": [...]
}
```

---

### `POST /portfolio-insight`

**Portfolio-level insights** across multiple products.

**Request:**
```json
{
  "query": "Which products are at risk of missing Q1 deadlines?",
  "filters": {
    "region": "North America",
    "lifecycle_stage": "Develop"
  }
}
```

**Valid Region Values:**
- `North America`
- `Europe`
- `Asia/Pacific`
- `Latin America & Caribbean`
- `Middle East & Africa`

**Response:**
```json
{
  "success": true,
  "insight": "5 products are at risk: Product A (high), Product B (medium)...",
  "sources": [...]
}
```

---

## Cognee Knowledge Graph Endpoints

### `POST /cognee/query`

**Query the knowledge graph** for causal reasoning and temporal analysis.

**Request:**
```json
{
  "query": "Why was Product X escalated last week?",
  "context": {
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "time_window": "Q1 2025 Week 1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Product X was escalated because readiness score dropped to 65%...",
  "confidence": 0.87,
  "confidence_breakdown": {...},
  "sources": [
    {
      "entity_type": "RiskSignal",
      "entity_id": "risk_001",
      "name": "Readiness Score Drop",
      "properties": {
        "severity": "High",
        "detected_at": "2025-01-01T09:00:00Z"
      }
    }
  ],
  "reasoning_trace": [
    {"step": 1, "action": "Found RiskSignal: Readiness score drop"},
    {"step": 2, "action": "Traced TRIGGERS relationship to GovernanceAction"},
    {"step": 3, "action": "Found escalation to VP Product on Jan 2nd"}
  ],
  "recommended_actions": [
    {
      "action": "Allocate additional resources",
      "confidence": 0.8,
      "historical_success_rate": 0.75
    }
  ],
  "forecasts": [
    {
      "scenario": "No action taken",
      "likelihood": 0.8,
      "predicted_outcome": "Risk escalates to Red within 2 weeks"
    }
  ]
}
```

---

### `POST /cognee/ingest/products`

**Ingest products** into knowledge graph (background job).

**Request:**
```json
{
  "time_window_label": "Q1 2025 Week 5",
  "force_update": false
}
```

**Response:**
```json
{
  "job_id": "abc123-def456",
  "status": "started",
  "message": "Product ingestion initiated"
}
```

**Check Status:**
```bash
GET /cognee/ingest/status/abc123-def456
```

**Status Response:**
```json
{
  "job_id": "abc123-def456",
  "status": "completed",
  "progress": 100,
  "total_items": 1000,
  "processed_items": 1000,
  "result": {
    "products_created": 950,
    "products_updated": 50,
    "risks_created": 234,
    "relationships_created": 1500
  }
}
```

**Possible Statuses:**
- `pending` - Job queued
- `running` - In progress
- `completed` - Successfully finished
- `failed` - Error occurred

---

### `POST /cognee/ingest/actions`

**Ingest governance actions** into knowledge graph.

**Request:**
```json
{
  "time_window_label": "Q1 2025 Week 5",
  "action_ids": ["action_001", "action_002"]
}
```

**Response:**
```json
{
  "job_id": "xyz789",
  "status": "started"
}
```

---

## Document Upload Endpoints

### `POST /upload/document`

**Upload documents** (PDF, TXT, MD, DOCX) for RAG ingestion.

**Request (multipart/form-data):**
```
file: product_spec.pdf
product_id: 550e8400-e29b-41d4-a716-446655440000
category: specification
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "job_id": "doc_upload_123",
  "file_name": "product_spec.pdf",
  "file_size": 1024000,
  "chunks_created": 25
}
```

**Supported Formats:**
- `.pdf` - Portable Document Format
- `.txt` - Plain text
- `.md` - Markdown
- `.docx` - Microsoft Word

**Max File Size:** 50MB

**Example cURL:**
```bash
curl -X POST https://studio-pilot-vision.onrender.com/upload/document \
  -F "file=@product_spec.pdf" \
  -F "product_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "category=specification"
```

---

### `POST /upload/jira-csv`

**Upload Jira CSV** for work item tracking.

**Request (multipart/form-data):**
```
file: jira_export.csv
project_key: MSIP
```

**CSV Format:**
```csv
Issue Key,Summary,Status,Assignee,Priority
MSIP-123,Implement feature X,In Progress,john.doe,High
MSIP-124,Fix bug Y,Done,jane.smith,Medium
```

**Response:**
```json
{
  "success": true,
  "job_id": "jira_upload_456",
  "rows_processed": 150,
  "issues_created": 150
}
```

---

### `GET /upload/status/{job_id}`

**Check upload job status**.

**Response:**
```json
{
  "job_id": "doc_upload_123",
  "status": "completed",
  "progress": 100,
  "result": {
    "chunks_created": 25,
    "embeddings_generated": 25,
    "time_elapsed_seconds": 12
  }
}
```

---

## Data Sync Endpoints

### `POST /api/sync/webhook`

**Supabase webhook receiver** for real-time sync.

**Request (from Supabase):**
```json
{
  "type": "INSERT",
  "table": "products",
  "record": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Mastercard Send",
    "lifecycle_stage": "Develop",
    "readiness_score": 75
  },
  "schema": "public",
  "old_record": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed, sync initiated",
  "sync_type": "incremental",
  "entities_updated": ["Product:550e8400"]
}
```

**Debouncing:** 5-second window to batch updates

---

### `POST /api/sync/ingest`

**Manual full sync** from Supabase to ChromaDB + Cognee.

**Headers:**
```
X-Admin-Key: your-admin-key
```

**Request:**
```json
{
  "tables": ["products", "governance_actions", "dependencies"],
  "force_reindex": false
}
```

**Response:**
```json
{
  "job_id": "sync_full_789",
  "status": "started",
  "estimated_duration_minutes": 8
}
```

---

### `GET /api/sync/status/{job_id}`

**Check sync job status**.

**Response:**
```json
{
  "job_id": "sync_full_789",
  "status": "running",
  "progress": 65,
  "current_task": "Ingesting governance_actions",
  "errors": []
}
```

---

## Admin Endpoints

### `POST /admin/cognee/cognify`

**Run Cognee cognify process** to build knowledge graph.

**Warning:** This is a heavy operation, use sparingly.

**Headers:**
```
X-Admin-Key: your-admin-key
```

**Response:**
```json
{
  "success": true,
  "message": "Cognify process started",
  "estimated_duration_minutes": 15
}
```

---

### `GET /admin/cognee/status`

**Get Cognee status**.

**Response:**
```json
{
  "initialized": true,
  "data_path": "./cognee_data",
  "graph_db": "networkx",
  "vector_db": "lancedb",
  "entity_count": 1234,
  "relationship_count": 5678
}
```

---

### `POST /admin/cognee/reset`

**Reset Cognee** (destructive operation - deletes all graph data).

**Warning:** This cannot be undone!

**Headers:**
```
X-Admin-Key: your-admin-key
```

**Request:**
```json
{
  "confirm": "DELETE_ALL_DATA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cognee data reset complete",
  "entities_deleted": 1234,
  "relationships_deleted": 5678
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error type",
  "detail": "Detailed error message",
  "timestamp": "2025-01-04T10:30:00Z"
}
```

**Common Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid admin key)
- `404` - Not Found (resource doesn't exist)
- `422` - Validation Error (Pydantic validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI services down)

**Example Error:**
```json
{
  "success": false,
  "error": "ValidationError",
  "detail": "Field 'query' is required",
  "timestamp": "2025-01-04T10:30:00Z",
  "request_id": "req_abc123"
}
```

---

## Rate Limits

**Current Limits (to be implemented):**
- Anonymous: 20 requests/minute
- Authenticated: 100 requests/minute
- Admin: 500 requests/minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1672876800
```

---

## Webhooks

### Configuring Supabase Webhooks

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - **URL:** `https://studio-pilot-vision.onrender.com/api/sync/webhook`
   - **Events:** INSERT, UPDATE
   - **Tables:** products, governance_actions, dependencies
   - **HTTP Method:** POST
   - **Timeout:** 10 seconds
   - **HTTP Headers:** None required

---

## SDK Usage Examples

### Python

```python
import requests

BASE_URL = "https://studio-pilot-vision.onrender.com"

def query_ai(question: str):
    response = requests.post(
        f"{BASE_URL}/ai/query",
        json={"query": question}
    )
    return response.json()

result = query_ai("What blockers does Product X have?")
print(result["answer"])
print(f"Confidence: {result['confidence']}")
```

### JavaScript

```javascript
const BASE_URL = "https://studio-pilot-vision.onrender.com";

async function queryAI(question) {
  const response = await fetch(`${BASE_URL}/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: question })
  });
  return response.json();
}

const result = await queryAI("What blockers does Product X have?");
console.log(result.answer);
console.log(`Confidence: ${result.confidence}`);
```

### cURL

```bash
# Query AI
curl -X POST https://studio-pilot-vision.onrender.com/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What blockers does Product X have?"}'

# Upload document
curl -X POST https://studio-pilot-vision.onrender.com/upload/document \
  -F "file=@product_spec.pdf" \
  -F "product_id=550e8400"

# Check health
curl https://studio-pilot-vision.onrender.com/health
```

---

## Performance Guidelines

**Expected Latencies (95th percentile):**
- `/ai/query` (cached): < 50ms
- `/ai/query` (RAG): < 300ms
- `/ai/query` (Cognee): < 1s
- `/query` (RAG-only): < 200ms
- `/upload/document`: < 30s (10MB PDF)

**Best Practices:**
1. Cache frequently accessed queries on your side
2. Use `product_id` filter when possible (faster retrieval)
3. Set appropriate `top_k` (5-10 recommended)
4. Use `/query` for simple retrieval, `/ai/query` for complex reasoning
5. Batch uploads during off-peak hours

---

## Changelog

### v2.1.0 (2026-01-22)
- Added `product_region` enum with 5 Mastercard regions
- Added Latin America & Caribbean (LAC) products and compliance tracking
- Updated region filter documentation
- Added product_predictions table for success/revenue probability

### v2.0.0 (2026-01-04)
- Added `/ai/query` unified endpoint
- Implemented confidence scoring (4-component)
- Added reasoning trace generation
- Implemented entity validation
- Added hybrid query routing

### v1.5.0 (2025-12-15)
- Added Cognee knowledge graph integration
- Implemented causal chain tracking
- Added forecasting capabilities

### v1.0.0 (2025-11-01)
- Initial RAG pipeline release
- ChromaDB integration
- Groq LLM integration

---

## Related Documentation

- [System Architecture](./ARCHITECTURE.md)
- [AI Architecture](./AI_ARCHITECTURE.md)
- [Data Flow](./DATA_FLOW.md)
- [Operational Runbook](./RUNBOOK.md)

---

**Last Updated:** 2026-01-22
**API Version:** 2.1.0
**OpenAPI Spec:** `/openapi.json`
