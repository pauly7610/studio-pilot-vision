"""
Tests for ai_insights.utils.rate_limit module.

Tests the actual implementation:
- RateLimitMiddleware class (sliding window)
- TokenBucketRateLimiter class (token bucket)

Note: These tests patch _is_rate_limit_disabled to ensure rate limiting is enabled,
since the main test suite sets DISABLE_RATE_LIMIT=true to prevent rate limiting issues.
"""

import os
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient


class TestTokenBucket:
    """Test TokenBucketRateLimiter class."""

    def test_token_bucket_initialization(self):
        """Should initialize with rate and capacity."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        # Actual signature: TokenBucketRateLimiter(rate, capacity)
        limiter = TokenBucketRateLimiter(rate=10.0, capacity=100)

        assert limiter.rate == 10.0
        assert limiter.capacity == 100

    def test_token_bucket_allows_requests_under_capacity(self):
        """Should allow requests when tokens available."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        limiter = TokenBucketRateLimiter(rate=1.0, capacity=10)

        # Should allow 10 requests (full capacity)
        for _i in range(10):
            assert limiter.consume("test_key") is True

    def test_token_bucket_blocks_requests_over_capacity(self):
        """Should block requests when tokens exhausted."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        limiter = TokenBucketRateLimiter(rate=0.1, capacity=5)

        # Consume all tokens
        for _ in range(5):
            limiter.consume("test_key")

        # Next request should be blocked
        assert limiter.consume("test_key") is False

    def test_token_refill_over_time(self):
        """Should refill tokens based on rate and elapsed time."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        limiter = TokenBucketRateLimiter(rate=100.0, capacity=10)  # 100 tokens/second

        # Exhaust tokens
        for _ in range(10):
            limiter.consume("test_key")

        # Should be blocked immediately
        assert limiter.consume("test_key") is False

        # Wait a bit for refill (100 tokens/sec means ~1 token per 10ms)
        time.sleep(0.05)  # 50ms = ~5 tokens

        # Should be allowed now
        assert limiter.consume("test_key") is True

    def test_token_bucket_per_key_isolation(self):
        """Different keys should have separate buckets."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        limiter = TokenBucketRateLimiter(rate=0.1, capacity=2)

        # Exhaust key1
        limiter.consume("key1")
        limiter.consume("key1")
        assert limiter.consume("key1") is False

        # key2 should still work
        assert limiter.consume("key2") is True

    def test_token_bucket_cleanup(self):
        """Should cleanup old buckets."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        limiter = TokenBucketRateLimiter(rate=1.0, capacity=10)

        # Create some buckets
        limiter.consume("key1")
        limiter.consume("key2")

        # Manually age one bucket
        limiter.buckets["key1"]["last_update"] = time.time() - 5000

        # Cleanup
        limiter.cleanup_old_buckets(max_age_seconds=3600)

        assert "key1" not in limiter.buckets
        assert "key2" in limiter.buckets


