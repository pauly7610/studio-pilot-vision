"""
Cognee Client - Knowledge Graph Memory Layer
Handles connection, entity management, and query interface for Cognee.
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import cognee
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
            
        # Configure Cognee
        await cognee.config.set_llm_provider("groq")
        await cognee.config.set_llm_model("llama-3.1-70b-versatile")
        
        # Set vector store (using ChromaDB for consistency)
        await cognee.config.set_vector_db_provider("chroma")
        
        # Set graph database (Cognee's built-in)
        await cognee.config.set_graph_db_provider("networkx")
        
        self.initialized = True
        print("✓ Cognee initialized successfully")
    
    async def add_entity(
        self,
        entity_type: str,
        entity_id: str,
        properties: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add an entity to the knowledge graph.
        
        Args:
            entity_type: Type of entity (e.g., "Product", "RiskSignal")
            entity_id: Unique identifier for the entity
            properties: Entity properties/fields
            metadata: Additional metadata (confidence, freshness, etc.)
        
        Returns:
            Entity ID in Cognee
        """
        if not self.initialized:
            await self.initialize()
        
        # Prepare entity data
        entity_data = {
            "id": entity_id,
            "type": entity_type,
            "properties": properties,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add to Cognee
        await cognee.add(entity_data, dataset_name=entity_type)
        
        return entity_id
    
    async def add_relationship(
        self,
        source_id: str,
        relationship_type: str,
        target_id: str,
        properties: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add a relationship between two entities.
        
        Args:
            source_id: Source entity ID
            relationship_type: Type of relationship (e.g., "HAS_RISK", "DEPENDS_ON")
            target_id: Target entity ID
            properties: Relationship properties
        
        Returns:
            Relationship ID
        """
        if not self.initialized:
            await self.initialize()
        
        relationship_data = {
            "source": source_id,
            "type": relationship_type,
            "target": target_id,
            "properties": properties or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add relationship to Cognee
        await cognee.add(relationship_data, dataset_name="relationships")
        
        return f"{source_id}_{relationship_type}_{target_id}"
    
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
        
        # Cognee's search with context
        search_results = await cognee.search(
            query_text,
            search_type="INSIGHTS"
        )
        
        return {
            "query": query_text,
            "results": search_results,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_entity(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an entity by ID.
        
        Args:
            entity_id: Entity identifier
        
        Returns:
            Entity data or None if not found
        """
        if not self.initialized:
            await self.initialize()
        
        # Query for specific entity
        results = await cognee.search(
            f"entity:{entity_id}",
            search_type="CHUNKS"
        )
        
        return results[0] if results else None
    
    async def get_relationships(
        self,
        entity_id: str,
        relationship_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all relationships for an entity.
        
        Args:
            entity_id: Entity identifier
            relationship_type: Optional filter by relationship type
        
        Returns:
            List of relationships
        """
        if not self.initialized:
            await self.initialize()
        
        query = f"relationships for {entity_id}"
        if relationship_type:
            query += f" type:{relationship_type}"
        
        results = await cognee.search(query, search_type="CHUNKS")
        
        return results
    
    async def cognify_data(self, data: Any, dataset_name: str = "default"):
        """
        Process and store data in Cognee (creates embeddings and graph).
        
        Args:
            data: Data to process (can be text, dict, or list)
            dataset_name: Dataset identifier
        """
        if not self.initialized:
            await self.initialize()
        
        # Add data to Cognee
        await cognee.add(data, dataset_name=dataset_name)
        
        # Process (cognify) the data
        await cognee.cognify()
        
        print(f"✓ Data cognified in dataset: {dataset_name}")
    
    async def reset(self):
        """Reset Cognee (clear all data) - use with caution!"""
        await cognee.prune.prune_data()
        await cognee.prune.prune_system()
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
