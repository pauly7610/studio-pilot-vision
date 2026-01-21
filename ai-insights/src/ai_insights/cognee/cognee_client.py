"""
Cognee Client - Knowledge Graph Memory Layer
Handles connection, entity management, and query interface for Cognee.

OPTIMIZATIONS (Professional Plan):
1. Class-level initialization caching
2. Lazy environment setup
3. Query result caching
4. Faster search types when appropriate
5. Concurrency control to prevent SQLite database locking
"""

import asyncio
import hashlib
import json
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
    _config_applied = False

    # Query cache for repeated queries
    _query_cache: dict = {}
    _cache_ttl = 300  # 5 minutes

    # Concurrency control to prevent SQLite "database is locked" errors
    _cognify_lock = asyncio.Lock()
    _add_data_lock = asyncio.Lock()

    def __init__(self):
        """Initialize Cognee connection."""
        self.initialized = False

    @classmethod
    def _apply_cognee_config(cls):
        """
        Apply Cognee configuration using its API.
        
        NOTE: Cognee does NOT have set_embedding_model() - embeddings are 
        configured via environment variables ONLY:
        - EMBEDDING_PROVIDER (fastembed, litellm, etc.)
        - EMBEDDING_MODEL (model name)
        - EMBEDDING_DIMENSIONS (vector size)
        
        The env vars MUST be set in Render dashboard before deployment.
        """
        if cls._config_applied:
            return
        
        # Get configuration from env vars (set in Render dashboard)
        embedding_provider = os.getenv("EMBEDDING_PROVIDER", "fastembed")
        embedding_model = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        
        llm_provider = os.getenv("LLM_PROVIDER", "custom")
        llm_model = os.getenv("LLM_MODEL", "groq/llama-3.3-70b-versatile")
        llm_endpoint = os.getenv("LLM_ENDPOINT", "https://api.groq.com/openai/v1")
        llm_api_key = os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY")

        # Data path for persistent storage
        # Check both COGNEE_DATA_DIR (from settings.py) and COGNEE_DATA_PATH (legacy)
        data_path = os.getenv("COGNEE_DATA_DIR", os.getenv("COGNEE_DATA_PATH", "./cognee_data"))

        # Ensure data directory exists with proper permissions
        try:
            os.makedirs(data_path, mode=0o755, exist_ok=True)
            print(f"✓ Cognee data directory ready: {data_path}")
        except Exception as e:
            print(f"⚠️ Could not create data directory {data_path}: {e}")
            # Fall back to /tmp if current path fails (Render-safe)
            data_path = "/tmp/cognee_data"
            os.makedirs(data_path, mode=0o755, exist_ok=True)
            print(f"✓ Using fallback data directory: {data_path}")

        # Set the data directory for Cognee
        os.environ["COGNEE_DATA_DIR"] = data_path

        print(f"🔧 Configuring Cognee: embeddings={embedding_provider}/{embedding_model}, llm={llm_provider}, data={data_path}")
        
        try:
            # Configure LLM for Cognee (used in cognify and smart queries)
            # Cognee DOES have these methods
            if llm_api_key:
                cognee.config.set_llm_provider(llm_provider)
                cognee.config.set_llm_model(llm_model)
                cognee.config.set_llm_api_key(llm_api_key)
                if llm_endpoint:
                    cognee.config.set_llm_endpoint(llm_endpoint)
                print(f"✓ Cognee LLM: {llm_provider}/{llm_model}")
            
            cls._config_applied = True
            print(f"✓ Cognee config applied (embeddings via env vars: {embedding_provider})")
            
        except Exception as e:
            print(f"⚠️ Cognee config error: {e}")
            cls._config_applied = True  # Don't retry on failure

    async def initialize(self):
        """Initialize Cognee with configuration (cached at class level)."""
        # Quick return if already initialized
        if CogneeClient._class_initialized and self.initialized:
            return
        
        # Apply Cognee configuration using its API
        self._apply_cognee_config()
        
        # Mark as initialized
        CogneeClient._class_initialized = True
        self.initialized = True
        print("✓ Cognee client initialized")

    async def add_data(
        self, data: Any, user_id: Optional[str] = None, node_set: Optional[str] = None
    ) -> str:
        """Add data to Cognee knowledge graph.

        Handles duplicate data gracefully - if data already exists, returns success.
        Uses locking to prevent SQLite "database is locked" errors during concurrent writes.
        """
        if not self.initialized:
            await self.initialize()

        # Convert dict to JSON string - Cognee doesn't support raw dict type
        if isinstance(data, dict):
            data = json.dumps(data, indent=2)

        kwargs = {}
        if user_id:
            kwargs["user_id"] = user_id
        if node_set:
            kwargs["node_set"] = node_set

        # Serialize add operations to prevent SQLite locking
        async with CogneeClient._add_data_lock:
            try:
                result = await cognee.add(data, **kwargs)
                return str(result)
            except Exception as e:
                error_str = str(e).lower()
                # Handle duplicate data gracefully - data already exists is OK
                if "unique constraint" in error_str or "integrity" in error_str or "duplicate" in error_str:
                    print(f"✓ Data already exists in Cognee (skipping duplicate)")
                    return "already_exists"
                # Handle database locked errors
                if "database is locked" in error_str:
                    print(f"⚠️ Cognee database locked during add_data, retrying...")
                    raise
                # Re-raise other errors
                raise

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
        """Process all added data into knowledge graph.

        Handles duplicate/integrity errors gracefully - these occur when
        re-processing already-cognified data.
        Uses locking to prevent SQLite "database is locked" errors during concurrent operations.
        """
        if not self.initialized:
            await self.initialize()

        # Serialize cognify operations to prevent SQLite locking
        async with CogneeClient._cognify_lock:
            try:
                result = await cognee.cognify()

                # Clear query cache after cognify (data changed)
                CogneeClient._query_cache.clear()

                return str(result)
            except Exception as e:
                error_str = str(e).lower()
                # Handle integrity errors gracefully - data already processed is OK
                if "unique constraint" in error_str or "integrity" in error_str or "duplicate" in error_str:
                    print(f"✓ Some data already cognified (continuing with partial success)")
                    CogneeClient._query_cache.clear()
                    return "partial_success_duplicates_skipped"
                # Handle database locked errors
                if "database is locked" in error_str:
                    print(f"⚠️ Cognee database locked during cognify, this should not happen with locking!")
                    CogneeClient._query_cache.clear()
                    raise
                # Re-raise other errors
                raise

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

        # Execute query with error handling for SQLAlchemy/database issues
        start_time = time.time()
        try:
            search_results = await cognee.search(
                query_text=query_text,
                query_type=search_type,
                top_k=10  # Limit results per Cognee API docs
            )
        except Exception as e:
            error_str = str(e).lower()
            # Handle database locked errors - these should be retried by caller
            if "database is locked" in error_str:
                print(f"⚠️ Cognee database locked during query: {query_text}")
                raise  # Propagate to caller for retry logic
            # Handle SQLAlchemy merge/session errors gracefully
            elif "merge" in error_str or "session" in error_str or "sqlalchemy" in error_str:
                print(f"⚠️ Cognee database error during query, returning empty results: {e}")
                search_results = []
            else:
                # Re-raise other errors
                raise
        query_time = time.time() - start_time

        # Transform Cognee results to orchestrator-expected format
        sources = []
        answer_parts = []
        
        if search_results:
            for i, item in enumerate(search_results):
                # Cognee returns different formats based on search type
                if isinstance(item, dict):
                    # Extract text content for answer
                    text = item.get("text", item.get("summary", item.get("content", "")))
                    if text:
                        answer_parts.append(text)
                    
                    # Build source object
                    sources.append({
                        "entity_id": item.get("id", item.get("node_id", f"cognee_{i}")),
                        "entity_type": item.get("type", item.get("layer_class", "Document")),
                        "content": text[:500] if text else "",
                        "relevance": item.get("score", item.get("relevance", 0.8)),
                    })
                elif isinstance(item, str):
                    # Plain text result
                    answer_parts.append(item)
                    sources.append({
                        "entity_id": f"cognee_{i}",
                        "entity_type": "TextChunk",
                        "content": item[:500],
                        "relevance": 0.8,
                    })
                elif hasattr(item, "payload"):
                    # Cognee SearchResult object
                    payload = item.payload if hasattr(item, "payload") else {}
                    text = payload.get("text", str(item))
                    answer_parts.append(text)
                    sources.append({
                        "entity_id": payload.get("id", f"cognee_{i}"),
                        "entity_type": payload.get("type", "SearchResult"),
                        "content": text[:500],
                        "relevance": getattr(item, "score", 0.8),
                    })

        # Build combined answer from top results
        answer = "\n\n".join(answer_parts[:5]) if answer_parts else ""
        
        # Calculate confidence based on results
        confidence = min(0.95, 0.5 + (len(sources) * 0.05)) if sources else 0.3

        result = {
            "query": query_text,
            "results": search_results,  # Keep raw results for debugging
            "sources": sources,  # Orchestrator expects this
            "answer": answer,  # Orchestrator expects this
            "confidence": confidence,  # Orchestrator expects this
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

    async def get_entity(self, entity_id: str) -> Optional[dict[str, Any]]:
        """
        Get an entity by ID using search.

        Args:
            entity_id: The entity identifier

        Returns:
            Entity data if found, None otherwise
        """
        if not self.initialized:
            await self.initialize()

        try:
            # Search for the entity by ID
            search_results = await cognee.search(
                query_text=f"id:{entity_id}",
                query_type=SearchType.CHUNKS,
                top_k=1  # Only need first match for entity lookup
            )

            if not search_results:
                return None

            # Return first matching result
            result = search_results[0] if isinstance(search_results, list) else search_results

            # Convert to standard entity format
            if isinstance(result, dict):
                return {
                    "id": result.get("id", entity_id),
                    "type": result.get("type", "Unknown"),
                    "properties": result,
                }
            elif hasattr(result, "payload"):
                payload = result.payload
                return {
                    "id": payload.get("id", entity_id),
                    "type": payload.get("type", "Unknown"),
                    "properties": payload,
                }

            return None

        except Exception as e:
            print(f"Error getting entity {entity_id}: {e}")
            return None

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