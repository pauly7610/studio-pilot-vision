"""
API Key Authentication Middleware
Provides secure authentication for AI Insights endpoints.
"""

import os
from functools import wraps
from typing import Optional

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

# API Key header name
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


def get_api_key() -> str:
    """Get the configured API key from environment."""
    api_key = os.getenv("AI_INSIGHTS_API_KEY")
    if not api_key:
        raise ValueError(
            "AI_INSIGHTS_API_KEY environment variable not set. "
            "Set this to enable API authentication."
        )
    return api_key


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Verify API key from request header.

    Args:
        api_key: API key from X-API-Key header

    Returns:
        The validated API key

    Raises:
        HTTPException: If API key is missing or invalid
    """
    # Check if authentication is enabled
    try:
        expected_key = get_api_key()
    except ValueError:
        # API key not configured - authentication disabled
        return "auth_disabled"

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Include X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return api_key


def require_api_key(func):
    """
    Decorator to require API key authentication on endpoint.

    Usage:
        @app.post("/protected-endpoint")
        @require_api_key
        async def protected_endpoint():
            return {"status": "authenticated"}
    """

    @wraps(func)
    async def wrapper(*args, api_key: str = Security(verify_api_key), **kwargs):
        return await func(*args, **kwargs)

    return wrapper
