# Cognee Integration Documentation

## Overview

Cognee is integrated as the **persistent AI memory and reasoning layer** for Studio Pilot Vision. It replaces ad-hoc RAG queries with a structured, long-lived knowledge graph that remembers historical portfolio states, relationships, and decisions.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│  - CogneeInsights Component                                          │
│  - Query Interface                                                   │
│  - Explainability Visualization                                      │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                           │
│  - /cognee/query                                                     │
│  - /cognee/ingest/products                                           │
│  - /cognee/ingest/actions                                            │
└────────┬────────────────────────────────┬───────────────────────────┘
         │                                │
         │ Transactional                  │ Memory/Reasoning
         ▼                                ▼
┌────────────────────────┐    ┌──────────────────────────────────────┐
│   SUPABASE (PostgreSQL)│    │   COGNEE MEMORY LAYER                │
│  - Current State       │    │  - Knowledge Graph                   │
│  - CRUD Operations     │    │  - Vector Store                      │
│  - Real-time Updates   │    │  - Reasoning Engine                  │
└────────────────────────┘    │  - Historical Versioning             │
                              └──────────────────────────────────────┘
```

### Data Flow Separation

**Supabase (Transactional DB):**
- Current product state (latest snapshot)
- User authentication & permissions
- Real-time updates for dashboard
- CRUD operations

**Cognee (Memory & Reasoning Layer):**
- Historical portfolio states (time-series)
- Entity relationships & dependencies
- Causal chains (Risk → Action → Outcome)
- Executive decisions & rationale
- Trend analysis & pattern recognition

---

## Knowledge Graph Model

### Core Entities

1. **Product** - Product information and lifecycle
2. **Portfolio** - Portfolio groupings
3. **RiskSignal** - Risk indicators and health metrics
4. **Dependency** - Blockers and requirements
5. **GovernanceAction** - Escalations and mitigations
6. **Decision** - Executive decisions
7. **Outcome** - Measured results
8. **RevenueSignal** - Financial tracking
9. **FeedbackSignal** - Customer/user feedback
10. **TimeWindow** - Temporal organization

### Key Relationships

- `Product → HAS_RISK → RiskSignal`
- `Product → DEPENDS_ON → Dependency`
- `RiskSignal → TRIGGERS → GovernanceAction`
- `GovernanceAction → RESULTS_IN → Outcome`
- `Outcome → IMPACTS → RevenueSignal`
- `Decision → REFERENCES → Product/Risk/Outcome`
- `All Entities → OCCURS_IN → TimeWindow`

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd ai-insights
pip install -r requirements.txt
```

The `requirements.txt` includes:
```
cognee>=0.1.0
```

### 2. Configure Environment

Cognee uses the existing Groq API key for LLM operations:

```bash
# .env file
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Initialize Cognee

Cognee is automatically initialized on first use. The client configures:
- LLM Provider: Groq (llama-3.1-70b-versatile)
- Vector Store: ChromaDB (for consistency)
- Graph Database: NetworkX (built-in)

---

## Usage

### Frontend Query Interface

The `CogneeInsights` component provides a natural language query interface:

**Location:** AI Insights tab in the main dashboard

**Example Queries:**
- "What's blocking Q1 revenue growth?"
- "Which products are high-risk?"
- "What actions should I prioritize?"

**Response Includes:**
- Natural language answer
- Confidence score (0-100%)
- Source entities with citations
- Step-by-step reasoning trace
- Recommended actions
- Forecast (if applicable)

### API Endpoints

#### 1. Query Endpoint

```bash
POST https://studio-pilot-vision.onrender.com/cognee/query
Content-Type: application/json

