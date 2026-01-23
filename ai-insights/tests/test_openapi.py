"""Tests for OpenAPI documentation endpoints.

Note: Module-level mocking is handled by conftest.py.
Do NOT add sys.modules patches here as they will conflict.
"""

import os
# Disable rate limiting for these tests - must be set before importing main
os.environ["DISABLE_RATE_LIMIT"] = "true"

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestOpenAPIDocs:
    """Test OpenAPI documentation is properly configured."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test client."""
        from main import app
        self.client = TestClient(app)

    def test_openapi_json_available(self):
        """Test that OpenAPI JSON schema is available."""
        response = self.client.get("/openapi.json")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check basic OpenAPI structure
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data

    def test_openapi_metadata(self):
        """Test that OpenAPI metadata is correctly set."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        info = data["info"]
        assert info["title"] == "MSIP AI Insights API"
        assert info["version"] == "2.0.0"
        assert "description" in info
        assert "RAG" in info["description"]

    def test_swagger_docs_available(self):
        """Test that Swagger UI is available at /docs."""
        response = self.client.get("/docs")
        
        assert response.status_code == 200
        # Swagger UI returns HTML
        assert "text/html" in response.headers.get("content-type", "")

    def test_redoc_available(self):
        """Test that ReDoc is available at /redoc."""
        response = self.client.get("/redoc")
        
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")

    def test_api_tags_defined(self):
        """Test that API tags are properly defined."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        tags = data.get("tags", [])
        tag_names = [t["name"] for t in tags]
        
        assert "health" in tag_names
        assert "ai" in tag_names
        assert "upload" in tag_names
        assert "sync" in tag_names

    def test_health_endpoint_documented(self):
        """Test that health endpoint is documented."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        paths = data["paths"]
        assert "/health" in paths
        
        health_path = paths["/health"]
        assert "get" in health_path
        assert "tags" in health_path["get"]
        assert "health" in health_path["get"]["tags"]

    def test_ai_query_endpoint_documented(self):
        """Test that AI query endpoint is documented."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        paths = data["paths"]
        assert "/ai/query" in paths
        
        ai_path = paths["/ai/query"]
        assert "post" in ai_path
        assert "tags" in ai_path["post"]
        assert "ai" in ai_path["post"]["tags"]

    def test_upload_endpoint_documented(self):
        """Test that upload endpoint is documented."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        paths = data["paths"]
        assert "/upload/document" in paths
        
        upload_path = paths["/upload/document"]
        assert "post" in upload_path
        assert "tags" in upload_path["post"]
        assert "upload" in upload_path["post"]["tags"]

    def test_sync_webhook_documented(self):
        """Test that sync webhook is documented."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        paths = data["paths"]
        assert "/api/sync/webhook" in paths
        
        sync_path = paths["/api/sync/webhook"]
        assert "post" in sync_path
        assert "tags" in sync_path["post"]
        assert "sync" in sync_path["post"]["tags"]

    def test_contact_info_present(self):
        """Test that contact information is present."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        assert "contact" in data["info"]
        contact = data["info"]["contact"]
        assert "name" in contact or "email" in contact

    def test_license_info_present(self):
        """Test that license information is present."""
        response = self.client.get("/openapi.json")
        data = response.json()
        
        assert "license" in data["info"]
        license_info = data["info"]["license"]
        assert "name" in license_info


class TestHealthEndpointResponse:
    """Test health endpoint response structure."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test client with mocked dependencies."""
        # Mock the lazy vector store to return proper integers
        mock_vs = MagicMock()
        mock_vs.count.return_value = 100
        
        with patch('main.get_lazy_vector_store', return_value=mock_vs):
            from main import app
            self.client = TestClient(app)

    def test_health_returns_json(self):
        """Test that health endpoint returns JSON."""
        mock_vs = MagicMock()
        mock_vs.count.return_value = 100
        
        with patch('main.get_lazy_vector_store', return_value=mock_vs):
            response = self.client.get("/health")
        
            assert response.status_code == 200
            assert "application/json" in response.headers.get("content-type", "")

    def test_health_contains_status(self):
        """Test that health response contains status fields."""
        mock_vs = MagicMock()
        mock_vs.count.return_value = 100
        
        with patch('main.get_lazy_vector_store', return_value=mock_vs):
            response = self.client.get("/health")
            data = response.json()
        
            assert "status" in data
            # Should have service status flags
            assert "chromadb" in data or "status" in data

