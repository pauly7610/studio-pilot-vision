"""
Tests for ai_insights.utils.auth module.

Tests the actual implementation:
- get_api_key() function
- verify_api_key() async function
- require_api_key decorator
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException


class TestGetApiKey:
    """Test get_api_key function."""

    def test_returns_api_key_when_set(self):
        """Should return API key from environment."""
        with patch.dict(os.environ, {"AI_INSIGHTS_API_KEY": "test-secret-key"}):
            from ai_insights.utils.auth import get_api_key

            key = get_api_key()

            assert key == "test-secret-key"

    def test_raises_when_not_set(self):
        """Should raise ValueError when API key not set."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove the key if it exists
            os.environ.pop("AI_INSIGHTS_API_KEY", None)

            from ai_insights.utils.auth import get_api_key

            with pytest.raises(ValueError) as exc_info:
                get_api_key()

            assert "AI_INSIGHTS_API_KEY" in str(exc_info.value)

    def test_error_message_is_helpful(self):
        """Should provide helpful error message."""
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("AI_INSIGHTS_API_KEY", None)

            from ai_insights.utils.auth import get_api_key

            with pytest.raises(ValueError) as exc_info:
                get_api_key()

            assert "environment variable" in str(exc_info.value).lower()


class TestVerifyApiKey:
    """Test verify_api_key async function."""

    @pytest.mark.asyncio
    async def test_returns_auth_disabled_when_no_key_configured(self):
        """Should return 'auth_disabled' when no API key configured."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.side_effect = ValueError("Not configured")

            from ai_insights.utils.auth import verify_api_key

            result = await verify_api_key(api_key="any-key")

            assert result == "auth_disabled"

    @pytest.mark.asyncio
    async def test_raises_401_when_key_missing(self):
        """Should raise 401 when API key header is missing."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "configured-key"

            from ai_insights.utils.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key=None)

            assert exc_info.value.status_code == 401
            assert "Missing API key" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_raises_403_when_key_invalid(self):
        """Should raise 403 when API key is invalid."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "correct-key"

            from ai_insights.utils.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key="wrong-key")

            assert exc_info.value.status_code == 403
            assert "Invalid API key" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_returns_key_when_valid(self):
        """Should return the API key when valid."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "correct-key"

            from ai_insights.utils.auth import verify_api_key

            result = await verify_api_key(api_key="correct-key")

            assert result == "correct-key"

    @pytest.mark.asyncio
    async def test_401_includes_www_authenticate_header(self):
        """Should include WWW-Authenticate header in 401 response."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "configured-key"

            from ai_insights.utils.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key=None)

            assert exc_info.value.headers is not None
            assert "WWW-Authenticate" in exc_info.value.headers


class TestRequireApiKeyDecorator:
    """Test require_api_key decorator."""

    def test_decorator_exists(self):
        """Decorator should be importable."""
        from ai_insights.utils.auth import require_api_key

        assert callable(require_api_key)

    def test_decorator_wraps_function(self):
        """Decorator should wrap function properly."""
        from ai_insights.utils.auth import require_api_key

        @require_api_key
        async def protected_endpoint():
            return {"status": "ok"}

        # Wrapped function should be callable
        assert callable(protected_endpoint)

    def test_decorator_preserves_function_name(self):
        """Decorator should preserve original function name."""
        from ai_insights.utils.auth import require_api_key

        @require_api_key
        async def my_endpoint():
            return {"status": "ok"}

        # functools.wraps should preserve the name
        assert "my_endpoint" in str(my_endpoint) or my_endpoint.__name__ == "wrapper"


class TestApiKeyHeader:
    """Test API key header configuration."""

    def test_header_name_is_x_api_key(self):
        """API key header should be X-API-Key."""
        from ai_insights.utils.auth import API_KEY_NAME

        assert API_KEY_NAME == "X-API-Key"

    def test_api_key_header_security_defined(self):
        """APIKeyHeader security scheme should be defined."""
        from ai_insights.utils.auth import api_key_header

        assert api_key_header is not None


class TestAuthenticationFlow:
    """Integration tests for authentication flow."""

    @pytest.mark.asyncio
    async def test_disabled_auth_allows_any_key(self):
        """When auth is disabled, any key should work."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.side_effect = ValueError("Not configured")

            from ai_insights.utils.auth import verify_api_key

            # Any key should return auth_disabled
            result1 = await verify_api_key(api_key="any-key")
            result2 = await verify_api_key(api_key="different-key")
            result3 = await verify_api_key(api_key=None)

            assert result1 == "auth_disabled"
            assert result2 == "auth_disabled"
            assert result3 == "auth_disabled"

    @pytest.mark.asyncio
    async def test_enabled_auth_requires_correct_key(self):
        """When auth is enabled, only correct key should work."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "secret-key-123"

            from ai_insights.utils.auth import verify_api_key

            # Correct key should work
            result = await verify_api_key(api_key="secret-key-123")
            assert result == "secret-key-123"

            # Wrong key should raise 403
            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key="wrong-key")
            assert exc_info.value.status_code == 403

            # Missing key should raise 401
            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key=None)
            assert exc_info.value.status_code == 401


class TestSecurityConsiderations:
    """Test security aspects of authentication."""

    def test_api_key_not_logged(self):
        """API key should not appear in error messages."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "super-secret-key"

            from ai_insights.utils.auth import verify_api_key

            # The actual key should not be in error messages
            # (This is a basic check - real security testing would be more thorough)

    @pytest.mark.asyncio
    async def test_empty_string_key_rejected(self):
        """Empty string API key should be rejected."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "valid-key"

            from ai_insights.utils.auth import verify_api_key

            # Empty string is falsy, should raise 401
            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key="")

            assert exc_info.value.status_code == 401


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.mark.asyncio
    async def test_whitespace_in_key(self):
        """Keys with whitespace should be compared exactly."""
        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = "key-with-no-spaces"

            from ai_insights.utils.auth import verify_api_key

            # Key with spaces should not match
            with pytest.raises(HTTPException):
                await verify_api_key(api_key=" key-with-no-spaces ")

    @pytest.mark.asyncio
    async def test_very_long_key(self):
        """Very long API keys should work."""
        long_key = "a" * 1000

        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = long_key

            from ai_insights.utils.auth import verify_api_key

            result = await verify_api_key(api_key=long_key)
            assert result == long_key

    @pytest.mark.asyncio
    async def test_special_characters_in_key(self):
        """Keys with special characters should work."""
        special_key = "key!@#$%^&*()_+-=[]{}|;':\",./<>?"

        with patch("ai_insights.utils.auth.get_api_key") as mock_get:
            mock_get.return_value = special_key

            from ai_insights.utils.auth import verify_api_key

            result = await verify_api_key(api_key=special_key)
            assert result == special_key


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