{
  "query": "What's blocking Q1 revenue growth?",
  "context": {
    "region": "North America"
  }
}
```

**Response:**
```json
{
  "success": true,
  "query": "What's blocking Q1 revenue growth?",
  "answer": "Q1 revenue growth is primarily blocked by...",
  "confidence": 0.88,
  "confidence_breakdown": {
    "overall": 0.88,
    "components": {
      "data_freshness": 0.95,
      "relationship_strength": 0.88,
      "historical_accuracy": 0.82,
      "entity_completeness": 0.90
    },
    "explanation": "High confidence due to recent data..."
  },
  "sources": [
    {
      "entity_type": "Dependency",
      "entity_name": "Stripe Integration",
      "confidence": 0.95,
      "time_range": "Current period"
    }
  ],
  "reasoning_trace": [
    {
      "step": 1,
      "action": "Parsed query intent as 'blockers'",
      "confidence": 1.0
    }
  ],
  "recommended_actions": [
    {
      "action_type": "escalation",
      "tier": "steerco",
      "rationale": "Historical pattern shows 50% faster resolution",
      "confidence": 0.82
    }
  ],
  "forecast": {
    "scenario": "no_action",
    "impact": "$2.7M revenue at risk",
    "probability": 0.88,
    "time_horizon": "3 weeks"
  }
}
```

#### 2. Product Ingestion Endpoint

```bash
POST https://studio-pilot-vision.onrender.com/cognee/ingest/products
```

**What it does:**
- Fetches current products from Supabase
- Creates Product and RiskSignal entities
- Establishes relationships
- Preserves historical snapshots

**Response:**
```json
{
  "success": true,
  "job_id": "cognee_ingest_1735286400",
  "message": "Product ingestion queued. Poll /cognee/ingest/status/{job_id} for progress."
}
```

#### 3. Actions Ingestion Endpoint

```bash
POST https://studio-pilot-vision.onrender.com/cognee/ingest/actions
```

**What it does:**
- Fetches governance actions from Supabase
- Creates GovernanceAction entities
- Links to RiskSignals
- Creates Outcome entities for completed actions

---

## Ingestion Pipelines

### 1. Product Snapshot (Weekly)

**File:** `ai-insights/ingestion/product_snapshot.py`

**Trigger:** Scheduled job (every Monday 00:00 UTC) or manual API call

**Process:**
1. Query current state from Supabase
2. Create/Update Product entities
3. Create RiskSignal entities
4. Create OCCURS_IN relationships to TimeWindow
5. Calculate confidence scores based on data freshness

**Confidence Weighting:**
- Data < 24hrs old: 1.0
- Data 24-72hrs old: 0.9
- Data > 7 days old: 0.5

### 2. Governance Actions (Real-time)

**File:** `ai-insights/ingestion/governance_actions.py`

**Trigger:** On INSERT/UPDATE to `actions` table (CDC stream) or manual API call

**Process:**
1. Detect new action or status change
2. Create GovernanceAction entity
3. Create TRIGGERS relationship from RiskSignal
4. If completed: Create Outcome entity and RESULTS_IN relationship

---

## Query Flow

### Example: "What's blocking Q1 revenue growth?"

**Step 1: Query Parsing**
- Extract intent: "blockers"
- Identify entities: TimeWindow, Dependency, RevenueSignal

**Step 2: Graph Traversal**
```
START: TimeWindow("Q1 2025")
→ CONTAINS → Product
→ HAS_RISK → RiskSignal (severity: high)
→ DEPENDS_ON → Dependency (status: blocked)
→ IMPACTS → RevenueSignal (type: at_risk)
```

**Step 3: Context Enrichment**
- Calculate confidence scores
- Identify patterns (e.g., similar Q3 2024 event)
- Retrieve historical context

**Step 4: Answer Synthesis**
- LLM generates answer with citations
- Include recommended actions
- Add forecast for "no action" scenario

**Step 5: Response with Explainability**
- Source attribution
- Confidence breakdown
- Reasoning trace
- Recommendations

---

## Explainability Features

### 1. Source Attribution

Every answer includes source entities:
```json
"sources": [
  {
    "entity_type": "Dependency",
    "entity_id": "dep_stripe_123",
    "entity_name": "Stripe Integration",
    "confidence": 0.95
  }
]
```

### 2. Confidence Breakdown

```json
"confidence_breakdown": {
  "overall": 0.88,
  "components": {
    "data_freshness": 0.95,
    "relationship_strength": 0.88,
    "historical_accuracy": 0.82,
    "entity_completeness": 0.90
  }
}
```

### 3. Reasoning Trace

Step-by-step explanation of how the answer was derived:
```json
"reasoning_trace": [
  {
    "step": 1,
    "action": "Parsed query intent as 'blockers'",
    "confidence": 1.0
  },
  {
    "step": 2,
    "action": "Identified 5 relevant entities",
    "entities_found": 5,
    "confidence": 0.95
  }
]
```

---

## Testing

### Manual Testing

**Test Product Ingestion:**
```bash
cd ai-insights/ingestion
python product_snapshot.py
```

**Test Governance Actions:**
```bash
cd ai-insights/ingestion
python governance_actions.py
```

**Test Query Interface:**
```bash
cd ai-insights
python cognee_query.py
```

### API Testing

```bash
# Test query endpoint
curl -X POST https://studio-pilot-vision.onrender.com/cognee/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the high-risk products?"}'

