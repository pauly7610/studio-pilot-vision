"""
Tests for ai_insights.cognee.cognee_client module (Optimized Version).

Tests the CogneeClient class with caching, fast/smart queries, and performance features.
"""

import pytest
import sys
from unittest.mock import MagicMock, patch, AsyncMock
import asyncio
import time


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


class TestCogneeClientInit:
    """Test CogneeClient initialization."""
    
    def test_init_defaults(self):
        """Should initialize with default values."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        
        assert client.initialized is False
    
    def test_class_level_flags_exist(self):
        """Should have class-level initialization flags."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        assert hasattr(CogneeClient, '_class_initialized')
        assert hasattr(CogneeClient, '_config_applied')
        assert hasattr(CogneeClient, '_query_cache')
        assert hasattr(CogneeClient, '_cache_ttl')


class TestApplyCogneeConfig:
    """Test Cognee configuration via API."""
    
    @patch('ai_insights.cognee.cognee_client.cognee')
    def test_apply_config_only_runs_once(self, mock_cognee):
        """Should only configure once."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        CogneeClient._config_applied = True
        
        # This should return immediately without calling cognee.config
        CogneeClient._apply_cognee_config()
        
        # No cognee.config calls should be made
        mock_cognee.config.set_embedding_model.assert_not_called()
        assert CogneeClient._config_applied is True
    
    @patch('ai_insights.cognee.cognee_client.cognee')
    def test_apply_config_uses_fastembed_by_default(self, mock_cognee, monkeypatch):
        """Should configure FastEmbed when EMBEDDING_PROVIDER=fastembed."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        # Reset class state
        CogneeClient._config_applied = False
        
        # Simulate Render env vars
        monkeypatch.setenv("EMBEDDING_PROVIDER", "fastembed")
        monkeypatch.setenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        monkeypatch.setenv("EMBEDDING_DIMENSIONS", "384")
        monkeypatch.setenv("GROQ_API_KEY", "test-key")
        
        CogneeClient._apply_cognee_config()
        
        # Should call cognee.config.set_embedding_model with fastembed provider
        mock_cognee.config.set_embedding_model.assert_called_once()
        call_kwargs = mock_cognee.config.set_embedding_model.call_args[1]
        assert call_kwargs["provider"] == "fastembed"
        assert call_kwargs["model"] == "sentence-transformers/all-MiniLM-L6-v2"
        assert call_kwargs["dimensions"] == 384
    
    @patch('ai_insights.cognee.cognee_client.cognee')
    def test_apply_config_sets_llm_model(self, mock_cognee, monkeypatch):
        """Should configure LLM via cognee.config API."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        # Reset class state
        CogneeClient._config_applied = False
        
        # Set required env vars
        monkeypatch.setenv("EMBEDDING_PROVIDER", "fastembed")
        monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
        monkeypatch.setenv("LLM_MODEL", "groq/llama-3.3-70b-versatile")
        
        CogneeClient._apply_cognee_config()
        
        # Should call cognee.config.set_llm_model
        mock_cognee.config.set_llm_model.assert_called_once()
        call_kwargs = mock_cognee.config.set_llm_model.call_args[1]
        assert call_kwargs["api_key"] == "test-groq-key"
    
    @patch('ai_insights.cognee.cognee_client.cognee')
    def test_apply_config_sets_data_directory(self, mock_cognee, monkeypatch):
        """Should set data directory via cognee.config API."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        # Reset class state
        CogneeClient._config_applied = False
        
        monkeypatch.setenv("EMBEDDING_PROVIDER", "fastembed")
        monkeypatch.setenv("COGNEE_DATA_PATH", "/data/cognee")
        monkeypatch.setenv("GROQ_API_KEY", "test-key")
        
        CogneeClient._apply_cognee_config()
        
        # Should call cognee.config.set_data_directory
        mock_cognee.config.set_data_directory.assert_called_once_with("/data/cognee")


