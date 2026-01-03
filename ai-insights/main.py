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
                "message": f"Successfully ingested '{filename}'{ocr_msg} - {chroma_count} chunks to RAG" + (", added to knowledge base (relationships build on next sync)" if cognee_success else "")
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


@app.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...), 
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
    x_admin_key: str = Header(None)
):
    """
    🔄 UNIFIED SYNC: Ingest data into BOTH ChromaDB (RAG) and Cognee (Knowledge Graph).
    
    This endpoint ensures data consistency across both vector stores:
    1. Fetches data from Supabase
    2. Ingests into ChromaDB for fast RAG retrieval
    3. Ingests into Cognee for knowledge graph queries
    4. Optionally runs cognify() to build relationships
    
    PROTECTED: Requires X-Admin-Key header
    
    Example:
        curl -X POST https://your-app.onrender.com/api/sync/ingest \\
             -H "X-Admin-Key: your-secret-key" \\
             -H "Content-Type: application/json" \\
             -d '{"source": "products", "run_cognify": true}'
    """
    # Verify admin key
    expected_key = os.getenv("ADMIN_API_KEY")
    if not expected_key or x_admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid or missing admin key")
    
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


@app.post("/api/sync/webhook")
async def sync_webhook(
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(None)
):
    """
    🔔 WEBHOOK: Trigger sync when external system updates data.
    
    Call this from Supabase Database Webhooks or external systems
    to automatically sync new data to both stores.
    
    PROTECTED: Requires X-Webhook-Secret header
    
    Setup in Supabase:
    1. Go to Database > Webhooks
    2. Create webhook on products/feedback tables
    3. Set URL to https://your-app.onrender.com/api/sync/webhook
    4. Add header X-Webhook-Secret with your secret
    """
    expected_secret = os.getenv("WEBHOOK_SECRET") or os.getenv("ADMIN_API_KEY")
    if not expected_secret or x_webhook_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
    
    # Trigger full sync
    job_id = f"webhook_sync_{int(datetime.utcnow().timestamp())}"
    
    _job_status[job_id] = {
        "status": "queued",
        "triggered_by": "webhook",
        "progress": 0,
    }
    
    async def webhook_sync():
        """Sync ALL sources (products, feedback, actions) on webhook trigger."""
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
            
            # === 1. SYNC PRODUCTS ===
            _job_status[job_id]["status"] = "syncing_products"
            _job_status[job_id]["progress"] = 10
            
            products = await fetch_from_supabase(
                "products",
                params={"select": "*,readiness:product_readiness(*),prediction:product_predictions(*)"}
            )
            
            if products:
                # ChromaDB
                documents = loader.load_product_data(products)
                loader.ingest_documents(documents)
                
                # Cognee
                if client:
                    for product in products:
                        await client.add_data(product, node_set="products")
                
                sync_results["products"] = len(products)
            
            # === 2. SYNC FEEDBACK ===
            _job_status[job_id]["status"] = "syncing_feedback"
            _job_status[job_id]["progress"] = 40
            
            feedback = await fetch_from_supabase(
                "product_feedback",
                params={"select": "*,product:products(name)"}
            )
            
            if feedback:
                # Cognee - add feedback as knowledge
                if client:
                    for item in feedback:
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
                
                sync_results["feedback"] = len(feedback)
            
            # === 3. SYNC ACTIONS ===
            _job_status[job_id]["status"] = "syncing_actions"
            _job_status[job_id]["progress"] = 70
            
            actions = await fetch_from_supabase(
                "product_actions",
                params={"select": "*,product:products(name)"}
            )
            
            if actions:
                # Cognee - add actions as knowledge
                if client:
                    for item in actions:
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
                
                sync_results["actions"] = len(actions)
            
            # === 4. BUILD KNOWLEDGE GRAPH ===
            _job_status[job_id]["status"] = "building_knowledge_graph"
            _job_status[job_id]["progress"] = 90
            
            if client:
                await client.cognify()
            
            _job_status[job_id]["status"] = "completed"
            _job_status[job_id]["progress"] = 100
            _job_status[job_id]["products_synced"] = sync_results["products"]
            _job_status[job_id]["feedback_synced"] = sync_results["feedback"]
            _job_status[job_id]["actions_synced"] = sync_results["actions"]
            
        except Exception as e:
            _job_status[job_id]["status"] = "failed"
            _job_status[job_id]["error"] = str(e)
    
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