# Test product ingestion
curl -X POST https://studio-pilot-vision.onrender.com/cognee/ingest/products

# Check ingestion status
curl https://studio-pilot-vision.onrender.com/cognee/ingest/status/{job_id}
```

---

## Maintenance

### Data Freshness

Cognee stores historical snapshots with timestamps. To maintain data quality:

1. **Weekly Product Snapshots:** Run every Monday
2. **Real-time Actions:** Trigger on action status changes
3. **Monthly Revenue Reconciliation:** Compare forecasts vs actuals

### Confidence Score Calibration

Confidence scores are calculated based on:
- **Data Freshness:** Age of source data
- **Relationship Strength:** Number and quality of graph connections
- **Historical Accuracy:** Past prediction accuracy
- **Entity Completeness:** Coverage of relevant entities

To improve accuracy:
1. Track prediction outcomes
2. Compare AI answers to actual results
3. Update confidence weights based on historical performance

### Reset Cognee (Use with Caution!)

```python
from cognee_client import get_cognee_client

client = get_cognee_client()
await client.reset()  # Clears all data
```

---

## Troubleshooting

### Issue: Query returns no results

**Cause:** No data ingested into Cognee

**Solution:**
```bash
# Ingest products
curl -X POST https://studio-pilot-vision.onrender.com/cognee/ingest/products

# Wait for completion, then query
curl -X POST https://studio-pilot-vision.onrender.com/cognee/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What products exist?"}'
```

### Issue: Low confidence scores

**Cause:** Stale data or incomplete relationships

**Solution:**
1. Run fresh product snapshot ingestion
2. Ensure actions are being ingested
3. Check data freshness in Supabase

### Issue: Cognee initialization fails

**Cause:** Missing Groq API key

**Solution:**
```bash
# Check environment variable
echo $GROQ_API_KEY

# Set if missing
export GROQ_API_KEY=your_key_here
```

---

## Future Enhancements

### Phase 2: Additional Pipelines

1. **Revenue Forecasts vs Actuals** (Monthly)
2. **Partner Dependency Changes** (Event-driven)
3. **Customer Feedback** (Daily batch)
4. **Executive Decisions** (Manual entry)

### Phase 3: Advanced Features

1. **Hybrid Search:** Combine vector similarity with keyword BM25
2. **Semantic Chunking:** Improve document coherence
3. **Re-ranking:** Cross-encoder for precision
4. **GPU Acceleration:** Faster vector search

### Phase 4: Production Optimization

1. **Migrate to Milvus:** Horizontal scaling for billions of vectors
2. **Binary Quantization:** 32x memory reduction
3. **A/B Testing:** Optimize prompt variations
4. **Feedback Loop:** User ratings improve model quality

---

## Key Files

### Backend
- `cognee_client.py` - Cognee connection and entity management
- `cognee_schema.py` - Entity and relationship definitions
- `cognee_query.py` - Query interface with explainability
- `ingestion/product_snapshot.py` - Weekly product ingestion
- `ingestion/governance_actions.py` - Real-time action ingestion
- `main.py` - FastAPI endpoints (lines 424-602)

### Frontend
- `src/components/CogneeInsights.tsx` - Query UI component
- `src/pages/Index.tsx` - Dashboard integration

### Documentation
- `COGNEE_INTEGRATION.md` - This file
- `README.md` - Main project documentation

---

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in `cognee_*.py` files
3. Test with example queries in `cognee_query.py`
4. Check API endpoint responses for error details

---

**Last Updated:** December 27, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
