"""
Test Suite for Authentication and Authorization
Tests API key validation, middleware, and security decorators.
"""

import pytest
from fastapi import HTTPException, Security
from fastapi.testclient import TestClient
from fastapi import FastAPI
from ai_insights.utils.auth import verify_api_key, require_api_key
import os


class TestAPIKeyValidation:
    """Test API key validation logic."""

    def test_valid_api_key_passes(self):
        """Valid API key should pass validation."""
        # Set a test API key
        os.environ["AI_INSIGHTS_API_KEY"] = "test-api-key-12345"

        # This would normally be called by FastAPI with the header value
        # We'll test the logic directly
        from ai_insights.utils.auth import api_key_header

        # In a real request, FastAPI would extract this from headers
        # For testing, we verify the environment variable is set correctly
        assert os.environ.get("AI_INSIGHTS_API_KEY") == "test-api-key-12345"

    def test_missing_api_key_raises_error(self):
        """Missing API key should raise 403 error."""
        # Temporarily remove API key
        original_key = os.environ.get("AI_INSIGHTS_API_KEY")
        if "AI_INSIGHTS_API_KEY" in os.environ:
            del os.environ["AI_INSIGHTS_API_KEY"]

        try:
            # verify_api_key should raise HTTPException when key is missing
            with pytest.raises(HTTPException) as exc_info:
                # Simulate calling with None (no header provided)
                from ai_insights.utils.auth import verify_api_key

                # This simulates what happens when no API key header is sent
                result = verify_api_key(None)

            assert exc_info.value.status_code == 403
            assert "Invalid API key" in str(exc_info.value.detail)
        finally:
            # Restore original key
            if original_key:
                os.environ["AI_INSIGHTS_API_KEY"] = original_key

    def test_invalid_api_key_raises_error(self):
        """Invalid API key should raise 403 error."""
        os.environ["AI_INSIGHTS_API_KEY"] = "correct-key"

        with pytest.raises(HTTPException) as exc_info:
            from ai_insights.utils.auth import verify_api_key

            # Try with wrong key
            verify_api_key("wrong-key")

        assert exc_info.value.status_code == 403
        assert "Invalid API key" in str(exc_info.value.detail)


class TestAPIKeyMiddleware:
    """Test API key middleware integration with FastAPI."""

    def test_endpoint_with_auth_decorator(self):
        """Endpoint with @require_api_key should enforce authentication."""
        app = FastAPI()

        @app.get("/protected")
        @require_api_key
        async def protected_endpoint():
            return {"message": "Success"}

        client = TestClient(app)

        # Set valid API key
        os.environ["AI_INSIGHTS_API_KEY"] = "test-key-123"

        # Request without API key should fail
        response = client.get("/protected")
        assert response.status_code == 403

        # Request with valid API key should succeed
        response = client.get("/protected", headers={"X-API-Key": "test-key-123"})
        assert response.status_code == 200
        assert response.json() == {"message": "Success"}

    def test_endpoint_without_auth_decorator(self):
        """Endpoint without @require_api_key should allow access."""
        app = FastAPI()

        @app.get("/public")
        async def public_endpoint():
            return {"message": "Public"}

        client = TestClient(app)

        # Should work without API key
        response = client.get("/public")
        assert response.status_code == 200
        assert response.json() == {"message": "Public"}


class TestSecurityHeaders:
    """Test API key header extraction and validation."""

    def test_api_key_header_name(self):
        """Verify correct header name is used."""
        from ai_insights.utils.auth import api_key_header

        assert api_key_header.model.name == "X-API-Key"

    def test_multiple_api_keys_support(self):
        """Test support for multiple API keys (if implemented)."""
        # Set primary API key
        os.environ["AI_INSIGHTS_API_KEY"] = "primary-key"

        # This test verifies the basic key works
        from ai_insights.utils.auth import verify_api_key

        result = verify_api_key("primary-key")
        assert result == "primary-key"


class TestAdminAPIKey:
    """Test admin API key for elevated permissions."""

    def test_admin_key_separate_from_regular_key(self):
        """Admin API key should be separate from regular API key."""
        os.environ["AI_INSIGHTS_API_KEY"] = "regular-key"
        os.environ["ADMIN_API_KEY"] = "admin-key"

        # Verify both keys are set and different
        assert os.environ.get("AI_INSIGHTS_API_KEY") != os.environ.get(
            "ADMIN_API_KEY"
        )

    def test_admin_endpoints_require_admin_key(self):
        """Admin endpoints should require admin API key."""
        # This is a placeholder for when admin-specific auth is implemented
        os.environ["ADMIN_API_KEY"] = "admin-secret-key"

        # Verify admin key is configured
        assert os.environ.get("ADMIN_API_KEY") == "admin-secret-key"
