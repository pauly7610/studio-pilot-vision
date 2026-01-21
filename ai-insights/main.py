"""FastAPI Server for AI Insights RAG Pipeline"""

import asyncio
import os

# CRITICAL: Set environment variables BEFORE any imports that might use them
# This prevents race conditions where libraries read env vars at import time
if not os.getenv("LLM_API_KEY") and os.getenv("GROQ_API_KEY"):
    os.environ["LLM_API_KEY"] = os.getenv("GROQ_API_KEY")

if not os.getenv("EMBEDDING_API_KEY") and os.getenv("HUGGINGFACE_API_KEY"):
    os.environ["EMBEDDING_API_KEY"] = os.getenv("HUGGINGFACE_API_KEY")

# Now safe to import everything else
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

import httpx
from fastapi import BackgroundTasks, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from pydantic import BaseModel

# Lazy imports - heavy ML libraries loaded on first use
_document_loader = None
_retrieval_pipeline = None
_generator = None
_vector_store = None
_cognee_initialized = False

from ai_insights.config import API_HOST, API_PORT, SUPABASE_KEY, SUPABASE_URL, get_logger
from ai_insights.utils import update_cognee_availability

logger = get_logger(__name__)


def get_lazy_document_loader():
    """Lazy load document loader."""
    global _document_loader
    if _document_loader is None:
        from ai_insights.retrieval import get_document_loader

        _document_loader = get_document_loader()
    return _document_loader


def get_lazy_retrieval():
    """Lazy load retrieval pipeline."""
    global _retrieval_pipeline
    if _retrieval_pipeline is None:
        from ai_insights.retrieval import get_retrieval_pipeline

        _retrieval_pipeline = get_retrieval_pipeline()
    return _retrieval_pipeline


def get_lazy_generator():
    """Lazy load generator."""
    global _generator
    if _generator is None:
        from ai_insights.utils import get_generator

        _generator = get_generator()
    return _generator


def get_lazy_vector_store():
    """Lazy load vector store."""
    global _vector_store
    if _vector_store is None:
        from ai_insights.retrieval import get_vector_store

        _vector_store = get_vector_store()
    return _vector_store


async def background_warmup():
    """
    Background task to warm up Cognee without blocking the main thread.

    CRITICAL: This runs in fire-and-forget mode, so errors must be logged explicitly.
    If this fails silently, queries will crash with NoneType errors later.
    """
    global _cognee_initialized
    try:
        logger.info("Background warmup: Loading Cognee...")

        # Import Cognee here to keep main thread light during boot
        from ai_insights.cognee import get_cognee_lazy_loader

        loader = get_cognee_lazy_loader()

        # Get client to trigger initialization (but don't run cognify)
        # CRITICAL: This must be awaited since get_client() is now async
        client = await loader.get_client()

        if client:
            # Just initialize config, don't process data
            await client.initialize()
            _cognee_initialized = True
            update_cognee_availability(True)
            logger.info(
                "Cognee background warm-up complete",
                extra={
                    "llm_model": os.getenv("LLM_MODEL", "unknown"),
                    "data_path": os.getenv("COGNEE_DATA_PATH", "./cognee_data"),
                },
            )
        else:
            logger.warning("Cognee client returned None - will use RAG-only mode")
            _cognee_initialized = False
            update_cognee_availability(False)

    except ImportError as e:
        logger.error(f"Cognee import failed: {e}", exc_info=True)
        _cognee_initialized = False
        update_cognee_availability(False)

    except Exception as e:
        logger.error(f"Cognee warm-up failed: {e}", exc_info=True)
        _cognee_initialized = False
        update_cognee_availability(False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the startup and shutdown of the Cognee AI engine.

    WHY: Modern FastAPI pattern for resource management.
         - Code before 'yield' runs on startup
         - Code after 'yield' runs on shutdown
         - Provides graceful task cancellation
    """
    # --- STARTUP ---
    global _cognee_initialized
    print("🚀 API Lifespan starting: Launching Cognee warmup...")
    print("✓ API will respond immediately while Cognee loads in background")

    # Fire and forget the warmup task so health checks pass immediately
    warmup_task = asyncio.create_task(background_warmup())
    _cognee_initialized = False

    yield  # Control is handed back to FastAPI to start receiving requests

    # --- SHUTDOWN ---
    print("🛑 API Lifespan shutting down: Cleaning up resources...")
    warmup_task.cancel()
    try:
        await warmup_task
    except asyncio.CancelledError:
        print("✓ Cognee warmup task cancelled successfully.")
    except Exception as e:
        print(f"⚠️ Error during warmup task cancellation: {e}")


# Initialize FastAPI with the lifespan and OpenAPI docs
app = FastAPI(
    title="MSIP AI Insights API",
    description="""
## Mastercard Studio Intelligence Platform - AI Backend

Production-grade dual-layer AI system combining RAG pipeline with Cognee knowledge graph.

### Features
- **RAG Pipeline**: ChromaDB vector store + Groq LLM (Llama 3.3 70B)
- **Knowledge Graph**: Cognee with 10 entity types, 9 relationship types
- **Document Processing**: PDF, TXT, MD, DOCX with OCR support
- **Auto-Sync**: Supabase webhooks → ChromaDB + Cognee

### Quick Start
1. `POST /ai/query` - Ask natural language questions
2. `POST /upload/document` - Upload documents for ingestion
3. `POST /api/sync/webhook` - Trigger data sync

### Authentication
Most endpoints require `X-Admin-Key` header for write operations.
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=[
        {"name": "health", "description": "Health checks and status"},
        {"name": "ai", "description": "AI query and insights endpoints"},
        {"name": "upload", "description": "Document and CSV upload"},
        {"name": "sync", "description": "Data synchronization with Supabase"},
        {"name": "cognee", "description": "Knowledge graph operations"},
    ],
    contact={
        "name": "MSIP Team",
        "email": "studio-intelligence@mastercard.com",
    },
    license_info={
        "name": "Proprietary",
        "identifier": "proprietary",
    },
)

# CORS middleware for frontend access
# Explicit origins for production + wildcard for development
CORS_ORIGINS = [
    "https://studio-pilot-vision.lovable.app",
    "https://studio-pilot-vision.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],  # Explicit + wildcard fallback
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Allow frontend to read custom headers
)


# Custom exception handler to ensure CORS headers on ALL errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler that ensures CORS headers are included on 500 errors.
    Without this, unhandled exceptions bypass CORS middleware.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Get origin from request
    origin = request.headers.get("origin", "*")
    
    # Check if origin is allowed
    if origin not in CORS_ORIGINS:
        origin = "*"
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An unexpected error occurred",
        },
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


# Request/Response Models
class QueryRequest(BaseModel):
    query: str
    product_id: Optional[str] = None
    top_k: Optional[int] = 5
    include_sources: Optional[bool] = True


class IngestRequest(BaseModel):
    source: str  # "products", "feedback", "documents"
    product_id: Optional[str] = None


class ProductInsightRequest(BaseModel):
    product_id: str
    insight_type: str = "summary"  # summary, risks, opportunities, recommendations


class PortfolioInsightRequest(BaseModel):
    query: str
    filters: Optional[dict] = None


class InsightResponse(BaseModel):
    success: bool
    insight: Optional[str] = None
    sources: Optional[list[dict]] = None
    error: Optional[str] = None
    usage: Optional[dict] = None


