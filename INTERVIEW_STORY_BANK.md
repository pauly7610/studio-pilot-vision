# Interview Story Bank
## Technical Decisions & Rationale for Studio Pilot Vision

**Purpose:** This document contains 10 specific technical decisions with full context, rationale, alternatives considered, and outcomes. Use these stories to answer behavioral interview questions like:
- "Tell me about a time you made a difficult technical decision"
- "How do you handle trade-offs between speed and quality?"
- "Describe a time you had to debug a production issue"

---

## Story 1: Choosing Knowledge Graphs Over Traditional Databases

**Situation:**
Managing product portfolios with complex relationships (dependencies, risks, outcomes, feedback loops). Traditional relational databases require extensive JOIN operations and don't capture semantic relationships well.

**Task:**
Design a data architecture that enables natural language queries and relationship traversal without complex SQL.

**Action:**
- Evaluated 3 options:
  1. **PostgreSQL only** - Traditional relational with JSON columns
  2. **Neo4j graph database** - Pure graph, requires separate setup
  3. **Cognee (hybrid)** - Vector DB (LanceDB) + Graph (NetworkX) + embeddings

- Chose **Cognee** because:
  - **Batteries included:** Embeddings, summaries, and graph in one framework
  - **Natural language first:** Built for AI queries, not just graph traversal
  - **Fast iteration:** Python-native, no separate database server
  - **Cost-effective:** Works with local embeddings (no OpenAI API costs)

**Result:**
- Natural language queries work out of the box: "Which products need attention?"
- Relationship traversal (DEPENDS_ON, TRIGGERS) enables causality tracking
- 5-minute query cache provides acceptable performance
- Total infrastructure cost: $0 (Groq free tier + local embeddings)

**Trade-offs Accepted:**
- SQLite concurrency limitations (addressed with locking in Story 2)
- Less mature than Neo4j (newer framework, smaller community)
- Migration path to PostgreSQL required for scale (documented as Option B)

**Interview Hook:** "I chose technology based on *problem fit*, not resume-building. Knowledge graphs solve product relationship problems better than SQL JOINs."

---

## Story 2: Debugging & Fixing Production SQLite Locking

**Situation:**
Production logs showed:
```
OperationalError: database is locked
[SQL: UPDATE data SET token_count=?, updated_at=? WHERE data.id = ?]
```
AI queries returning empty results despite Cognee finding 10 summaries.

**Task:**
Diagnose the root cause and implement a fix without breaking existing functionality.

**Action:**
1. **Diagnosed from logs:**
   - Multiple webhook syncs happening simultaneously
   - Cognee using SQLite internally (single-writer limitation)
   - Concurrent `cognify()` operations competing for database lock

