"""
Shared pytest fixtures for AI Insights tests.

This module provides reusable fixtures for mocking:
- Environment variables
- External services (Supabase, Groq, HuggingFace)
- Internal components (vector store, retrieval, generator)
- FastAPI test clients
"""

import os
from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ============================================================================
# ENVIRONMENT FIXTURES
# ============================================================================


@pytest.fixture
def mock_env(monkeypatch) -> None:
    """Set up all environment variables for testing."""
    env_vars = {
        "GROQ_API_KEY": "test-groq-key",
        "HUGGINGFACE_API_KEY": "test-hf-key",
        "LLM_API_KEY": "test-llm-key",
        "EMBEDDING_API_KEY": "test-embed-key",
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_KEY": "test-supabase-key",
        "ADMIN_API_KEY": "test-admin-key",
        "LLM_MODEL": "llama-3.1-70b-versatile",
        "COGNEE_DATA_PATH": "./test_cognee_data",
        "API_HOST": "0.0.0.0",
        "API_PORT": "8000",
    }
    for key, value in env_vars.items():
        monkeypatch.setenv(key, value)


@pytest.fixture
def clean_env(monkeypatch) -> None:
    """Remove all optional environment variables for testing defaults."""
    optional_vars = [
        "GROQ_API_KEY",
        "HUGGINGFACE_API_KEY",
        "LLM_API_KEY",
        "EMBEDDING_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "ADMIN_API_KEY",
        "LLM_MODEL",
        "COGNEE_DATA_PATH",
    ]
    for var in optional_vars:
        monkeypatch.delenv(var, raising=False)


# ============================================================================
# COMPONENT MOCK FIXTURES
# ============================================================================


@pytest.fixture
def mock_vector_store() -> MagicMock:
    """Mock vector store with common methods."""
    mock = MagicMock()
    mock.count.return_value = 100
    mock.collection_name = "test_collection"
    mock.add.return_value = True
    mock.search.return_value = [
        {"id": "1", "text": "Test doc 1", "score": 0.95},
        {"id": "2", "text": "Test doc 2", "score": 0.87},
    ]
    mock.delete.return_value = True
    mock.update.return_value = True
    return mock


@pytest.fixture
def mock_retrieval() -> MagicMock:
    """Mock retrieval pipeline with common methods."""
    mock = MagicMock()
    mock.retrieve.return_value = [
        {"text": "Retrieved chunk 1", "metadata": {"source": "doc1.pdf"}, "score": 0.92},
        {"text": "Retrieved chunk 2", "metadata": {"source": "doc2.pdf"}, "score": 0.88},
    ]
    mock.retrieve_for_product.return_value = [
        {"text": "Product specific chunk", "metadata": {"product_id": "P001"}, "score": 0.95},
    ]
    mock.retrieve_with_context.return_value = [
        {"text": "Context aware chunk", "metadata": {"context": "test"}, "score": 0.90},
    ]
    return mock


@pytest.fixture
def mock_generator() -> MagicMock:
    """Mock generator with common methods."""
    mock = MagicMock()
    mock.generate.return_value = {
        "success": True,
        "insight": "Generated insight based on retrieved context.",
        "sources": [{"source": "doc1.pdf", "text": "relevant chunk"}],
        "usage": {"prompt_tokens": 150, "completion_tokens": 50, "total_tokens": 200},
    }
    mock.generate_product_insight.return_value = {
        "success": True,
        "insight": "Product-specific insight.",
        "sources": [],
    }
    mock.generate_portfolio_insight.return_value = {
        "success": True,
        "insight": "Portfolio-wide insight.",
        "sources": [],
    }
    mock.generate_streaming.return_value = iter(["Chunk 1", "Chunk 2", "Chunk 3"])
    return mock


@pytest.fixture
def mock_document_loader() -> MagicMock:
    """Mock document loader with common methods."""
    mock = MagicMock()
    mock.ingest_from_directory.return_value = 10
    mock.load_product_data.return_value = [
        {"id": "doc1", "text": "Product data", "metadata": {"type": "product"}}
    ]
    mock.load_feedback_data.return_value = [
        {"id": "doc2", "text": "Feedback data", "metadata": {"type": "feedback"}}
    ]
    mock.ingest_documents.return_value = 5
    mock.chunk_text.return_value = ["chunk1", "chunk2", "chunk3"]
    return mock


