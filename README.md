# Mastercard Studio Intelligence Platform (MSIP)

**Predictive Portfolio Intelligence for North America**

A comprehensive product portfolio command center that provides AI-driven decision intelligence for managing products across their lifecycle—from concept to commercial scaling and sunset at Mastercard.

### 🔗 [Live Demo → studio-pilot-vision.lovable.app](https://studio-pilot-vision.lovable.app/) | [AI Backend → studio-pilot-vision.onrender.com](https://studio-pilot-vision.onrender.com/)

---

## Screenshots

<details>
<summary><b>📊 Portfolio Dashboard</b></summary>

![Portfolio Snapshot](public/1.png)
*Portfolio metrics with revenue, active products, success rate, and risk indicators*

![Revenue vs Risk Analysis](public/2.png)
*Interactive scatter plot showing commercial value vs execution risk*
</details>

<details>
<summary><b>📋 Actions & Governance</b></summary>

![Actions Tracker](public/3.png)
*Portfolio action tracker with governance rules and auto-flagging*

![Evidence-Based Scaling](public/4.png)
*Scaling decisions backed by market evidence data*
</details>

<details>
<summary><b>🌍 Regional & Feedback</b></summary>

![Regional Performance](public/5.png)
*Geographic distribution and regional revenue targets*

![Feedback Intelligence](public/6.png)
*Customer feedback loop with sentiment analysis and theme clustering*
</details>

<details>
<summary><b>📈 Analytics & AI Insights</b></summary>

![Advanced Analytics](public/7.png)
*Readiness score distribution and lifecycle stage breakdown*

![AI Insights Panel](public/8.png)
*RAG-powered AI insights with natural language queries*

![AI Query Interface](public/9.png)
*Ask questions like "What's blocking our Q1 launches?"*

![Jira CSV Upload](public/10.png)
*Background batch processing for Jira data ingestion*
</details>

---

## 🚀 Quick Start

```bash
# Frontend
npm install && npm run dev

# AI Insights Service (separate terminal)
cd ai-insights
pip install -r requirements.txt
python main.py

# Backend (optional - Supabase handles most data)
cd backend && go run main.go
```

**Prerequisites**: Node.js 18+, Python 3.11+, Go 1.21+ (optional)

---

## Why This Exists

This prototype demonstrates the **Visibility Foundation** phase of the 90-day roadmap. It solves for the ambiguity mentioned in the current state by providing:

- **Quantifiable Pipeline Health Metrics** — Real-time RAG status with momentum indicators that show whether a project is "Amber but improving" vs "Amber and declining"
- **Automated Escalation Triggers** — Three-Tier Governance Model integration that auto-escalates stuck projects to Ambassador Deep Dive, Exec SteerCo, or Critical Intervention based on cycles in status
- **Standardized Transition Checklist** — Asset Transition Package for Foundry-to-BAU handovers covering Sales (Pitch Decks/FAQs), Tech (API Docs/Security Certs), and Ops (Support SOPs)
- **Dependency Visibility** — External "Partner Rail" blockers clearly identified so executives can have peer-to-peer conversations with partners rather than burdening regional PMs
- **Data Contract Compliance** — "Central Sync Complete" badges reduce admin burden on Regional Leads by providing a single source of truth
- **AI-Powered Insights** — RAG pipeline that answers questions like "What's blocking our Q1 launches?" by synthesizing across all product data

### The Problem It Solves

| Current State | MSIP Solution |
|--------------|---------------|
| Ad-hoc status requests from Global HQ | Self-service dashboard with Data Freshness indicators |
| Unclear if delays are internal vs external | Dependency badges show "Blocked by: External Rail (Stripe)" |
| No accountability for stuck projects | Auto-triggered escalation paths with named owners |
| Inconsistent Foundry-to-BAU handovers | Standardized transition checklist with progress tracking |
| Snapshot views only | Momentum indicators show velocity and trend direction |
| Manual status aggregation | AI Insights synthesize portfolio health automatically |

