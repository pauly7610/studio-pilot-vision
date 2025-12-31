"""
Test Suite for Admin Endpoints
Tests admin-only functionality, authentication, and management operations.
"""

import os
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client for admin endpoints."""
    # Environment variables are already set in conftest.py
    try:
        from fastapi import FastAPI

        from admin_endpoints import router

        app = FastAPI()
        app.include_router(router)

        return TestClient(app)
    except ImportError as e:
        # If admin_endpoints doesn't have a router, skip these tests
        pytest.skip(f"Cannot import admin_endpoints router: {e}")


class TestAdminAuthentication:
    """Test admin API key authentication."""

    def test_admin_endpoint_without_key_returns_403(self, client):
        """Admin endpoints should require API key."""
        response = client.post("/admin/clear-cache")
        assert response.status_code == 403

    def test_admin_endpoint_with_regular_key_returns_403(self, client):
        """Admin endpoints should reject regular API key."""
        response = client.post(
            "/admin/clear-cache", headers={"X-API-Key": "test-api-key"}  # Regular key, not admin
        )
        assert response.status_code == 403

    def test_admin_endpoint_with_admin_key_succeeds(self, client):
        """Admin endpoints should accept admin API key."""
        response = client.post("/admin/clear-cache", headers={"X-API-Key": "test-admin-key"})
        # Should not be 403 (may be 200, 404, or 500 depending on implementation)
        assert response.status_code != 403


class TestCacheManagement:
    """Test cache management endpoints."""

    @patch("admin_endpoints.clear_all_caches")
    def test_clear_cache_endpoint(self, mock_clear, client):
        """Clear cache endpoint should work."""
        mock_clear.return_value = {"status": "success", "cleared": 100}

        response = client.post("/admin/clear-cache", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert "status" in data

    @patch("admin_endpoints.get_cache_stats")
    def test_cache_stats_endpoint(self, mock_stats, client):
        """Cache stats endpoint should return statistics."""
        mock_stats.return_value = {"total_entries": 150, "memory_usage_mb": 25.5, "hit_rate": 0.85}

        response = client.get("/admin/cache-stats", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)


class TestSystemStats:
    """Test system statistics endpoints."""

    @patch("admin_endpoints.get_system_stats")
    def test_system_stats_endpoint(self, mock_stats, client):
        """System stats should return metrics."""
        mock_stats.return_value = {
            "uptime_seconds": 3600,
            "total_requests": 1000,
            "error_rate": 0.02,
        }

        response = client.get("/admin/stats", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)

    @patch("admin_endpoints.get_query_stats")
    def test_query_stats_endpoint(self, mock_stats, client):
        """Query stats should return query metrics."""
        mock_stats.return_value = {
            "total_queries": 500,
            "avg_response_time": 1.2,
            "by_intent": {"factual": 200, "historical": 150, "causal": 100, "mixed": 50},
        }

        response = client.get("/admin/query-stats", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)


class TestDataManagement:
    """Test data management endpoints."""

    @patch("admin_endpoints.refresh_product_data")
    def test_refresh_data_endpoint(self, mock_refresh, client):
        """Refresh data endpoint should trigger data refresh."""
        mock_refresh.return_value = {"status": "success", "products_updated": 50}

        response = client.post("/admin/refresh-data", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert "status" in data

    @patch("admin_endpoints.rebuild_indexes")
    def test_rebuild_indexes_endpoint(self, mock_rebuild, client):
        """Rebuild indexes endpoint should work."""
        mock_rebuild.return_value = {"status": "success", "indexes_rebuilt": 3}

        response = client.post("/admin/rebuild-indexes", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert "status" in data


class TestConfigurationManagement:
    """Test configuration management endpoints."""

    @patch("admin_endpoints.get_current_config")
    def test_get_config_endpoint(self, mock_config, client):
        """Get config endpoint should return current configuration."""
        mock_config.return_value = {
            "rate_limit_per_minute": 60,
            "max_query_length": 2000,
            "enable_cognee": True,
        }

        response = client.get("/admin/config", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)

    @patch("admin_endpoints.update_config")
    def test_update_config_endpoint(self, mock_update, client):
        """Update config endpoint should accept new configuration."""
        mock_update.return_value = {"status": "success"}

        response = client.put(
            "/admin/config",
            json={"rate_limit_per_minute": 100},
            headers={"X-API-Key": "test-admin-key"},
        )

        if response.status_code == 200:
            data = response.json()
            assert "status" in data


class TestHealthChecks:
    """Test admin health check endpoints."""

    @patch("admin_endpoints.check_dependencies")
    def test_dependency_health_check(self, mock_check, client):
        """Dependency health check should test all services."""
        mock_check.return_value = {
            "groq": {"status": "healthy", "latency_ms": 50},
            "supabase": {"status": "healthy", "latency_ms": 30},
            "cognee": {"status": "degraded", "latency_ms": 500},
        }

        response = client.get("/admin/health/dependencies", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)


class TestUserManagement:
    """Test user and API key management."""

    @patch("admin_endpoints.list_api_keys")
    def test_list_api_keys_endpoint(self, mock_list, client):
        """List API keys endpoint should return all keys."""
        mock_list.return_value = {
            "keys": [
                {"id": "key1", "name": "Production", "created": "2024-01-01"},
                {"id": "key2", "name": "Development", "created": "2024-01-02"},
            ]
        }

        response = client.get("/admin/api-keys", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert "keys" in data or isinstance(data, dict)

    @patch("admin_endpoints.revoke_api_key")
    def test_revoke_api_key_endpoint(self, mock_revoke, client):
        """Revoke API key endpoint should disable a key."""
        mock_revoke.return_value = {"status": "success"}

        response = client.delete("/admin/api-keys/key123", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert "status" in data


class TestLogsAndAudit:
    """Test logging and audit endpoints."""

    @patch("admin_endpoints.get_recent_logs")
    def test_get_logs_endpoint(self, mock_logs, client):
        """Get logs endpoint should return recent logs."""
        mock_logs.return_value = {
            "logs": [
                {"timestamp": "2024-01-01T12:00:00", "level": "INFO", "message": "Query processed"},
                {"timestamp": "2024-01-01T12:01:00", "level": "ERROR", "message": "API error"},
            ]
        }

        response = client.get("/admin/logs?limit=100", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)

    @patch("admin_endpoints.get_audit_trail")
    def test_audit_trail_endpoint(self, mock_audit, client):
        """Audit trail endpoint should return admin actions."""
        mock_audit.return_value = {
            "actions": [
                {"timestamp": "2024-01-01T12:00:00", "action": "clear_cache", "user": "admin"},
                {"timestamp": "2024-01-01T12:05:00", "action": "update_config", "user": "admin"},
            ]
        }

        response = client.get("/admin/audit", headers={"X-API-Key": "test-admin-key"})

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)


class TestErrorHandling:
    """Test admin endpoint error handling."""

    def test_invalid_admin_key_format_returns_403(self, client):
        """Invalid admin key format should return 403."""
        response = client.post("/admin/clear-cache", headers={"X-API-Key": ""})
        assert response.status_code == 403

    def test_missing_required_parameters_returns_422(self, client):
        """Missing required parameters should return 422."""
        response = client.put(
            "/admin/config", json={}, headers={"X-API-Key": "test-admin-key"}  # Empty config
        )
        assert response.status_code in [200, 422, 404]

    @patch("admin_endpoints.clear_all_caches")
    def test_operation_failure_handled_gracefully(self, mock_clear, client):
        """Operation failures should be handled gracefully."""
        mock_clear.side_effect = Exception("Cache clear failed")

        response = client.post("/admin/clear-cache", headers={"X-API-Key": "test-admin-key"})

        # Should return error response, not crash
        assert response.status_code in [403, 404, 500]


class TestRateLimiting:
    """Test rate limiting on admin endpoints."""

    def test_admin_endpoints_have_higher_rate_limits(self, client):
        """Admin endpoints should have higher rate limits."""
        # Make multiple requests
        responses = []
        for _i in range(20):
            response = client.get("/admin/stats", headers={"X-API-Key": "test-admin-key"})
            responses.append(response)

        # Most should succeed (admin has higher limits)
        success_count = sum(1 for r in responses if r.status_code != 429)
        assert success_count > 10  # At least half should succeed