class TestCogneeClientInitialize:
    """Test async initialize method."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_initialize_sets_flags(self, mock_cognee):
        """Should set initialized flags."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        # Reset state
        CogneeClient._class_initialized = False
        CogneeClient._config_applied = False
        
        client = CogneeClient()
        await client.initialize()
        
        assert client.initialized is True
        assert CogneeClient._class_initialized is True
    
    @pytest.mark.asyncio
    async def test_initialize_skips_if_already_done(self):
        """Should skip if already initialized."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        CogneeClient._class_initialized = True
        
        client = CogneeClient()
        client.initialized = True
        
        # Should return immediately without error
        await client.initialize()
        
        assert client.initialized is True


class TestCogneeClientAddData:
    """Test add_data method."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_add_data_basic(self, mock_cognee):
        """Should add data to Cognee."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        mock_cognee.add = AsyncMock(return_value="success")
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        
        result = await client.add_data("test data")
        
        assert result == "success"
        mock_cognee.add.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_add_data_with_node_set(self, mock_cognee):
        """Should pass node_set to Cognee."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        mock_cognee.add = AsyncMock(return_value="success")
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        
        await client.add_data("test", node_set="products")
        
        mock_cognee.add.assert_called_once()
        call_kwargs = mock_cognee.add.call_args[1]
        assert call_kwargs.get("node_set") == "products"


class TestCogneeClientCognify:
    """Test cognify method."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_cognify_clears_cache(self, mock_cognee):
        """Should clear query cache after cognify."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        mock_cognee.cognify = AsyncMock(return_value="processed")
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        
        # Add something to cache
        CogneeClient._query_cache["test_key"] = {"result": "cached"}
        
        await client.cognify()
        
        assert len(CogneeClient._query_cache) == 0


class TestCogneeClientCaching:
    """Test query caching functionality."""
    
    def test_get_cache_key_consistent(self):
        """Should generate consistent cache keys."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        
        key1 = client._get_cache_key("test query", {"ctx": "value"})
        key2 = client._get_cache_key("test query", {"ctx": "value"})
        
        assert key1 == key2
    
    def test_get_cache_key_different_for_different_queries(self):
        """Should generate different keys for different queries."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        
        key1 = client._get_cache_key("query 1", None)
        key2 = client._get_cache_key("query 2", None)
        
        assert key1 != key2
    
    def test_get_cached_result_returns_none_if_missing(self):
        """Should return None if not cached."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        CogneeClient._query_cache.clear()
        
        result = client._get_cached_result("nonexistent_key")
        
        assert result is None
    
    def test_get_cached_result_returns_valid_cache(self):
        """Should return cached result if valid."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        
        # Add to cache
        CogneeClient._query_cache["test_key"] = {
            "result": {"answer": "cached answer"},
            "timestamp": time.time()
        }
        
        result = client._get_cached_result("test_key")
        
        assert result == {"answer": "cached answer"}
    
    def test_get_cached_result_expires_old_entries(self):
        """Should not return expired cache entries."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        
        # Add expired entry
        CogneeClient._query_cache["expired_key"] = {
            "result": {"answer": "old"},
            "timestamp": time.time() - 600  # 10 minutes ago
        }
        
        result = client._get_cached_result("expired_key")
        
        assert result is None
        assert "expired_key" not in CogneeClient._query_cache
    
    def test_cache_result_limits_size(self):
        """Should limit cache size."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        CogneeClient._query_cache.clear()
        
        # Add 110 entries
        for i in range(110):
            CogneeClient._query_cache[f"key_{i}"] = {
                "result": {"data": i},
                "timestamp": time.time() - i  # Older entries have smaller timestamps
            }
        
        # Cache a new result (should trigger cleanup)
        client._cache_result("new_key", {"data": "new"})
        
        # Should have removed oldest entries
        assert len(CogneeClient._query_cache) <= 101


