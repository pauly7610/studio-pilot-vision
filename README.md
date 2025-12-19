# Mastercard Studio Intelligence Platform (MSIP)

**Predictive Portfolio Intelligence for North America**

A comprehensive product portfolio command center that provides AI-driven decision intelligence for managing products across their lifecycle—from concept to commercial scaling and sunset.

## Overview

MSIP enables product leaders to:
- **Monitor** portfolio health with real-time risk heatmaps and readiness scores
- **Analyze** feedback intelligence with sentiment analysis and theme extraction
- **Predict** product success using ML-based probability scoring
- **Act** on data-driven recommendations with integrated action tracking
- **Scale** products confidently with evidence-based scaling frameworks

## Project Structure

```
studio-pilot-vision/
├── src/                    # React frontend application
│   ├── components/         # UI components (76 components)
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── lib/                # Utility functions
│   └── integrations/       # Supabase client & types
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

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL (Supabase compatible)
- **Auth**: JWT

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- PostgreSQL 14+ (or Supabase account)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`

### Backend Setup

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
