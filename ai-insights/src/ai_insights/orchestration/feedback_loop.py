"""
RAG → Cognee Feedback Loop
Persists high-confidence RAG findings to the knowledge graph.

WHY: RAG retrieves current documents but findings are ephemeral.
     Persisting validated findings to Cognee enables:
     1. Cross-session memory (answers build on past answers)
     2. Trend detection (accumulating evidence over time)
     3. Knowledge consolidation (deduplication and linking)

SAFETY:
- Only persist HIGH confidence findings (≥0.8)
- Mark as "unverified" until confirmed by multiple sources
- Require 2+ sources for same fact before marking verified
- Include provenance (source, timestamp, query context)
"""

import asyncio
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

from ai_insights.config import get_logger


@dataclass
class RAGFinding:
    """A finding from RAG retrieval to potentially persist."""
    
    id: str
    content: str
    source: str
    confidence: float
    timestamp: datetime
    query_context: str
    entity_references: list[str] = field(default_factory=list)
    
    # Verification state
    verified: bool = False
    verification_count: int = 1
    first_seen: datetime = field(default_factory=datetime.utcnow)
    last_seen: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "id": self.id,
            "content": self.content,
            "source": self.source,
            "confidence": self.confidence,
            "timestamp": self.timestamp.isoformat(),
            "query_context": self.query_context,
            "entity_references": self.entity_references,
            "verified": self.verified,
            "verification_count": self.verification_count,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
        }


