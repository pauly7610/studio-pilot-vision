"""
Tests for ai_insights.cognee.cognee_lazy_loader module (Optimized Version).

Tests the CogneeLazyLoader class with caching, performance monitoring, and warm-up.
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
import asyncio
import time


class TestCogneeLazyLoaderInit:
    """Test CogneeLazyLoader initialization."""
    
    def test_init_sets_defaults(self):
        """Should initialize with default None values."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        assert loader._client is None
        assert loader._available is None
        assert loader._last_error is None
        assert loader._load_attempted_at is None
        assert loader._lock is not None
    
    def test_init_creates_cache(self):
        """Should initialize query cache."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        assert loader._query_cache == {}
        assert loader._cache_ttl == 300
        assert loader._cache_hits == 0
        assert loader._cache_misses == 0
    
    def test_init_creates_performance_tracking(self):
        """Should initialize performance tracking."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        assert loader._query_times == []
        assert loader._max_tracked_queries == 100


class TestIsAvailable:
    """Test is_available method."""
    
    def test_is_available_returns_cached_true(self):
        """Should return cached True value."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = True
        
        assert loader.is_available() is True
    
    def test_is_available_returns_cached_false(self):
        """Should return cached False value."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = False
        
        assert loader.is_available() is False
    
    @patch('importlib.util.find_spec')
    def test_is_available_checks_cognee_spec(self, mock_find_spec):
        """Should check if cognee module is installed."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_find_spec.return_value = MagicMock()
        
        loader = CogneeLazyLoader()
        result = loader.is_available()
        
        assert result is True
        mock_find_spec.assert_called_with("cognee")
    
    @patch('importlib.util.find_spec')
    def test_is_available_returns_false_if_not_installed(self, mock_find_spec):
        """Should return False if cognee not installed."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_find_spec.return_value = None
        
        loader = CogneeLazyLoader()
        result = loader.is_available()
        
        assert result is False


class TestGetClient:
    """Test get_client async method."""
    
    @pytest.mark.asyncio
    async def test_get_client_returns_cached_client(self):
        """Should return cached client if already loaded."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        mock_client = MagicMock()
        loader._client = mock_client
        
        result = await loader.get_client()
        
        assert result is mock_client
    
    @pytest.mark.asyncio
    async def test_get_client_returns_none_if_unavailable(self):
        """Should return None if marked unavailable."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = False
        
        result = await loader.get_client()
        
        assert result is None
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_lazy_loader.asyncio.to_thread')
    async def test_get_client_loads_successfully(self, mock_to_thread):
        """Should load client successfully."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_client = MagicMock()
        mock_to_thread.return_value = mock_client
        
        loader = CogneeLazyLoader()
        result = await loader.get_client()
        
        assert result is mock_client
        assert loader._client is mock_client
        assert loader._available is True
        assert loader._load_attempted_at is not None
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_lazy_loader.asyncio.to_thread')
    async def test_get_client_handles_import_error(self, mock_to_thread):
        """Should handle ImportError gracefully."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_to_thread.side_effect = ImportError("cognee not found")
        
        loader = CogneeLazyLoader()
        result = await loader.get_client()
        
        assert result is None
        assert loader._available is False
        assert "Import error" in loader._last_error


class TestCaching:
    """Test query caching functionality."""
    
    def test_get_cache_key_consistent(self):
        """Should generate consistent cache keys."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        key1 = loader._get_cache_key("test query", {"ctx": "value"})
        key2 = loader._get_cache_key("test query", {"ctx": "value"})
        
        assert key1 == key2
    
    def test_get_cache_key_different_for_different_queries(self):
        """Should generate different keys for different queries."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        key1 = loader._get_cache_key("query 1", None)
        key2 = loader._get_cache_key("query 2", None)
        
        assert key1 != key2
    
    def test_check_cache_returns_none_if_missing(self):
        """Should return None and increment misses."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        result = loader._check_cache("nonexistent")
        
        assert result is None
        assert loader._cache_misses == 1
    
    def test_check_cache_returns_valid_entry(self):
        """Should return cached result and increment hits."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._query_cache["test_key"] = {
            "result": {"answer": "cached"},
            "timestamp": time.time()
        }
        
        result = loader._check_cache("test_key")
        
        assert result == {"answer": "cached"}
        assert loader._cache_hits == 1
    
    def test_check_cache_expires_old_entries(self):
        """Should expire old cache entries."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._query_cache["old_key"] = {
            "result": {"answer": "old"},
            "timestamp": time.time() - 600  # 10 minutes ago
        }
        
        result = loader._check_cache("old_key")
        
        assert result is None
        assert "old_key" not in loader._query_cache
    
    def test_store_cache_adds_entry(self):
        """Should store entry in cache."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        loader._store_cache("new_key", {"answer": "new"})
        
        assert "new_key" in loader._query_cache
        assert loader._query_cache["new_key"]["result"] == {"answer": "new"}
    
    def test_store_cache_limits_size(self):
        """Should limit cache size."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        # Add 110 entries
        for i in range(110):
            loader._query_cache[f"key_{i}"] = {
                "result": {"data": i},
                "timestamp": time.time() - i
            }
        
        loader._store_cache("new_key", {"data": "new"})
        
        assert len(loader._query_cache) <= 101


class TestPerformanceTracking:
    """Test performance tracking functionality."""
    
    def test_track_query_time_adds_entry(self):
        """Should add query time to tracking."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        loader._track_query_time(0.5)
        
        assert len(loader._query_times) == 1
        assert loader._query_times[0]["time"] == 0.5
    
    def test_track_query_time_limits_entries(self):
        """Should limit number of tracked queries."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        # Add more than max
        for i in range(150):
            loader._track_query_time(0.1 * i)
        
        assert len(loader._query_times) <= 100


class TestQuery:
    """Test query method."""
    
    @pytest.mark.asyncio
    async def test_query_returns_cached_result(self):
        """Should return cached result."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        
        cache_key = loader._get_cache_key("cached query", None)
        loader._query_cache[cache_key] = {
            "result": {"answer": "cached", "results": []},
            "timestamp": time.time()
        }
        
        result = await loader.query("cached query", use_cache=True)
        
        assert result["answer"] == "cached"
        assert result.get("from_cache") is True
    
    @pytest.mark.asyncio
    async def test_query_returns_none_if_no_client(self):
        """Should return None if client unavailable."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = False
        
        result = await loader.query("test query", use_cache=False)
        
        assert result is None
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_lazy_loader.asyncio.to_thread')
    async def test_query_executes_and_caches(self, mock_to_thread):
        """Should execute query and cache result."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_client = MagicMock()
        mock_client.query_smart = AsyncMock(return_value={
            "results": [{"text": "result"}],
            "query": "test"
        })
        mock_client.query_fast = AsyncMock(return_value={
            "results": [{"text": "fast result"}],
            "query": "test"
        })
        mock_to_thread.return_value = mock_client
        
        loader = CogneeLazyLoader()
        result = await loader.query("test query", use_cache=True, fast_mode=False)
        
        assert result is not None
        assert result.get("from_cache") is False
        assert "query_time_ms" in result
        
        # Check it was cached
        cache_key = loader._get_cache_key("test query", None)
        assert cache_key in loader._query_cache
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_lazy_loader.asyncio.to_thread')
    async def test_query_fast_mode(self, mock_to_thread):
        """Should call query_fast in fast mode."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_client = MagicMock()
        mock_client.query_fast = AsyncMock(return_value={"results": []})
        mock_to_thread.return_value = mock_client
        
        loader = CogneeLazyLoader()
        await loader.query("test", fast_mode=True)
        
        mock_client.query_fast.assert_called_once()


class TestQueryFast:
    """Test query_fast convenience method."""
    
    @pytest.mark.asyncio
    async def test_query_fast_uses_fast_mode(self):
        """Should call query with fast_mode=True."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader.query = AsyncMock(return_value={"results": []})
        
        await loader.query_fast("test query")
        
        loader.query.assert_called_once_with("test query", None, fast_mode=True)


