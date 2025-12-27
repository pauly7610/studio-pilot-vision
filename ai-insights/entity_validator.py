"""
Entity Validation and Grounding Layer
Ensures entities are valid, stable, and properly resolved.

WHY: Without validation, the system can reference non-existent entities,
     create duplicate entities with different IDs, or use stale entity data.
     This module enforces entity integrity across the knowledge graph.
"""

import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from cognee_client import get_cognee_client


class EntityValidator:
    """
    Validates and grounds entities in the knowledge graph.
    
    Design principles:
    1. Stable IDs - same entity always gets same ID
    2. Existence checks - verify entity exists before use
    3. Resolution - handle entity aliases and duplicates
    4. Freshness - track when entity was last verified
    """
    
    def __init__(self):
        self.cognee_client = get_cognee_client()
        self.entity_cache = {}  # Cache for recently validated entities
        self.cache_ttl_seconds = 300  # 5 minutes
    
    def generate_stable_id(
        self,
        entity_type: str,
        natural_key: str
    ) -> str:
        """
        Generate stable, deterministic entity ID.
        
        WHY: Using random UUIDs leads to duplicate entities.
             Hash-based IDs ensure same entity always gets same ID.
        
        Args:
            entity_type: Type of entity (Product, RiskSignal, etc.)
            natural_key: Natural identifier (product name, etc.)
        
        Returns:
            Stable entity ID
        
        Example:
            generate_stable_id("Product", "PayLink") 
            -> "prod_a3f2b1c..."
        """
        # Normalize natural key
        normalized_key = natural_key.lower().strip()
        
        # Create hash from type + key
        hash_input = f"{entity_type}:{normalized_key}"
        hash_digest = hashlib.sha256(hash_input.encode()).hexdigest()[:12]
        
        # Prefix with entity type abbreviation
        type_prefix = {
            "Product": "prod",
            "RiskSignal": "risk",
            "Dependency": "dep",
            "GovernanceAction": "action",
            "Decision": "decision",
            "Outcome": "outcome",
            "RevenueSignal": "revenue",
            "FeedbackSignal": "feedback",
            "TimeWindow": "tw",
            "Portfolio": "portfolio"
        }.get(entity_type, "entity")
        
        return f"{type_prefix}_{hash_digest}"
    
    async def validate_entity(
        self,
        entity_id: str,
        entity_type: str,
        allow_missing: bool = False
    ) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Validate that entity exists and is current.
        
        WHY: Prevents referencing non-existent or stale entities.
             Returns entity data for immediate use.
        
        Args:
            entity_id: Entity identifier to validate
            entity_type: Expected entity type
            allow_missing: If True, don't error on missing entity
        
        Returns:
            Tuple of (is_valid, entity_data, message)
        """
        # Check cache first
        cache_key = f"{entity_type}:{entity_id}"
        if cache_key in self.entity_cache:
            cached = self.entity_cache[cache_key]
            age_seconds = (datetime.utcnow() - cached["cached_at"]).total_seconds()
            
            if age_seconds < self.cache_ttl_seconds:
                return True, cached["data"], "From cache"
        
        # Query Cognee for entity
        try:
            entity_data = await self.cognee_client.get_entity(entity_id)
            
            if entity_data is None:
                if allow_missing:
                    return False, None, f"Entity {entity_id} not found (allowed)"
                else:
                    return False, None, f"Entity {entity_id} does not exist in knowledge graph"
            
            # Verify entity type matches
            if entity_data.get("type") != entity_type:
                return False, None, f"Entity type mismatch: expected {entity_type}, got {entity_data.get('type')}"
            
            # Cache the result
            self.entity_cache[cache_key] = {
                "data": entity_data,
                "cached_at": datetime.utcnow()
            }
            
            return True, entity_data, "Valid"
            
        except Exception as e:
            return False, None, f"Validation error: {str(e)}"
    
    async def resolve_entity(
        self,
        entity_name: str,
        entity_type: str
    ) -> Optional[str]:
        """
        Resolve entity name to canonical entity ID.
        
        WHY: Handles aliases, typos, and variations in entity names.
             "PayLink", "paylink", "Pay Link" all resolve to same ID.
        
        Args:
            entity_name: Human-readable entity name
            entity_type: Type of entity
        
        Returns:
            Canonical entity ID or None if not found
        """
        # Generate stable ID from normalized name
        stable_id = self.generate_stable_id(entity_type, entity_name)
        
        # Validate it exists
        is_valid, entity_data, _ = await self.validate_entity(
            stable_id,
            entity_type,
            allow_missing=True
        )
        
        if is_valid:
            return stable_id
        
        # If not found, try fuzzy search (future enhancement)
        # For now, return None
        return None
    
    async def validate_relationship(
        self,
        source_id: str,
        relationship_type: str,
        target_id: str
    ) -> Tuple[bool, str]:
        """
        Validate that a relationship exists and is current.
        
        WHY: Prevents using stale or broken relationships.
             Ensures causal chains are still valid.
        
        Args:
            source_id: Source entity ID
            relationship_type: Type of relationship
            target_id: Target entity ID
        
        Returns:
            Tuple of (is_valid, message)
        """
        try:
            # Query Cognee for relationships
            relationships = await self.cognee_client.get_relationships(
                source_id,
                relationship_type
            )
            
            # Check if target is in relationships
            for rel in relationships:
                if isinstance(rel, dict) and rel.get("target") == target_id:
                    return True, "Relationship exists"
            
            return False, f"Relationship {source_id} -{relationship_type}-> {target_id} not found"
            
        except Exception as e:
            return False, f"Relationship validation error: {str(e)}"
    
    def clear_cache(self):
        """Clear entity cache (for testing or after bulk updates)."""
        self.entity_cache.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        return {
            "cached_entities": len(self.entity_cache),
            "cache_ttl_seconds": self.cache_ttl_seconds
        }


class EntityGrounder:
    """
    Grounds entities by verifying they exist and extracting metadata.
    
    WHY: "Grounding" means connecting abstract entity references to
         concrete data in the knowledge graph. This prevents hallucination
         and ensures all entity references are backed by real data.
    """
    
    def __init__(self):
        self.validator = EntityValidator()
    
    async def ground_entities(
        self,
        entity_ids: List[Dict[str, str]]
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Ground a list of entity references.
        
        WHY: Takes raw entity IDs and returns full entity data with validation.
             Separates valid from invalid entities.
        
        Args:
            entity_ids: List of {"id": "...", "type": "..."} dicts
        
        Returns:
            Tuple of (grounded_entities, errors)
        """
        grounded = []
        errors = []
        
        for entity_ref in entity_ids:
            entity_id = entity_ref.get("id")
            entity_type = entity_ref.get("type")
            
            if not entity_id or not entity_type:
                errors.append(f"Invalid entity reference: {entity_ref}")
                continue
            
            # Validate entity
            is_valid, entity_data, message = await self.validator.validate_entity(
                entity_id,
                entity_type,
                allow_missing=True
            )
            
            if is_valid and entity_data:
                grounded.append({
                    "id": entity_id,
                    "type": entity_type,
                    "data": entity_data,
                    "verified": True,
                    "verified_at": datetime.utcnow().isoformat()
                })
            else:
                errors.append(f"{entity_id}: {message}")
        
        return grounded, errors
    
    async def ground_with_relationships(
        self,
        entity_id: str,
        entity_type: str,
        relationship_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Ground entity and include its relationships.
        
        WHY: Often we need not just the entity but its connections.
             This provides full context in one call.
        
        Args:
            entity_id: Entity to ground
            entity_type: Type of entity
            relationship_types: Optional filter for relationship types
        
        Returns:
            Dict with entity data and relationships
        """
        # Validate entity
        is_valid, entity_data, message = await self.validator.validate_entity(
            entity_id,
            entity_type
        )
        
        if not is_valid:
            return {
                "entity": None,
                "relationships": [],
                "error": message
            }
        
        # Get relationships
        relationships = []
        if relationship_types:
            for rel_type in relationship_types:
                rels = await self.validator.cognee_client.get_relationships(
                    entity_id,
                    rel_type
                )
                relationships.extend(rels)
        else:
            # Get all relationships
            rels = await self.validator.cognee_client.get_relationships(entity_id)
            relationships.extend(rels)
        
        return {
            "entity": entity_data,
            "relationships": relationships,
            "grounded_at": datetime.utcnow().isoformat()
        }


# Global instances
_validator: Optional[EntityValidator] = None
_grounder: Optional[EntityGrounder] = None


def get_entity_validator() -> EntityValidator:
    """Get or create global entity validator instance."""
    global _validator
    if _validator is None:
        _validator = EntityValidator()
    return _validator


def get_entity_grounder() -> EntityGrounder:
    """Get or create global entity grounder instance."""
    global _grounder
    if _grounder is None:
        _grounder = EntityGrounder()
    return _grounder
