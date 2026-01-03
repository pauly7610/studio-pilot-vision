"""
Comprehensive tests for admin_endpoints module.

Tests all admin endpoints with proper mocking to achieve 80%+ coverage.
"""

import os
import sys
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException


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


class TestVerifyAdminKey:
    """Test admin key verification."""

    @pytest.mark.asyncio
    async def test_verify_admin_key_success(self):
        """Should pass with valid admin key."""
        from ai_insights.admin_endpoints import verify_admin_key

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-admin-key"}):
            result = await verify_admin_key(x_admin_key="test-admin-key")
            assert result is True

    @pytest.mark.asyncio
    async def test_verify_admin_key_missing_env(self):
        """Should raise 500 if ADMIN_API_KEY not configured."""
        from ai_insights.admin_endpoints import verify_admin_key

        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(HTTPException) as exc_info:
                await verify_admin_key(x_admin_key="any-key")

            assert exc_info.value.status_code == 500
            assert "not configured" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_verify_admin_key_missing_header(self):
        """Should raise 401 if X-Admin-Key header missing."""
        from ai_insights.admin_endpoints import verify_admin_key

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with pytest.raises(HTTPException) as exc_info:
                await verify_admin_key(x_admin_key=None)

            assert exc_info.value.status_code == 401
            assert "Missing" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_verify_admin_key_invalid(self):
        """Should raise 403 if admin key is invalid."""
        from ai_insights.admin_endpoints import verify_admin_key

        with patch.dict(os.environ, {"ADMIN_API_KEY": "correct-key"}):
            with pytest.raises(HTTPException) as exc_info:
                await verify_admin_key(x_admin_key="wrong-key")

            assert exc_info.value.status_code == 403
            assert "Invalid" in exc_info.value.detail


class TestTriggerCognify:
    """Test cognify trigger endpoint."""

    @pytest.mark.asyncio
    async def test_trigger_cognify_success(self):
        """Should successfully trigger cognify."""
        from ai_insights.admin_endpoints import trigger_cognify

        # Mock cognee client
        mock_client = MagicMock()
        mock_client.cognify = AsyncMock()

        mock_loader = MagicMock()
        mock_loader.get_client = AsyncMock(return_value=mock_client)

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with patch("builtins.print"):  # Mock print to avoid emoji encoding issues
                    result = await trigger_cognify(x_admin_key="test-key")

                    assert result["success"] is True
                    assert "Knowledge graph built" in result["message"]
                    assert "duration_seconds" in result
                    assert "timestamp" in result
                    mock_client.cognify.assert_called_once()

    @pytest.mark.asyncio
    async def test_trigger_cognify_client_unavailable(self):
        """Should raise 503 or 500 if Cognee client unavailable."""
        from ai_insights.admin_endpoints import trigger_cognify

        mock_loader = MagicMock()
        mock_loader.get_client = AsyncMock(return_value=None)

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with pytest.raises(HTTPException) as exc_info:
                    await trigger_cognify(x_admin_key="test-key")

                # May be 503 or 500 (wrapped exception)
                assert exc_info.value.status_code in [500, 503]
                assert (
                    "unavailable" in exc_info.value.detail.lower()
                    or "failed" in exc_info.value.detail.lower()
                )

    @pytest.mark.asyncio
    async def test_trigger_cognify_fails(self):
        """Should raise 500 if cognify fails."""
        from ai_insights.admin_endpoints import trigger_cognify

        mock_client = MagicMock()
        mock_client.cognify = AsyncMock(side_effect=Exception("Cognify error"))

        mock_loader = MagicMock()
        mock_loader.get_client = AsyncMock(return_value=mock_client)

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with pytest.raises(HTTPException) as exc_info:
                    await trigger_cognify(x_admin_key="test-key")

                assert exc_info.value.status_code == 500
                assert "cognify() failed" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_trigger_cognify_requires_auth(self):
        """Should require valid admin key."""
        from ai_insights.admin_endpoints import trigger_cognify

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with pytest.raises(HTTPException) as exc_info:
                await trigger_cognify(x_admin_key="wrong-key")

            assert exc_info.value.status_code == 403


