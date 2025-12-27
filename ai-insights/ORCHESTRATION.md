# AI Query Orchestration Layer

## Overview

The orchestration layer intelligently routes queries between Cognee (memory/reasoning) and RAG (retrieval) based on query intent, providing a unified interface with coherent answers and clear source attribution.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    POST /ai/query                                │
│                    (Unified Endpoint)                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Query Orchestrator                             │
│                                                                  │
│  Step 1: Intent Classification                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Historical → "Why did X happen?"                       │  │
│  │ • Causal → "What caused Y?"                              │  │
│  │ • Factual → "What is the current state of Z?"            │  │
│  │ • Mixed → "How does X compare to historical Y?"          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 2: Route to Layer(s)                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Historical/Causal → Cognee Primary                       │  │
│  │ Factual → RAG Primary (with Cognee context)              │  │
│  │ Mixed → Hybrid (both layers)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 3: Merge Results                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Coherent answer                                        │  │
│  │ • Source attribution (memory vs retrieval)               │  │
│  │ • Reasoning trace                                        │  │
│  │ • Shared context                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
┌────────────────────┐         ┌──────────────────────────┐
│  Cognee Layer      │         │    RAG Layer             │
│  (Memory)          │◀───────▶│    (Retrieval)           │
│                    │  Enrich │                          │
│  • Entity IDs      │         │  • Documents             │
│  • Historical ctx  │         │  • Chunks                │
│  • Causal chains   │         │  • Relevance scores      │
│  • Prior decisions │         │                          │
└────────────────────┘         └──────────────────────────┘
```

---

## Key Components

### 1. Query Orchestrator (`orchestrator.py`)

Main orchestration class that:
- Classifies query intent
- Routes to appropriate layer(s)
- Manages shared context
- Merges results into coherent response

### 2. Shared Context Object

Enables cross-layer communication:

```python
class SharedContext:
    entity_ids: List[str]           # Relevant entities from Cognee
    historical_context: str         # Historical background
    relevant_time_windows: List[str] # Time periods referenced
    prior_decisions: List[dict]     # Past decisions
    causal_chains: List[dict]       # Cause-effect relationships
    confidence_modifiers: dict      # Confidence adjustments
```

### 3. Intent Classification

Keyword-based classification:

| Intent | Keywords | Example |
|--------|----------|---------|
| **Historical** | "why did", "what happened", "previously", "trend" | "Why did PayLink fail in Q3?" |
| **Causal** | "caused", "because", "triggered", "led to" | "What caused the revenue miss?" |
| **Factual** | "what is", "current", "status", "list" | "What is the current status of InstantPay?" |
| **Mixed** | Combination of above | "How does Q1 compare to Q3 historically?" |

---

## Query Routing Logic

### Historical/Causal → Cognee Primary

```python
async def _cognee_primary(query, context, shared_ctx):
    # 1. Query Cognee knowledge graph
    cognee_result = await cognee.query(query)
    
    # 2. Extract entity IDs and context
    shared_ctx.add_entity_ids(cognee_result.sources)
    shared_ctx.set_historical_context(cognee_result.answer)
    
    # 3. Optionally enrich with RAG if confidence < 70%
    if cognee_result.confidence < 0.7:
        rag_context = await get_rag_context(query, shared_ctx)
        return merge_cognee_rag(cognee_result, rag_context)
    
    # 4. Return Cognee result
    return cognee_result
```

**When to use:**
- Questions about past events
- Causal relationships
- Historical trends
- "Why" and "how" questions

**Example:**
```
Query: "Why did PayLink miss its Q3 revenue target?"

Routing: Cognee Primary
Reason: Historical + causal intent

Response:
- Answer from Cognee knowledge graph
- Sources: Historical RiskSignals, GovernanceActions, Outcomes
- Reasoning: Causal chain (Dependency blocked → Action delayed → Revenue miss)
- Optional RAG enrichment if needed
```

---

### Factual → RAG Primary (with Cognee Context)

```python
async def _rag_primary(query, context, shared_ctx):
    # 1. Get relevant context from Cognee first
    cognee_context = await cognee.query(query)
    
    # 2. Extract entity IDs for RAG filtering
    shared_ctx.add_entity_ids(cognee_context.sources)
    shared_ctx.set_historical_context(cognee_context.answer)
    
    # 3. Query RAG with enriched context
    rag_result = await rag.query(query, entity_ids=shared_ctx.entity_ids)
    
    # 4. Merge RAG answer with Cognee context
    return merge_rag_with_context(rag_result, shared_ctx)
```

**When to use:**
- Current state questions
- Factual lookups
- "What is" questions
- List/show requests

**Example:**
```
Query: "What is the current readiness score for InstantPay?"

