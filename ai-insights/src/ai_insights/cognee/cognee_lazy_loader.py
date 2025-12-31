"""
Lazy-loading wrapper for Cognee to minimize memory footprint.

OPTIMIZATIONS (Professional Plan):
1. Query-level caching with TTL
2. Performance monitoring
3. Warm-up support
4. Graceful degradation with detailed status
"""

import asyncio
import hashlib
import time
from datetime import datetime
from typing import Any, Optional


class CogneeLazyLoader:
    """
    Lazy-loading wrapper for Cognee client with performance optimizations.

    Features:
    1. Lazy import (only load Cognee when first needed)
    2. Query caching (avoid repeated work)
    3. Performance monitoring (track query times)
    4. Thread-safe loading (asyncio.Lock)
    """

    def __init__(self):
        """Initialize loader without importing cognee."""
        self._client = None
        self._available = None
        self._last_error = None
        self._load_attempted_at = None
        self._lock = asyncio.Lock()
        
        # Query cache
        self._query_cache: dict = {}
        self._cache_ttl = 300  # 5 minutes
        self._cache_hits = 0
        self._cache_misses = 0
        
        # Performance tracking
        self._query_times: list = []
        self._max_tracked_queries = 100

    def is_available(self) -> bool:
        """Check if Cognee is available without loading it."""
        if self._available is not None:
            return self._available

        try:
            import importlib.util
            spec = importlib.util.find_spec("cognee")
            return spec is not None
        except Exception:
            return False

    async def get_client(self):
        """Get Cognee client, loading it if necessary (thread-safe)."""
        if self._client is not None:
            return self._client

        if self._available is False:
            return None

        async with self._lock:
            # Double-check after acquiring lock
            if self._client is not None:
                return self._client

            try:
                self._load_attempted_at = datetime.now()
                load_start = time.time()

                def _sync_load():
                    from ai_insights.cognee.cognee_client import get_cognee_client
                    return get_cognee_client()

                self._client = await asyncio.to_thread(_sync_load)
                self._available = True

                load_time = time.time() - load_start
                print(f"✓ Cognee loaded successfully in {load_time:.2f}s")

                return self._client

            except ImportError as e:
                self._available = False
                self._last_error = f"Import error: {str(e)}"
                print(f"⚠️ Cognee unavailable: {self._last_error}")
                return None

            except Exception as e:
                self._available = False
                self._last_error = f"Load error: {str(e)}"
                print(f"⚠️ Cognee load failed: {self._last_error}")
                return None

    def _get_cache_key(self, query_text: str, context: Optional[dict]) -> str:
        """Generate cache key for query."""
        context_str = str(sorted(context.items())) if context else ""
        return hashlib.md5(f"{query_text}:{context_str}".encode()).hexdigest()

    def _check_cache(self, cache_key: str) -> Optional[dict]:
        """Check if query result is cached and valid."""
        if cache_key in self._query_cache:
            cached = self._query_cache[cache_key]
            if time.time() - cached["timestamp"] < self._cache_ttl:
                self._cache_hits += 1
                return cached["result"]
            else:
                del self._query_cache[cache_key]
        
        self._cache_misses += 1
        return None

    def _store_cache(self, cache_key: str, result: dict):
        """Store query result in cache."""
        # Limit cache size
        if len(self._query_cache) > 100:
            oldest = sorted(
                self._query_cache.keys(),
                key=lambda k: self._query_cache[k]["timestamp"]
            )[:20]
            for key in oldest:
                del self._query_cache[key]
        
        self._query_cache[cache_key] = {
            "result": result,
            "timestamp": time.time()
        }

    def _track_query_time(self, query_time: float):
        """Track query time for performance monitoring."""
        self._query_times.append({
            "time": query_time,
            "timestamp": time.time()
        })
        
        # Keep only recent queries
        if len(self._query_times) > self._max_tracked_queries:
            self._query_times = self._query_times[-self._max_tracked_queries:]

    async def query(
        self, 
        query_text: str, 
        context: Optional[dict[str, Any]] = None,
        use_cache: bool = True,
        fast_mode: bool = False
    ) -> Optional[dict[str, Any]]:
        """
        Query Cognee with graceful degradation and caching.

        Args:
            query_text: Natural language query
            context: Additional context
            use_cache: Whether to use query caching
            fast_mode: Use fast search (CHUNKS) instead of INSIGHTS

        Returns:
            Query results or None if unavailable
        """
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(query_text, context)
            cached = self._check_cache(cache_key)
            if cached:
                cached["from_cache"] = True
                return cached

        # Get client
        client = await self.get_client()
        if client is None:
            return None

        try:
            start_time = time.time()
            
            # Choose query method based on mode
            if fast_mode:
                result = await client.query_fast(query_text, context)
            else:
                result = await client.query_smart(query_text, context)
            
            query_time = time.time() - start_time
            self._track_query_time(query_time)
            
            result["from_cache"] = False
            result["query_time_ms"] = int(query_time * 1000)

            # Cache the result
            if use_cache:
                self._store_cache(cache_key, result)

            return result

        except Exception as e:
            print(f"⚠️ Cognee query failed: {str(e)}")
            return None

    async def query_fast(
        self, 
        query_text: str, 
        context: Optional[dict[str, Any]] = None
    ) -> Optional[dict[str, Any]]:
        """Fast query (vector search only, no LLM reasoning)."""
        return await self.query(query_text, context, fast_mode=True)

    async def warm_up(self) -> bool:
        """
        Warm up Cognee for faster first query.
        Call this during app startup.
        """
        try:
            print("🔥 Warming up Cognee...")
            client = await self.get_client()
            
            if client is None:
                print("⚠️ Warm-up failed: client unavailable")
                return False
            
            await client.initialize()
            
            # Run a dummy query to warm caches
            warmup_start = time.time()
            await self.query("warmup query", use_cache=False, fast_mode=True)
            warmup_time = time.time() - warmup_start
            
            print(f"✓ Cognee warm-up complete in {warmup_time:.2f}s")
            return True
            
        except Exception as e:
            print(f"⚠️ Warm-up failed: {e}")
            return False

    def clear_cache(self):
        """Clear the query cache."""
        self._query_cache.clear()
        print("✓ Query cache cleared")

    def get_status(self) -> dict[str, Any]:
        """Get detailed loader status for debugging/monitoring."""
        # Calculate average query time
        if self._query_times:
            avg_time = sum(q["time"] for q in self._query_times) / len(self._query_times)
            recent_times = [q["time"] for q in self._query_times[-10:]]
            recent_avg = sum(recent_times) / len(recent_times) if recent_times else 0
        else:
            avg_time = 0
            recent_avg = 0

        return {
            "available": self._available,
            "client_loaded": self._client is not None,
            "last_error": self._last_error,
            "load_attempted_at": str(self._load_attempted_at) if self._load_attempted_at else None,
            "cache": {
                "size": len(self._query_cache),
                "ttl_seconds": self._cache_ttl,
                "hits": self._cache_hits,
                "misses": self._cache_misses,
                "hit_rate": (
                    self._cache_hits / (self._cache_hits + self._cache_misses)
                    if (self._cache_hits + self._cache_misses) > 0 else 0
                ),
            },
            "performance": {
                "total_queries": len(self._query_times),
                "avg_query_time_ms": int(avg_time * 1000),
                "recent_avg_time_ms": int(recent_avg * 1000),
            },
        }

    def get_performance_summary(self) -> str:
        """Get human-readable performance summary."""
        status = self.get_status()
        cache = status["cache"]
        perf = status["performance"]
        
        return (
            f"Cognee Status: {'✓ Available' if status['available'] else '✗ Unavailable'}\n"
            f"Cache: {cache['size']} entries, {cache['hit_rate']:.0%} hit rate\n"
            f"Performance: {perf['avg_query_time_ms']}ms avg, "
            f"{perf['recent_avg_time_ms']}ms recent\n"
            f"Total queries: {perf['total_queries']}"
        )


# Global lazy loader instance
_lazy_loader: Optional[CogneeLazyLoader] = None


def get_cognee_lazy_loader() -> CogneeLazyLoader:
    """Get or create global Cognee lazy loader."""
    global _lazy_loader
    if _lazy_loader is None:
        _lazy_loader = CogneeLazyLoader()
    return _lazy_loader


def reset_cognee_lazy_loader():
    """Reset the global lazy loader (for testing)."""
    global _lazy_loader
    if _lazy_loader:
        _lazy_loader.clear_cache()
    _lazy_loader = None