"""
Cognee Client - Knowledge Graph Memory Layer
Handles connection, entity management, and query interface for Cognee.

OPTIMIZATIONS (Professional Plan):
1. Class-level initialization caching
2. Lazy environment setup
3. Query result caching
4. Faster search types when appropriate
"""

import hashlib
import os
import time
from datetime import datetime
from typing import Any, Optional

import cognee
from cognee import SearchType


class CogneeClient:
    """Client for interacting with Cognee knowledge graph."""
    
    # Class-level initialization flag (persists across instances)
    _class_initialized = False
    _env_configured = False
    
    # Query cache for repeated queries
    _query_cache: dict = {}
    _cache_ttl = 300  # 5 minutes

    def __init__(self):
        """Initialize Cognee connection."""
        self.initialized = False

    @classmethod
    def _configure_environment(cls):
        """Configure environment variables once (class-level)."""
        if cls._env_configured:
            return
        
        # LLM Configuration (Groq via LiteLLM custom provider)
        # Cognee expects LLM_API_KEY, copy from GROQ_API_KEY if not set
        if not os.getenv("LLM_API_KEY"):
            if os.getenv("GROQ_API_KEY"):
                os.environ["LLM_API_KEY"] = os.getenv("GROQ_API_KEY")
        
        # CRITICAL: Use "custom" provider with groq/ prefix for LiteLLM routing
        os.environ["LLM_PROVIDER"] = "custom"
        os.environ["LLM_MODEL"] = "groq/llama-3.3-70b-versatile"
        os.environ["LLM_ENDPOINT"] = "https://api.groq.com/openai/v1"

        # Embedding Configuration - USE LOCAL for speed!
        # This avoids HuggingFace API latency (~500ms per query)
        os.environ["EMBEDDING_PROVIDER"] = "sentence-transformers"
        os.environ["EMBEDDING_MODEL"] = "all-MiniLM-L6-v2"
        os.environ["EMBEDDING_DIMENSIONS"] = "384"
        
        # If you prefer remote embeddings (for lower RAM), uncomment:
        # if not os.getenv("EMBEDDING_API_KEY") and os.getenv("HUGGINGFACE_API_KEY"):
        #     os.environ["EMBEDDING_API_KEY"] = os.getenv("HUGGINGFACE_API_KEY")
        # os.environ["EMBEDDING_PROVIDER"] = "custom"
        # os.environ["EMBEDDING_MODEL"] = "huggingface/sentence-transformers/all-MiniLM-L6-v2"
        # os.environ["EMBEDDING_ENDPOINT"] = "https://api-inference.huggingface.co/pipeline/feature-extraction"

        # Storage Configuration - Use persistent storage on Render Pro
        os.environ["VECTOR_DB_PROVIDER"] = "lancedb"
        os.environ["GRAPH_DB_PROVIDER"] = "networkx"
        os.environ["ENABLE_BACKEND_ACCESS_CONTROL"] = "false"

        # Persistent data path
        data_path = os.getenv("COGNEE_DATA_PATH", "./cognee_data")
        os.environ["COGNEE_DATA_DIR"] = data_path
        
        cls._env_configured = True
        print("✓ Cognee environment configured")

    async def initialize(self):
        """Initialize Cognee with configuration (cached at class level)."""
        # Quick return if already initialized
        if CogneeClient._class_initialized and self.initialized:
            return
        
        # Configure environment once
        self._configure_environment()
        
        # Mark as initialized
        CogneeClient._class_initialized = True
        self.initialized = True
        print("✓ Cognee client initialized")

    async def add_data(
        self, data: Any, user_id: Optional[str] = None, node_set: Optional[str] = None
    ) -> str:
        """Add data to Cognee knowledge graph."""
        if not self.initialized:
            await self.initialize()

        kwargs = {}
        if user_id:
            kwargs["user_id"] = user_id
        if node_set:
            kwargs["node_set"] = node_set

        result = await cognee.add(data, **kwargs)
        return str(result)

    async def add_entity(
        self,
        entity_type: str,
        entity_id: str,
        properties: dict,
        metadata: Optional[dict] = None,
    ) -> str:
        """Add an entity to the knowledge graph."""
        entity_data = {"type": entity_type, "id": entity_id, **properties}
        if metadata:
            entity_data["metadata"] = metadata
        return await self.add_data(entity_data)

    async def add_relationship(
        self,
        source_id: str,
        relationship_type: str,
        target_id: str,
        properties: Optional[dict] = None,
    ) -> str:
        """Add a relationship between entities."""
        relationship_data = {
            "source": source_id,
            "type": relationship_type,
            "target": target_id,
        }
        if properties:
            relationship_data["properties"] = properties
        return await self.add_data(relationship_data)

    async def cognify(self) -> str:
        """Process all added data into knowledge graph."""
        if not self.initialized:
            await self.initialize()

        result = await cognee.cognify()
        
        # Clear query cache after cognify (data changed)
        CogneeClient._query_cache.clear()
        
        return str(result)

    def _get_cache_key(self, query_text: str, context: Optional[dict]) -> str:
        """Generate cache key for query."""
        context_str = str(sorted(context.items())) if context else ""
        return hashlib.md5(f"{query_text}:{context_str}".encode()).hexdigest()

    def _get_cached_result(self, cache_key: str) -> Optional[dict]:
        """Get cached result if valid."""
        if cache_key in CogneeClient._query_cache:
            cached = CogneeClient._query_cache[cache_key]
            if time.time() - cached["timestamp"] < self._cache_ttl:
                print(f"✓ Cache hit for query")
                return cached["result"]
            else:
                # Expired, remove it
                del CogneeClient._query_cache[cache_key]
        return None

    def _cache_result(self, cache_key: str, result: dict):
        """Cache query result."""
        # Limit cache size to prevent memory bloat
        if len(CogneeClient._query_cache) > 100:
            # Remove oldest entries
            oldest_keys = sorted(
                CogneeClient._query_cache.keys(),
                key=lambda k: CogneeClient._query_cache[k]["timestamp"]
            )[:20]
            for key in oldest_keys:
                del CogneeClient._query_cache[key]
        
        CogneeClient._query_cache[cache_key] = {
            "result": result,
            "timestamp": time.time()
        }

    async def query(
        self, 
        query_text: str, 
        context: Optional[dict[str, Any]] = None,
        use_cache: bool = True,
        search_type: SearchType = SearchType.SUMMARIES
    ) -> dict[str, Any]:
        """
        Query the knowledge graph with natural language.

        Args:
            query_text: Natural language query
            context: Additional context
            use_cache: Whether to use query caching (default True)
            search_type: Type of search (SUMMARIES=slow+smart, CHUNKS=fast+simple)

        Returns:
            Query results with entities, relationships, and answer
        """
        if not self.initialized:
            await self.initialize()

        # Check cache first
        cache_key = self._get_cache_key(query_text, context)
        if use_cache:
            cached = self._get_cached_result(cache_key)
            if cached:
                return cached

        # Execute query
        start_time = time.time()
        search_results = await cognee.search(
            query_text=query_text, 
            query_type=search_type
        )
        query_time = time.time() - start_time

        result = {
            "query": query_text,
            "results": search_results,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat(),
            "query_time_ms": int(query_time * 1000),
            "search_type": search_type.value if hasattr(search_type, 'value') else str(search_type),
        }

        # Cache the result
        if use_cache:
            self._cache_result(cache_key, result)

        return result

    async def query_fast(
        self, 
        query_text: str, 
        context: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """
        Fast query using CHUNKS search (vector similarity only, no LLM).
        
        Use this for:
        - Autocomplete/suggestions
        - Quick lookups
        - High-volume queries
        """
        return await self.query(
            query_text, 
            context, 
            search_type=SearchType.CHUNKS
        )

    async def query_smart(
        self, 
        query_text: str, 
        context: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """
        Smart query using SUMMARIES search (includes LLM reasoning).
        
        Use this for:
        - Complex questions
        - Causal/historical queries
        - When explanation is needed
        """
        return await self.query(
            query_text, 
            context, 
            search_type=SearchType.SUMMARIES
        )

    async def reset(self):
        """Reset Cognee (clear all data) - use with caution!"""
        await cognee.prune.prune_data()
        await cognee.prune.prune_system(metadata=True)
        CogneeClient._class_initialized = False
        CogneeClient._query_cache.clear()
        self.initialized = False
        print("✓ Cognee reset complete")

    def get_cache_stats(self) -> dict:
        """Get cache statistics for monitoring."""
        return {
            "cache_size": len(CogneeClient._query_cache),
            "cache_ttl_seconds": self._cache_ttl,
            "initialized": self.initialized,
            "class_initialized": CogneeClient._class_initialized,
        }


# Global client instance
_cognee_client: Optional[CogneeClient] = None


def get_cognee_client() -> CogneeClient:
    """Get or create the global Cognee client instance."""
    global _cognee_client
    if _cognee_client is None:
        _cognee_client = CogneeClient()
    return _cognee_client