# Supabase client helper
async def fetch_from_supabase(endpoint: str, params: dict = None) -> dict:
    """Fetch data from Supabase REST API."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


@app.get("/")
@app.head("/")
async def root():
    """Health check endpoint. Supports both GET and HEAD."""
    return {
        "status": "healthy",
        "service": "Studio Pilot AI Insights",
        "version": "1.0.0",
    }


@app.get("/health", tags=["health"], summary="Health Check", 
         description="Returns detailed health status of all AI services including ChromaDB, Cognee, and Groq.")
async def health():
    """Detailed health check with service status."""
    vs = get_lazy_vector_store()
    vector_count = vs.count()

    return {
        "status": "healthy",
        "vector_store": {
            "connected": vector_count >= 0,
            "document_count": vector_count,
        },
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "cognee_initialized": _cognee_initialized,
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/query", response_model=InsightResponse)
async def query_insights(request: QueryRequest):
    """
    Query the RAG pipeline for insights.

    This endpoint:
    1. Embeds the query using binary quantization
    2. Retrieves top-k similar chunks using Hamming distance
    3. Generates an insight using Groq LLM
    """
    retrieval = get_lazy_retrieval()
    generator = get_lazy_generator()

    # Retrieve relevant context
    if request.product_id:
        chunks = retrieval.retrieve_for_product(
            product_id=request.product_id,
            query=request.query,
            top_k=request.top_k,
        )
    else:
        chunks = retrieval.retrieve(
            query=request.query,
            top_k=request.top_k,
        )

    # Generate insight
    result = generator.generate(
        query=request.query,
        retrieved_chunks=chunks,
    )

    if not request.include_sources:
        result.pop("sources", None)

    return InsightResponse(**result)


@app.post("/product-insight", response_model=InsightResponse)
async def product_insight(request: ProductInsightRequest):
    """Generate a specific type of insight for a product."""
    try:
        # Fetch product data from Supabase
        products = await fetch_from_supabase(
            "products",
            params={
                "id": f"eq.{request.product_id}",
                "select": "*,readiness:product_readiness(*),prediction:product_predictions(*),compliance:product_compliance(*)",
            },
        )

        if not products:
            raise HTTPException(status_code=404, detail="Product not found")

        product = products[0]

        # Generate insight
        generator = get_lazy_generator()
        result = generator.generate_product_insight(
            product_data=product,
            insight_type=request.insight_type,
        )

        return InsightResponse(**result)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")


@app.post("/portfolio-insight", response_model=InsightResponse)
async def portfolio_insight(request: PortfolioInsightRequest):
    """Generate insights across the product portfolio."""
    try:
        # Fetch all products from Supabase
        params = {"select": "*,readiness:product_readiness(*),prediction:product_predictions(*)"}

        if request.filters:
            for key, value in request.filters.items():
                params[key] = f"eq.{value}"

        products = await fetch_from_supabase("products", params=params)

        if not products:
            return InsightResponse(
                success=False,
                error="No products found matching criteria",
            )

        # Generate portfolio insight
        generator = get_lazy_generator()
        result = generator.generate_portfolio_insight(
            products=products,
            query=request.query,
        )

        return InsightResponse(**result)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@app.post("/ingest")
async def ingest_data(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Ingest data into the vector store.

    Sources:
    - products: Fetch and ingest all product data from Supabase
    - feedback: Fetch and ingest all feedback data
    - documents: Ingest documents from the documents directory
    """
    loader = get_lazy_document_loader()

    if request.source == "documents":
        # Ingest from local documents directory
        count = loader.ingest_from_directory()
        return {"success": True, "ingested": count, "source": "documents"}

    elif request.source == "products":
        try:
            products = await fetch_from_supabase(
                "products",
                params={
                    "select": "*,readiness:product_readiness(*),prediction:product_predictions(*),compliance:product_compliance(*)",
                },
            )

            documents = loader.load_product_data(products)
            count = loader.ingest_documents(documents)

            return {"success": True, "ingested": count, "source": "products"}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to ingest products: {str(e)}")

    elif request.source == "feedback":
        try:
            params = {"select": "*"}
            if request.product_id:
                params["product_id"] = f"eq.{request.product_id}"

            feedback = await fetch_from_supabase("product_feedback", params=params)

            documents = loader.load_feedback_data(feedback)
            count = loader.ingest_documents(documents)

            return {"success": True, "ingested": count, "source": "feedback"}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to ingest feedback: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail=f"Unknown source: {request.source}")


@app.get("/stats")
async def get_stats():
    """Get statistics about the vector store."""
    vs = get_lazy_vector_store()

    return {
        "total_vectors": vs.count(),
        "collection": vs.collection_name,
    }


@app.get("/api/reports/executive-summary", tags=["reports"], summary="Executive Summary Dashboard")
async def get_executive_summary():
    """
    Executive summary for Studio Ambassador role - key metrics at a glance.

    Returns high-level portfolio health metrics suitable for leadership reporting.
    """
    from datetime import datetime, timedelta

    try:
        supabase = get_supabase_client()

        # Get all products with readiness
        products_response = supabase.table("products").select(
            "*, product_readiness(risk_band, readiness_score)"
        ).execute()

        products = products_response.data if products_response.data else []

        # Calculate summary stats
        total_products = len(products)
        products_by_stage = {}
        products_by_risk = {"low": 0, "medium": 0, "high": 0}
        total_revenue_target = 0

        for product in products:
            # Count by lifecycle stage
            stage = product.get("lifecycle_stage", "unknown")
            products_by_stage[stage] = products_by_stage.get(stage, 0) + 1

            # Count by risk band
            readiness = product.get("product_readiness")
            if readiness and isinstance(readiness, list) and len(readiness) > 0:
                risk_band = readiness[0].get("risk_band", "unknown")
                if risk_band in products_by_risk:
                    products_by_risk[risk_band] += 1

            # Sum revenue targets
            revenue_target = product.get("revenue_target", 0)
            if revenue_target:
                total_revenue_target += float(revenue_target)

        # Get governance actions
        actions_response = supabase.table("product_actions").select("*").execute()
        actions = actions_response.data if actions_response.data else []

        actions_by_status = {}
        high_priority_pending = 0

        for action in actions:
            status = action.get("status", "unknown")
            actions_by_status[status] = actions_by_status.get(status, 0) + 1

            if action.get("priority") == "high" and action.get("status") == "pending":
                high_priority_pending += 1

        # Get recent feedback
        feedback_response = supabase.table("product_feedback").select("sentiment_score").execute()
        feedback_items = feedback_response.data if feedback_response.data else []

        avg_sentiment = 0
        if feedback_items:
            total_sentiment = sum(float(f.get("sentiment_score", 0)) for f in feedback_items)
            avg_sentiment = round(total_sentiment / len(feedback_items), 2)

        # Calculate products launched this quarter (last 90 days)
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        recent_launches = sum(
            1 for p in products
            if p.get("launch_date") and datetime.fromisoformat(p["launch_date"].replace("Z", "")) > ninety_days_ago
        )

        # Calculate revenue at risk (high risk band products)
        revenue_at_risk = sum(
            float(p.get("revenue_target", 0))
            for p in products
            if p.get("product_readiness")
            and isinstance(p["product_readiness"], list)
            and len(p["product_readiness"]) > 0
            and p["product_readiness"][0].get("risk_band") == "high"
        )

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "portfolio_overview": {
                "total_products": total_products,
                "products_by_stage": products_by_stage,
                "recent_launches_90d": recent_launches,
                "total_revenue_target": f"${total_revenue_target:,.0f}",
            },
            "risk_summary": {
                "products_by_risk_band": products_by_risk,
                "high_risk_count": products_by_risk["high"],
                "revenue_at_risk": f"${revenue_at_risk:,.0f}",
            },
            "governance_actions": {
                "total_actions": len(actions),
                "by_status": actions_by_status,
                "high_priority_pending": high_priority_pending,
            },
            "customer_feedback": {
                "total_feedback_items": len(feedback_items),
                "average_sentiment": avg_sentiment,
                "sentiment_status": "positive" if avg_sentiment > 0.3 else "neutral" if avg_sentiment > -0.3 else "negative",
            },
            "alerts": [
                f"{high_priority_pending} high-priority actions pending" if high_priority_pending > 0 else None,
                f"{products_by_risk['high']} products in high-risk band" if products_by_risk['high'] > 0 else None,
                f"${revenue_at_risk:,.0f} revenue at risk" if revenue_at_risk > 1000000 else None,
            ],
        }

    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


# In-memory job status tracking (use Redis in production)
_job_status: dict = {}

# Webhook debouncing - prevent rapid re-syncs
_last_webhook_sync: float = 0
_webhook_sync_cooldown: int = 60  # Minimum seconds between webhook syncs
_webhook_sync_in_progress: bool = False