### 90-Day Roadmap Alignment

This prototype targets **February 3, 2025** commencement with the APAC-Singapore pilot region, demonstrating zero-day velocity readiness with pre-populated data from a Key Partner Region.

---

## Overview

MSIP enables product leaders to:
- **Monitor** portfolio health with real-time risk heatmaps and readiness scores
- **Analyze** feedback intelligence with sentiment analysis and theme extraction
- **Predict** product success using ML-based probability scoring
- **Act** on data-driven recommendations with integrated action tracking
- **Scale** products confidently with evidence-based scaling frameworks
- **Ask AI** natural language questions about portfolio status via RAG pipeline

## Project Structure

```
studio-pilot-vision/
├── src/                    # React frontend application
│   ├── components/         # UI components (80+ components)
│   ├── hooks/              # Custom React hooks (9 hooks)
│   ├── pages/              # Page components
│   ├── lib/                # Utility functions
│   └── integrations/       # Supabase client & types
├── ai-insights/            # Python AI/RAG service
│   ├── main.py             # FastAPI server
│   ├── embeddings.py       # Binary embeddings
│   ├── vector_store.py     # ChromaDB integration
│   ├── retrieval.py        # RAG retrieval pipeline
│   ├── generator.py        # Groq LLM generation
│   ├── jira_parser.py      # Jira CSV ingestion
│   └── k8s/                # Kubernetes manifests
├── backend/                # Go API server
│   ├── handlers/           # HTTP request handlers
│   ├── models/             # Data models
│   ├── routes/             # API route definitions
│   ├── middleware/         # Auth & CORS middleware
│   └── database/           # Database connection
├── supabase/               # Database migrations
└── public/                 # Static assets
```

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Routing**: React Router v6

### AI Insights Service
- **Framework**: FastAPI + Python 3.11
- **Vector Database**: ChromaDB (cross-platform)
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **LLM**: Groq API (Llama 3.3 70B)
- **Document Processing**: LlamaIndex

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (for AI Insights)
- Go 1.21+ (optional, for backend)
- Supabase account (or PostgreSQL 14+)

### Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Supabase credentials

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`

### AI Insights Service Setup

```bash
cd ai-insights

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
echo "GROQ_API_KEY=your_groq_api_key" > .env

# Run the service
python main.py
```

AI service runs at `http://localhost:8001`

### Backend Setup (Optional)

```bash
cd backend

# Install Go dependencies
go mod tidy

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run the server
go run main.go
```

Backend API runs at `http://localhost:8080`

## Features

### Dashboard Views
- **Portfolio Snapshot** — Key metrics at a glance
- **Risk Heatmap** — Visual risk assessment by lifecycle stage
- **Executive Brief** — AI-generated insights and recommendations

### Product Management
- **Product Cards** — Detailed product views with readiness scores
- **Comparison Mode** — Side-by-side product comparison (up to 3)
- **Filtering** — By type, lifecycle, risk band, region, governance tier

### Analytics
- **Feedback Intelligence** — Sentiment analysis and theme clustering
- **Regional Performance** — Geographic breakdown
- **Historical Trends** — Time-series analysis
- **What-If Simulator** — Scenario modeling

### Action Tracking
- **Portfolio Actions** — Centralized action management
- **Governance Rules** — Compliance monitoring
- **Evidence-Based Scaling** — Data-driven scaling decisions