class TestWarmUp:
    """Test warm_up method."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_lazy_loader.asyncio.to_thread')
    async def test_warm_up_success(self, mock_to_thread):
        """Should warm up successfully."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        mock_client = MagicMock()
        mock_client.initialize = AsyncMock()
        mock_client.query_fast = AsyncMock(return_value={"results": []})
        mock_to_thread.return_value = mock_client
        
        loader = CogneeLazyLoader()
        result = await loader.warm_up()
        
        assert result is True
        mock_client.initialize.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_warm_up_fails_without_client(self):
        """Should return False if client unavailable."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = False
        
        result = await loader.warm_up()
        
        assert result is False


class TestClearCache:
    """Test clear_cache method."""
    
    def test_clear_cache_empties_cache(self):
        """Should clear the query cache."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._query_cache["key1"] = {"result": {}, "timestamp": time.time()}
        loader._query_cache["key2"] = {"result": {}, "timestamp": time.time()}
        
        loader.clear_cache()
        
        assert len(loader._query_cache) == 0


class TestGetStatus:
    """Test get_status method."""
    
    def test_get_status_returns_complete_status(self):
        """Should return complete status dictionary."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = True
        loader._cache_hits = 10
        loader._cache_misses = 5
        loader._query_times = [{"time": 0.5, "timestamp": time.time()}]
        
        status = loader.get_status()
        
        assert status["available"] is True
        assert "cache" in status
        assert status["cache"]["hits"] == 10
        assert status["cache"]["misses"] == 5
        assert status["cache"]["hit_rate"] == 10 / 15
        assert "performance" in status
        assert status["performance"]["total_queries"] == 1


class TestGetPerformanceSummary:
    """Test get_performance_summary method."""
    
    def test_get_performance_summary_returns_string(self):
        """Should return human-readable summary."""
        from ai_insights.cognee.cognee_lazy_loader import CogneeLazyLoader
        
        loader = CogneeLazyLoader()
        loader._available = True
        
        summary = loader.get_performance_summary()
        
        assert isinstance(summary, str)
        assert "Available" in summary
        assert "Cache" in summary


class TestGetCogneeLazyLoader:
    """Test singleton factory function."""
    
    def test_returns_loader_instance(self):
        """Should return CogneeLazyLoader instance."""
        import ai_insights.cognee.cognee_lazy_loader as module
        
        module._lazy_loader = None
        
        loader = module.get_cognee_lazy_loader()
        
        assert isinstance(loader, module.CogneeLazyLoader)
    
    def test_returns_singleton(self):
        """Should return same instance on multiple calls."""
        import ai_insights.cognee.cognee_lazy_loader as module
        
        module._lazy_loader = None
        
        loader1 = module.get_cognee_lazy_loader()
        loader2 = module.get_cognee_lazy_loader()
        
        assert loader1 is loader2


class TestResetCogneeLazyLoader:
    """Test reset function."""
    
    def test_reset_clears_singleton(self):
        """Should reset the global singleton."""
        import ai_insights.cognee.cognee_lazy_loader as module
        
        # Create a loader
        loader = module.get_cognee_lazy_loader()
        loader._query_cache["key"] = {"result": {}, "timestamp": time.time()}
        
        # Reset
        module.reset_cognee_lazy_loader()
        
        assert module._lazy_loader is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])