class TestGetCogneeStatus:
    """Test Cognee status endpoint."""

    @pytest.mark.asyncio
    async def test_get_cognee_status_success(self):
        """Should return Cognee status."""
        from ai_insights.admin_endpoints import get_cognee_status

        mock_loader = MagicMock()
        mock_loader.get_status.return_value = {"initialized": True, "client_available": True}

        with patch.dict(
            os.environ, {"ADMIN_API_KEY": "test-key", "COGNEE_DATA_PATH": "./cognee_data"}
        ):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                result = await get_cognee_status(x_admin_key="test-key")

                assert result["success"] is True
                assert "cognee_status" in result
                assert result["data_path"] == "./cognee_data"
                assert result["persistent_disk"] is False
                assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_get_cognee_status_persistent_disk(self):
        """Should detect persistent disk usage."""
        from ai_insights.admin_endpoints import get_cognee_status

        mock_loader = MagicMock()
        mock_loader.get_status.return_value = {"initialized": True}

        with patch.dict(
            os.environ, {"ADMIN_API_KEY": "test-key", "COGNEE_DATA_PATH": "/data/cognee"}
        ):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                result = await get_cognee_status(x_admin_key="test-key")

                assert result["persistent_disk"] is True

    @pytest.mark.asyncio
    async def test_get_cognee_status_fails(self):
        """Should raise 500 if status check fails."""
        from ai_insights.admin_endpoints import get_cognee_status

        mock_loader = MagicMock()
        mock_loader.get_status.side_effect = Exception("Status error")

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with pytest.raises(HTTPException) as exc_info:
                    await get_cognee_status(x_admin_key="test-key")

                assert exc_info.value.status_code == 500
                assert "Status check failed" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_cognee_status_requires_auth(self):
        """Should require valid admin key."""
        from ai_insights.admin_endpoints import get_cognee_status

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with pytest.raises(HTTPException) as exc_info:
                await get_cognee_status(x_admin_key=None)

            assert exc_info.value.status_code == 401


class TestResetCognee:
    """Test Cognee reset endpoint."""

    @pytest.mark.asyncio
    async def test_reset_cognee_success(self):
        """Should successfully reset Cognee."""
        from ai_insights.admin_endpoints import reset_cognee

        mock_client = MagicMock()
        mock_client.reset = AsyncMock()

        mock_loader = MagicMock()
        mock_loader.get_client = AsyncMock(return_value=mock_client)

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with patch("builtins.print"):  # Mock print to avoid emoji encoding issues
                    result = await reset_cognee(x_admin_key="test-key")

                    assert result["success"] is True
                    assert "reset successfully" in result["message"]
                    assert "timestamp" in result
                    mock_client.reset.assert_called_once()

    @pytest.mark.asyncio
    async def test_reset_cognee_client_unavailable(self):
        """Should raise 503 or 500 if Cognee client unavailable."""
        from ai_insights.admin_endpoints import reset_cognee

        mock_loader = MagicMock()
        mock_loader.get_client = AsyncMock(return_value=None)

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with pytest.raises(HTTPException) as exc_info:
                    await reset_cognee(x_admin_key="test-key")

                # May be 503 or 500 (wrapped exception)
                assert exc_info.value.status_code in [500, 503]
                assert (
                    "unavailable" in exc_info.value.detail.lower()
                    or "failed" in exc_info.value.detail.lower()
                )

    @pytest.mark.asyncio
    async def test_reset_cognee_fails(self):
        """Should raise 500 if reset fails."""
        from ai_insights.admin_endpoints import reset_cognee

        mock_client = MagicMock()
        mock_client.reset = AsyncMock(side_effect=Exception("Reset error"))

        mock_loader = MagicMock()
        mock_loader.get_client = AsyncMock(return_value=mock_client)

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with patch("ai_insights.cognee.get_cognee_lazy_loader", return_value=mock_loader):
                with pytest.raises(HTTPException) as exc_info:
                    await reset_cognee(x_admin_key="test-key")

                assert exc_info.value.status_code == 500
                assert "Reset failed" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_reset_cognee_requires_auth(self):
        """Should require valid admin key."""
        from ai_insights.admin_endpoints import reset_cognee

        with patch.dict(os.environ, {"ADMIN_API_KEY": "test-key"}):
            with pytest.raises(HTTPException) as exc_info:
                await reset_cognee(x_admin_key="invalid-key")

            assert exc_info.value.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