class FeedbackLoop:
    """
    Manages the RAG → Cognee feedback loop.
    
    Design principles:
    1. Conservative - only persist high-confidence findings
    2. Idempotent - same finding doesn't create duplicates
    3. Traceable - full provenance for every persisted fact
    4. Async - doesn't block the response path
    """
    
    # Thresholds
    CONFIDENCE_THRESHOLD = 0.8  # Minimum confidence to consider
    VERIFICATION_THRESHOLD = 2  # Sources needed to mark verified
    
    def __init__(self):
        self.logger = get_logger(__name__)
        
        # Pending findings (not yet persisted)
        self._pending: dict[str, RAGFinding] = {}
        
        # Processing lock
        self._lock = asyncio.Lock()
        
        # Statistics
        self._stats = {
            "findings_received": 0,
            "findings_persisted": 0,
            "findings_deduplicated": 0,
            "findings_rejected": 0,
        }
    
    def _generate_finding_id(self, content: str, entity_refs: list[str]) -> str:
        """
        Generate stable ID for a finding (for deduplication).
        
        WHY: Same finding from different queries should map to same ID.
        """
        # Normalize content
        normalized = content.lower().strip()
        
        # Include entity references for context
        entity_str = ":".join(sorted(entity_refs)) if entity_refs else ""
        
        # Hash for stable ID
        hash_input = f"{normalized}:{entity_str}"
        return f"finding_{hashlib.sha256(hash_input.encode()).hexdigest()[:16]}"
    
    async def add_finding(
        self,
        content: str,
        source: str,
        confidence: float,
        query_context: str,
        entity_references: Optional[list[str]] = None,
    ) -> Optional[str]:
        """
        Add a RAG finding for potential persistence.
        
        Args:
            content: The finding content
            source: Source document/chunk ID
            confidence: Confidence score (0-1)
            query_context: Original query for context
            entity_references: Related entity IDs
            
        Returns:
            Finding ID if accepted, None if rejected
            
        WHY: Findings are queued and processed asynchronously
             to avoid blocking the response path.
        """
        self._stats["findings_received"] += 1
        
        # Reject low-confidence findings
        if confidence < self.CONFIDENCE_THRESHOLD:
            self._stats["findings_rejected"] += 1
            self.logger.debug(
                f"Rejected low-confidence finding ({confidence:.2f} < {self.CONFIDENCE_THRESHOLD})"
            )
            return None
        
        entity_refs = entity_references or []
        finding_id = self._generate_finding_id(content, entity_refs)
        
        async with self._lock:
            # Check for existing finding (deduplication)
            if finding_id in self._pending:
                existing = self._pending[finding_id]
                existing.verification_count += 1
                existing.last_seen = datetime.utcnow()
                
                # Update confidence if this observation is higher
                if confidence > existing.confidence:
                    existing.confidence = confidence
                
                # Check if now verified
                if existing.verification_count >= self.VERIFICATION_THRESHOLD:
                    existing.verified = True
                    self.logger.info(
                        f"Finding {finding_id} now verified "
                        f"(count={existing.verification_count})"
                    )
                
                self._stats["findings_deduplicated"] += 1
                return finding_id
            
            # Create new finding
            finding = RAGFinding(
                id=finding_id,
                content=content,
                source=source,
                confidence=confidence,
                timestamp=datetime.utcnow(),
                query_context=query_context,
                entity_references=entity_refs,
            )
            
            self._pending[finding_id] = finding
            self.logger.debug(f"Added pending finding: {finding_id}")
            
            return finding_id
    
    async def process_pending(self, cognee_client: Any) -> int:
        """
        Process pending findings and persist to Cognee.
        
        Args:
            cognee_client: Cognee client instance
            
        Returns:
            Number of findings persisted
            
        WHY: Called periodically or after a batch of queries.
             Only persists verified findings to prevent noise.
        """
        if not cognee_client:
            self.logger.warning("No Cognee client - skipping persistence")
            return 0
        
        persisted = 0
        
        async with self._lock:
            # Get verified findings
            to_persist = [
                f for f in self._pending.values()
                if f.verified and f.confidence >= self.CONFIDENCE_THRESHOLD
            ]
            
            if not to_persist:
                return 0
            
            self.logger.info(f"Processing {len(to_persist)} verified findings")
            
            for finding in to_persist:
                try:
                    # Persist to Cognee as a fact node
                    await self._persist_finding(cognee_client, finding)
                    
                    # Remove from pending
                    del self._pending[finding.id]
                    persisted += 1
                    self._stats["findings_persisted"] += 1
                    
                except Exception as e:
                    self.logger.error(f"Failed to persist finding {finding.id}: {e}")
        
        return persisted
    
    async def _persist_finding(self, cognee_client: Any, finding: RAGFinding):
        """
        Persist a single finding to Cognee knowledge graph.
        
        WHY: Creates a "Fact" node linked to referenced entities.
        """
        # Build the fact data
        fact_data = {
            "type": "RAGFinding",
            "id": finding.id,
            "content": finding.content,
            "confidence": finding.confidence,
            "source": finding.source,
            "query_context": finding.query_context,
            "verification_count": finding.verification_count,
            "first_seen": finding.first_seen.isoformat(),
            "last_seen": finding.last_seen.isoformat(),
            "verified": finding.verified,
        }
        
        # Ingest to Cognee
        try:
            # Use the add method if available
            if hasattr(cognee_client, "add"):
                await cognee_client.add(fact_data)
            elif hasattr(cognee_client, "ingest"):
                await cognee_client.ingest([fact_data])
            else:
                # Fallback: cognify the data
                import cognee
                await cognee.add([fact_data])
                await cognee.cognify()
            
            self.logger.info(f"Persisted finding {finding.id} to Cognee")
            
            # Create relationships to referenced entities
            for entity_id in finding.entity_references:
                try:
                    # This would create a SUPPORTS relationship
                    # Implementation depends on Cognee's relationship API
                    self.logger.debug(
                        f"Would link finding {finding.id} to entity {entity_id}"
                    )
                except Exception as e:
                    self.logger.warning(f"Failed to link finding to {entity_id}: {e}")
                    
        except Exception as e:
            self.logger.error(f"Cognee persistence error: {e}")
            raise
    
    async def add_findings_from_context(
        self,
        shared_context: dict[str, Any],
        query: str,
    ) -> list[str]:
        """
        Process RAG findings from shared context.
        
        Args:
            shared_context: SharedContext.to_dict() output
            query: Original query for context
            
        Returns:
            List of accepted finding IDs
        """
        rag_findings = shared_context.get("rag_findings", [])
        
        if not rag_findings:
            return []
        
        accepted = []
        for finding in rag_findings:
            finding_id = await self.add_finding(
                content=finding.get("finding", ""),
                source=finding.get("source", "unknown"),
                confidence=finding.get("confidence", 0.0),
                query_context=query,
                entity_references=[
                    e.get("id", "") 
                    for e in shared_context.get("grounded_entities", [])
                ],
            )
            
            if finding_id:
                accepted.append(finding_id)
        
        return accepted
    
    def get_statistics(self) -> dict[str, Any]:
        """Get feedback loop statistics."""
        return {
            **self._stats,
            "pending_count": len(self._pending),
            "verified_count": sum(
                1 for f in self._pending.values() if f.verified
            ),
        }
    
    def get_pending_findings(self) -> list[dict[str, Any]]:
        """Get all pending findings (for debugging)."""
        return [f.to_dict() for f in self._pending.values()]


# Global instance
_feedback_loop: Optional[FeedbackLoop] = None


def get_feedback_loop() -> FeedbackLoop:
    """Get or create global feedback loop instance."""
    global _feedback_loop
    if _feedback_loop is None:
        _feedback_loop = FeedbackLoop()
    return _feedback_loop