### AI Insights (RAG Pipeline)
- **Natural Language Queries** — Ask "What's blocking our Q1 launches?"
- **Product Insights** — Executive summaries, risk analysis, recommendations
- **Portfolio Analysis** — Cross-product synthesis
- **Jira CSV Import** — Upload Jira exports for work status tracking
- **Background Processing** — Batch jobs with progress tracking

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/products` | List all products with relationships |
| `GET /api/v1/products/:id` | Get product details |
| `GET /api/v1/products/:id/metrics` | Product time-series metrics |
| `GET /api/v1/products/:id/feedback` | Product feedback entries |
| `GET /api/v1/actions` | List all actions |
| `POST /api/v1/actions` | Create new action |
| `GET /api/v1/feedback/summary` | Aggregated feedback stats |

See `backend/README.md` for complete API documentation.

## Database Schema

### Core Tables
- **products** — Product master data
- **product_readiness** — Readiness scores and risk bands
- **product_metrics** — Time-series performance data
- **product_compliance** — Certification tracking
- **product_partners** — Partner integrations
- **product_feedback** — Customer feedback with sentiment
- **product_predictions** — ML prediction scores
- **product_actions** — Action items and tracking
- **sales_training** — Training coverage metrics
- **profiles** — User profiles and roles

### Enums
- **lifecycle_stage**: concept, early_pilot, pilot, commercial, sunset
- **product_type**: data_services, payment_flows, core_products, partnerships
- **risk_band**: low, medium, high
- **user_role**: vp_product, studio_ambassador, regional_lead, sales, partner_ops, viewer

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_AI_INSIGHTS_URL=http://localhost:8001  # or https://your-render-url.onrender.com
```

### AI Insights (.env)
```env
GROQ_API_KEY=your-groq-api-key
```

### Backend (.env)
```env
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## Deployment

### Live Deployment
| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Lovable | [studio-pilot-vision.lovable.app](https://studio-pilot-vision.lovable.app/) |
| AI Backend | Render | [studio-pilot-vision.onrender.com](https://studio-pilot-vision.onrender.com/) |
| Database | Supabase | PostgreSQL with RLS |

### Frontend (Lovable)
Connected to GitHub for auto-deploy on push. Set environment variables in Lovable dashboard.

### AI Backend (Render)
```yaml
# render.yaml in ai-insights/
services:
  - type: web
    name: studio-pilot-ai
    runtime: python
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GROQ_API_KEY
        sync: false
```

### Self-Hosted
```bash
# Frontend
npm run build
# Deploy dist/ folder

# AI Backend
cd ai-insights
uvicorn main:app --host 0.0.0.0 --port 8001