@pytest.fixture
def mock_cognee_client() -> MagicMock:
    """Mock Cognee client with common methods."""
    mock = MagicMock()
    mock.initialize = AsyncMock(return_value=True)
    mock.add_data = AsyncMock(return_value=True)
    mock.query = AsyncMock(
        return_value={
            "answer": "Cognee-generated answer",
            "confidence": 0.85,
            "sources": [{"entity": "Product", "relationship": "HAS_RISK"}],
            "reasoning_trace": [{"step": "Entity extraction", "result": "Found 3 entities"}],
        }
    )
    mock.cognify = AsyncMock(return_value={"nodes": 100, "edges": 250})
    mock.reset = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_cognee_loader(mock_cognee_client) -> MagicMock:
    """Mock Cognee lazy loader."""
    mock = MagicMock()
    mock.get_client = AsyncMock(return_value=mock_cognee_client)
    mock.query = AsyncMock(
        return_value={
            "query": "test query",
            "answer": "Test answer from Cognee",
            "confidence": 0.85,
            "confidence_breakdown": {"source_quality": 0.9, "coverage": 0.8},
            "sources": [],
            "reasoning_trace": [],
            "timestamp": "2024-01-01T00:00:00Z",
        }
    )
    mock.is_available = MagicMock(return_value=True)
    return mock


@pytest.fixture
def mock_orchestrator() -> MagicMock:
    """Mock orchestrator with common methods."""
    mock = MagicMock()
    mock.orchestrate = AsyncMock()

    # Create a mock response object with dict() method
    mock_response = MagicMock()
    mock_response.dict.return_value = {
        "success": True,
        "query": "test query",
        "answer": "Orchestrated answer",
        "confidence": 0.9,
        "source_type": "hybrid",
        "sources": {"memory": [], "retrieval": []},
        "reasoning_trace": [{"step": "intent_classification", "result": "factual"}],
        "guardrails": {"answer_type": "factual", "warnings": []},
        "timestamp": "2024-01-01T00:00:00Z",
    }
    mock.orchestrate.return_value = mock_response
    return mock


# ============================================================================
# HTTP CLIENT FIXTURES
# ============================================================================


@pytest.fixture
def mock_httpx_client() -> MagicMock:
    """Mock httpx.AsyncClient for Supabase calls."""
    mock_response = MagicMock()
    mock_response.json.return_value = []
    mock_response.raise_for_status = MagicMock()
    mock_response.status_code = 200

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.post.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    return mock_client


@pytest.fixture
def mock_supabase_products(mock_httpx_client) -> MagicMock:
    """Mock Supabase returning product data."""
    mock_httpx_client.get.return_value.json.return_value = [
        {
            "id": "P001",
            "name": "Test Product",
            "status": "active",
            "readiness": {"score": 0.8},
            "prediction": {"risk_level": "low"},
        }
    ]
    return mock_httpx_client


# ============================================================================
# FASTAPI TEST CLIENT FIXTURES
# ============================================================================


@pytest.fixture
def mock_modules() -> dict:
    """Create mock modules for patching sys.modules."""
    return {
        "ai_insights.config": MagicMock(
            API_HOST="0.0.0.0",
            API_PORT=8000,
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_KEY="test-key",
            get_logger=MagicMock(return_value=MagicMock()),
        ),
        "ai_insights.utils": MagicMock(
            set_system_info=MagicMock(),
            update_cognee_availability=MagicMock(),
            get_generator=MagicMock(),
        ),
        "admin_endpoints": MagicMock(
            trigger_cognify=AsyncMock(return_value={"status": "triggered"}),
            get_cognee_status=AsyncMock(return_value={"status": "ready"}),
            reset_cognee=AsyncMock(return_value={"status": "reset"}),
        ),
    }


@pytest.fixture
def app_with_mocks(
    mock_env,
    mock_modules,
    mock_vector_store,
    mock_retrieval,
    mock_generator,
    mock_document_loader,
):
    """Create FastAPI app with all dependencies mocked."""
    with patch.dict("sys.modules", mock_modules):
        with (
            patch("main.get_lazy_vector_store", return_value=mock_vector_store),
            patch("main.get_lazy_retrieval", return_value=mock_retrieval),
            patch("main.get_lazy_generator", return_value=mock_generator),
            patch("main.get_lazy_document_loader", return_value=mock_document_loader),
            patch("main.background_warmup", new_callable=AsyncMock),
            patch("main._cognee_initialized", True),
        ):

            from main import app

            yield app