def process_jira_csv_background(job_id: str, csv_text: str, filename: str):
    """Background task to process Jira CSV."""
    from ai_insights.utils.jira_parser import get_ingestion_summary, parse_jira_csv

    try:
        _job_status[job_id] = {"status": "parsing", "progress": 0}

        # Parse CSV
        documents = parse_jira_csv(csv_text)

        if not documents:
            _job_status[job_id] = {"status": "failed", "error": "No valid tickets found"}
            return

        _job_status[job_id] = {
            "status": "processing",
            "progress": 20,
            "total_tickets": len(documents),
        }

        # Get summary
        summary = get_ingestion_summary(documents)

        _job_status[job_id]["progress"] = 40
        _job_status[job_id]["summary"] = summary

        # Ingest into vector store
        loader = get_lazy_document_loader()

        loader_docs = []
        for doc in documents:
            loader_docs.append(
                {
                    "id": doc["id"],
                    "text": doc["text"],
                    "metadata": doc["metadata"],
                }
            )

        _job_status[job_id]["status"] = "ingesting"
        _job_status[job_id]["progress"] = 60

        count = loader.ingest_documents(loader_docs)

        _job_status[job_id] = {
            "status": "completed",
            "progress": 100,
            "filename": filename,
            "ingested": count,
            "summary": summary,
        }

    except Exception as e:
        _job_status[job_id] = {"status": "failed", "error": str(e)}