Routing: RAG Primary (with Cognee context)
Reason: Factual intent

Response:
- Answer from RAG retrieval
- Sources: Current product documents
- Context: Historical readiness trend from Cognee
- Enrichment: "Readiness improved from 45% (Q3) to 72% (current)"
```

---

### Mixed → Hybrid Approach

```python
async def _hybrid_query(query, context, shared_ctx):
    # 1. Query both layers in parallel
    cognee_result, rag_result = await asyncio.gather(
        cognee.query(query),
        rag.query(query)
    )
    
    # 2. Extract context from Cognee
    shared_ctx.add_entity_ids(cognee_result.sources)
    
    # 3. Merge both results
    merged_answer = merge_hybrid_results(
        cognee_result.answer,
        rag_result.answer,
        shared_ctx
    )
    
    # 4. Calculate combined confidence
    combined_confidence = (
        cognee_result.confidence * 0.6 +
        rag_result.confidence * 0.4
    )
    
    return merged_answer
```

**When to use:**
- Questions requiring both historical and current context
- Comparative questions
- Complex multi-faceted queries

**Example:**
```
Query: "What's blocking Q1 revenue and how does it compare to Q3?"

Routing: Hybrid
Reason: Mixed intent (current blockers + historical comparison)

Response:
- Historical perspective from Cognee
- Current state from RAG
- Sources: Both memory and retrieval
- Comparison: "Similar pattern to Q3 (Stripe blocker)"
```

---

## API Usage

### Unified Endpoint

```bash
POST /ai/query
Content-Type: application/json

{
  "query": "Why did PayLink fail in Q3?",
  "context": {
    "region": "North America",
    "user_id": "user_123"
  }
}
```

### Response Structure

```json
{
  "success": true,
  "query": "Why did PayLink fail in Q3?",
  "answer": "PayLink failed in Q3 due to...",
  "confidence": 0.88,
  "source_type": "memory",
  "sources": {
    "memory": [
      {
        "entity_type": "RiskSignal",
        "entity_id": "risk_001",
        "entity_name": "High dependency risk",
        "confidence": 0.95
      }
    ],
    "retrieval": []
  },
  "reasoning_trace": [
    {
      "step": 1,
      "action": "Classified intent as historical",
      "confidence": 1.0
    },
    {
      "step": 2,
      "action": "Queried Cognee knowledge graph",
      "confidence": 0.88
    }
  ],
  "recommended_actions": [
    {
      "action_type": "escalation",
      "tier": "steerco",
      "rationale": "Similar to Q3 pattern",
      "confidence": 0.82
    }
  ],
  "shared_context": {
    "entity_ids": ["prod_001", "risk_001"],
    "historical_context": "Q3 had similar blocker...",
    "causal_chains": [...]
  },
  "timestamp": "2025-12-27T13:30:00Z"
}
```

---

## Source Attribution

### Memory Sources (from Cognee)

```json
"sources": {
  "memory": [
    {
      "entity_type": "Product",
      "entity_id": "prod_001",
      "entity_name": "PayLink",
      "time_range": "Q3 2024",
      "confidence": 0.95
    },
    {
      "entity_type": "RiskSignal",
      "entity_id": "risk_001",
      "entity_name": "Dependency blocker",
      "time_range": "Q3 2024 Week 8",
      "confidence": 0.90
    }
  ]
}
```

### Retrieval Sources (from RAG)

```json
"sources": {
  "retrieval": [
    {
      "document_id": "doc_123",
      "chunk_id": "chunk_456",
      "content": "PayLink readiness score: 72%",
      "relevance_score": 0.85
    }
  ]
}
```

---

## Shared Context Usage

The `SharedContext` object enables Cognee to influence RAG:

### Example: Entity ID Filtering

```python
# Cognee identifies relevant entities
shared_ctx.add_entity_id("prod_001", "Product")
shared_ctx.add_entity_id("dep_stripe", "Dependency")

# RAG uses these to filter retrieval
rag_result = await rag.query(
    query,
    filter_entity_ids=shared_ctx.entity_ids
)
```

### Example: Historical Context Enrichment

```python
# Cognee provides historical context
shared_ctx.set_historical_context(
    "Q3 2024 had similar Stripe blocker that took 3 weeks to resolve"
)

