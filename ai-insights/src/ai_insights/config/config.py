"""
Configuration for AI Insights RAG Pipeline
DEPRECATED: Use settings.py with Pydantic validation instead.
This file is kept for backward compatibility.
"""

import os

from dotenv import load_dotenv

load_dotenv()

try:
    from settings import get_settings

    _settings = get_settings()

    GROQ_API_KEY = _settings.groq_api_key
    GROQ_MODEL = _settings.groq_model

    MILVUS_MODE = _settings.milvus.mode
    MILVUS_LITE_PATH = _settings.milvus.lite_path
    MILVUS_HOST = _settings.milvus.host
    MILVUS_PORT = _settings.milvus.port
    MILVUS_COLLECTION = _settings.milvus.collection

    EMBEDDING_MODEL = _settings.embedding_model
    EMBEDDING_DIM = _settings.embedding_dim
    BINARY_DIM = EMBEDDING_DIM // 8

    TOP_K = _settings.retrieval.top_k
    SIMILARITY_THRESHOLD = _settings.retrieval.similarity_threshold

    CHUNK_SIZE = _settings.retrieval.chunk_size
    CHUNK_OVERLAP = _settings.retrieval.chunk_overlap
    DOCUMENTS_PATH = _settings.documents_path

    API_HOST = _settings.api.host
    API_PORT = _settings.api.port

    SUPABASE_URL = _settings.supabase_url or ""
    SUPABASE_KEY = _settings.supabase_key or ""

except Exception:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    MILVUS_MODE = os.getenv("MILVUS_MODE", "lite")
    MILVUS_LITE_PATH = os.getenv("MILVUS_LITE_PATH", "./milvus_data.db")
    MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
    MILVUS_PORT = int(os.getenv("MILVUS_PORT", "19530"))
    MILVUS_COLLECTION = os.getenv("MILVUS_COLLECTION", "studio_pilot_insights")

    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    EMBEDDING_DIM = 384
    BINARY_DIM = EMBEDDING_DIM // 8

    TOP_K = int(os.getenv("TOP_K", "5"))
    SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))

    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))
    DOCUMENTS_PATH = os.getenv("DOCUMENTS_PATH", "./documents")

    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8001"))

    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
