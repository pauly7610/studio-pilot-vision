"""FastAPI Server for AI Insights RAG Pipeline"""
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from jira_parser import parse_jira_csv, get_ingestion_summary, match_products

from config import API_HOST, API_PORT, SUPABASE_URL, SUPABASE_KEY
from document_loader import get_document_loader
from retrieval import get_retrieval_pipeline
from generator import get_generator

app = FastAPI(
    title="Studio Pilot AI Insights",
    description="RAG-powered AI insights for product management",
    version="1.0.0",
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
    sources: Optional[List[dict]] = None
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
    from vector_store import get_vector_store
    
    vs = get_vector_store()
    vector_count = vs.count()
    
    return {
        "status": "healthy",
        "vector_store": {
            "connected": vector_count >= 0,
            "document_count": vector_count,
        },
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
    }


@app.post("/query", response_model=InsightResponse)
async def query_insights(request: QueryRequest):
    """
    Query the RAG pipeline for insights.
    
    This endpoint:
    1. Embeds the query using binary quantization
    2. Retrieves top-k similar chunks using Hamming distance
    3. Generates an insight using Groq LLM
    """
    retrieval = get_retrieval_pipeline()
    generator = get_generator()
    
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
            }
        )
        
        if not products:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product = products[0]
        
        # Generate insight
        generator = get_generator()
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
        generator = get_generator()
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
    loader = get_document_loader()
    
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
                }
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
    from vector_store import get_vector_store
    
    vs = get_vector_store()
    
    return {
        "total_vectors": vs.count(),
        "collection": vs.collection_name,
    }


# In-memory job status tracking (use Redis in production)
_job_status: dict = {}


def process_jira_csv_background(job_id: str, csv_text: str, filename: str):
    """Background task to process Jira CSV."""
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
        loader = get_document_loader()
        
        loader_docs = []
        for doc in documents:
            loader_docs.append({
                "id": doc["id"],
                "text": doc["text"],
                "metadata": doc["metadata"],
            })
        
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
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read file content
        content = await file.read()
        csv_text = content.decode('utf-8')
        
        # Quick validation - just check if it parses
        import hashlib
        job_id = hashlib.md5(f"{file.filename}_{len(csv_text)}".encode()).hexdigest()[:12]
        
        # Check if same job already running
        if job_id in _job_status and _job_status[job_id].get("status") in ["parsing", "processing", "ingesting"]:
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


if __name__ == "__main__":
    import uvicorn
    
    # Use PORT env var for cloud deployment (Render, Railway, etc.)
    port = int(os.environ.get("PORT", API_PORT))
    print(f"Starting AI Insights server on {API_HOST}:{port}")
    uvicorn.run(app, host=API_HOST, port=port)
