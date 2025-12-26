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
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```env
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### Backend
```bash
cd backend
go build -o server
./server
```

## Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## License

Proprietary — Mastercard