@app.post("/upload/jira-csv")
async def upload_jira_csv(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Upload and queue a Jira CSV export for background processing.

    Returns a job_id immediately. Poll /upload/status/{job_id} for progress.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Read file content
        content = await file.read()
        csv_text = content.decode("utf-8")

        # Quick validation - just check if it parses
        import hashlib

        job_id = hashlib.md5(f"{file.filename}_{len(csv_text)}".encode()).hexdigest()[:12]

        # Check if same job already running
        if job_id in _job_status and _job_status[job_id].get("status") in [
            "parsing",
            "processing",
            "ingesting",
        ]:
            return {
                "success": True,
                "job_id": job_id,
                "status": "already_processing",
                "message": "This file is already being processed",
            }

        # Initialize job status
        _job_status[job_id] = {"status": "queued", "progress": 0}

        # Queue background processing
        background_tasks.add_task(process_jira_csv_background, job_id, csv_text, file.filename)

        return {
            "success": True,
            "job_id": job_id,
            "status": "queued",
            "message": "CSV upload queued for processing. Poll /upload/status/{job_id} for progress.",
        }

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid CSV encoding. Please use UTF-8.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue CSV: {str(e)}")


@app.get("/upload/status/{job_id}")
async def get_upload_status(job_id: str):
    """Get the status of a CSV upload job."""
    if job_id not in _job_status:
        raise HTTPException(status_code=404, detail="Job not found")

    return _job_status[job_id]


# ============================================================================
# PDF/Document Upload Endpoint
# ============================================================================

# File size limit: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


def perform_ocr_on_pdf(pdf_path: str) -> tuple[str, float]:
    """
    Perform OCR on a PDF file using pytesseract.
    Returns (extracted_text, confidence_score).
    
    Requires: poppler-utils (for pdf2image) and tesseract-ocr installed on system.
    On Render, add to apt packages: poppler-utils tesseract-ocr
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract
        from PIL import Image
        
        logger.info(f"Starting OCR on {pdf_path}")
        
        # Convert PDF pages to images
        # Use lower DPI for speed, higher for accuracy
        images = convert_from_path(pdf_path, dpi=200, first_page=1, last_page=20)  # Limit to 20 pages
        
        all_text = []
        confidences = []
        
        for i, image in enumerate(images):
            # Get OCR data with confidence scores
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Extract text and confidence
            page_text = []
            page_confidences = []
            
            for j, word in enumerate(data['text']):
                conf = int(data['conf'][j])
                if conf > 0 and word.strip():  # Only include words with positive confidence
                    page_text.append(word)
                    page_confidences.append(conf)
            
            if page_text:
                all_text.append(' '.join(page_text))
                confidences.extend(page_confidences)
            
            logger.debug(f"OCR page {i+1}: {len(page_text)} words extracted")
        
        full_text = '\n\n'.join(all_text)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        logger.info(f"OCR complete: {len(full_text)} chars, {avg_confidence:.1f}% avg confidence")
        
        return full_text, avg_confidence / 100.0  # Normalize to 0-1
        
    except ImportError as e:
        logger.warning(f"OCR dependencies not available: {e}")
        return "", 0.0
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return "", 0.0


async def process_document_background(job_id: str, file_content: bytes, filename: str, product_id: Optional[str] = None, product_name: Optional[str] = None):
    """Process uploaded document in background with dual ingestion and OCR fallback."""
    import tempfile
    import os as local_os
    from pathlib import Path
    
    try:
        _job_status[job_id] = {"status": "parsing", "progress": 10, "filename": filename, "product_id": product_id}
        
        # Save to temp file for LlamaIndex to read
        file_ext = Path(filename).suffix.lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name
        
        ocr_applied = False
        ocr_confidence = None
        
        try:
            # Step 1: Parse document with LlamaIndex
            _job_status[job_id]["status"] = "extracting_text"
            _job_status[job_id]["progress"] = 20
            
            from llama_index.core import SimpleDirectoryReader
            
            # Read single file
            reader = SimpleDirectoryReader(input_files=[tmp_path])
            documents = reader.load_data()
            
            if not documents:
                _job_status[job_id] = {
                    "status": "failed", 
                    "error": "Could not extract text from document. File may be empty or corrupted."
                }
                return
            
            # Combine all document text
            full_text = "\n\n".join([doc.text for doc in documents])
            
            # If text extraction yielded very little, try OCR for PDFs
            if len(full_text.strip()) < 50 and file_ext == ".pdf":
                _job_status[job_id]["status"] = "applying_ocr"
                _job_status[job_id]["progress"] = 25
                logger.info(f"Low text extraction ({len(full_text)} chars), attempting OCR...")
                
                ocr_text, ocr_conf = perform_ocr_on_pdf(tmp_path)
                
                if len(ocr_text.strip()) > 50:
                    full_text = ocr_text
                    ocr_applied = True
                    ocr_confidence = ocr_conf
                    _job_status[job_id]["ocr_applied"] = True
                    _job_status[job_id]["ocr_confidence"] = ocr_conf
                    logger.info(f"OCR successful: {len(full_text)} chars at {ocr_conf*100:.1f}% confidence")
                    
                    # Create a document from OCR text for downstream processing
                    from llama_index.core import Document
                    documents = [Document(text=full_text, metadata={"source": "ocr", "filename": filename})]
                else:
                    _job_status[job_id] = {
                        "status": "failed",
                        "error": "Document appears to be a scanned image. OCR could not extract readable text. Try a higher quality scan or a native PDF."
                    }
                    return
            elif len(full_text.strip()) < 50:
                _job_status[job_id] = {
                    "status": "failed",
                    "error": "Document contains very little text. Is it a scanned image? (OCR only available for PDFs)"
                }
                return
            
            _job_status[job_id]["progress"] = 30
            _job_status[job_id]["extracted_chars"] = len(full_text)
            
            # Step 2: Ingest into ChromaDB
            _job_status[job_id]["status"] = "ingesting_chromadb"
            _job_status[job_id]["progress"] = 40
            
            loader = get_lazy_document_loader()
            
            # Add metadata for better search attribution
            for doc in documents:
                doc.metadata["source"] = "upload"
                doc.metadata["filename"] = filename
                doc.metadata["file_type"] = file_ext
                doc.metadata["upload_time"] = datetime.now().isoformat()
                if product_id:
                    doc.metadata["product_id"] = product_id
                if product_name:
                    doc.metadata["product_name"] = product_name
            
            chroma_count = loader.ingest_documents(documents)
            _job_status[job_id]["chroma_ingested"] = chroma_count
            _job_status[job_id]["progress"] = 60
            
            # Step 3: Ingest into Cognee (knowledge graph)
            # NOTE: cognify() is DISABLED for document uploads - it's too heavy for web process
            # and causes 30-min timeout on Render. Data is still added to Cognee and will be
            # processed when the next webhook triggers cognify(), or via manual sync.
            _job_status[job_id]["status"] = "ingesting_cognee"
            _job_status[job_id]["progress"] = 70
            
            cognee_success = False
            try:
                from ai_insights.cognee import get_cognee_lazy_loader
                cognee_loader = get_cognee_lazy_loader()
                client = await cognee_loader.get_client()
                
                if client:
                    # Format document as natural text for better knowledge extraction
                    # Cognee works better with prose than JSON structures
                    # Limit to 20K chars to avoid memory issues (Cognee processes in-memory)
                    content_limit = min(len(full_text), 20000)
                    truncated = content_limit < len(full_text)
                    
                    # Include product context if provided (helps AI relate docs to products)
                    product_context = ""
                    if product_name:
                        product_context = f"\nRelated Product: {product_name}"
                    elif product_id:
                        product_context = f"\nRelated Product ID: {product_id}"
                    
                    document_text = f"""
UPLOADED DOCUMENT: {filename}
File Type: {file_ext}{product_context}
Upload Time: {datetime.now().isoformat()}
Character Count: {len(full_text)}{' (truncated for processing)' if truncated else ''}

--- DOCUMENT CONTENT ---
{full_text[:content_limit]}
{'...[content truncated]...' if truncated else ''}
--- END DOCUMENT ---
"""
                    await client.add_data(document_text, node_set="documents")
                    
                    # SKIP cognify() - too heavy for web process, causes Render timeout
                    # Knowledge graph relationships will be built on next webhook sync
                    # or via manual /api/sync/ingest endpoint
                    _job_status[job_id]["progress"] = 85
                    
                    cognee_success = True
                    _job_status[job_id]["cognee_ingested"] = True
                    _job_status[job_id]["cognee_note"] = "Added to knowledge base. Relationships will build on next sync."
            except Exception as cognee_error:
                logger.warning(f"Cognee ingestion failed (non-fatal): {cognee_error}")
                _job_status[job_id]["cognee_error"] = str(cognee_error)
            
            # Step 4: Upload to Supabase Storage (private folder)
            _job_status[job_id]["status"] = "uploading_storage"
            _job_status[job_id]["progress"] = 90
            
            storage_url = None
            storage_error = None
            
            if SUPABASE_URL and SUPABASE_KEY:
                try:
                    from supabase import create_client
                    
                    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                    
                    # Use private/ folder to match RLS policies
                    # Format: private/{product_id or 'general'}/{job_id}_{filename}
                    safe_filename = filename.replace(" ", "_").replace("/", "_")
                    storage_path = f"private/{product_id or 'general'}/{job_id}_{safe_filename}"
                    
                    # Upload file to storage
                    storage_response = supabase.storage.from_("uploaded_documents").upload(
                        storage_path,
                        file_content,
                        {"content-type": "application/octet-stream"}
                    )
                    
                    if hasattr(storage_response, 'path'):
                        # Get signed URL (valid for 1 hour) for immediate access
                        signed_url = supabase.storage.from_("uploaded_documents").create_signed_url(
                            storage_path, 
                            3600  # 1 hour expiry
                        )
                        storage_url = signed_url.get('signedURL') if isinstance(signed_url, dict) else None
                        
                        # Also store metadata in uploaded_documents table
                        try:
                            supabase.table("uploaded_documents").insert({
                                "filename": safe_filename,
                                "original_name": filename,
                                "file_type": file_ext,
                                "file_size": len(file_content),
                                "storage_path": storage_path,
                                "product_id": product_id,
                                "extracted_chars": len(full_text),
                                "chroma_chunks": chroma_count,
                                "cognee_ingested": cognee_success,
                                "ocr_applied": ocr_applied,
                                "ocr_confidence": ocr_confidence,
                                "status": "completed",
                                "processed_at": datetime.now().isoformat()
                            }).execute()
                            logger.info(f"Stored document metadata in DB: {storage_path}")
                        except Exception as db_err:
                            logger.warning(f"Could not store document metadata: {db_err}")
                        
                        logger.info(f"Uploaded document to storage: {storage_path}")
                    else:
                        storage_error = "Upload response missing path"
                        logger.warning(f"Storage upload issue: {storage_error}")
                        
                except Exception as storage_err:
                    storage_error = str(storage_err)
                    logger.warning(f"Storage upload failed (non-fatal): {storage_err}")
            else:
                storage_error = "Supabase not configured"
            
            # Complete!
            ocr_msg = f" (OCR applied at {ocr_confidence*100:.0f}% confidence)" if ocr_applied else ""
            _job_status[job_id] = {
                "status": "completed",
                "progress": 100,
                "filename": filename,
                "file_type": file_ext,
                "extracted_chars": len(full_text),
                "chroma_ingested": chroma_count,
                "cognee_ingested": cognee_success,
                "cognee_note": "Relationships build on next sync" if cognee_success else None,
                "ocr_applied": ocr_applied,
                "ocr_confidence": ocr_confidence,
                "storage_path": storage_path if storage_url else None,
                "storage_url": storage_url,
                "storage_error": storage_error,
                "message": f"Successfully ingested '{filename}'{ocr_msg} - {chroma_count} chunks to RAG" + (", added to knowledge base (relationships build on next sync)" if cognee_success else "") + (", stored in Supabase" if storage_url else "")
            }
            
        finally:
            # Clean up temp file
            try:
                local_os.unlink(tmp_path)
            except Exception:
                pass
                
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        _job_status[job_id] = {"status": "failed", "error": str(e), "filename": filename}


@app.post("/upload/document", tags=["upload"], summary="Upload Document",
          description="Upload PDF, TXT, MD, or DOCX files for AI ingestion. Supports OCR for scanned PDFs. Max 10MB.")
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, TXT, MD, DOCX)"), 
    product_id: Optional[str] = None,
    product_name: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Upload a document (PDF, TXT, MD, DOCX) for AI ingestion.
    
    - Max file size: 10MB
    - Supported formats: .pdf, .txt, .md, .docx
    - Optional: product_id and product_name to link document to a product
    - Returns job_id immediately. Poll /upload/status/{job_id} for progress.
    - Document is ingested into both ChromaDB (RAG) and Cognee (knowledge graph).
    """
    import hashlib
    from pathlib import Path
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read and validate file size
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size / 1024 / 1024:.1f}MB). Maximum size is 10MB."
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Generate job ID
    job_id = hashlib.md5(f"{file.filename}_{file_size}_{datetime.now().isoformat()}".encode()).hexdigest()[:12]
    
    # Check if already processing
    if job_id in _job_status and _job_status[job_id].get("status") in ["parsing", "extracting_text", "ingesting_chromadb", "ingesting_cognee", "building_knowledge"]:
        return {
            "success": True,
            "job_id": job_id,
            "status": "already_processing",
            "message": "This file is already being processed"
        }
    
    # Initialize job
    _job_status[job_id] = {"status": "queued", "progress": 0, "filename": file.filename, "product_id": product_id}
    
    # Queue background processing
    background_tasks.add_task(process_document_background, job_id, content, file.filename, product_id, product_name)
    
    return {
        "success": True,
        "job_id": job_id,
        "status": "queued",
        "filename": file.filename,
        "file_size_mb": round(file_size / 1024 / 1024, 2),
        "product_id": product_id,
        "message": f"Document '{file.filename}' queued for processing. Poll /upload/status/{job_id} for progress."
    }


# Unified AI Query Endpoint (Orchestrated)


class UnifiedQueryRequest(BaseModel):
    query: str
    context: Optional[dict] = None


class UnifiedQueryResponse(BaseModel):
    success: bool
    query: str
    answer: str
    confidence: float
    source_type: str  # "memory", "retrieval", or "hybrid"
    sources: dict  # {"memory": [...], "retrieval": [...]}
    reasoning_trace: list[dict]
    recommended_actions: Optional[list[dict]] = None
    forecast: Optional[dict] = None
    shared_context: Optional[dict] = None
    timestamp: str
    error: Optional[str] = None


@app.post("/ai/query", tags=["ai"], summary="Unified AI Query",
          description="Production-grade AI query with hybrid intent classification, entity validation, and confidence scoring.")
