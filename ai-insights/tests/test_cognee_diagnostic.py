"""
Tests for cognee_diagnostics module.

Tests the diagnostic endpoints for monitoring Cognee performance.
"""

import pytest
import sys
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient


# Mock cognee module before any imports to prevent PyO3 initialization
@pytest.fixture(autouse=True)
def mock_cognee_module():
    """Mock cognee module to prevent PyO3 initialization."""
    mock_cognee = MagicMock()
    mock_cognee.add = AsyncMock(return_value="added")
    mock_cognee.cognify = AsyncMock(return_value="cognified")
    mock_cognee.search = AsyncMock(return_value=[])
    
    with patch.dict(sys.modules, {'cognee': mock_cognee}):
        yield mock_cognee


@pytest.fixture
def mock_lazy_loader():
    """Create a mock lazy loader."""
    mock = MagicMock()
    mock.is_available.return_value = True
    mock.get_status.return_value = {
        "available": True,
        "client_loaded": True,
        "last_error": None,
        "load_attempted_at": "2024-01-01T00:00:00",
        "cache": {
            "size": 5,
            "ttl_seconds": 300,
            "hits": 10,
            "misses": 2,
            "hit_rate": 0.83
        },
        "performance": {
            "total_queries": 12,
            "avg_query_time_ms": 500,
            "recent_avg_time_ms": 450
        }
    }
    mock.get_performance_summary.return_value = (
        "Cognee Status: ✓ Available\n"
        "Cache: 5 entries, 83% hit rate\n"
        "Performance: 500ms avg\n"
        "Total queries: 12"
    )
    mock.get_client = AsyncMock(return_value=MagicMock())
    mock.warm_up = AsyncMock(return_value=True)
    mock.clear_cache = MagicMock()
    mock.query = AsyncMock(return_value={
        "results": [{"text": "test result"}],
        "from_cache": False,
        "query_time_ms": 500
    })
    return mock


@pytest.fixture
def client(mock_lazy_loader):
    """Create test client with mocked loader."""
    # Skip these tests - cognee_diagnostics module doesn't exist yet
    pytest.skip("cognee_diagnostics module not implemented")
    with patch('ai_insights.cognee.cognee_diagnostics.get_cognee_lazy_loader', return_value=mock_lazy_loader):
        from ai_insights.cognee.cognee_diagnostics import router
        from fastapi import FastAPI
        
        app = FastAPI()
        app.include_router(router)
        
        yield TestClient(app)


class TestCogneeStatusEndpoint:
    """Test /status endpoint."""
    
    def test_status_returns_loader_status(self, client, mock_lazy_loader):
        """Should return loader status."""
        response = client.get("/status")
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] is True
        assert "cache" in data
        assert "performance" in data


class TestCogneePerformanceEndpoint:
    """Test /performance endpoint."""
    
    def test_performance_returns_summary(self, client, mock_lazy_loader):
        """Should return performance summary."""
        response = client.get("/performance")
        
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "details" in data
        assert "Available" in data["summary"]


class TestCogneeWarmUpEndpoint:
    """Test /warm-up endpoint."""
    
    def test_warm_up_success(self, client, mock_lazy_loader):
        """Should trigger warm-up successfully."""
        response = client.post("/warm-up")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "duration_ms" in data
        mock_lazy_loader.warm_up.assert_called_once()


class TestClearCacheEndpoint:
    """Test /clear-cache endpoint."""
    
    def test_clear_cache_success(self, client, mock_lazy_loader):
        """Should clear cache successfully."""
        response = client.post("/clear-cache")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        mock_lazy_loader.clear_cache.assert_called_once()


class TestDiagnoseEndpoint:
    """Test /diagnose endpoint."""
    
    def test_diagnose_returns_full_results(self, client, mock_lazy_loader):
        """Should return full diagnostic results."""
        # Setup mock client
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_lazy_loader.get_client = AsyncMock(return_value=mock_client)
        
        response = client.get("/diagnose")
        
        assert response.status_code == 200
        data = response.json()
        assert "overall_status" in data
        assert "total_duration_ms" in data
        assert "tests" in data
        assert "recommendations" in data
        assert isinstance(data["tests"], list)
    
    def test_diagnose_includes_import_test(self, client, mock_lazy_loader):
        """Should include import test."""
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_lazy_loader.get_client = AsyncMock(return_value=mock_client)
        
        response = client.get("/diagnose")
        
        data = response.json()
        test_names = [t["test"] for t in data["tests"]]
        assert "import" in test_names


class TestTestQueryEndpoint:
    """Test /test-query endpoint."""
    
    def test_test_query_executes(self, client, mock_lazy_loader):
        """Should execute test query."""
        response = client.post("/test-query?query=test%20query")
        
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "test query"
        assert "duration_ms" in data
        assert "result_count" in data
    
    def test_test_query_with_fast_mode(self, client, mock_lazy_loader):
        """Should respect fast_mode parameter."""
        response = client.post("/test-query?query=test&fast_mode=true")
        
        assert response.status_code == 200
        data = response.json()
        assert data["fast_mode"] is True


class TestDiagnosticResultModel:
    """Test DiagnosticResult Pydantic model."""
    
    def test_diagnostic_result_valid(self):
        """Should create valid DiagnosticResult."""
        pytest.skip("cognee_diagnostics module not implemented")
        from ai_insights.cognee.cognee_diagnostics import DiagnosticResult
        
        result = DiagnosticResult(
            test="import",
            status="pass",
            duration_ms=100,
            details={"key": "value"}
        )
        
        assert result.test == "import"
        assert result.status == "pass"
        assert result.duration_ms == 100
    
    def test_diagnostic_result_with_error(self):
        """Should handle error field."""
        pytest.skip("cognee_diagnostics module not implemented")
        from ai_insights.cognee.cognee_diagnostics import DiagnosticResult
        
        result = DiagnosticResult(
            test="query",
            status="fail",
            duration_ms=0,
            error="Connection failed"
        )
        
        assert result.error == "Connection failed"


class TestFullDiagnosticResponseModel:
    """Test FullDiagnosticResponse Pydantic model."""
    
    def test_full_diagnostic_response_valid(self):
        """Should create valid FullDiagnosticResponse."""
        pytest.skip("cognee_diagnostics module not implemented")
        from ai_insights.cognee.cognee_diagnostics import FullDiagnosticResponse, DiagnosticResult
        
        response = FullDiagnosticResponse(
            overall_status="healthy",
            total_duration_ms=5000,
            tests=[
                DiagnosticResult(test="import", status="pass", duration_ms=100)
            ],
            recommendations=["All good!"]
        )
        
        assert response.overall_status == "healthy"
        assert len(response.tests) == 1
        assert len(response.recommendations) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])