class TestCogneeClientQuery:
    """Test query methods."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_query_returns_cached_result(self, mock_cognee):
        """Should return cached result without calling Cognee."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        
        # Pre-populate cache
        cache_key = client._get_cache_key("cached query", None)
        CogneeClient._query_cache[cache_key] = {
            "result": {"query": "cached query", "results": ["cached"]},
            "timestamp": time.time()
        }
        
        result = await client.query("cached query", use_cache=True)
        
        assert result["results"] == ["cached"]
        mock_cognee.search.assert_not_called()
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_query_executes_when_not_cached(self, mock_cognee):
        """Should execute query when not cached."""
        from ai_insights.cognee.cognee_client import CogneeClient, SearchType
        
        mock_cognee.search = AsyncMock(return_value=[{"text": "result"}])
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        CogneeClient._query_cache.clear()
        
        result = await client.query("new query", use_cache=False)
        
        assert result["query"] == "new query"
        assert "query_time_ms" in result
        mock_cognee.search.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_query_fast_uses_chunks(self, mock_cognee):
        """Should use CHUNKS search type for fast queries."""
        from ai_insights.cognee.cognee_client import CogneeClient
        from cognee import SearchType
        
        mock_cognee.search = AsyncMock(return_value=[])
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        
        await client.query_fast("fast query")
        
        mock_cognee.search.assert_called_once()
        call_kwargs = mock_cognee.search.call_args[1]
        assert call_kwargs["query_type"] == SearchType.CHUNKS
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_query_smart_uses_summaries(self, mock_cognee):
        """Should use SUMMARIES search type for smart queries."""
        from ai_insights.cognee.cognee_client import CogneeClient
        from cognee import SearchType
        
        mock_cognee.search = AsyncMock(return_value=[])
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        
        await client.query_smart("smart query")
        
        mock_cognee.search.assert_called_once()
        call_kwargs = mock_cognee.search.call_args[1]
        assert call_kwargs["query_type"] == SearchType.SUMMARIES


class TestCogneeClientReset:
    """Test reset method."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.cognee_client.cognee')
    async def test_reset_clears_state(self, mock_cognee):
        """Should clear all state on reset."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        mock_cognee.prune.prune_data = AsyncMock()
        mock_cognee.prune.prune_system = AsyncMock()
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        CogneeClient._query_cache["key"] = {"data": "value"}
        
        await client.reset()
        
        assert client.initialized is False
        assert CogneeClient._class_initialized is False
        assert len(CogneeClient._query_cache) == 0


class TestCogneeClientCacheStats:
    """Test cache statistics."""
    
    def test_get_cache_stats(self):
        """Should return cache statistics."""
        from ai_insights.cognee.cognee_client import CogneeClient
        
        client = CogneeClient()
        client.initialized = True
        CogneeClient._class_initialized = True
        CogneeClient._query_cache["key1"] = {"result": {}, "timestamp": time.time()}
        
        stats = client.get_cache_stats()
        
        assert "cache_size" in stats
        assert "cache_ttl_seconds" in stats
        assert "initialized" in stats
        assert "class_initialized" in stats
        assert stats["cache_size"] >= 1


class TestGetCogneeClient:
    """Test singleton factory function."""
    
    def test_returns_client_instance(self):
        """Should return CogneeClient instance."""
        import ai_insights.cognee.cognee_client as module
        
        # Reset singleton
        module._cognee_client = None
        
        client = module.get_cognee_client()
        
        assert isinstance(client, module.CogneeClient)
    
    def test_returns_singleton(self):
        """Should return same instance on multiple calls."""
        import ai_insights.cognee.cognee_client as module
        
        # Reset singleton
        module._cognee_client = None
        
        client1 = module.get_cognee_client()
        client2 = module.get_cognee_client()
        
        assert client1 is client2


# Cleanup fixture
@pytest.fixture(autouse=True)
def reset_cognee_state():
    """Reset CogneeClient class state before each test."""
    from ai_insights.cognee.cognee_client import CogneeClient
    import ai_insights.cognee.cognee_client as module
    
    # Store original state
    original_class_init = CogneeClient._class_initialized
    original_config_applied = CogneeClient._config_applied
    original_cache = CogneeClient._query_cache.copy()
    original_client = module._cognee_client
    
    yield
    
    # Restore original state
    CogneeClient._class_initialized = original_class_init
    CogneeClient._config_applied = original_config_applied
    CogneeClient._query_cache = original_cache
    module._cognee_client = original_client


if __name__ == "__main__":
    pytest.main([__file__, "-v"])