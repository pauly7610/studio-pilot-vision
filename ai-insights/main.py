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
from fastapi import BackgroundTasks, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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


# Initialize FastAPI with the lifespan
app = FastAPI(
    title="Studio Pilot AI Insights",
    description="RAG-powered AI insights for product management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Studio Pilot AI Insights",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """Detailed health check."""
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


# In-memory job status tracking (use Redis in production)
_job_status: dict = {}


def process_jira_csv_background(job_id: str, csv_text: str, filename: str):
    """Background task to process Jira CSV."""
    from jira_parser import get_ingestion_summary, parse_jira_csv

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


@app.post("/ai/query")
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

        # Result is already UnifiedAIResponse, return as dict
        return result.dict()

    except Exception as e:
        from ai_insights.models import UnifiedAIResponse

        error_response = UnifiedAIResponse.create_error_response(
            query=request.query, error_message=f"Orchestration failed: {str(e)}"
        )
        return error_response.dict()


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
        result = await loader.query(request.query, request.context)

        if result is None:
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

        return CogneeQueryResponse(success=True, **result)

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
            "products", params={"select": "*,readiness(*),prediction(*)"}
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

from admin_endpoints import get_cognee_status, reset_cognee, trigger_cognify


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
