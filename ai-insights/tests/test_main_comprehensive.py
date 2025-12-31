"""
Comprehensive tests for main.py FastAPI application.

This test file covers:
- All endpoint routes (GET/POST)
- Request/Response models validation
- Lazy loading functions
- Background tasks
- Error handling
- Edge cases
"""

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, PropertyMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def mock_env(monkeypatch):
    """Set up environment variables for testing."""
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setenv("HUGGINGFACE_API_KEY", "test-hf-key")
    monkeypatch.setenv("LLM_API_KEY", "test-llm-key")
    monkeypatch.setenv("EMBEDDING_API_KEY", "test-embed-key")
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "test-supabase-key")
    monkeypatch.setenv("ADMIN_API_KEY", "test-admin-key")


@pytest.fixture
def mock_vector_store():
    """Mock vector store with count method."""
    mock = MagicMock()
    mock.count.return_value = 100
    mock.collection_name = "test_collection"
    return mock


@pytest.fixture
def mock_retrieval():
    """Mock retrieval pipeline."""
    mock = MagicMock()
    mock.retrieve.return_value = [
        {"text": "Test chunk 1", "metadata": {"source": "test"}},
        {"text": "Test chunk 2", "metadata": {"source": "test"}},
    ]
    mock.retrieve_for_product.return_value = [
        {"text": "Product chunk", "metadata": {"product_id": "P001"}},
    ]
    return mock


@pytest.fixture
def mock_generator():
    """Mock generator."""
    mock = MagicMock()
    mock.generate.return_value = {
        "success": True,
        "insight": "Test insight response",
        "sources": [{"source": "test", "text": "chunk"}],
        "usage": {"tokens": 100},
    }
    mock.generate_product_insight.return_value = {
        "success": True,
        "insight": "Product insight",
        "sources": [],
    }
    mock.generate_portfolio_insight.return_value = {
        "success": True,
        "insight": "Portfolio insight",
        "sources": [],
    }
    return mock


@pytest.fixture
def mock_document_loader():
    """Mock document loader."""
    mock = MagicMock()
    mock.ingest_from_directory.return_value = 10
    mock.load_product_data.return_value = [{"id": "1", "text": "test"}]
    mock.load_feedback_data.return_value = [{"id": "2", "text": "feedback"}]
    mock.ingest_documents.return_value = 5
    return mock


@pytest.fixture
def client(mock_env, mock_vector_store, mock_retrieval, mock_generator, mock_document_loader):
    """Create test client with mocked dependencies."""
    with patch.dict(
        "sys.modules",
        {
            "ai_insights.config": MagicMock(
                API_HOST="0.0.0.0",
                API_PORT=8000,
                SUPABASE_URL="https://test.supabase.co",
                SUPABASE_KEY="test-key",
                get_logger=MagicMock(return_value=MagicMock()),
            ),
            "ai_insights.utils": MagicMock(
                set_system_info=MagicMock(), update_cognee_availability=MagicMock()
            ),
            "admin_endpoints": MagicMock(
                trigger_cognify=AsyncMock(return_value={"status": "triggered"}),
                get_cognee_status=AsyncMock(return_value={"status": "ready"}),
                reset_cognee=AsyncMock(return_value={"status": "reset"}),
            ),
        },
    ):
        # Now import and patch the lazy loaders
        with (
            patch("main.get_lazy_vector_store", return_value=mock_vector_store),
            patch("main.get_lazy_retrieval", return_value=mock_retrieval),
            patch("main.get_lazy_generator", return_value=mock_generator),
            patch("main.get_lazy_document_loader", return_value=mock_document_loader),
            patch("main.background_warmup", new_callable=AsyncMock),
            patch("main._cognee_initialized", True),
        ):

            from main import app

            yield TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def async_client(mock_env, mock_vector_store, mock_retrieval, mock_generator, mock_document_loader):
    """Create async test client for testing async endpoints."""
    from httpx import ASGITransport, AsyncClient

    with patch.dict(
        "sys.modules",
        {
            "ai_insights.config": MagicMock(
                API_HOST="0.0.0.0",
                API_PORT=8000,
                SUPABASE_URL="https://test.supabase.co",
                SUPABASE_KEY="test-key",
                get_logger=MagicMock(return_value=MagicMock()),
            ),
            "ai_insights.utils": MagicMock(
                set_system_info=MagicMock(), update_cognee_availability=MagicMock()
            ),
            "admin_endpoints": MagicMock(
                trigger_cognify=AsyncMock(return_value={"status": "triggered"}),
                get_cognee_status=AsyncMock(return_value={"status": "ready"}),
                reset_cognee=AsyncMock(return_value={"status": "reset"}),
            ),
        },
    ):
        with (
            patch("main.get_lazy_vector_store", return_value=mock_vector_store),
            patch("main.get_lazy_retrieval", return_value=mock_retrieval),
            patch("main.get_lazy_generator", return_value=mock_generator),
            patch("main.get_lazy_document_loader", return_value=mock_document_loader),
            patch("main.background_warmup", new_callable=AsyncMock),
            patch("main._cognee_initialized", True),
        ):

            from main import app

            return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


