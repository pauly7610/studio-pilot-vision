"""
Cognee Client - Knowledge Graph Memory Layer
Handles connection, entity management, and query interface for Cognee.
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import cognee
from cognee import SearchType
from pydantic import BaseModel


class CogneeClient:
    """Client for interacting with Cognee knowledge graph."""
    
    def __init__(self):
        """Initialize Cognee connection."""
        self.initialized = False
        
    async def initialize(self):
        """Initialize Cognee with configuration."""
        if self.initialized:
            return
        
        # Configure Cognee via environment variables (Cognee's preferred method)
        # LLM_API_KEY should already be set from GROQ_API_KEY
        if not os.getenv("LLM_API_KEY") and os.getenv("GROQ_API_KEY"):
            os.environ["LLM_API_KEY"] = os.getenv("GROQ_API_KEY")
        
        # Use custom provider for Groq (OpenAI-compatible API)
        # LiteLLM requires provider prefix in model name
        os.environ["LLM_PROVIDER"] = "custom"
        os.environ["LLM_MODEL"] = "groq/llama-3.3-70b-versatile"  # Updated to current production model
        os.environ["LLM_ENDPOINT"] = "https://api.groq.com/openai/v1"
        
        # Configure embeddings - Groq doesn't have embedding models yet
        # Use HuggingFace Inference API with custom provider
        if not os.getenv("EMBEDDING_API_KEY") and os.getenv("HUGGINGFACE_API_KEY"):
            os.environ["EMBEDDING_API_KEY"] = os.getenv("HUGGINGFACE_API_KEY")
        
        os.environ["EMBEDDING_PROVIDER"] = "custom"
        os.environ["EMBEDDING_MODEL"] = "huggingface/sentence-transformers/all-MiniLM-L6-v2"
        os.environ["EMBEDDING_ENDPOINT"] = "https://api-inference.huggingface.co/pipeline/feature-extraction"
        os.environ["EMBEDDING_DIMENSIONS"] = "384"
        
        # Cognee auto-detects ChromaDB and NetworkX when installed
        # No explicit configuration needed
        
        self.initialized = True
        print("✓ Cognee initialized successfully")
    
    async def add_data(
        self,
        data: Any,
        user_id: Optional[str] = None,
        node_set: Optional[str] = None
    ) -> str:
        """
        Add data to Cognee knowledge graph.
        
        Args:
            data: Data to add (text, dict, or any serializable object)
            user_id: Optional user context
            node_set: Optional node set for organization
        
        Returns:
            Result message
        """
        if not self.initialized:
            await self.initialize()
        
        # Add to Cognee with optional context
        kwargs = {}
        if user_id:
            kwargs["user_id"] = user_id
        if node_set:
            kwargs["node_set"] = node_set
        
        result = await cognee.add(data, **kwargs)
        return str(result)
    
    async def cognify(self) -> str:
        """
        Process all added data into knowledge graph.
        This must be called after adding data and before searching.
        
        Returns:
            Result message
        """
        if not self.initialized:
            await self.initialize()
        
        result = await cognee.cognify()
        return str(result)
    
    async def query(
        self,
        query_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query the knowledge graph with natural language.
        
        Args:
            query_text: Natural language query
            context: Additional context (user_id, region, time_window, etc.)
        
        Returns:
            Query results with entities, relationships, and answer
        """
        if not self.initialized:
            await self.initialize()
        
        # Use correct Cognee search API with SearchType enum
        search_results = await cognee.search(
            query_text=query_text,
            query_type=SearchType.INSIGHTS
        )
        
        return {
            "query": query_text,
            "results": search_results,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    
    
    
    async def reset(self):
        """Reset Cognee (clear all data) - use with caution!"""
        await cognee.prune.prune_data()
        await cognee.prune.prune_system(metadata=True)
        self.initialized = False
        print("✓ Cognee reset complete")


# Global client instance
_cognee_client: Optional[CogneeClient] = None


def get_cognee_client() -> CogneeClient:
    """Get or create the global Cognee client instance."""
    global _cognee_client
    if _cognee_client is None:
        _cognee_client = CogneeClient()
    return _cognee_client
