"""
AI Query Orchestrator
Routes queries between Cognee (memory) and RAG (retrieval) based on intent.
"""

import os
import sys
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime
from enum import Enum

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cognee_query import CogneeQueryInterface
from cognee_client import get_cognee_client


class QueryIntent(str, Enum):
    """Query intent classification."""
    HISTORICAL = "historical"  # Why/how did X happen? What led to Y?
    CAUSAL = "causal"          # What caused X? What's the relationship between X and Y?
    FACTUAL = "factual"        # What is X? Current state of Y?
    MIXED = "mixed"            # Combination of historical context + current facts


class QuerySource(str, Enum):
    """Source of information in the response."""
    MEMORY = "memory"          # From Cognee knowledge graph
    RETRIEVAL = "retrieval"    # From RAG pipeline
    HYBRID = "hybrid"          # Combined from both


class SharedContext:
    """
    Shared context object passed between layers.
    Allows Cognee to influence RAG retrieval.
    """
    
    def __init__(self):
        self.entity_ids: List[str] = []
        self.historical_context: str = ""
        self.relevant_time_windows: List[str] = []
        self.prior_decisions: List[Dict[str, Any]] = []
        self.causal_chains: List[Dict[str, Any]] = []
        self.confidence_modifiers: Dict[str, float] = {}
    
    def add_entity_id(self, entity_id: str, entity_type: str):
        """Add relevant entity ID for RAG filtering."""
        self.entity_ids.append({"id": entity_id, "type": entity_type})
    
    def set_historical_context(self, context: str):
        """Set historical context from Cognee."""
        self.historical_context = context
    
    def add_prior_decision(self, decision: Dict[str, Any]):
        """Add prior decision for context."""
        self.prior_decisions.append(decision)
    
    def add_causal_chain(self, chain: Dict[str, Any]):
        """Add causal relationship chain."""
        self.causal_chains.append(chain)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "entity_ids": self.entity_ids,
            "historical_context": self.historical_context,
            "relevant_time_windows": self.relevant_time_windows,
            "prior_decisions": self.prior_decisions,
            "causal_chains": self.causal_chains,
            "confidence_modifiers": self.confidence_modifiers
        }