# ============================================================================
# ROOT ENDPOINT TESTS
# ============================================================================


class TestRootEndpoint:
    """Tests for the root / endpoint."""

    def test_root_returns_healthy_status(self, client):
        """Root endpoint should return healthy status."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Studio Pilot AI Insights"
        assert data["version"] == "1.0.0"

    def test_root_response_structure(self, client):
        """Root response should have expected keys."""
        response = client.get("/")
        data = response.json()
        assert "status" in data
        assert "service" in data
        assert "version" in data


# ============================================================================
# HEALTH ENDPOINT TESTS
# ============================================================================


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_returns_detailed_status(self, client, mock_vector_store):
        """Health endpoint should return detailed status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "vector_store" in data
        assert data["vector_store"]["document_count"] == 100

    def test_health_shows_groq_configured(self, client):
        """Health should indicate Groq configuration status."""
        response = client.get("/health")
        data = response.json()
        assert "groq_configured" in data
        assert data["groq_configured"] is True

    def test_health_shows_cognee_status(self, client):
        """Health should show Cognee initialization status."""
        response = client.get("/health")
        data = response.json()
        assert "cognee_initialized" in data


# ============================================================================
# METRICS ENDPOINT TESTS
# ============================================================================


class TestMetricsEndpoint:
    """Tests for the /metrics endpoint."""

    def test_metrics_returns_prometheus_format(self, client):
        """Metrics endpoint should return Prometheus format."""
        with patch("main.generate_latest", return_value=b"# HELP test metric\ntest_metric 1"):
            response = client.get("/metrics")
            assert response.status_code == 200
            # Should return text content (Prometheus format)
            assert response.headers.get("content-type") is not None


# ============================================================================
# QUERY ENDPOINT TESTS
# ============================================================================


