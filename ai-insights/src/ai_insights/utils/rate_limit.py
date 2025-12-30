"""
Rate Limiting Middleware
Prevents API abuse with configurable rate limits.
"""

import time
from collections import defaultdict
from typing import Optional

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm.

    Args:
        requests_per_minute: Maximum requests per minute per IP
        requests_per_hour: Maximum requests per hour per IP
    """

    def __init__(self, app, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour

        # Store request timestamps per IP
        self.request_history: dict[str, list[float]] = defaultdict(list)

        # Last cleanup time
        self.last_cleanup = time.time()

    def _cleanup_old_requests(self):
        """Remove old request timestamps to prevent memory leak."""
        current_time = time.time()

        # Cleanup every 5 minutes
        if current_time - self.last_cleanup < 300:
            return

        one_hour_ago = current_time - 3600

        # Remove old timestamps
        for ip in list(self.request_history.keys()):
            self.request_history[ip] = [ts for ts in self.request_history[ip] if ts > one_hour_ago]

            # Remove empty entries
            if not self.request_history[ip]:
                del self.request_history[ip]

        self.last_cleanup = current_time

    def _check_rate_limit(self, ip: str) -> Optional[str]:
        """
        Check if IP has exceeded rate limits.

        Returns:
            Error message if rate limit exceeded, None otherwise
        """
        current_time = time.time()
        timestamps = self.request_history[ip]

        # Check minute limit
        one_minute_ago = current_time - 60
        recent_requests = sum(1 for ts in timestamps if ts > one_minute_ago)

        if recent_requests >= self.requests_per_minute:
            return f"Rate limit exceeded: {self.requests_per_minute} requests per minute"

        # Check hour limit
        one_hour_ago = current_time - 3600
        hourly_requests = sum(1 for ts in timestamps if ts > one_hour_ago)

        if hourly_requests >= self.requests_per_hour:
            return f"Rate limit exceeded: {self.requests_per_hour} requests per hour"

        return None

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        # Skip rate limiting for health check and metrics
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Check rate limit
        error_message = self._check_rate_limit(client_ip)
        if error_message:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_message,
                headers={"Retry-After": "60"},
            )

        # Record request
        self.request_history[client_ip].append(time.time())

        # Cleanup old requests periodically
        self._cleanup_old_requests()

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        timestamps = self.request_history[client_ip]
        current_time = time.time()

        one_minute_ago = current_time - 60
        minute_requests = sum(1 for ts in timestamps if ts > one_minute_ago)

        response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining-Minute"] = str(
            max(0, self.requests_per_minute - minute_requests)
        )

        return response


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter for more sophisticated rate limiting.
    Allows bursts while maintaining average rate.
    """

    def __init__(self, rate: float, capacity: int):
        """
        Initialize token bucket.

        Args:
            rate: Tokens added per second
            capacity: Maximum tokens in bucket
        """
        self.rate = rate
        self.capacity = capacity
        self.buckets: dict[str, dict] = {}

    def _get_bucket(self, key: str) -> dict:
        """Get or create bucket for key."""
        if key not in self.buckets:
            self.buckets[key] = {"tokens": self.capacity, "last_update": time.time()}
        return self.buckets[key]

    def _add_tokens(self, bucket: dict):
        """Add tokens based on elapsed time."""
        now = time.time()
        elapsed = now - bucket["last_update"]

        # Add tokens based on rate
        tokens_to_add = elapsed * self.rate
        bucket["tokens"] = min(self.capacity, bucket["tokens"] + tokens_to_add)
        bucket["last_update"] = now

    def consume(self, key: str, tokens: int = 1) -> bool:
        """
        Try to consume tokens from bucket.

        Args:
            key: Identifier (e.g., IP address)
            tokens: Number of tokens to consume

        Returns:
            True if tokens consumed, False if insufficient tokens
        """
        bucket = self._get_bucket(key)
        self._add_tokens(bucket)

        if bucket["tokens"] >= tokens:
            bucket["tokens"] -= tokens
            return True

        return False

    def cleanup_old_buckets(self, max_age_seconds: int = 3600):
        """Remove buckets that haven't been used recently."""
        now = time.time()
        old_keys = [
            key
            for key, bucket in self.buckets.items()
            if now - bucket["last_update"] > max_age_seconds
        ]
        for key in old_keys:
            del self.buckets[key]