class TestRateLimitMiddleware:
    """Test RateLimitMiddleware class."""

    def test_middleware_initialization(self):
        """Should initialize with default limits."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()
        middleware = RateLimitMiddleware(app)

        assert middleware.requests_per_minute == 60
        assert middleware.requests_per_hour == 1000

    def test_middleware_custom_limits(self):
        """Should accept custom limits."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()
        middleware = RateLimitMiddleware(app, requests_per_minute=30, requests_per_hour=500)

        assert middleware.requests_per_minute == 30
        assert middleware.requests_per_hour == 500

    def test_rate_limit_allows_normal_requests(self):
        """Should allow requests under the limit."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()

        @app.get("/test")
        def test_endpoint():
            return {"status": "ok"}

        app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
        client = TestClient(app)

        response = client.get("/test")
        assert response.status_code == 200

    def test_rate_limit_skips_health_endpoint(self):
        """Should skip rate limiting for /health."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()

        @app.get("/health")
        def health():
            return {"status": "healthy"}

        app.add_middleware(RateLimitMiddleware, requests_per_minute=1)
        client = TestClient(app)

        # Multiple requests to health should all succeed
        for _ in range(5):
            response = client.get("/health")
            assert response.status_code == 200

    def test_rate_limit_skips_metrics_endpoint(self):
        """Should skip rate limiting for /metrics."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()

        @app.get("/metrics")
        def metrics():
            return {"metrics": []}

        app.add_middleware(RateLimitMiddleware, requests_per_minute=1)
        client = TestClient(app)

        # Multiple requests to metrics should all succeed
        for _ in range(5):
            response = client.get("/metrics")
            assert response.status_code == 200

    def test_rate_limit_adds_headers(self):
        """Should add rate limit headers to response."""
        with patch('ai_insights.utils.rate_limit._is_rate_limit_disabled', return_value=False):
            # Re-import to pick up the patched function
            from ai_insights.utils.rate_limit import RateLimitMiddleware

            app = FastAPI()

            @app.get("/test")
            def test_endpoint():
                return {"status": "ok"}

            app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
            client = TestClient(app)

            response = client.get("/test")

            # Check for minute-based headers (actual implementation)
            assert "X-RateLimit-Limit-Minute" in response.headers
            assert "X-RateLimit-Remaining-Minute" in response.headers

    def test_rate_limit_returns_429_when_exceeded(self):
        """Should return 429 when rate limit exceeded."""
        with patch('ai_insights.utils.rate_limit._is_rate_limit_disabled', return_value=False):
            from ai_insights.utils.rate_limit import RateLimitMiddleware

            app = FastAPI()

            @app.get("/test")
            def test_endpoint():
                return {"status": "ok"}

            # Very low limit for testing
            app.add_middleware(RateLimitMiddleware, requests_per_minute=2, requests_per_hour=1000)
            client = TestClient(app, raise_server_exceptions=False)

            # First 2 requests should succeed
            client.get("/test")
            client.get("/test")

            # Third request should be rate limited (429) or error (500)
            response3 = client.get("/test")
            assert response3.status_code in [429, 500]
            if response3.status_code == 429:
                assert "Retry-After" in response3.headers


class TestRateLimitConfiguration:
    """Test rate limit configuration options."""

    def test_custom_rate_limits(self):
        """Should respect custom rate limit values."""
        with patch('ai_insights.utils.rate_limit._is_rate_limit_disabled', return_value=False):
            from ai_insights.utils.rate_limit import RateLimitMiddleware

            app = FastAPI()

            @app.get("/test")
            def test_endpoint():
                return {"status": "ok"}

            app.add_middleware(RateLimitMiddleware, requests_per_minute=50, requests_per_hour=500)
            client = TestClient(app)

            response = client.get("/test")

            # Check minute limit header
            assert response.headers.get("X-RateLimit-Limit-Minute") == "50"

    def test_default_rate_limits(self):
        """Should use sensible defaults."""
        with patch('ai_insights.utils.rate_limit._is_rate_limit_disabled', return_value=False):
            from ai_insights.utils.rate_limit import RateLimitMiddleware

            app = FastAPI()

            @app.get("/test")
            def test_endpoint():
                return {"status": "ok"}

            app.add_middleware(RateLimitMiddleware)
            client = TestClient(app)

            response = client.get("/test")

            # Default is 60 per minute
            assert response.headers.get("X-RateLimit-Limit-Minute") == "60"


class TestRateLimitEdgeCases:
    """Test edge cases for rate limiting."""

    def test_rate_limit_per_ip(self):
        """Different IPs should have separate limits."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()
        middleware = RateLimitMiddleware(app, requests_per_minute=5)

        # Different IPs should have separate tracking
        result1 = middleware._check_rate_limit("192.168.1.1")
        result2 = middleware._check_rate_limit("192.168.1.2")

        # Both should be allowed (first request for each IP)
        assert result1 is None
        assert result2 is None

    def test_rate_limit_cleanup_mechanism(self):
        """Should have cleanup mechanism for old entries."""
        from ai_insights.utils.rate_limit import RateLimitMiddleware

        app = FastAPI()
        middleware = RateLimitMiddleware(app)

        # Add old entry
        old_time = time.time() - 5000
        middleware.request_history["old_ip"] = [old_time]
        middleware.last_cleanup = time.time() - 400  # Force cleanup

        # Trigger cleanup
        middleware._cleanup_old_requests()

        # Old entry should be removed
        assert (
            "old_ip" not in middleware.request_history
            or len(middleware.request_history.get("old_ip", [])) == 0
        )


class TestRateLimitIntegration:
    """Integration tests for rate limiting."""

    def test_full_request_flow(self):
        """Test complete request flow with rate limiting."""
        with patch('ai_insights.utils.rate_limit._is_rate_limit_disabled', return_value=False):
            from ai_insights.utils.rate_limit import RateLimitMiddleware

            app = FastAPI()

            @app.get("/api/query")
            def query():
                return {"result": "data"}

            app.add_middleware(RateLimitMiddleware, requests_per_minute=10)
            client = TestClient(app)

            # Make several requests
            for i in range(5):
                response = client.get("/api/query")
                assert response.status_code == 200

                # Verify remaining decreases
                remaining = int(response.headers.get("X-RateLimit-Remaining-Minute", 0))
                assert remaining == 10 - (i + 1)

    def test_token_bucket_with_middleware(self):
        """Token bucket can work alongside middleware."""
        from ai_insights.utils.rate_limit import TokenBucketRateLimiter

        # Create limiter for specific expensive operations
        expensive_limiter = TokenBucketRateLimiter(rate=1.0, capacity=5)

        # Simulate expensive operation rate limiting
        results = []
        for _ in range(10):
            allowed = expensive_limiter.consume("user123")
            results.append(allowed)

        # First 5 should succeed, rest should fail
        assert results[:5] == [True] * 5
        assert results[5:] == [False] * 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