class QueryOrchestrator:
    """
    Orchestrates queries between Cognee and RAG layers.
    Routes based on intent and merges results.
    """
    
    def __init__(self):
        self.cognee_interface = CogneeQueryInterface()
        self.cognee_client = get_cognee_client()
    
    async def orchestrate(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main orchestration method.
        
        Args:
            query: Natural language query
            context: Optional context (user_id, region, etc.)
        
        Returns:
            Unified response with answer, sources, and reasoning
        """
        # Step 1: Classify intent
        intent = self._classify_intent(query)
        
        # Step 2: Create shared context
        shared_ctx = SharedContext()
        
        # Step 3: Route based on intent
        if intent == QueryIntent.HISTORICAL or intent == QueryIntent.CAUSAL:
            # Cognee first, optionally enrich with RAG
            return await self._cognee_primary(query, context, shared_ctx)
        
        elif intent == QueryIntent.FACTUAL:
            # RAG first, optionally enrich with Cognee context
            return await self._rag_primary(query, context, shared_ctx)
        
        else:  # MIXED
            # Both layers, merge results
            return await self._hybrid_query(query, context, shared_ctx)
    
    def _classify_intent(self, query: str) -> QueryIntent:
        """
        Classify query intent based on keywords and structure.
        
        Args:
            query: Natural language query
        
        Returns:
            QueryIntent enum value
        """
        query_lower = query.lower()
        
        # Historical indicators
        historical_keywords = [
            "why did", "how did", "what happened", "what led to",
            "history of", "previously", "in the past", "last time",
            "trend", "pattern", "evolution", "changed over time"
        ]
        
        # Causal indicators
        causal_keywords = [
            "caused", "because", "reason for", "what triggered",
            "what led to", "impact of", "resulted in", "consequence",
            "relationship between", "correlation", "influenced by"
        ]
        
        # Factual indicators
        factual_keywords = [
            "what is", "current", "now", "today", "status of",
            "list", "show me", "how many", "which products",
            "definition", "describe"
        ]
        
        # Count matches
        historical_score = sum(1 for kw in historical_keywords if kw in query_lower)
        causal_score = sum(1 for kw in causal_keywords if kw in query_lower)
        factual_score = sum(1 for kw in factual_keywords if kw in query_lower)
        
        # Determine intent
        if historical_score > 0 or causal_score > 0:
            if factual_score > 0:
                return QueryIntent.MIXED
            return QueryIntent.CAUSAL if causal_score > historical_score else QueryIntent.HISTORICAL
        
        if factual_score > 0:
            return QueryIntent.FACTUAL
        
        # Default to mixed if unclear
        return QueryIntent.MIXED
    
    async def _cognee_primary(
        self,
        query: str,
        context: Optional[Dict[str, Any]],
        shared_ctx: SharedContext
    ) -> Dict[str, Any]:
        """
        Cognee-primary query flow.
        Cognee provides answer, optionally enriched with RAG.
        """
        # Query Cognee
        cognee_result = await self.cognee_interface.query(query, context)
        
        # Extract entity IDs from Cognee sources
        for source in cognee_result.get("sources", []):
            shared_ctx.add_entity_id(
                source.get("entity_id", ""),
                source.get("entity_type", "")
            )
        
        # Set historical context
        shared_ctx.set_historical_context(cognee_result.get("answer", ""))
        
        # Check if RAG enrichment would help
        needs_rag = self._should_enrich_with_rag(cognee_result)
        
        if needs_rag:
            # Get additional context from RAG
            rag_context = await self._get_rag_context(query, shared_ctx)
            
            # Merge results
            return self._merge_cognee_rag(cognee_result, rag_context, shared_ctx)
        
        # Return Cognee result with source attribution
        return {
            "answer": cognee_result.get("answer", ""),
            "confidence": cognee_result.get("confidence", 0.0),
            "source_type": QuerySource.MEMORY,
            "sources": {
                "memory": cognee_result.get("sources", []),
                "retrieval": []
            },
            "reasoning_trace": cognee_result.get("reasoning_trace", []),
            "recommended_actions": cognee_result.get("recommended_actions", []),
            "forecast": cognee_result.get("forecast"),
            "shared_context": shared_ctx.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _rag_primary(
        self,
        query: str,
        context: Optional[Dict[str, Any]],
        shared_ctx: SharedContext
    ) -> Dict[str, Any]:
        """
        RAG-primary query flow.
        RAG provides answer, enriched with Cognee context.
        """
        # First, get relevant context from Cognee
        cognee_context = await self._get_cognee_context(query, context)
        
        # Extract entity IDs and historical context
        if cognee_context:
            for source in cognee_context.get("sources", []):
                shared_ctx.add_entity_id(
                    source.get("entity_id", ""),
                    source.get("entity_type", "")
                )
            shared_ctx.set_historical_context(
                cognee_context.get("answer", "")
            )
        
        # Query RAG with enriched context
        rag_result = await self._get_rag_context(query, shared_ctx)
        
        # Merge with Cognee context
        return {
            "answer": self._merge_rag_with_context(
                rag_result.get("answer", ""),
                shared_ctx.historical_context
            ),
            "confidence": rag_result.get("confidence", 0.0),
            "source_type": QuerySource.HYBRID,
            "sources": {
                "memory": cognee_context.get("sources", []) if cognee_context else [],
                "retrieval": rag_result.get("sources", [])
            },
            "reasoning_trace": [
                {
                    "step": 1,
                    "action": "Retrieved historical context from Cognee",
                    "confidence": 0.9
                },
                {
                    "step": 2,
                    "action": "Queried RAG with enriched context",
                    "confidence": 0.85
                }
            ],
            "shared_context": shared_ctx.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _hybrid_query(
        self,
        query: str,
        context: Optional[Dict[str, Any]],
        shared_ctx: SharedContext
    ) -> Dict[str, Any]:
        """
        Hybrid query flow.
        Both Cognee and RAG contribute equally.
        """
        # Query both in parallel (in practice, would use asyncio.gather)
        cognee_result = await self.cognee_interface.query(query, context)
        
        # Extract context from Cognee
        for source in cognee_result.get("sources", []):
            shared_ctx.add_entity_id(
                source.get("entity_id", ""),
                source.get("entity_type", "")
            )
        
        # Get RAG results with Cognee context
        rag_result = await self._get_rag_context(query, shared_ctx)
        
        # Merge both results
        merged_answer = self._merge_hybrid_results(
            cognee_result.get("answer", ""),
            rag_result.get("answer", ""),
            shared_ctx
        )
        
        # Calculate combined confidence
        combined_confidence = (
            cognee_result.get("confidence", 0.0) * 0.6 +
            rag_result.get("confidence", 0.0) * 0.4
        )
        
        return {
            "answer": merged_answer,
            "confidence": combined_confidence,
            "source_type": QuerySource.HYBRID,
            "sources": {
                "memory": cognee_result.get("sources", []),
                "retrieval": rag_result.get("sources", [])
            },
            "reasoning_trace": [
                {
                    "step": 1,
                    "action": "Queried Cognee knowledge graph",
                    "confidence": cognee_result.get("confidence", 0.0)
                },
                {
                    "step": 2,
                    "action": "Queried RAG pipeline with Cognee context",
                    "confidence": rag_result.get("confidence", 0.0)
                },
                {
                    "step": 3,
                    "action": "Merged results into coherent answer",
                    "confidence": combined_confidence
                }
            ],
            "recommended_actions": cognee_result.get("recommended_actions", []),
            "forecast": cognee_result.get("forecast"),
            "shared_context": shared_ctx.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _should_enrich_with_rag(self, cognee_result: Dict[str, Any]) -> bool:
        """Determine if Cognee result should be enriched with RAG."""
        # Enrich if confidence is low or sources are sparse
        confidence = cognee_result.get("confidence", 0.0)
        source_count = len(cognee_result.get("sources", []))
        
        return confidence < 0.7 or source_count < 2
    
    async def _get_rag_context(
        self,
        query: str,
        shared_ctx: SharedContext
    ) -> Dict[str, Any]:
        """Get additional context from RAG."""
        try:
            from retrieval import get_retrieval_pipeline
            from generator import get_generator
            
            # Get retrieval pipeline
            retrieval = get_retrieval_pipeline()
            generator = get_generator()
            
            # Build filter from entity IDs if available
            product_ids = [
                e["id"] for e in shared_ctx.entity_ids 
                if e.get("type") == "Product"
            ]
            
            # Retrieve relevant chunks
            chunks = retrieval.retrieve(
                query,
                top_k=5,
                product_id=product_ids[0] if product_ids else None
            )
            
            # Generate answer
            answer = generator.generate(query, chunks)
            
            return {
                "answer": answer.get("insight", ""),
                "sources": chunks,
                "confidence": 0.85
            }
        except Exception as e:
            print(f"RAG context retrieval failed: {e}")
            return {
                "answer": "",
                "sources": [],
                "confidence": 0.0
            }
    
    async def _get_cognee_context(
        self,
        query: str,
        context: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Get relevant context from Cognee for RAG enrichment."""
        try:
            # Query Cognee for context
            result = await self.cognee_interface.query(query, context)
            return result
        except Exception:
            return None
    
    def _merge_cognee_rag(
        self,
        cognee_result: Dict[str, Any],
        rag_context: Dict[str, Any],
        shared_ctx: SharedContext
    ) -> Dict[str, Any]:
        """Merge Cognee primary result with RAG enrichment."""
        # Combine answers
        cognee_answer = cognee_result.get("answer", "")
        rag_sources = rag_context.get("sources", [])
        
        if rag_sources:
            enriched_answer = f"{cognee_answer}\n\nAdditional context: {len(rag_sources)} supporting documents found."
        else:
            enriched_answer = cognee_answer
        
        return {
            "answer": enriched_answer,
            "confidence": cognee_result.get("confidence", 0.0),
            "source_type": QuerySource.HYBRID,
            "sources": {
                "memory": cognee_result.get("sources", []),
                "retrieval": rag_sources
            },
            "reasoning_trace": cognee_result.get("reasoning_trace", []),
            "recommended_actions": cognee_result.get("recommended_actions", []),
            "forecast": cognee_result.get("forecast"),
            "shared_context": shared_ctx.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _merge_rag_with_context(
        self,
        rag_answer: str,
        historical_context: str
    ) -> str:
        """Merge RAG answer with Cognee historical context."""
        if historical_context:
            return f"Context: {historical_context}\n\nCurrent state: {rag_answer}"
        return rag_answer
    
    def _merge_hybrid_results(
        self,
        cognee_answer: str,
        rag_answer: str,
        shared_ctx: SharedContext
    ) -> str:
        """Merge Cognee and RAG results into coherent answer."""
        # Combine both perspectives
        merged = f"Historical perspective: {cognee_answer}\n\n"
        merged += f"Current state: {rag_answer}"
        
        return merged


# Example usage
async def test_orchestrator():
    """Test the orchestrator with example queries."""
    orchestrator = QueryOrchestrator()
    
    test_queries = [
        "Why did PayLink fail in Q3?",  # Historical -> Cognee primary
        "What is the current status of InstantPay?",  # Factual -> RAG primary
        "What's blocking Q1 revenue and how does it compare to Q3?",  # Mixed -> Hybrid
    ]
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print(f"{'='*60}")
        
        result = await orchestrator.orchestrate(query)
        
        print(f"Intent: {result.get('source_type')}")
        print(f"Confidence: {result.get('confidence', 0)*100:.0f}%")
        print(f"\nAnswer: {result.get('answer')}")
        print(f"\nSources:")
        print(f"  Memory: {len(result.get('sources', {}).get('memory', []))}")
        print(f"  Retrieval: {len(result.get('sources', {}).get('retrieval', []))}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_orchestrator())