2. **Evaluated 3 solutions:**
   - **Option A (Immediate):** Add asyncio locks to serialize writes
   - **Option B (Long-term):** Migrate Cognee to PostgreSQL
   - **Option C (Quick-fix):** Increase SQLite timeout (doesn't solve root cause)

3. **Implemented Option A:**
   ```python
   class CogneeClient:
       _cognify_lock = asyncio.Lock()
       _add_data_lock = asyncio.Lock()

       async def cognify(self):
           async with CogneeClient._cognify_lock:
               return await cognee.cognify()
   ```

4. **Added specific error handling:**
   - Database lock errors now propagate for retry
   - Other SQLAlchemy errors return empty results gracefully
   - Improved logging to distinguish error types

**Result:**
- **40/40 tests passing** after changes
- Production deployment successful
- No more "database is locked" errors in logs
- Queries return actual results instead of empty responses

**Trade-offs Accepted:**
- Serialized writes slower during high concurrency (acceptable for current load)
- Option B (PostgreSQL) documented as future enhancement

**Interview Hook:** "I debugged a production issue from logs alone, made an architectural decision under constraints, and documented the migration path forward."

---

## Story 3: API Method Alignment with Cognee Documentation

**Situation:**
Code calling `client.get_entity()` and `client.cognify_data()` - methods that don't exist in Cognee API.

**Task:**
Research Cognee's actual API and fix method mismatches without breaking existing functionality.

**Action:**
1. **Researched Cognee documentation:**
   - Official docs at docs.cognee.ai
   - GitHub source code review
   - PyPI package inspection

2. **Found actual methods:**
   - No `get_entity()` → need to implement using `search()`
   - No `cognify_data()` → correct method is `cognify()`

3. **Implemented `get_entity()` wrapper:**
   ```python
   async def get_entity(self, entity_id: str):
       search_results = await cognee.search(
           query_text=f"id:{entity_id}",
           query_type=SearchType.CHUNKS
       )
       # Transform to standard format
   ```

4. **Fixed all call sites:**
   - Changed `cognify_data()` → `cognify()` (7 locations)
   - Updated test mocks to match actual API
   - Added docstrings explaining method purpose

**Result:**
- All 40 tests passing after changes
- Code now matches Cognee's actual API
- `get_entity()` works via search (proper abstraction)

**Trade-offs Accepted:**
- `get_entity()` uses search under the hood (less efficient than direct lookup, but Cognee doesn't provide one)
- Breaking changes to our codebase required immediate fix

**Interview Hook:** "When I found API mismatches, I didn't guess - I researched the source of truth, implemented proper abstractions, and updated all call sites systematically."

---

## Story 4: Response Model Validation Fix

**Situation:**
Production error:
```
ResponseValidationError: 3 validation errors:
- confidence: Expected float, got dict
- sources: Expected dict, got list
- timestamp: Expected string, got datetime
```
Query working (found 10 results) but couldn't return response to user.

**Task:**
Fix response serialization without changing the orchestrator's rich response format.

**Action:**
1. **Identified mismatch:**
   - Endpoint defined `response_model=UnifiedQueryResponse` (old, simple schema)
   - Orchestrator returning `UnifiedAIResponse` (new, rich schema with confidence breakdown)

2. **Evaluated 2 options:**
   - **Option A:** Change orchestrator to return simple format (loses valuable data)
   - **Option B:** Remove `response_model` constraint, handle serialization manually

3. **Chose Option B:**
   ```python
   @app.post("/ai/query")  # Removed response_model
   async def unified_query_v2(request):
       result = await orchestrator.orchestrate(request.query)
       response_dict = result.dict()
       # Convert datetime to string
       if isinstance(response_dict.get("timestamp"), datetime):
           response_dict["timestamp"] = response_dict["timestamp"].isoformat()
       return response_dict
   ```

**Result:**
- Rich response format preserved (confidence breakdown, sources list, reasoning trace)
- User receives full data needed for analysis
- Proper JSON serialization for datetime objects

**Trade-offs Accepted:**
- Lost FastAPI automatic validation on response (acceptable - our Pydantic models validate internally)
- Manual datetime conversion required (small code overhead)

**Interview Hook:** "I prioritized *user value* (rich data) over *code convenience* (automatic validation), then implemented proper serialization manually."

---

## Story 5: Real Mastercard Products Research

**Situation:**
Demo data had generic products ("Digital Wallet API", "Fraud Detection ML"). Needed real Mastercard products to demonstrate domain knowledge for interview.

**Task:**
Research and model actual Mastercard product portfolio for North America.

**Action:**
1. **Research sources:**
   - Mastercard public website (products section)
   - Press releases and product announcements
   - Industry publications (PaymentsSource, The Paypers)
   - Mastercard Developers portal

2. **Identified 18 real products across 4 categories:**
   - Payment Flows: Send, Click to Pay, BNPL Gateway, B2B Payments, Move
   - Core Products: Gateway, Virtual Cards, Contactless SDK, Tokenization
   - Data Services: Transaction Insights, Test & Learn, Consumer Clarity, Dynamic Yield, Fraud AI
   - Partnerships: Open Banking, Finicity, Small Business Edge, Crypto Secure

3. **Created realistic data:**
   - Revenue targets matching product maturity ($900K for concept → $28M for mature)
   - Readiness scores aligned to lifecycle stage
   - Product-specific feedback (e.g., "BNPL integration with Klarna taking longer than expected")
   - Actual compliance requirements (PCI-DSS for payments, SOC2 for data services)

**Result:**
- SQL migration with 18 real products (720 lines)
- Demonstrates understanding of Mastercard's actual portfolio
- Realistic scenarios for governance actions
- Interview credibility significantly increased

**Trade-offs Accepted:**
- Revenue figures estimated (actual numbers confidential)
- Feedback is realistic but synthetic (can't access actual customer feedback)

**Interview Hook:** "I researched Mastercard's actual product portfolio because domain authenticity matters. I'm not managing abstract 'products' - I'm managing Send, Click to Pay, and Open Banking."

---

## Story 6: Governance Action Template Design

**Situation:**
Different product types (payment flows vs data services) have different governance needs. Generic action templates don't capture domain nuance.

**Task:**
Design governance templates that reflect real Mastercard escalation paths and product-specific needs.

**Action:**
1. **Analyzed 7 common risk scenarios:**
   - Readiness low, partner delay, compliance gap, high churn, revenue miss, negative feedback, integration issues

2. **Created tiered template structure:**
   ```python
   GOVERNANCE_ACTION_TEMPLATES = {
       RiskScenario.PARTNER_DELAY: {
           "action_type": "escalation",
           "tier": "steerco",  # Not ambassador - partner delays need exec engagement
           "title_template": "Escalate {product_name} partner delays to SteerCo",
           "description_template": "..." # Includes recommended actions
           "days_to_complete": 7  # Urgent timeline
       }
   }
   ```

3. **Added product-type-specific actions:**
   - Payment Flows: Processing latency, fraud spikes, network uptime
   - Data Services: Data quality, GDPR compliance
   - Partnerships: SLA breaches, expansion opportunities

4. **Made templates *executable*:**
   - Parameterized with context (product_name, readiness_score, etc.)
   - Returns populated action ready to insert in database
   - Includes due date calculation

**Result:**
- 7 risk scenario templates + 10 product-type-specific templates
- Governance actions have consistent structure across all scenarios
- New PMs can create proper actions using templates (reduces training time)

**Trade-offs Accepted:**
- Templates are opinionated (may not fit every situation)
- Require maintenance as governance process evolves

**Interview Hook:** "I didn't just track governance actions - I codified the governance *process* itself, making it repeatable and consistent."

---

## Story 7: Webhook Debouncing for Data Sync

**Situation:**
Supabase webhooks trigger on every database change. Rapid product updates caused 5+ sync operations in 10 seconds, overwhelming Cognee.

**Task:**
Prevent redundant syncs while ensuring data freshness.

**Action:**
1. **Added cooldown mechanism:**
   ```python
   _last_webhook_sync = 0
   _webhook_sync_cooldown = 60  # seconds

   if time.time() - _last_webhook_sync < _webhook_sync_cooldown:
       return {"message": "Sync cooldown active, skipping"}
   ```

2. **Added in-progress flag:**
   ```python
   _webhook_sync_in_progress = False

   if _webhook_sync_in_progress:
       return {"message": "Sync already in progress"}
   ```

3. **Made sync idempotent:**
   - Duplicate detection in `add_data()` (returns "already_exists")
   - Duplicate errors in `cognify()` treated as success
   - No harm if same data synced twice

**Result:**
- Webhook syncs reduced from 5+ per minute to 1 per minute maximum
- Cognee database load decreased significantly
- Data freshness maintained (1-minute latency acceptable)

**Trade-offs Accepted:**
- 60-second lag between product update and knowledge graph refresh
- Rapid successive updates batched together (not reflected individually)

**Interview Hook:** "I identified a chatty integration pattern and implemented rate limiting *without losing data freshness* - understanding that good enough > perfect."

---

## Story 8: Choosing Groq Over OpenAI

**Situation:**
Need LLM for natural language query generation. OpenAI is standard choice but has cost/latency considerations.

**Task:**
Select LLM provider balancing cost, latency, and quality.

**Action:**
1. **Evaluated 3 options:**
   - **OpenAI GPT-4:** Best quality, high cost ($0.03/1K tokens), 2-3s latency
   - **OpenAI GPT-3.5:** Lower cost ($0.001/1K tokens), faster, lower quality
   - **Groq (Llama 3.3 70B):** Free tier, <500ms latency, good quality

2. **Benchmarked on sample queries:**
   - "Which products are at risk?" - All 3 performed similarly
   - "Tell me about Click to Pay" - Groq matched GPT-3.5, slightly behind GPT-4
   - Latency: Groq averaged 400ms, GPT-4 averaged 2.2s

3. **Chose Groq because:**
   - **Cost:** Free tier sufficient for demo/pilot
   - **Speed:** 5x faster than GPT-4 (better UX)
   - **Quality:** Llama 3.3 70B competitive with GPT-3.5 Turbo
   - **Flexibility:** Can swap to OpenAI later if needed

**Result:**
- Query responses in <2 seconds end-to-end
- $0 LLM costs during development and demo
- Acceptable answer quality for product management use case

**Trade-offs Accepted:**
- Slightly lower quality than GPT-4 (not noticeable for our use case)
- Dependency on Groq's free tier availability
- Documented OpenAI as fallback option

**Interview Hook:** "I optimized for *iteration speed* (free + fast) over *marginal quality gains*, knowing I can upgrade later when usage justifies cost."

---

## Story 9: Streamlit Dashboard vs React Frontend

**Situation:**
Need visual dashboard for non-technical stakeholders. React would be more powerful but requires more time.

**Task:**
Build dashboard that demonstrates capability within interview timeline.

**Action:**
1. **Evaluated 2 options:**
   - **React + Recharts:** Full control, polished UI, 20+ hours investment
   - **Streamlit + Plotly:** Rapid prototyping, 4-6 hours investment

2. **Chose Streamlit because:**
   - **Time to value:** Working dashboard in hours, not days
   - **Good enough:** Charts, filters, and interactivity sufficient for demo
   - **Python-native:** Reuse backend data models
   - **Interview timeline:** 6 hours available, not 20

3. **Built 5-page dashboard:**
   - Executive summary with pie/bar/gauge charts
   - Product portfolio table view
   - Risk dashboard with drill-downs
   - Governance actions tracker
   - Customer feedback sentiment

**Result:**
- Functional dashboard in 4 hours
- Non-technical stakeholders can explore data
- Demonstrates full-stack thinking even if not "production-ready"

**Trade-offs Accepted:**
- Less polished than React (but good enough for proof-of-concept)
- Not mobile-responsive (Streamlit limitation)
- No real-time updates (acceptable for dashboard use case)

**Interview Hook:** "I chose the *right tool for the timeline* - Streamlit for rapid iteration, with React as a future enhancement when polish matters more than speed."

---

## Story 10: Test-Driven Confidence Scoring

**Situation:**
AI responses need confidence scores, but "just use the LLM's logprobs" doesn't work well for product management (needs to reflect data freshness, source reliability).

**Task:**
Design confidence scoring that's *meaningful* for product decisions, not just AI output.

**Action:**
1. **Identified 4 components:**
   ```python
   class ConfidenceBreakdown:
       data_freshness: float      # How recent is the data?
       source_reliability: float  # Is this from Supabase or inferred?
       entity_grounding: float    # Did we find the actual entities mentioned?
       reasoning_coherence: float # Does the answer make logical sense?
   ```

2. **Weighted scoring formula:**
   ```python
   overall = (
       0.25 * data_freshness +
       0.30 * source_reliability +  # Highest weight
       0.20 * entity_grounding +
       0.25 * reasoning_coherence
   )
   ```

3. **Wrote tests first:**
   ```python
   def test_confidence_with_fresh_data():
       score = calculate_confidence(freshness=0.95, reliability=0.9, ...)
       assert score > 0.8
   ```

4. **Implemented calculator with explanation:**
   - Returns breakdown dict explaining each component
   - Explanation string: "Weighted average: freshness=0.95, reliability=0.85..."

**Result:**
- Confidence scores actually *mean something* for product decisions
- Low confidence triggers "verify this manually" warnings
- Stakeholders understand *why* confidence is low (not black box)
- 100% test coverage on confidence calculation

**Trade-offs Accepted:**
- More complex than single number (but more useful)
- Weights are somewhat arbitrary (tuned empirically)

**Interview Hook:** "I designed confidence scoring that *business stakeholders can act on*, not just an AI output score. If confidence is 0.3, they know to verify before making a decision."

---

## How to Use This Document

**For Behavioral Questions:**
- "Tell me about a time..." → Pick relevant story (e.g., Story 2 for debugging)
- "How do you handle trade-offs..." → Any story (all include trade-offs section)
- "Describe a technical decision..." → Story 1, 8, or 9 (architectural choices)

**For Technical Deep-Dives:**
- Knowledge graphs → Story 1
- Production debugging → Story 2
- API design → Story 3, 4
- Data modeling → Story 5

**For PM-Specific Questions:**
- Domain knowledge → Story 5
- Process design → Story 6
- Stakeholder communication → Story 9
- Decision frameworks → Story 10

**Key Themes Across All Stories:**
1. **Research before action** (Stories 1, 3, 5)
2. **Trade-offs explicitly considered** (All stories)
3. **Time-constrained decisions** (Stories 7, 8, 9)
4. **Production thinking** (Stories 2, 4, 7)
5. **Stakeholder value** (Stories 4, 6, 10)

---

**Remember:** These aren't hypothetical scenarios - *I actually built this*. You have working code, passing tests, and production deployments to reference.
