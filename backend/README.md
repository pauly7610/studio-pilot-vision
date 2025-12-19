# Studio Pilot Vision - Backend API

Go backend API for the Mastercard Studio Intelligence Platform (MSIP).

## Tech Stack

- **Framework**: Gin (HTTP web framework)
- **ORM**: GORM (Go ORM)
- **Database**: PostgreSQL (compatible with Supabase)
- **Authentication**: JWT

## Project Structure

```
backend/
├── config/          # Configuration management
├── database/        # Database connection and migrations
├── handlers/        # HTTP request handlers
├── middleware/      # Custom middleware (CORS, auth)
├── models/          # Data models and DTOs
├── routes/          # Route definitions
├── main.go          # Application entry point
├── .env.example     # Environment variables template
└── README.md
```

## Prerequisites

- Go 1.21 or higher
- PostgreSQL 14+ (or Supabase account)

## Setup

### 1. Install Dependencies

```bash
cd backend
go mod tidy
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run the Server

```bash
# Development mode
go run main.go

# Or build and run
go build -o server
./server
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/:id` - Update product (admin)
- `DELETE /api/v1/products/:id` - Delete product (admin)

### Product Metrics
- `GET /api/v1/products/:productId/metrics` - Get product metrics
- `POST /api/v1/metrics` - Create metric (admin)

### Product Readiness
- `GET /api/v1/products/:productId/readiness` - Get readiness data
- `POST /api/v1/products/:productId/readiness` - Create/update readiness (admin)

### Compliance
- `GET /api/v1/products/:productId/compliance` - Get compliance records
- `POST /api/v1/compliance` - Create compliance record (admin)

### Partners
- `GET /api/v1/products/:productId/partners` - Get partners
- `POST /api/v1/partners` - Create partner (admin)

### Feedback
- `GET /api/v1/products/:productId/feedback` - Get feedback
- `POST /api/v1/feedback` - Create feedback (authenticated)

### Predictions
- `GET /api/v1/products/:productId/predictions` - Get latest prediction
- `POST /api/v1/predictions` - Create prediction (admin)

### Actions
- `GET /api/v1/actions` - List all actions
- `GET /api/v1/products/:productId/actions` - Get product actions
- `POST /api/v1/actions` - Create action (authenticated)
- `PUT /api/v1/actions/:id` - Update action (authenticated)

### Training
- `GET /api/v1/products/:productId/training` - Get training data
- `POST /api/v1/products/:productId/training` - Create/update training (admin)

### Market Evidence
- `GET /api/v1/products/:productId/market-evidence` - Get market evidence
- `POST /api/v1/market-evidence` - Create evidence (admin)

### Profiles
- `GET /api/v1/profiles` - List all profiles
- `GET /api/v1/me` - Get current user profile (authenticated)

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Roles

- `viewer` - Read-only access
- `sales` - Can create actions and feedback
- `partner_ops` - Partner operations access
- `regional_lead` - Regional management
- `studio_ambassador` - Admin access
- `vp_product` - Full admin access

## Database

The backend uses GORM's AutoMigrate to create tables. On first run, it will create all necessary tables matching the Supabase schema.

### Connecting to Supabase

To connect to your existing Supabase database:

1. Get your database connection string from Supabase Dashboard > Settings > Database
2. Update `DATABASE_URL` in `.env`

```env
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Development

### Running with Hot Reload

```bash
# Install air for hot reloading
go install github.com/cosmtrek/air@latest

# Run with hot reload
air
```

### Building for Production

```bash
CGO_ENABLED=0 GOOS=linux go build -o server main.go
```

## License

Proprietary - Mastercard
