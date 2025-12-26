"""Configuration for AI Insights RAG Pipeline"""
import os
from dotenv import load_dotenv

load_dotenv()

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  # Or use kimi-k2 when available

# Milvus Configuration
# Use Milvus Lite for local dev (no Docker needed!)
# Set MILVUS_MODE=server to connect to external Milvus server
MILVUS_MODE = os.getenv("MILVUS_MODE", "lite")  # "lite" or "server"
MILVUS_LITE_PATH = os.getenv("MILVUS_LITE_PATH", "./milvus_data.db")
MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = int(os.getenv("MILVUS_PORT", "19530"))
MILVUS_COLLECTION = os.getenv("MILVUS_COLLECTION", "studio_pilot_insights")

# Embedding Configuration
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDING_DIM = 384  # Dimension for MiniLM-L6-v2
BINARY_DIM = EMBEDDING_DIM // 8  # Binary quantized dimension (48 bytes)

# Retrieval Configuration
TOP_K = int(os.getenv("TOP_K", "5"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))

# Document Processing
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))
DOCUMENTS_PATH = os.getenv("DOCUMENTS_PATH", "./documents")

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8001"))

# Supabase Configuration (for fetching product data)
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
