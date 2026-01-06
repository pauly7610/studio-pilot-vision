# Studio Pilot Vision - Interview Demo Script
## 5-Minute Technical Demonstration

**By Paul Campbell | For Manager, Product Management, Studio Ambassador Role**

---

## PRE-DEMO SETUP (Do Before Interview)

### 1. Verify API is Running
```bash
# Check production API
curl https://studio-pilot-vision.onrender.com/health

# Expected response: {"status": "healthy"}
```

### 2. Launch Streamlit Dashboard
```bash
cd ai-insights
export API_BASE_URL=https://studio-pilot-vision.onrender.com
streamlit run streamlit_dashboard.py
```

### 3. Have These Browser Tabs Open
- Tab 1: Streamlit Dashboard (http://localhost:8501)
- Tab 2: API Documentation (https://studio-pilot-vision.onrender.com/docs)
- Tab 3: Frontend (https://studio-pilot-vision.lovable.app)
- Tab 4: INTERVIEW_ONE_PAGER.md (as reference)

---

## DEMO FLOW (5 Minutes)

### **Opening (30 seconds)**
*"I didn't just apply for the Studio Ambassador role - I built the system I'd use to excel in it. Let me show you Studio Pilot Vision, an AI-powered portfolio management system for the exact products you manage at Mastercard."*

---

### **Part 1: The Problem (30 seconds)**
*Share screen showing Streamlit Dashboard - Executive Summary page*

**Say:**
- "Studio Ambassadors manage 18+ products across lifecycle stages"
- "Each product has dependencies, risks, compliance requirements, governance escalations"
- "Traditional approach: spreadsheets, manual tracking, reactive governance"
- "I built an AI system that automates this entire workflow"

**Show:** Executive Summary dashboard with live metrics

---

### **Part 2: Real Mastercard Products (60 seconds)**
*Navigate to Product Portfolio page*

**Say:**
- "These are 18 **real** Mastercard products I researched"
- "Send, Click to Pay, BNPL, Open Banking, Fraud AI, Tokenization, etc."
- "Each with realistic revenue targets, readiness scores, risk bands"

**Highlight:**
- "This isn't generic demo data - I studied your actual portfolio"
- "Shows domain depth and understanding of the North America payment ecosystem"

**Show:**
- Scroll through product list
- Point to specific products: "Click to Pay - $8.7M target, 83% readiness"

---

### **Part 3: Natural Language Queries (90 seconds)**
*Switch to API Documentation tab → Try the `/ai/query` endpoint*

**Say:** "The system uses a knowledge graph + AI to answer natural language questions about the portfolio."

**Demo Query 1: Risk Identification**
```
Query: "Which products are at high risk?"
```

**Expected Response:**
- 3 products in high-risk band
- Open Banking Connect ($3.1M revenue at risk) - partner delays exceeding 6 months
- Small Business Edge ($1.65M) - 8.5% churn rate
- Crypto Secure ($900K) - concept stage, readiness 16%

**Say:** "This proactively identifies risk instead of waiting for fire-drills"

**Demo Query 2: Product Deep-Dive**
```
Query: "Tell me about Click to Pay"
```

**Expected Response:**
- Scaling payment flow, $8.7M target
- 83% readiness (compliance complete, 85% sales training)
- Positive feedback: "One-click checkout reduced cart abandonment significantly"
- Recommendation: Simplify enrollment UX for 55+ demographic

**Say:** "Combines data from multiple sources - readiness, feedback, compliance - in one query"

**Demo Query 3: Action Items**
```
Query: "What needs immediate attention?"
```

**Expected Response:**
- 3 high-priority pending actions
- Escalate Open Banking delays to SteerCo
- Review Small Business Edge value proposition
- Address BNPL API documentation gaps

**Say:** "This becomes my daily standup - what's critical today?"

---

### **Part 4: Technical Architecture (60 seconds)**
*Switch to API docs showing endpoints*

**Say:** "Under the hood, this is production-ready infrastructure"

**Highlight:**
- **FastAPI backend** - 40/40 tests passing, deployed on Render
- **Cognee knowledge graph** - Vector DB + Graph DB for relationship tracking
- **Supabase PostgreSQL** - Products, feedback, actions with real-time webhooks
- **Groq LLM** - Llama 3.3 70B for natural language processing
- **Streamlit dashboard** - 5-page executive interface

**Technical credibility points:**
- "I debugged production SQLite locking errors from logs alone"
- "Fixed API validation errors by researching Cognee's source code"
- "Implemented webhook debouncing to prevent database overload"
- "All documented in my INTERVIEW_STORY_BANK.md with 10 technical decision stories"

---

### **Part 5: Governance Templates (45 seconds)**
*Switch back to Streamlit → Governance Actions page*

**Say:** "I didn't just track governance - I codified the governance **process** itself"

**Show:** Example governance action card
- "Escalate Open Banking partnership delays to SteerCo"
- Priority: High | Tier: SteerCo | Status: Pending
- Due date: 2025-01-15

**Highlight:**
- "7 risk scenario templates - readiness gaps, partner delays, compliance, churn, etc."
- "Product-type-specific actions for payment flows vs data services vs partnerships"
- "Escalation paths matching real Mastercard tiers: Ambassador → SteerCo → Critical"

**Say:** "New PMs can use these templates - reduces training time and ensures consistency"

---

### **Closing (30 seconds)**

*Switch to INTERVIEW_ONE_PAGER.md*

**Say:**
- "Most candidates arrive with a resume and talking points"
- "I'm arriving with a working system solving the exact problems you face"
- "This demonstrates technical depth, PM strategic thinking, and execution at scale"
- "I didn't just apply for the Studio Ambassador role - I demonstrated how I'd revolutionize it"

**Hand them:** INTERVIEW_ONE_PAGER.md (leave-behind document)

---

## KEY TALKING POINTS TO WEAVE IN

### Domain Knowledge
- "I researched Mastercard's actual product portfolio - Send, Click to Pay, BNPL"
- "Realistic revenue targets, readiness criteria, compliance requirements"
- "Product-specific governance templates aligned to payment/data/partnership needs"

### Technical Depth
- "40/40 tests passing with 90%+ coverage"
- "Debugged production SQLite concurrency issues using asyncio locks"
- "Fixed API validation errors by researching Cognee's source code"
- "Implemented webhook debouncing to prevent database overload"

### PM Strategic Thinking
- "Knowledge graphs fundamentally better for product relationships than spreadsheets"
- "Natural language replaces manual report generation"
- "Automated risk detection replaces reactive interventions"
- "10x faster executive reporting - API call instead of PowerPoint assembly"

### Execution at Scale
- "Deployed on Render with auto-deploy from GitHub"
- "Error handling, caching strategies (5-min TTL), graceful degradation"
- "Handles 18 products today, could handle 180 with same architecture"
- "Documented migration path to PostgreSQL for enterprise scale"

### Business Impact
- **Time savings:** 8-10 hours/week on reporting and manual tracking
- **Revenue impact:** Earlier risk detection → faster interventions → reduced revenue at risk
- **Stakeholder value:** Executive summary API, Streamlit dashboard, governance templates

---

## BACKUP DEMOS (If Extra Time)

### Customer Feedback Loop
*Navigate to Customer Feedback page*
- Show sentiment analysis with theme extraction
- Example: BNPL feedback (-0.55 sentiment) "Integration with Klarna taking longer than expected"
- Example: Fraud AI feedback (+0.98 sentiment) "Reduced fraud losses by 63%"

### Executive Summary API
*Show `/api/reports/executive-summary` response*
- One-call portfolio snapshot
- Automated alerts for high-priority actions
- Revenue at risk calculations
- Sentiment aggregation across all products

---

## OBJECTION HANDLING

### "Why not just use spreadsheets?"
- "Spreadsheets don't capture relationships - dependencies, causality, feedback loops"
- "Knowledge graphs enable natural language queries: 'Which products need attention?'"
- "Automated risk detection vs manual scanning of 18+ product rows"

### "Why not a commercial tool like Jira/Confluence?"
- "Generic tools don't understand product management domain"
- "No natural language query capability"
- "I built exactly what a Studio Ambassador needs - not a one-size-fits-all platform"

### "How long did this take?"
- "Core system: 2 weeks part-time (backend + AI integration)"
- "Real Mastercard research: 1 day"
- "Dashboard + interview prep: 2 days"
- "Total: ~3 weeks, demonstrating rapid iteration and shipping velocity"

### "Is this production-ready?"
- "Yes - 40/40 tests passing, deployed on Render, error handling, caching"
- "Documented migration path to PostgreSQL for enterprise scale"
- "Would require multi-tenant support and SSO for full production deployment"

---

## TECHNICAL QUESTIONS TO PREPARE FOR

### "How does the knowledge graph work?"
- "Cognee uses LanceDB (vector DB) + NetworkX (graph DB)"
- "Entities: Products, Risks, Dependencies, Actions, Outcomes, Feedback"
- "Relationships: HAS_RISK, DEPENDS_ON, TRIGGERS, RESULTS_IN, RECEIVES"
- "Hybrid retrieval: Vector similarity + graph traversal for context"

### "Why Groq instead of OpenAI?"
- "Cost: Free tier vs $0.03/1K tokens for GPT-4"
- "Speed: <500ms vs 2-3s latency (better UX)"
- "Quality: Llama 3.3 70B competitive with GPT-3.5 for our use case"
- "Flexibility: Can swap to OpenAI if needed"

### "How do you handle concurrency?"
- "SQLite single-writer limitation caused database locking"
- "Implemented asyncio locks to serialize writes"
- "Documented PostgreSQL migration as Option B for scale"

### "What's the testing strategy?"
- "40 tests across ingestion, orchestration, API endpoints"
- "Unit tests for core logic, integration tests for API"
- "Mocking Cognee/Supabase for isolated testing"
- "90%+ coverage on critical paths"

---

## POST-DEMO FOLLOW-UP

### If they want to try it themselves:
1. Send them the GitHub repo link
2. Point them to the README for setup instructions
3. Offer to do a technical deep-dive session

### If they want to discuss specific features:
- Reference INTERVIEW_STORY_BANK.md for detailed technical decisions
- Reference INTERVIEW_ONE_PAGER.md for business impact metrics

### If they want to see the code:
- Start with `ai-insights/main.py` (FastAPI endpoints)
- Show `cognee_client.py` (knowledge graph integration)
- Show `governance_action_templates.py` (governance automation)

---

## CONFIDENCE BOOSTERS

**You researched actual Mastercard products** - not generic demos
**You debugged production issues from logs** - shows senior-level debugging skills
**You made architectural decisions under constraints** - SQLite locks, API mismatches
**You documented everything** - README, one-pager, story bank, demo script
**You shipped a working system** - not just slides, not just ideas

**You're not a candidate hoping to get the role - you're demonstrating you're already operating at the level required.**

---

## FINAL CHECKLIST

Before starting demo:
- [ ] API health check passed
- [ ] Streamlit dashboard running locally
- [ ] All browser tabs open (Dashboard, API docs, Frontend, One-pager)
- [ ] INTERVIEW_ONE_PAGER.md printed or ready to share
- [ ] Practiced demo flow at least once
- [ ] Reviewed INTERVIEW_STORY_BANK.md for technical questions

**Duration Target:** 5-7 minutes for core demo, 10-15 with Q&A

**Remember:** You built this. You understand every line of code. You made every technical decision. You're not pitching a vision - you're demonstrating a reality.

---

*Good luck! You've got this. 🚀*
