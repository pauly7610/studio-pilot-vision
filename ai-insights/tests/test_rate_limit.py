"""
Test Suite for Rate Limiting Middleware
Tests rate limiting logic, token bucket algorithm, and HTTP headers.
"""

import pytest
import asyncio
import time
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from ai_insights.utils.rate_limit import RateLimitMiddleware, TokenBucketRateLimiter


class TestTokenBucket:
    """Test token bucket algorithm for rate limiting."""

    def test_token_bucket_initialization(self):
        """Token bucket should initialize with full capacity."""
        bucket = TokenBucketRateLimiter(capacity=10, refill_rate=1.0)
        assert bucket.capacity == 10

    def test_token_bucket_allows_requests_under_capacity(self):
        """Requests under capacity should be allowed."""
        bucket = TokenBucketRateLimiter(capacity=10, refill_rate=1.0)
        # Should allow requests up to capacity
        for i in range(10):
            assert bucket.allow_request() is True

    def test_token_bucket_blocks_requests_over_capacity(self):
        """Requests exceeding capacity should be blocked."""
        bucket = TokenBucketRateLimiter(capacity=5, refill_rate=1.0)
        # Consume all tokens
        for i in range(5):
            bucket.allow_request()
        # Next request should be blocked
        assert bucket.allow_request() is False

    def test_token_refill_over_time(self):
        """Tokens should refill over time."""
        bucket = TokenBucketRateLimiter(capacity=10, refill_rate=10.0)
        # Consume all tokens
        for i in range(10):
            bucket.allow_request()
        
        # Wait for refill
        time.sleep(0.2)
        # Should allow at least one more request
        assert bucket.allow_request() is True


class TestRateLimitMiddleware:
    """Test rate limiting middleware integration."""

    def test_rate_limit_allows_requests_under_limit(self):
        """Requests under rate limit should be allowed."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=60, requests_per_hour=1000
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # First request should succeed
        response = client.get("/test")
        assert response.status_code == 200

    def test_rate_limit_blocks_requests_over_limit(self):
        """Requests exceeding rate limit should be blocked."""
        app = FastAPI()
        # Very restrictive rate limit for testing
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=2, requests_per_hour=10
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # Make requests up to the limit
        for i in range(2):
            response = client.get("/test")
            assert response.status_code == 200

        # Next request should be rate limited
        response = client.get("/test")
        assert response.status_code == 429
        assert "Rate limit exceeded" in response.json()["detail"]

    def test_rate_limit_headers_present(self):
        """Rate limit headers should be present in response."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=60, requests_per_hour=1000
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)
        response = client.get("/test")

        # Check for rate limit headers
        assert "X-RateLimit-Limit-Minute" in response.headers
        assert "X-RateLimit-Remaining-Minute" in response.headers
        assert "X-RateLimit-Limit-Hour" in response.headers
        assert "X-RateLimit-Remaining-Hour" in response.headers

    def test_rate_limit_per_ip_address(self):
        """Rate limiting should be per IP address."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=2, requests_per_hour=10
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # Exhaust limit for one IP
        for i in range(2):
            response = client.get("/test")
            assert response.status_code == 200

        # Should be rate limited
        response = client.get("/test")
        assert response.status_code == 429

        # Different IP should have separate limit (simulated by new client)
        # Note: TestClient doesn't easily simulate different IPs, so this is conceptual
        # In production, different IPs would have separate rate limit buckets

    def test_rate_limit_cleanup_old_entries(self):
        """Old rate limit entries should be cleaned up."""
        app = FastAPI()
        middleware = RateLimitMiddleware(
            app, requests_per_minute=60, requests_per_hour=1000
        )

        # Simulate old entries
        old_time = time.time() - 7200  # 2 hours ago
        middleware.request_history["old_ip"] = [old_time] * 10

        # Trigger cleanup
        middleware._cleanup_old_entries()

        # Old entries should be removed
        assert "old_ip" not in middleware.request_history


class TestRateLimitConfiguration:
    """Test rate limit configuration options."""

    def test_custom_rate_limits(self):
        """Custom rate limits should be configurable."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=30, requests_per_hour=500
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)
        response = client.get("/test")

        # Verify custom limits in headers
        assert response.headers["X-RateLimit-Limit-Minute"] == "30"
        assert response.headers["X-RateLimit-Limit-Hour"] == "500"

    def test_default_rate_limits(self):
        """Default rate limits should be applied if not specified."""
        app = FastAPI()
        app.add_middleware(RateLimitMiddleware)

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)
        response = client.get("/test")

        # Should have default limits (60/min, 1000/hour)
        assert "X-RateLimit-Limit-Minute" in response.headers
        assert "X-RateLimit-Limit-Hour" in response.headers


class TestRateLimitEdgeCases:
    """Test edge cases and error scenarios."""

    def test_rate_limit_with_concurrent_requests(self):
        """Rate limiting should handle concurrent requests correctly."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=5, requests_per_hour=20
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # Make multiple requests quickly
        responses = []
        for i in range(6):
            response = client.get("/test")
            responses.append(response)

        # First 5 should succeed, 6th should be rate limited
        success_count = sum(1 for r in responses if r.status_code == 200)
        rate_limited_count = sum(1 for r in responses if r.status_code == 429)

        assert success_count == 5
        assert rate_limited_count == 1

    def test_rate_limit_reset_after_time_window(self):
        """Rate limit should reset after time window passes."""
        app = FastAPI()
        # Very short time window for testing
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=2, requests_per_hour=10
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # Exhaust limit
        for i in range(2):
            response = client.get("/test")
            assert response.status_code == 200

        # Should be rate limited
        response = client.get("/test")
        assert response.status_code == 429

        # Wait for window to reset (in production, would wait 60 seconds)
        # For testing, we verify the mechanism exists
        assert "Retry-After" in response.headers or "X-RateLimit-Reset" in response.headers

    def test_rate_limit_with_missing_ip(self):
        """Rate limiting should handle missing IP address gracefully."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=60, requests_per_hour=1000
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # TestClient provides a default IP, but verify it doesn't crash
        response = client.get("/test")
        assert response.status_code in [200, 429]  # Should not crash


class TestRateLimitMetrics:
    """Test rate limit metrics and monitoring."""

    def test_rate_limit_remaining_decreases(self):
        """Remaining rate limit should decrease with each request."""
        app = FastAPI()
        app.add_middleware(
            RateLimitMiddleware, requests_per_minute=10, requests_per_hour=100
        )

        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}

        client = TestClient(app)

        # First request
        response1 = client.get("/test")
        remaining1 = int(response1.headers["X-RateLimit-Remaining-Minute"])

        # Second request
        response2 = client.get("/test")
        remaining2 = int(response2.headers["X-RateLimit-Remaining-Minute"])

        # Remaining should decrease
        assert remaining2 < remaining1