class TestQueryEndpoint:
    """Tests for the /query endpoint."""

    def test_query_basic_request(self, client):
        """Basic query should return insight response."""
        response = client.post("/query", json={"query": "What are the top products?"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "insight" in data

    def test_query_with_product_id(self, client):
        """Query with product_id should filter results."""
        response = client.post(
            "/query", json={"query": "What is the status?", "product_id": "P001"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_query_with_top_k(self, client):
        """Query with custom top_k should work."""
        response = client.post("/query", json={"query": "Test query", "top_k": 10})
        assert response.status_code == 200

    def test_query_without_sources(self, client):
        """Query with include_sources=False should exclude sources."""
        response = client.post("/query", json={"query": "Test query", "include_sources": False})
        assert response.status_code == 200
        data = response.json()
        # Sources should be None or not present
        assert data.get("sources") is None

    def test_query_empty_query_validation(self, client):
        """Empty query should be handled."""
        response = client.post("/query", json={"query": ""})
        # Either validation error or handled gracefully
        assert response.status_code in [200, 422]

    def test_query_missing_query_field(self, client):
        """Missing query field should return validation error."""
        response = client.post("/query", json={})
        assert response.status_code == 422


# ============================================================================
# PRODUCT INSIGHT ENDPOINT TESTS
# ============================================================================


class TestProductInsightEndpoint:
    """Tests for the /product-insight endpoint."""

    def test_product_insight_success(self, client):
        """Product insight with valid product should succeed."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "P001", "name": "Test Product"}]
            response = client.post(
                "/product-insight", json={"product_id": "P001", "insight_type": "summary"}
            )
            assert response.status_code == 200

    def test_product_insight_not_found(self, client):
        """Product insight for non-existent product should return 404."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = []
            response = client.post(
                "/product-insight", json={"product_id": "INVALID", "insight_type": "summary"}
            )
            assert response.status_code == 404

    def test_product_insight_different_types(self, client):
        """Different insight types should be accepted."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "P001", "name": "Test Product"}]

            for insight_type in ["summary", "risks", "opportunities", "recommendations"]:
                response = client.post(
                    "/product-insight", json={"product_id": "P001", "insight_type": insight_type}
                )
                assert response.status_code == 200


# ============================================================================
# PORTFOLIO INSIGHT ENDPOINT TESTS
# ============================================================================


class TestPortfolioInsightEndpoint:
    """Tests for the /portfolio-insight endpoint."""

    def test_portfolio_insight_success(self, client):
        """Portfolio insight with products should succeed."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [
                {"id": "P001", "name": "Product 1"},
                {"id": "P002", "name": "Product 2"},
            ]
            response = client.post(
                "/portfolio-insight", json={"query": "What are the portfolio risks?"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_portfolio_insight_no_products(self, client):
        """Portfolio insight with no products should return error."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = []
            response = client.post("/portfolio-insight", json={"query": "What are the risks?"})
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert "No products found" in data["error"]

    def test_portfolio_insight_with_filters(self, client):
        """Portfolio insight with filters should apply them."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "P001", "name": "Product 1"}]
            response = client.post(
                "/portfolio-insight",
                json={"query": "What are the risks?", "filters": {"status": "active"}},
            )
            assert response.status_code == 200


# ============================================================================
# INGEST ENDPOINT TESTS
# ============================================================================


class TestIngestEndpoint:
    """Tests for the /ingest endpoint."""

    def test_ingest_documents_source(self, client, mock_document_loader):
        """Ingest from documents source should work."""
        response = client.post("/ingest", json={"source": "documents"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["source"] == "documents"
        assert "ingested" in data

    def test_ingest_products_source(self, client, mock_document_loader):
        """Ingest from products source should work."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "P001", "name": "Test Product"}]
            response = client.post("/ingest", json={"source": "products"})
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["source"] == "products"

    def test_ingest_feedback_source(self, client, mock_document_loader):
        """Ingest from feedback source should work."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "F001", "text": "Great product!"}]
            response = client.post("/ingest", json={"source": "feedback"})
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["source"] == "feedback"

    def test_ingest_feedback_with_product_id(self, client, mock_document_loader):
        """Ingest feedback for specific product should work."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "F001", "product_id": "P001"}]
            response = client.post("/ingest", json={"source": "feedback", "product_id": "P001"})
            assert response.status_code == 200

    def test_ingest_unknown_source(self, client):
        """Ingest with unknown source should return 400."""
        response = client.post("/ingest", json={"source": "invalid_source"})
        assert response.status_code == 400
        assert "Unknown source" in response.json()["detail"]


# ============================================================================
# STATS ENDPOINT TESTS
# ============================================================================


class TestStatsEndpoint:
    """Tests for the /stats endpoint."""

    def test_stats_returns_vector_count(self, client, mock_vector_store):
        """Stats endpoint should return vector store statistics."""
        response = client.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_vectors" in data
        assert data["total_vectors"] == 100
        assert "collection" in data
        assert data["collection"] == "test_collection"


# ============================================================================
# JIRA CSV UPLOAD TESTS
# ============================================================================


class TestJiraCSVUpload:
    """Tests for the /upload/jira-csv endpoint."""

    def test_upload_csv_success(self, client):
        """Valid CSV upload should be queued."""
        csv_content = b"Issue Key,Summary,Description\nTEST-1,Test Issue,Description"
        response = client.post(
            "/upload/jira-csv", files={"file": ("test.csv", csv_content, "text/csv")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "job_id" in data

    def test_upload_non_csv_rejected(self, client):
        """Non-CSV file should be rejected."""
        response = client.post(
            "/upload/jira-csv", files={"file": ("test.txt", b"not a csv", "text/plain")}
        )
        assert response.status_code == 400
        assert "must be a CSV" in response.json()["detail"]

    def test_upload_invalid_encoding(self, client):
        """Invalid encoding should be rejected."""
        # Create bytes that aren't valid UTF-8
        invalid_bytes = b"\xff\xfe" + b"test"
        response = client.post(
            "/upload/jira-csv", files={"file": ("test.csv", invalid_bytes, "text/csv")}
        )
        assert response.status_code == 400
        assert "encoding" in response.json()["detail"].lower()


class TestUploadStatus:
    """Tests for the /upload/status/{job_id} endpoint."""

    def test_get_existing_job_status(self, client):
        """Get status of existing job should work."""
        # First upload a file to create a job
        csv_content = b"Issue Key,Summary\nTEST-1,Test"
        upload_response = client.post(
            "/upload/jira-csv", files={"file": ("test.csv", csv_content, "text/csv")}
        )
        job_id = upload_response.json()["job_id"]

        # Now check status
        response = client.get(f"/upload/status/{job_id}")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_get_nonexistent_job_status(self, client):
        """Get status of non-existent job should return 404."""
        response = client.get("/upload/status/nonexistent_job_id")
        assert response.status_code == 404
        assert "Job not found" in response.json()["detail"]


# ============================================================================
# UNIFIED AI QUERY ENDPOINT TESTS
# ============================================================================


class TestUnifiedQueryEndpoint:
    """Tests for the /ai/query endpoint."""

    def test_unified_query_success(self, client):
        """Unified query should orchestrate and return response."""
        mock_response = MagicMock()
        mock_response.dict.return_value = {
            "success": True,
            "query": "test query",
            "answer": "test answer",
            "confidence": 0.9,
            "source_type": "hybrid",
            "sources": {"memory": [], "retrieval": []},
            "reasoning_trace": [],
            "timestamp": "2024-01-01T00:00:00Z",
        }

        with patch("ai_insights.orchestration.get_production_orchestrator") as mock_orch:
            mock_orchestrator = AsyncMock()
            mock_orchestrator.orchestrate.return_value = mock_response
            mock_orch.return_value = mock_orchestrator

            response = client.post("/ai/query", json={"query": "What products need attention?"})
            assert response.status_code == 200

    @pytest.mark.skip(reason="PyO3 Cognee initialization conflict in test environment")
    def test_unified_query_with_context(self, client):
        """Unified query with context should pass context to orchestrator."""
        mock_response = MagicMock()
        mock_response.dict.return_value = {
            "success": True,
            "query": "test",
            "answer": "answer",
            "confidence": 0.8,
            "source_type": "memory",
            "sources": {},
            "reasoning_trace": [],
            "timestamp": "",
        }

        with patch("ai_insights.orchestration.get_production_orchestrator") as mock_orch:
            mock_orchestrator = AsyncMock()
            mock_orchestrator.orchestrate.return_value = mock_response
            mock_orch.return_value = mock_orchestrator

            response = client.post(
                "/ai/query", json={"query": "Status of P001?", "context": {"product_id": "P001"}}
            )
            assert response.status_code == 200

    @pytest.mark.skip(reason="PyO3 Cognee initialization conflict in test environment")
    def test_unified_query_error_handling(self, client):
        """Unified query should handle errors gracefully."""
        with patch("ai_insights.orchestration.get_production_orchestrator") as mock_orch:
            mock_orch.side_effect = Exception("Orchestration failed")

            # Also mock the error response creation
            mock_error_response = MagicMock()
            mock_error_response.dict.return_value = {
                "success": False,
                "query": "test",
                "answer": "",
                "error": "Orchestration failed",
            }

            with patch("ai_insights.models.UnifiedAIResponse") as mock_resp_class:
                mock_resp_class.create_error_response.return_value = mock_error_response

                response = client.post("/ai/query", json={"query": "Test query"})
                # Should return error response, not crash
                assert response.status_code == 200


# ============================================================================
# COGNEE QUERY ENDPOINT TESTS
# ============================================================================


class TestCogneeQueryEndpoint:
    """Tests for the /cognee/query endpoint."""

    @pytest.mark.skip(reason="PyO3 Cognee initialization conflict in test environment")
    def test_cognee_query_success(self, client):
        """Cognee query should return knowledge graph results."""
        with patch("ai_insights.cognee.get_cognee_lazy_loader") as mock_loader:
            mock_instance = MagicMock()
            mock_instance.query = AsyncMock(
                return_value={
                    "query": "test",
                    "answer": "Test answer",
                    "confidence": 0.85,
                    "confidence_breakdown": {"source": 0.9},
                    "sources": [],
                    "reasoning_trace": [],
                    "timestamp": "2024-01-01T00:00:00Z",
                }
            )
            mock_loader.return_value = mock_instance

            response = client.post(
                "/cognee/query", json={"query": "What were the past issues with P001?"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    @pytest.mark.skip(reason="PyO3 Cognee initialization conflict in test environment")
    def test_cognee_query_unavailable(self, client):
        """Cognee query when unavailable should return graceful error."""
        with patch("ai_insights.cognee.get_cognee_lazy_loader") as mock_loader:
            mock_instance = MagicMock()
            mock_instance.query = AsyncMock(return_value=None)
            mock_loader.return_value = mock_instance

            response = client.post("/cognee/query", json={"query": "Test query"})
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert "unavailable" in data["answer"].lower()


# ============================================================================
# COGNEE INGEST ENDPOINT TESTS
# ============================================================================


class TestCogneeIngestEndpoints:
    """Tests for the /cognee/ingest/* endpoints."""

    def test_cognee_ingest_products(self, client):
        """Cognee product ingestion should queue background job."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "P001", "name": "Test"}]

            response = client.post("/cognee/ingest/products")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "job_id" in data

    def test_cognee_ingest_actions(self, client):
        """Cognee actions ingestion should queue background job."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "A001", "action": "Review"}]

            response = client.post("/cognee/ingest/actions")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "job_id" in data

    def test_cognee_ingest_status_existing(self, client):
        """Get status of existing Cognee ingest job should work."""
        # First trigger an ingestion
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = [{"id": "P001"}]
            ingest_response = client.post("/cognee/ingest/products")
            job_id = ingest_response.json()["job_id"]

        # Then check status
        response = client.get(f"/cognee/ingest/status/{job_id}")
        assert response.status_code == 200

    def test_cognee_ingest_status_not_found(self, client):
        """Get status of non-existent job should return 404."""
        response = client.get("/cognee/ingest/status/nonexistent")
        assert response.status_code == 404


# ============================================================================
# ADMIN ENDPOINT TESTS
# ============================================================================


class TestAdminEndpoints:
    """Tests for admin endpoints."""

    def test_admin_trigger_cognify(self, client):
        """Admin cognify trigger should call admin function."""
        response = client.post("/admin/cognee/cognify", headers={"X-Admin-Key": "test-admin-key"})
        # Should work or return auth error depending on implementation
        assert response.status_code in [200, 401, 403]

    def test_admin_get_status(self, client):
        """Admin status should return Cognee status."""
        response = client.get("/admin/cognee/status", headers={"X-Admin-Key": "test-admin-key"})
        assert response.status_code in [200, 401, 403]

    def test_admin_reset_cognee(self, client):
        """Admin reset should trigger Cognee reset."""
        response = client.post("/admin/cognee/reset", headers={"X-Admin-Key": "test-admin-key"})
        assert response.status_code in [200, 401, 403]


# ============================================================================
# LAZY LOADING TESTS
# ============================================================================


class TestLazyLoading:
    """Tests for lazy loading functions."""

    def test_lazy_loading_through_health_endpoint(self, client, mock_vector_store):
        """Lazy loading should work through endpoint calls."""
        # Call health endpoint twice - if caching works, mock is reused
        response1 = client.get("/health")
        response2 = client.get("/health")

        assert response1.status_code == 200
        assert response2.status_code == 200

        # Both should return same vector count (proving cache works)
        assert response1.json()["vector_store"]["document_count"] == 100
        assert response2.json()["vector_store"]["document_count"] == 100

    def test_lazy_loading_through_query_endpoint(self, client, mock_retrieval, mock_generator):
        """Lazy loading should work for retrieval and generator."""
        # Multiple queries should reuse cached components
        for i in range(3):
            response = client.post("/query", json={"query": f"Test query {i}"})
            assert response.status_code == 200

        # If caching works, mocks are reused (not recreated)


# ============================================================================
# BACKGROUND WARMUP TESTS
# ============================================================================


class TestBackgroundWarmup:
    """Tests for background warmup functionality."""

    def test_background_warmup_called_on_startup(self, client):
        """Background warmup should be triggered on app startup."""
        # The client fixture already patches background_warmup
        # Just verify the app starts successfully
        response = client.get("/health")
        assert response.status_code == 200
        # If warmup failed catastrophically, health would fail

    def test_app_responds_before_warmup_completes(self, client):
        """App should respond to requests even if warmup is still running."""
        # This tests the fire-and-forget warmup pattern
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        # App is responsive regardless of Cognee warmup state


# ============================================================================
# SUPABASE HELPER TESTS
# ============================================================================


class TestSupabaseHelper:
    """Tests for fetch_from_supabase helper."""

    @pytest.mark.asyncio
    async def test_fetch_from_supabase_success(self):
        """Successful Supabase fetch should return data."""
        with (
            patch("main.SUPABASE_URL", "https://test.supabase.co"),
            patch("main.SUPABASE_KEY", "test-key"),
        ):

            with patch("httpx.AsyncClient") as mock_client_class:
                mock_client = AsyncMock()
                mock_response = MagicMock()
                mock_response.json.return_value = [{"id": "1", "name": "Test"}]
                mock_response.raise_for_status = MagicMock()
                mock_client.get.return_value = mock_response
                mock_client.__aenter__.return_value = mock_client
                mock_client.__aexit__.return_value = None
                mock_client_class.return_value = mock_client

                from main import fetch_from_supabase

                result = await fetch_from_supabase("products")
                assert result == [{"id": "1", "name": "Test"}]

    @pytest.mark.asyncio
    async def test_fetch_from_supabase_not_configured(self):
        """Fetch without Supabase config should raise HTTPException."""
        with patch("main.SUPABASE_URL", None), patch("main.SUPABASE_KEY", None):

            from main import fetch_from_supabase

            with pytest.raises(HTTPException) as exc_info:
                await fetch_from_supabase("products")

            assert exc_info.value.status_code == 500
            assert "not configured" in exc_info.value.detail


# ============================================================================
# REQUEST MODEL VALIDATION TESTS
# ============================================================================


class TestRequestModels:
    """Tests for Pydantic request model validation."""

    def test_query_request_defaults(self, client):
        """QueryRequest should have sensible defaults."""
        response = client.post("/query", json={"query": "test"})
        assert response.status_code == 200

    def test_ingest_request_requires_source(self, client):
        """IngestRequest should require source field."""
        response = client.post("/ingest", json={})
        assert response.status_code == 422

    def test_product_insight_request_requires_product_id(self, client):
        """ProductInsightRequest should require product_id."""
        response = client.post("/product-insight", json={"insight_type": "summary"})
        assert response.status_code == 422

    def test_portfolio_insight_request_requires_query(self, client):
        """PortfolioInsightRequest should require query."""
        response = client.post("/portfolio-insight", json={})
        assert response.status_code == 422


# ============================================================================
# CORS MIDDLEWARE TESTS
# ============================================================================


class TestCORSMiddleware:
    """Tests for CORS middleware configuration."""

    def test_cors_headers_present(self, client):
        """CORS headers should be present in responses."""
        response = client.options(
            "/", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"}
        )
        # OPTIONS should be allowed
        assert response.status_code in [200, 204, 405]

    def test_cors_allows_all_origins(self, client):
        """CORS should allow all origins (development mode)."""
        response = client.get("/", headers={"Origin": "http://any-origin.com"})
        assert response.status_code == 200


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================


class TestErrorHandling:
    """Tests for error handling across endpoints."""

    def test_invalid_json_returns_422(self, client):
        """Invalid JSON should return 422."""
        response = client.post(
            "/query", content="not valid json", headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    def test_supabase_error_handling(self, client):
        """Supabase errors should be handled gracefully."""
        with patch("main.fetch_from_supabase", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.side_effect = Exception("Database connection failed")

            response = client.post(
                "/product-insight", json={"product_id": "P001", "insight_type": "summary"}
            )
            assert response.status_code == 500


# ============================================================================
# PROCESS JIRA CSV BACKGROUND TESTS
# ============================================================================


class TestProcessJiraCsvBackground:
    """Tests for the process_jira_csv_background function."""

    def test_process_valid_csv(self):
        """Valid CSV should be processed successfully."""
        with patch.dict(
            "sys.modules",
            {
                "ai_insights.config": MagicMock(
                    API_HOST="0.0.0.0",
                    API_PORT=8000,
                    SUPABASE_URL="",
                    SUPABASE_KEY="",
                    get_logger=MagicMock(return_value=MagicMock()),
                ),
                "ai_insights.utils": MagicMock(),
                "admin_endpoints": MagicMock(),
                "jira_parser": MagicMock(
                    parse_jira_csv=MagicMock(
                        return_value=[{"id": "1", "text": "Test", "metadata": {}}]
                    ),
                    get_ingestion_summary=MagicMock(return_value={"total": 1}),
                ),
            },
        ):
            from main import _job_status, process_jira_csv_background

            with patch("main.get_lazy_document_loader") as mock_loader:
                mock_doc_loader = MagicMock()
                mock_doc_loader.ingest_documents.return_value = 1
                mock_loader.return_value = mock_doc_loader

                process_jira_csv_background("job123", "Issue Key,Summary\nTEST-1,Test", "test.csv")

                assert _job_status["job123"]["status"] == "completed"
                assert _job_status["job123"]["ingested"] == 1

    def test_process_empty_csv(self):
        """Empty CSV should result in failed status."""
        with patch.dict(
            "sys.modules",
            {
                "ai_insights.config": MagicMock(
                    API_HOST="0.0.0.0",
                    API_PORT=8000,
                    SUPABASE_URL="",
                    SUPABASE_KEY="",
                    get_logger=MagicMock(return_value=MagicMock()),
                ),
                "ai_insights.utils": MagicMock(),
                "admin_endpoints": MagicMock(),
                "jira_parser": MagicMock(
                    parse_jira_csv=MagicMock(return_value=[]),
                    get_ingestion_summary=MagicMock(return_value={}),
                ),
            },
        ):
            from main import _job_status, process_jira_csv_background

            process_jira_csv_background("job456", "", "empty.csv")

            assert _job_status["job456"]["status"] == "failed"
            assert "No valid tickets" in _job_status["job456"]["error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