# Go Backend (optional)
cd backend
go build -o server && ./server
```

---

## Production Roadmap

This prototype demonstrates core functionality with pre-populated data. Below is how we'd evolve MSIP for production deployment.

### Data Freshness & Source Integration

| Data Source | Integration Approach | Refresh Cadence |
|-------------|---------------------|-----------------|
| Product Telemetry | Kafka consumers → PostgreSQL CDC | Real-time (< 5min) |
| Financial Data | Secure batch ETL from SAP/Oracle | Daily reconciliation |
| Jira/Rally | Webhook listeners + scheduled sync | Near real-time |
| Partner Status | API polling with circuit breakers | Hourly |

**Implementation:**
- **Change Data Capture (CDC)** via Debezium to stream changes from source systems
- **Data Freshness Indicators** already built into UI (`DataFreshness.tsx`) show last sync time
- **Validation Layer** with schema contracts (Avro/Protobuf) ensures data integrity
- **Audit Trail** on all data mutations for compliance and debugging

### Security & Compliance

**Authentication & Authorization:**
- **JWT-based auth** with Supabase Auth (already implemented)
- **RBAC roles** defined in schema: `vp_product`, `studio_ambassador`, `regional_lead`, `sales`, `partner_ops`, `viewer`
- **Row-Level Security (RLS)** policies enforce data access by region and role
- **Session management** with auto-refresh tokens and secure cookie storage

**Data Privacy (GDPR/PCI DSS):**
- **Data Classification** — PII fields encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Right to Erasure** — Soft delete with 30-day purge jobs; anonymization for analytics retention
- **Audit Logging** — All data access logged to immutable store for compliance reporting
- **PCI DSS Scope Reduction** — Financial data remains in certified systems; MSIP shows aggregated metrics only
- **AI Data Handling** — RAG pipeline processes only non-PII product metadata; no customer data in vector store

### User Adoption Strategy

**Phased Rollout:**
| Phase | Timeline | Scope | Success Criteria |
|-------|----------|-------|------------------|
| 1. Pilot | Weeks 1-4 | APAC-Singapore (Key Partner Region) | 80% weekly active users among PMs |
| 2. Expand | Weeks 5-8 | North America + EMEA | 50% reduction in ad-hoc status requests |
| 3. Scale | Weeks 9-12 | Global rollout | Self-service adoption > 90% |

**Change Management:**
- **Executive Sponsor** — VP Product as champion to drive top-down adoption
- **Training Program** — 30-min async video + live office hours for Q&A
- **Feedback Loop** — In-app feedback widget feeding directly into roadmap backlog
- **Incentive Alignment** — OKRs tied to data freshness and escalation resolution time

**Success Metrics:**
- ↓ 60% reduction in manual status request emails
- ↓ 40% faster escalation resolution (days → hours)
- ↑ 85% data freshness score (< 24hr stale data)
- ↑ NPS > 40 from product leads

### Scalability

**Multi-Region Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                     Global Load Balancer                     │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐
   │ NA Edge │         │ APAC Edge │        │ EU Edge │
   │ (Ohio)  │         │ (Singapore)│       │(Frankfurt)│
   └────┬────┘         └─────┬─────┘        └────┬────┘
        │                    │                    │
   ┌────▼────────────────────▼────────────────────▼────┐
   │              Supabase (Primary + Read Replicas)    │
   └───────────────────────────────────────────────────┘
```

**Regional Customization:**
- **Risk Frameworks** — Configurable thresholds per region (e.g., APAC regulatory requirements differ from NA)
- **Localization** — i18n support for UI; AI insights generated in local language via prompt engineering
- **Data Residency** — Regional Supabase instances for GDPR (EU data stays in EU)

**Performance Targets:**
- < 200ms p95 dashboard load time
- < 2s AI insight generation
- 99.9% uptime SLA

### Extensibility of AI

**Expanding the Knowledge Base:**
```
Current:                    Future:
┌─────────────┐            ┌─────────────────────────────┐
│ Product DB  │            │ Product DB                  │
│ Jira CSV    │     →      │ Jira/Rally (live)           │
│             │            │ Confluence/SharePoint docs  │
│             │            │ Market research reports     │
│             │            │ Compliance policies         │
│             │            │ Historical launch playbooks │
└─────────────┘            └─────────────────────────────┘
```

**RAG Pipeline Enhancements:**
- **Hybrid Search** — Combine vector similarity with keyword BM25 for better recall
- **Chunking Strategy** — Semantic chunking (vs fixed-size) for document coherence
- **Metadata Filtering** — Query by region, product type, date range before vector search
- **Re-ranking** — Cross-encoder model to re-score top-k results for precision

**Production Vector Store:**
- Migrate from ChromaDB (MVP) to **Milvus** for:
  - Binary quantization (32x memory reduction)
  - Horizontal scaling to billions of vectors
  - GPU-accelerated search

**AI Quality Metrics:**
| Metric | Measurement | Target |
|--------|-------------|--------|
| **Relevance** | Human eval on 100 weekly queries | > 85% relevant |
| **Groundedness** | Citation accuracy (does answer match source?) | > 90% |
| **Latency** | p95 response time | < 3s |
| **Hallucination Rate** | Fact-check against source docs | < 5% |

**Feedback Loop:**
- 👍/👎 buttons on AI responses feed into fine-tuning dataset
- Weekly review of low-rated responses to improve prompts
- A/B testing of prompt variations to optimize quality

---

## Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## License

Proprietary — Mastercard