async def unified_query_v2(request: UnifiedQueryRequest):
    """
    Production-grade unified AI query endpoint with hardened orchestration.

    ARCHITECTURE:
    - Hybrid intent classification (heuristic + LLM fallback)
    - Entity validation and grounding
    - Principled confidence calculation (4 components)
    - Explicit guardrails and answer quality markers
    - Graceful fallbacks at every layer
    - Bidirectional memory-retrieval feedback

    Automatically routes queries:
    - Historical/causal → Cognee primary (memory + reasoning)
    - Factual/current → RAG primary (retrieval + Cognee context)
    - Mixed/ambiguous → Hybrid (both layers)

    Returns UnifiedAIResponse with:
    - Answer with confidence breakdown
    - Source attribution (memory vs retrieval)
    - Reasoning trace (every decision explained)
    - Guardrails (answer type, warnings, limitations)
    - Shared context (entity grounding, validation)
    """
    try:
        from ai_insights.models import UnifiedAIResponse
        from ai_insights.orchestration import get_production_orchestrator

        orchestrator = get_production_orchestrator()
        result = await orchestrator.orchestrate(request.query, request.context)

        # Result is already UnifiedAIResponse, return with JSON-compatible types
        response_dict = result.dict()
        # Convert datetime to ISO string for JSON serialization
        if isinstance(response_dict.get("timestamp"), datetime):
            response_dict["timestamp"] = response_dict["timestamp"].isoformat()
        return response_dict

    except Exception as e:
        from ai_insights.models import UnifiedAIResponse

        error_response = UnifiedAIResponse.create_error_response(
            query=request.query, error_message=f"Orchestration failed: {str(e)}"
        )
        response_dict = error_response.dict()
        # Convert datetime to ISO string for JSON serialization
        if isinstance(response_dict.get("timestamp"), datetime):
            response_dict["timestamp"] = response_dict["timestamp"].isoformat()
        return response_dict


# ============================================================================
# SSE STREAMING ENDPOINT - Race-Loop Pattern
# ============================================================================

from fastapi.responses import StreamingResponse
import json


class StreamQueryRequest(BaseModel):
    query: str
    context: Optional[dict] = None
    include_partial: bool = True  # Whether to yield partial results


@app.post("/ai/query/stream", tags=["ai"], summary="Streaming AI Query (SSE)",
          description="Stream AI query results using Server-Sent Events. Returns partial results as each layer completes.")