# RAG includes this in answer synthesis
answer = f"Current state: {rag_answer}\n\n"
answer += f"Historical context: {shared_ctx.historical_context}"
```

---

## Benefits

### 1. Intelligent Routing
- Queries automatically go to the right layer
- No manual endpoint selection needed
- Optimal use of each layer's strengths

### 2. Cross-Layer Enrichment
- Cognee provides context for RAG queries
- RAG supplements Cognee when needed
- Shared context enables collaboration

### 3. Clear Attribution
- Sources separated by type (memory vs retrieval)
- Reasoning trace shows orchestration decisions
- Confidence scores per layer

### 4. Minimal Code Changes
- Existing endpoints unchanged
- New orchestrator layer sits on top
- Backward compatible

---

## Example Queries

### Historical Query

```
Query: "Why did we miss Q3 revenue targets?"

Intent: Historical
Routing: Cognee Primary
Sources: Memory (RiskSignals, Outcomes, Decisions)
Answer: "Q3 revenue miss was caused by Stripe integration delay (3 weeks) 
         and late escalation. Similar pattern to Q2 2024."
```

### Factual Query

```
Query: "What is the current readiness score for PayLink?"

Intent: Factual
Routing: RAG Primary (with Cognee context)
Sources: Retrieval (current documents) + Memory (historical trend)
Answer: "Current readiness: 72% (up from 45% in Q3). Improvement due to 
         resolved Stripe dependency."
```

### Mixed Query

```
Query: "What's blocking Q1 launches and how does it compare to Q3?"

Intent: Mixed
Routing: Hybrid
Sources: Both memory and retrieval
Answer: "Current blockers: Visa Direct API (2 products, $1.2M at risk).
         Historical comparison: Similar to Q3 Stripe blocker. Q3 took 
         3 weeks to resolve via executive escalation."
```

---

## Testing

### Test the Orchestrator

```bash
cd ai-insights
python orchestrator.py
```

This runs test queries demonstrating each routing type.

### Test via API

```bash
# Historical query
curl -X POST http://localhost:8001/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Why did PayLink fail in Q3?"}'

# Factual query
curl -X POST http://localhost:8001/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the current status of InstantPay?"}'

# Mixed query
curl -X POST http://localhost:8001/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is blocking Q1 and how does it compare to Q3?"}'
```

---

## Future Enhancements

### Phase 1: RAG Integration (Current)
- ✅ Intent classification
- ✅ Routing logic
- ✅ Shared context object
- ⏳ Actual RAG integration (currently placeholder)

### Phase 2: Advanced Routing
- Learn from user feedback (thumbs up/down)
- Adaptive confidence thresholds
- Query complexity scoring
- Multi-turn conversation context

### Phase 3: Performance Optimization
- Parallel query execution (asyncio.gather)
- Result caching
- Confidence-based early termination
- Smart prefetching

### Phase 4: Explainability
- Visual query flow diagrams
- Interactive reasoning traces
- "Why this routing?" explanations
- Confidence breakdown per source

---

## Architecture Decisions

### Why Keyword-Based Intent Classification?

**Pros:**
- Fast and deterministic
- No additional ML model needed
- Easy to debug and tune
- Works well for structured queries

**Cons:**
- May misclassify ambiguous queries
- Requires keyword maintenance

**Future:** Could upgrade to LLM-based classification for better accuracy.

### Why Shared Context Object?

**Pros:**
- Clean interface between layers
- Explicit data flow
- Easy to serialize for debugging
- Extensible for new context types

**Cons:**
- Adds slight overhead
- Requires careful management

**Alternative:** Direct function calls between layers (less clean).

### Why Separate Endpoints?

**Pros:**
- Backward compatible
- Direct access still available
- Gradual migration path
- Testing flexibility

**Cons:**
- More endpoints to maintain

**Decision:** Keep both unified (`/ai/query`) and direct (`/cognee/query`, `/query`) endpoints.

---

## Troubleshooting

### Issue: Wrong routing

**Symptom:** Historical query routed to RAG

**Solution:** Check intent classification keywords in `orchestrator.py`

### Issue: Low confidence

**Symptom:** Hybrid queries have confidence < 50%

**Solution:** Adjust confidence weighting in `_hybrid_query` method

### Issue: Missing context

**Symptom:** RAG doesn't use Cognee context

**Solution:** Verify `shared_ctx.entity_ids` are being extracted and passed

---

## Summary

The orchestration layer provides:
- ✅ Intelligent query routing based on intent
- ✅ Cross-layer enrichment via shared context
- ✅ Clear source attribution (memory vs retrieval)
- ✅ Minimal code changes (new layer on top)
- ✅ Backward compatible with existing endpoints
- ✅ Explainable reasoning traces

**Status:** Ready for testing and integration

**Next Steps:** 
1. Integrate actual RAG calls (replace placeholders)
2. Test with real queries
3. Tune confidence thresholds
4. Add frontend support for unified endpoint

---

**Last Updated:** December 27, 2025  
**Version:** 1.0.0  
**Status:** Production Ready (pending RAG integration)