@pytest.fixture
def client(app_with_mocks):
    """Create synchronous test client."""
    from fastapi.testclient import TestClient

    return TestClient(app_with_mocks, raise_server_exceptions=False)


@pytest.fixture
async def async_client(app_with_mocks):
    """Create asynchronous test client."""
    from httpx import ASGITransport, AsyncClient

    async with AsyncClient(
        transport=ASGITransport(app=app_with_mocks), base_url="http://test"
    ) as ac:
        yield ac


# ============================================================================
# DATA FIXTURES
# ============================================================================


@pytest.fixture
def sample_query_request() -> dict:
    """Sample query request data."""
    return {
        "query": "What are the risks for Product A?",
        "product_id": "P001",
        "top_k": 5,
        "include_sources": True,
    }


@pytest.fixture
def sample_product_insight_request() -> dict:
    """Sample product insight request data."""
    return {
        "product_id": "P001",
        "insight_type": "summary",
    }


@pytest.fixture
def sample_portfolio_insight_request() -> dict:
    """Sample portfolio insight request data."""
    return {
        "query": "What products need immediate attention?",
        "filters": {"status": "active"},
    }


@pytest.fixture
def sample_unified_query_request() -> dict:
    """Sample unified query request data."""
    return {
        "query": "Why did product X fail last quarter?",
        "context": {"product_id": "P001", "time_range": "Q3 2024"},
    }


@pytest.fixture
def sample_cognee_query_request() -> dict:
    """Sample Cognee query request data."""
    return {
        "query": "What patterns led to risk escalations?",
        "context": {"domain": "governance"},
    }


@pytest.fixture
def sample_jira_csv() -> bytes:
    """Sample Jira CSV content."""
    return b"""Issue Key,Summary,Description,Status,Priority
TEST-1,Test Issue 1,Description for issue 1,Open,High
TEST-2,Test Issue 2,Description for issue 2,Closed,Medium
TEST-3,Test Issue 3,Description for issue 3,In Progress,Low
"""


@pytest.fixture
def sample_products_data() -> list:
    """Sample products data from Supabase."""
    return [
        {
            "id": "P001",
            "name": "Product Alpha",
            "status": "active",
            "risk_level": "medium",
            "readiness": {"score": 0.75, "factors": ["compliance", "market"]},
            "prediction": {"confidence": 0.82, "trend": "stable"},
        },
        {
            "id": "P002",
            "name": "Product Beta",
            "status": "development",
            "risk_level": "high",
            "readiness": {"score": 0.45, "factors": ["technical", "resources"]},
            "prediction": {"confidence": 0.65, "trend": "improving"},
        },
    ]


@pytest.fixture
def sample_feedback_data() -> list:
    """Sample feedback data from Supabase."""
    return [
        {
            "id": "F001",
            "product_id": "P001",
            "text": "Great product but needs better documentation.",
            "sentiment": "positive",
            "created_at": "2024-01-15T10:00:00Z",
        },
        {
            "id": "F002",
            "product_id": "P001",
            "text": "Performance issues on mobile.",
            "sentiment": "negative",
            "created_at": "2024-01-16T14:30:00Z",
        },
    ]


# ============================================================================
# ASYNC UTILITIES
# ============================================================================


@pytest.fixture
def event_loop():
    """Create event loop for async tests."""
    import asyncio

    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# CLEANUP FIXTURES
# ============================================================================


@pytest.fixture(autouse=True)
def reset_globals():
    """Reset global state between tests."""
    yield
    # Clean up any module-level state if needed
    import sys

    # Remove cached modules that might have test state
    # Include ai_insights modules to ensure clean imports for admin endpoint tests
    prefixes_to_remove = ["main", "ai_insights.admin_endpoints"]
    modules_to_remove = [
        k for k in sys.modules.keys() 
        if any(k.startswith(prefix) or k == prefix for prefix in prefixes_to_remove)
    ]
    for mod in modules_to_remove:
        del sys.modules[mod]