async def unified_query_stream(request: StreamQueryRequest):
    """
    🔄 STREAMING AI QUERY using Server-Sent Events (SSE).
    
    PATTERN: Race-loop from Niyam AI architecture.
             Instead of waiting for all layers to complete (Promise.all),
             this endpoint yields results as each layer finishes.
    
    BENEFITS:
    - Total perceived latency = slowest extractor (not the sum)
    - Users see partial results as domains complete
    - One domain failing doesn't block the others
    
    EVENTS:
    - "intent": Intent classification result
    - "cognee": Cognee knowledge graph result (when ready)
    - "rag": RAG retrieval result (when ready)
    - "merged": Final merged result
    - "error": Error event if something fails
    - "complete": Stream completion marker
    
    USAGE:
    ```javascript
    const eventSource = new EventSource('/ai/query/stream', {
        method: 'POST',
        body: JSON.stringify({ query: "What are the blockers?" })
    });
    
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data.type, data.payload);
    };
    ```
    """
    async def event_generator():
        """Generate SSE events as each layer completes."""
        import time
        start_time = time.time()
        
        try:
            from ai_insights.cognee import get_cognee_lazy_loader
            from ai_insights.orchestration.intent_classifier import get_intent_classifier
            from ai_insights.retrieval import get_retrieval_pipeline
            from ai_insights.utils import get_generator
            from ai_insights.models import CogneeQueryResult, RAGResult
            
            # Step 1: Intent Classification (fast, always first)
            intent_classifier = get_intent_classifier()
            intent, intent_confidence, intent_reasoning = intent_classifier.classify(request.query)
            
            intent_event = {
                "type": "intent",
                "timestamp": datetime.utcnow().isoformat(),
                "payload": {
                    "intent": intent.value,
                    "confidence": intent_confidence,
                    "reasoning": intent_reasoning,
                }
            }
            yield f"data: {json.dumps(intent_event)}\n\n"
            
            # Step 2: Launch parallel queries using race-loop pattern
            cognee_loader = get_cognee_lazy_loader()
            retrieval = get_retrieval_pipeline()
            generator = get_generator()
            
            # Create tasks for parallel execution
            cognee_task = asyncio.create_task(
                cognee_loader.query(request.query, request.context),
                name="cognee"
            )
            
            # RAG needs to run in thread since it's sync
            async def run_rag():
                chunks = await asyncio.to_thread(
                    retrieval.retrieve, request.query, top_k=5
                )
                answer_result = await asyncio.to_thread(
                    generator.generate, request.query, chunks
                )
                return {"chunks": chunks, "answer": answer_result}
            
            rag_task = asyncio.create_task(run_rag(), name="rag")
            
            # Race-loop: yield results as each task completes
            pending = {cognee_task, rag_task}
            results = {"cognee": None, "rag": None}
            
            while pending:
                done, pending = await asyncio.wait(
                    pending, 
                    return_when=asyncio.FIRST_COMPLETED,
                    timeout=30.0  # 30 second timeout per task
                )
                
                for task in done:
                    task_name = task.get_name()
                    elapsed = time.time() - start_time
                    
                    try:
                        result = task.result()
                        
                        if task_name == "cognee":
                            # Validate Cognee result using schema
                            validated = CogneeQueryResult.from_raw_cognee_response(
                                result, query_text=request.query
                            )
                            results["cognee"] = validated
                            
                            if request.include_partial:
                                cognee_event = {
                                    "type": "cognee",
                                    "timestamp": datetime.utcnow().isoformat(),
                                    "elapsed_ms": int(elapsed * 1000),
                                    "payload": {
                                        "answer": validated.answer[:500] if validated.answer else "",
                                        "confidence": validated.confidence,
                                        "source_count": len(validated.sources),
                                        "sources": [
                                            {"entity_type": s.entity_type, "entity_name": s.entity_name}
                                            for s in validated.sources[:5]
                                        ]
                                    }
                                }
                                yield f"data: {json.dumps(cognee_event)}\n\n"
                        
                        elif task_name == "rag":
                            # Validate RAG result using schema
                            validated = RAGResult.from_raw_rag_response({
                                "answer": result.get("answer", {}).get("insight", ""),
                                "chunks": result.get("chunks", []),
                            })
                            results["rag"] = validated
                            
                            if request.include_partial:
                                rag_event = {
                                    "type": "rag",
                                    "timestamp": datetime.utcnow().isoformat(),
                                    "elapsed_ms": int(elapsed * 1000),
                                    "payload": {
                                        "answer": validated.answer[:500] if validated.answer else "",
                                        "confidence": validated.confidence,
                                        "chunk_count": len(validated.chunks),
                                        "top_sources": [
                                            {"id": c.id, "score": c.score}
                                            for c in validated.chunks[:3]
                                        ]
                                    }
                                }
                                yield f"data: {json.dumps(rag_event)}\n\n"
                    
                    except Exception as task_error:
                        error_event = {
                            "type": "error",
                            "timestamp": datetime.utcnow().isoformat(),
                            "elapsed_ms": int(elapsed * 1000),
                            "payload": {
                                "source": task_name,
                                "error": str(task_error),
                            }
                        }
                        yield f"data: {json.dumps(error_event)}\n\n"
            
            # Step 3: Merge results and yield final answer
            elapsed = time.time() - start_time
            
            # Merge logic: prioritize based on intent and confidence
            final_answer = ""
            final_confidence = 0.0
            source_type = "unknown"
            
            cognee_result = results.get("cognee")
            rag_result = results.get("rag")
            
            if cognee_result and rag_result:
                # Hybrid: merge both
                if cognee_result.confidence >= rag_result.confidence:
                    final_answer = cognee_result.answer
                    if rag_result.answer:
                        final_answer += f"\n\nAdditional context: {rag_result.answer[:300]}"
                else:
                    final_answer = rag_result.answer
                    if cognee_result.answer:
                        final_answer += f"\n\nHistorical context: {cognee_result.answer[:300]}"
                
                final_confidence = (cognee_result.confidence * 0.5 + rag_result.confidence * 0.5)
                source_type = "hybrid"
                
            elif cognee_result:
                final_answer = cognee_result.answer
                final_confidence = cognee_result.confidence
                source_type = "memory"
                
            elif rag_result:
                final_answer = rag_result.answer
                final_confidence = rag_result.confidence
                source_type = "retrieval"
            else:
                final_answer = "Unable to retrieve information from any source."
                final_confidence = 0.0
                source_type = "none"
            
            # Yield merged result
            merged_event = {
                "type": "merged",
                "timestamp": datetime.utcnow().isoformat(),
                "elapsed_ms": int(elapsed * 1000),
                "payload": {
                    "query": request.query,
                    "answer": final_answer,
                    "confidence": final_confidence,
                    "source_type": source_type,
                    "sources": {
                        "memory": [s.entity_name for s in (cognee_result.sources if cognee_result else [])[:5]],
                        "retrieval": [c.id for c in (rag_result.chunks if rag_result else [])[:5]],
                    }
                }
            }
            yield f"data: {json.dumps(merged_event)}\n\n"
            
            # Final completion event
            complete_event = {
                "type": "complete",
                "timestamp": datetime.utcnow().isoformat(),
                "elapsed_ms": int(elapsed * 1000),
            }
            yield f"data: {json.dumps(complete_event)}\n\n"
            
        except Exception as e:
            error_event = {
                "type": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "payload": {
                    "source": "stream",
                    "error": str(e),
                }
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


# Cognee Query Endpoints (Direct Access)


class CogneeQueryRequest(BaseModel):
    query: str
    context: Optional[dict] = None


class CogneeQueryResponse(BaseModel):
    success: bool
    query: str
    answer: str
    confidence: float
    confidence_breakdown: dict
    sources: list[dict]
    reasoning_trace: list[dict]
    recommended_actions: Optional[list[dict]] = None
    forecast: Optional[dict] = None
    timestamp: str
    error: Optional[str] = None


def transform_cognee_response(raw_result: dict, query_text: str) -> dict:
    """
    Transform raw Cognee search results into CogneeQueryResponse format.
    
    Cognee returns: {"query", "results", "context", "timestamp", ...}
    We need: {"answer", "confidence", "sources", "reasoning_trace", ...}
    """
    results = raw_result.get("results", [])
    
    # Extract answer from results
    answer = ""
    sources = []
    
    if isinstance(results, list) and len(results) > 0:
        # Cognee returns list of search results
        for idx, result in enumerate(results[:5]):  # Top 5 results
            if isinstance(result, dict):
                text = result.get("text", result.get("content", ""))
                if text:
                    answer += f"{text}\n\n"
                    sources.append({
                        "rank": idx + 1,
                        "text": text[:200],
                        "metadata": result.get("metadata", {})
                    })
    
    if not answer:
        answer = "No relevant information found in the knowledge graph."
    
    # Calculate confidence based on number and quality of results
    confidence = min(len(sources) * 0.2, 1.0) if sources else 0.0
    
    return {
        "query": query_text,
        "answer": answer.strip(),
        "confidence": confidence,
        "confidence_breakdown": {
            "result_count": len(sources),
            "search_type": raw_result.get("search_type", "unknown")
        },
        "sources": sources,
        "reasoning_trace": [
            {
                "step": "search",
                "query_time_ms": raw_result.get("query_time_ms", 0),
                "results_found": len(sources)
            }
        ],
        "timestamp": raw_result.get("timestamp", ""),
    }


@app.post("/cognee/query", response_model=CogneeQueryResponse)
async def cognee_query(request: CogneeQueryRequest):
    """
    Query Cognee knowledge graph with natural language (lazy-loaded).

    This endpoint provides:
    - Natural language query processing
    - Knowledge graph traversal
    - Historical context retrieval
    - Explainable answers with sources
    - Confidence scoring
    - Recommended actions

    NOTE: Cognee is lazy-loaded to minimize memory footprint.
    """
    try:
        from ai_insights.cognee import get_cognee_lazy_loader

        loader = get_cognee_lazy_loader()
        raw_result = await loader.query(request.query, request.context)

        if raw_result is None:
            return CogneeQueryResponse(
                success=False,
                query=request.query,
                answer="⚠️ Cognee knowledge graph unavailable",
                confidence=0.0,
                confidence_breakdown={},
                sources=[],
                reasoning_trace=[],
                timestamp="",
                error="Cognee failed to load or query",
            )

        # Transform raw Cognee response to expected format
        transformed = transform_cognee_response(raw_result, request.query)
        return CogneeQueryResponse(success=True, **transformed)

    except Exception as e:
        return CogneeQueryResponse(
            success=False,
            query=request.query,
            answer="",
            confidence=0.0,
            confidence_breakdown={},
            sources=[],
            reasoning_trace=[],
            timestamp="",
            error=str(e),
        )


@app.post("/cognee/ingest/products")
async def cognee_ingest_products(background_tasks: BackgroundTasks):
    """
    Ingest product snapshot into Cognee knowledge graph.

    This endpoint:
    - Fetches current product data from Supabase
    - Creates Product and RiskSignal entities
    - Establishes relationships
    - Preserves historical state
    """
    try:
        # Fetch products from Supabase
        products_data = await fetch_from_supabase(
            "products", params={"select": "*,readiness:product_readiness(*),prediction:product_predictions(*)"}
        )

        # Queue ingestion as background task
        job_id = f"cognee_ingest_{int(datetime.utcnow().timestamp())}"
        _job_status[job_id] = {
            "status": "queued",
            "progress": 0,
            "message": "Product ingestion queued",
        }

        async def ingest_products_background():
            try:
                from ingestion.product_snapshot import ProductSnapshotIngestion

                _job_status[job_id]["status"] = "processing"
                _job_status[job_id]["progress"] = 50

                ingestion = ProductSnapshotIngestion()
                stats = await ingestion.ingest_product_snapshot(products_data)

                _job_status[job_id]["status"] = "completed"
                _job_status[job_id]["progress"] = 100
                _job_status[job_id]["stats"] = stats

            except Exception as e:
                _job_status[job_id]["status"] = "failed"
                _job_status[job_id]["error"] = str(e)

        background_tasks.add_task(ingest_products_background)

        return {
            "success": True,
            "job_id": job_id,
            "message": "Product ingestion queued. Poll /cognee/ingest/status/{job_id} for progress.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue ingestion: {str(e)}")


@app.post("/cognee/ingest/actions")
async def cognee_ingest_actions(background_tasks: BackgroundTasks):
    """
    Ingest governance actions into Cognee knowledge graph.

    This endpoint:
    - Fetches actions from Supabase
    - Creates GovernanceAction entities
    - Links to RiskSignals
    - Creates Outcome entities for completed actions
    """
    try:
        # Fetch actions from Supabase
        actions_data = await fetch_from_supabase("actions", params={"select": "*"})

        # Queue ingestion as background task
        job_id = f"cognee_actions_{int(datetime.utcnow().timestamp())}"
        _job_status[job_id] = {
            "status": "queued",
            "progress": 0,
            "message": "Actions ingestion queued",
        }

        async def ingest_actions_background():
            try:
                from ingestion.governance_actions import GovernanceActionIngestion

                _job_status[job_id]["status"] = "processing"
                _job_status[job_id]["progress"] = 50

                ingestion = GovernanceActionIngestion()
                stats = await ingestion.ingest_batch_actions(actions_data)

                _job_status[job_id]["status"] = "completed"
                _job_status[job_id]["progress"] = 100
                _job_status[job_id]["stats"] = stats

            except Exception as e:
                _job_status[job_id]["status"] = "failed"
                _job_status[job_id]["error"] = str(e)

        background_tasks.add_task(ingest_actions_background)

        return {
            "success": True,
            "job_id": job_id,
            "message": "Actions ingestion queued. Poll /cognee/ingest/status/{job_id} for progress.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue ingestion: {str(e)}")


@app.get("/cognee/ingest/status/{job_id}")
async def get_cognee_ingest_status(job_id: str):
    """Get the status of a Cognee ingestion job."""
    if job_id not in _job_status:
        raise HTTPException(status_code=404, detail="Job not found")

    return _job_status[job_id]


# ============================================================================
# ADMIN ENDPOINTS - Protected by API Key
# ============================================================================

from ai_insights.admin_endpoints import get_cognee_status, reset_cognee, trigger_cognify


@app.post("/admin/cognee/cognify")
async def admin_trigger_cognify(x_admin_key: str = Header(None)):
    """
    [ADMIN] Manually trigger cognify() to build knowledge graph.

    WHY: cognify() is too heavy for query path (30+ min).
         Use this after ingesting data or on deployment.

    PROTECTED: Requires X-Admin-Key header

    Example:
        curl -X POST https://your-app.onrender.com/admin/cognee/cognify \
             -H "X-Admin-Key: your-secret-key"
    """
    return await trigger_cognify(x_admin_key)


@app.get("/admin/cognee/status")
async def admin_get_cognee_status(x_admin_key: str = Header(None)):
    """
    [ADMIN] Get Cognee system status and statistics.

    PROTECTED: Requires X-Admin-Key header
    """
    return await get_cognee_status(x_admin_key)


@app.post("/admin/cognee/reset")
async def admin_reset_cognee(x_admin_key: str = Header(None)):
    """
    [ADMIN] Reset Cognee knowledge graph (DANGEROUS).

    PROTECTED: Requires X-Admin-Key header
    """
    return await reset_cognee(x_admin_key)


# ============================================================================
# UNIFIED SYNC API - Syncs data to BOTH ChromaDB and Cognee
# ============================================================================

class SyncRequest(BaseModel):
    """Request model for unified sync endpoint."""
    source: str = "products"  # products, feedback, actions
    run_cognify: bool = True  # Whether to run cognify() after ingestion
    product_id: Optional[str] = None  # Optional filter for feedback


@app.post("/api/sync/ingest")
async def unified_sync_ingest(
    request: SyncRequest,
    background_tasks: BackgroundTasks,
):
    """
    🔄 UNIFIED SYNC: Ingest data into BOTH ChromaDB (RAG) and Cognee (Knowledge Graph).
    
    This endpoint ensures data consistency across both vector stores:
    1. Fetches data from Supabase
    2. Ingests into ChromaDB for fast RAG retrieval
    3. Ingests into Cognee for knowledge graph queries
    4. Optionally runs cognify() to build relationships
    
    Example:
        curl -X POST https://your-app.onrender.com/api/sync/ingest \\
             -H "Content-Type: application/json" \\
             -d '{"source": "products", "run_cognify": true}'
    """
    # Admin key check disabled to allow AI queries without authentication
    
    job_id = f"sync_{request.source}_{int(datetime.utcnow().timestamp())}"
    
    _job_status[job_id] = {
        "status": "queued",
        "progress": 0,
        "source": request.source,
        "chroma_status": "pending",
        "cognee_status": "pending",
        "cognify_status": "pending" if request.run_cognify else "skipped",
    }
    
    async def sync_background():
        """Background task to sync data to both stores."""
        try:
            from ai_insights.cognee import get_cognee_lazy_loader
            
            # Step 1: Fetch data from Supabase
            _job_status[job_id]["status"] = "fetching"
            _job_status[job_id]["progress"] = 10
            
            if request.source == "products":
                data = await fetch_from_supabase(
                    "products",
                    params={"select": "*,readiness:product_readiness(*),prediction:product_predictions(*)"}
                )
            elif request.source == "feedback":
                params = {"select": "*"}
                if request.product_id:
                    params["product_id"] = f"eq.{request.product_id}"
                data = await fetch_from_supabase("product_feedback", params=params)
            elif request.source == "actions":
                data = await fetch_from_supabase("governance_actions", params={"select": "*"})
            else:
                _job_status[job_id]["status"] = "failed"
                _job_status[job_id]["error"] = f"Unknown source: {request.source}"
                return
            
            if not data:
                _job_status[job_id]["status"] = "completed"
                _job_status[job_id]["message"] = "No data found to sync"
                return
            
            _job_status[job_id]["progress"] = 20
            _job_status[job_id]["records_found"] = len(data)
            
            # Step 2: Ingest into ChromaDB (RAG)
            _job_status[job_id]["status"] = "ingesting_chroma"
            _job_status[job_id]["chroma_status"] = "processing"
            
            try:
                loader = get_lazy_document_loader()
                
                if request.source == "products":
                    documents = loader.load_product_data(data)
                elif request.source == "feedback":
                    documents = loader.load_feedback_data(data)
                else:
                    # Convert actions to documents
                    documents = [
                        {
                            "id": action.get("id", f"action_{i}"),
                            "text": f"Action: {action.get('title', '')}. {action.get('description', '')}",
                            "metadata": {"source": "actions", "action_id": action.get("id")}
                        }
                        for i, action in enumerate(data)
                    ]
                
                chroma_count = loader.ingest_documents(documents)
                _job_status[job_id]["chroma_status"] = "completed"
                _job_status[job_id]["chroma_ingested"] = chroma_count
                _job_status[job_id]["progress"] = 50
                
            except Exception as e:
                _job_status[job_id]["chroma_status"] = f"failed: {str(e)}"
            
            # Step 3: Ingest into Cognee (Knowledge Graph)
            _job_status[job_id]["status"] = "ingesting_cognee"
            _job_status[job_id]["cognee_status"] = "processing"
            
            try:
                cognee_loader = get_cognee_lazy_loader()
                client = await cognee_loader.get_client()
                
                if client:
                    cognee_count = 0
                    for item in data:
                        try:
                            await client.add_data(item, node_set=request.source)
                            cognee_count += 1
                        except Exception as item_error:
                            print(f"Cognee item error: {item_error}")
                    
                    _job_status[job_id]["cognee_status"] = "completed"
                    _job_status[job_id]["cognee_ingested"] = cognee_count
                else:
                    _job_status[job_id]["cognee_status"] = "unavailable"
                
                _job_status[job_id]["progress"] = 75
                
            except Exception as e:
                _job_status[job_id]["cognee_status"] = f"failed: {str(e)}"
            
            # Step 4: Run cognify() if requested
            if request.run_cognify:
                _job_status[job_id]["status"] = "cognifying"
                _job_status[job_id]["cognify_status"] = "processing"
                
                try:
                    cognee_loader = get_cognee_lazy_loader()
                    client = await cognee_loader.get_client()
                    
                    if client:
                        await client.cognify()
                        _job_status[job_id]["cognify_status"] = "completed"
                    else:
                        _job_status[job_id]["cognify_status"] = "skipped (client unavailable)"
                        
                except Exception as e:
                    _job_status[job_id]["cognify_status"] = f"failed: {str(e)}"
            
            _job_status[job_id]["status"] = "completed"
            _job_status[job_id]["progress"] = 100
            _job_status[job_id]["timestamp"] = datetime.utcnow().isoformat()
            
        except Exception as e:
            _job_status[job_id]["status"] = "failed"
            _job_status[job_id]["error"] = str(e)
    
    # Queue background task
    background_tasks.add_task(sync_background)
    
    return {
        "success": True,
        "job_id": job_id,
        "message": f"Sync job queued for {request.source}. Poll /api/sync/status/{job_id} for progress.",
        "targets": ["ChromaDB (RAG)", "Cognee (Knowledge Graph)"],
        "run_cognify": request.run_cognify,
    }


@app.get("/api/sync/status/{job_id}")
async def get_sync_status(job_id: str):
    """Get the status of a sync job."""
    if job_id not in _job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return _job_status[job_id]


@app.post("/api/sync/webhook", tags=["sync"], summary="Supabase Webhook",
          description="Receives webhooks from Supabase to trigger data sync to ChromaDB and Cognee.")
async def sync_webhook(
    background_tasks: BackgroundTasks,
):
    """
    🔔 WEBHOOK: Trigger sync when external system updates data.
    
    Call this from Supabase Database Webhooks or external systems
    to automatically sync new data to both stores.
    
    Setup in Supabase:
    1. Go to Database > Webhooks
    2. Create webhook on products/feedback tables
    3. Set URL to https://your-app.onrender.com/api/sync/webhook
    
    ⚠️ DEBOUNCING: Webhook calls are debounced to prevent rapid re-syncs.
    Multiple calls within 60 seconds will be ignored.
    """
    global _last_webhook_sync, _webhook_sync_in_progress
    
    import time
    current_time = time.time()
    
    # Check if sync is already in progress
    if _webhook_sync_in_progress:
        logger.info("Webhook sync already in progress, skipping")
        return {"status": "skipped", "reason": "sync_in_progress"}
    
    # Check cooldown period
    time_since_last_sync = current_time - _last_webhook_sync
    if time_since_last_sync < _webhook_sync_cooldown:
        remaining = int(_webhook_sync_cooldown - time_since_last_sync)
        logger.info(f"Webhook sync on cooldown, {remaining}s remaining")
        return {"status": "skipped", "reason": "cooldown", "retry_after": remaining}
    
    # Mark sync as in progress and update timestamp
    _webhook_sync_in_progress = True
    _last_webhook_sync = current_time
    
    # Trigger full sync
    job_id = f"webhook_sync_{int(datetime.utcnow().timestamp())}"
    
    _job_status[job_id] = {
        "status": "queued",
        "triggered_by": "webhook",
        "progress": 0,
    }
    
    async def webhook_sync():
        """
        Sync ALL sources (products, feedback, actions) on webhook trigger.
        
        OPTIMIZATION: Uses asyncio.gather for parallel data fetching,
                      reducing total sync time by ~3x.
        """
        try:
            from ai_insights.cognee import get_cognee_lazy_loader
            
            loader = get_lazy_document_loader()
            cognee_loader = get_cognee_lazy_loader()
            client = await cognee_loader.get_client()
            
            sync_results = {
                "products": 0,
                "feedback": 0,
                "actions": 0,
            }
            
            # === PARALLEL FETCH: Get all data sources concurrently ===
            _job_status[job_id]["status"] = "fetching_data_parallel"
            _job_status[job_id]["progress"] = 10
            
            # Fetch all data in parallel using asyncio.gather
            fetch_results = await asyncio.gather(
                fetch_from_supabase(
                    "products",
                    params={"select": "*,readiness:product_readiness(*),prediction:product_predictions(*)"}
                ),
                fetch_from_supabase(
                    "product_feedback",
                    params={"select": "*,product:products(name)"}
                ),
                fetch_from_supabase(
                    "product_actions",
                    params={"select": "*,product:products(name)"}
                ),
                return_exceptions=True  # Don't fail if one source errors
            )
            
            # Unpack results, handling any errors
            products = fetch_results[0] if not isinstance(fetch_results[0], Exception) else []
            feedback = fetch_results[1] if not isinstance(fetch_results[1], Exception) else []
            actions = fetch_results[2] if not isinstance(fetch_results[2], Exception) else []
            
            # Log any fetch errors
            for i, (name, result) in enumerate([("products", fetch_results[0]), 
                                                  ("feedback", fetch_results[1]), 
                                                  ("actions", fetch_results[2])]):
                if isinstance(result, Exception):
                    logger.warning(f"Failed to fetch {name}: {result}")
            
            _job_status[job_id]["progress"] = 25
            _job_status[job_id]["records_fetched"] = {
                "products": len(products),
                "feedback": len(feedback),
                "actions": len(actions)
            }
            
            # === 1. SYNC PRODUCTS ===
            _job_status[job_id]["status"] = "syncing_products"
            _job_status[job_id]["progress"] = 30
            
            if products:
                # ChromaDB
                documents = loader.load_product_data(products)
                loader.ingest_documents(documents)
                
                # Cognee - add with error handling for duplicates
                if client:
                    for product in products:
                        try:
                            await client.add_data(product, node_set="products")
                        except Exception as e:
                            # Log but continue - duplicate data is OK
                            logger.debug(f"Cognee add_data skipped (likely duplicate): {e}")
                
                sync_results["products"] = len(products)
            
            # === 2. SYNC FEEDBACK ===
            _job_status[job_id]["status"] = "syncing_feedback"
            _job_status[job_id]["progress"] = 50
            
            if feedback:
                # Cognee - add feedback as knowledge (with error handling)
                if client:
                    for item in feedback:
                        try:
                            # Derive sentiment label from score
                            score = item.get("sentiment_score", 0) or 0
                            sentiment = "positive" if score > 0.3 else "negative" if score < -0.3 else "neutral"
                            
                            # Enrich feedback with product name for better context
                            feedback_text = {
                                "type": "feedback",
                                "product_name": item.get("product", {}).get("name", "Unknown") if item.get("product") else "Unknown",
                                "theme": item.get("theme", "general"),
                                "content": item.get("raw_text", ""),
                                "sentiment": sentiment,
                                "sentiment_score": score,
                                "impact_level": item.get("impact_level", "MEDIUM"),
                                "source": item.get("source", "unknown"),
                                "created_at": str(item.get("created_at", "")),
                            }
                            await client.add_data(feedback_text, node_set="feedback")
                        except Exception as e:
                            logger.debug(f"Cognee feedback add skipped (likely duplicate): {e}")
                
                sync_results["feedback"] = len(feedback)
            
            # === 3. SYNC ACTIONS ===
            _job_status[job_id]["status"] = "syncing_actions"
            _job_status[job_id]["progress"] = 70
            
            if actions:
                # Cognee - add actions as knowledge (with error handling)
                if client:
                    for item in actions:
                        try:
                            action_text = {
                                "type": "action",
                                "product_name": item.get("product", {}).get("name", "Unknown") if item.get("product") else "Unknown",
                                "action_type": item.get("action_type", "general"),
                                "description": item.get("description", ""),
                                "status": item.get("status", "pending"),
                                "assigned_to": item.get("assigned_to", "unassigned"),
                                "created_at": str(item.get("created_at", "")),
                            }
                            await client.add_data(action_text, node_set="actions")
                        except Exception as e:
                            logger.debug(f"Cognee action add skipped (likely duplicate): {e}")
                
                sync_results["actions"] = len(actions)
            
            # === 4. BUILD KNOWLEDGE GRAPH ===
            _job_status[job_id]["status"] = "building_knowledge_graph"
            _job_status[job_id]["progress"] = 90
            
            if client:
                try:
                    await client.cognify()
                except Exception as e:
                    # Cognify may fail on duplicate data, that's OK
                    logger.warning(f"Cognify warning (data may already exist): {e}")
            
            _job_status[job_id]["status"] = "completed"
            _job_status[job_id]["progress"] = 100
            _job_status[job_id]["products_synced"] = sync_results["products"]
            _job_status[job_id]["feedback_synced"] = sync_results["feedback"]
            _job_status[job_id]["actions_synced"] = sync_results["actions"]
            logger.info(f"Webhook sync completed: {sync_results}")
            
        except Exception as e:
            _job_status[job_id]["status"] = "failed"
            _job_status[job_id]["error"] = str(e)
            logger.error(f"Webhook sync failed: {e}")
        finally:
            # Always clear the in-progress flag
            global _webhook_sync_in_progress
            _webhook_sync_in_progress = False
    
    background_tasks.add_task(webhook_sync)
    
    return {
        "success": True,
        "job_id": job_id,
        "message": "Webhook sync triggered",
    }


if __name__ == "__main__":
    import signal

    import uvicorn

    # Graceful shutdown handler
    shutdown_event = asyncio.Event()

    def handle_shutdown(signum, frame):
        """Handle shutdown signals gracefully."""
        logger.info("Shutdown signal received, cleaning up...")
        shutdown_event.set()

    # Register signal handlers
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    # Use PORT env var for cloud deployment (Render, Railway, etc.)
    port = int(os.environ.get("PORT", API_PORT))
    logger.info(f"Starting AI Insights server on {API_HOST}:{port}")

    # Configure uvicorn with graceful shutdown
    config = uvicorn.Config(
        app,
        host=API_HOST,
        port=port,
        log_level="info",
        access_log=True,
        timeout_keep_alive=5,
        timeout_graceful_shutdown=30,  # 30 seconds for graceful shutdown
    )
    server = uvicorn.Server(config)

    try:
        server.run()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, shutting down...")
    finally:
        logger.info("Server shutdown complete")
