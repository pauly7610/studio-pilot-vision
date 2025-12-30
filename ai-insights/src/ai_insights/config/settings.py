"""
Pydantic Settings Validation
Centralized configuration management with validation.
"""

import os
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings


class CogneeSettings(BaseModel):
    """Cognee-specific configuration."""

    data_path: str = Field(default="./cognee_data")
    llm_model: str = Field(default="groq/llama-3.3-70b-versatile")
    llm_provider: str = Field(default="custom")
    llm_endpoint: str = Field(default="https://api.groq.com/openai/v1")
    embedding_model: str = Field(default="huggingface/sentence-transformers/all-MiniLM-L6-v2")
    embedding_provider: str = Field(default="custom")
    embedding_endpoint: str = Field(
        default="https://api-inference.huggingface.co/pipeline/feature-extraction"
    )
    embedding_dimensions: int = Field(default=384)
    vector_db_provider: str = Field(default="lancedb")
    graph_db_provider: str = Field(default="networkx")


class MilvusSettings(BaseModel):
    """Milvus vector database configuration."""

    mode: str = Field(default="lite")
    lite_path: str = Field(default="./milvus_data.db")
    host: str = Field(default="localhost")
    port: int = Field(default=19530)
    collection: str = Field(default="studio_pilot_insights")


class RetrievalSettings(BaseModel):
    """RAG retrieval configuration."""

    top_k: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    chunk_size: int = Field(default=512, ge=128, le=2048)
    chunk_overlap: int = Field(default=50, ge=0, le=256)

    @field_validator("chunk_overlap")
    @classmethod
    def validate_overlap(cls, v, info):
        chunk_size = info.data.get("chunk_size", 512)
        if v >= chunk_size:
            raise ValueError(f"chunk_overlap ({v}) must be less than chunk_size ({chunk_size})")
        return v


class APISettings(BaseModel):
    """API server configuration."""

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8001, ge=1024, le=65535)


class Settings(BaseSettings):
    """
    Main application settings with validation.

    All settings are loaded from environment variables with fallback defaults.
    Required settings will raise validation errors if not provided.
    """

    # API Keys (required)
    groq_api_key: str = Field(..., min_length=1)
    huggingface_api_key: Optional[str] = Field(default=None)

    # LLM Configuration
    groq_model: str = Field(default="llama-3.3-70b-versatile")

    # Embedding Configuration
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    embedding_dim: int = Field(default=384)

    # Supabase (optional)
    supabase_url: Optional[str] = Field(default=None, alias="VITE_SUPABASE_URL")
    supabase_key: Optional[str] = Field(default=None, alias="VITE_SUPABASE_PUBLISHABLE_KEY")

    # Documents path
    documents_path: str = Field(default="./documents")

    # Sub-configurations
    cognee: CogneeSettings = Field(default_factory=CogneeSettings)
    milvus: MilvusSettings = Field(default_factory=MilvusSettings)
    retrieval: RetrievalSettings = Field(default_factory=RetrievalSettings)
    api: APISettings = Field(default_factory=APISettings)

    # Logging
    log_level: str = Field(default="INFO")
    log_file: Optional[str] = Field(default=None)

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
        "populate_by_name": True,
    }

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"log_level must be one of {valid_levels}")
        return v_upper

    def setup_cognee_env(self):
        """Setup Cognee environment variables from settings."""
        if not os.getenv("LLM_API_KEY"):
            os.environ["LLM_API_KEY"] = self.groq_api_key

        if self.huggingface_api_key and not os.getenv("EMBEDDING_API_KEY"):
            os.environ["EMBEDDING_API_KEY"] = self.huggingface_api_key

        os.environ["LLM_PROVIDER"] = self.cognee.llm_provider
        os.environ["LLM_MODEL"] = self.cognee.llm_model
        os.environ["LLM_ENDPOINT"] = self.cognee.llm_endpoint
        os.environ["EMBEDDING_PROVIDER"] = self.cognee.embedding_provider
        os.environ["EMBEDDING_MODEL"] = self.cognee.embedding_model
        os.environ["EMBEDDING_ENDPOINT"] = self.cognee.embedding_endpoint
        os.environ["EMBEDDING_DIMENSIONS"] = str(self.cognee.embedding_dimensions)
        os.environ["VECTOR_DB_PROVIDER"] = self.cognee.vector_db_provider
        os.environ["GRAPH_DB_PROVIDER"] = self.cognee.graph_db_provider
        os.environ["COGNEE_DATA_DIR"] = self.cognee.data_path
        os.environ["ENABLE_BACKEND_ACCESS_CONTROL"] = "false"


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create the global settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
        _settings.setup_cognee_env()
    return _settings


def reload_settings() -> Settings:
    """Force reload settings (useful for testing)."""
    global _settings
    _settings = Settings()
    _settings.setup_cognee_env()
    return _settings
