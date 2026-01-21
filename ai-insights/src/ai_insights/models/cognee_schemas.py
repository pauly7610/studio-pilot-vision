"""
Pydantic Schema Validation for Cognee Responses

PURPOSE: Schema-first validation to contain LLM chaos.
         LLMs don't reliably produce valid formats - they return strings 
         instead of numbers, malformed nesting, missing fields.
         
         These schemas validate, coerce, normalize, or reject malformed 
         data BEFORE it reaches downstream logic.

PATTERN: From Niyam AI architecture - "schemas contain llm chaos"
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class CogneeSource(BaseModel):
    """
    Validated source from Cognee knowledge graph.
    
    Handles common LLM output issues:
    - Missing entity_id/type
    - String confidence values
    - Invalid confidence ranges
    """
    entity_id: str = ""
    entity_type: str = "unknown"
    entity_name: Optional[str] = None
    content: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    relevance: float = Field(default=0.0, ge=0.0, le=1.0)
    time_range: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    
    @field_validator('confidence', 'relevance', mode='before')
    @classmethod
    def coerce_float(cls, v):
        """Coerce string floats, percentages, and None to valid floats."""
        if v is None:
            return 0.0
        if isinstance(v, str):
            # Handle percentage strings like "85%"
            v = v.strip().rstrip('%')
            try:
                val = float(v)
                # If it was a percentage, normalize to 0-1
                if val > 1.0:
                    val = val / 100.0
                return max(0.0, min(1.0, val))
            except ValueError:
                return 0.0
        if isinstance(v, (int, float)):
            val = float(v)
            # Normalize percentages to 0-1
            if val > 1.0:
                val = val / 100.0
            return max(0.0, min(1.0, val))
        return 0.0
    
    @field_validator('entity_id', 'entity_type', mode='before')
    @classmethod
    def ensure_string(cls, v):
        """Ensure entity fields are strings."""
        if v is None:
            return ""
        return str(v)


class CogneeQueryResult(BaseModel):
    """
    Validated Cognee query result.
    
    Normalizes the raw Cognee response into a consistent format
    that downstream code can rely on.
    """
    query: str = ""
    answer: str = ""
    sources: list[CogneeSource] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    reasoning_trace: list[dict[str, Any]] = Field(default_factory=list)
    recommended_actions: list[dict[str, Any]] = Field(default_factory=list)
    forecast: Optional[dict[str, Any]] = None
    timestamp: str = ""
    raw_results: Optional[list[Any]] = None  # Preserve original for debugging
    
    @field_validator('confidence', mode='before')
    @classmethod
    def coerce_confidence(cls, v):
        """Coerce confidence to valid float."""
        if v is None:
            return 0.0
        if isinstance(v, str):
            v = v.strip().rstrip('%')
            try:
                val = float(v)
                if val > 1.0:
                    val = val / 100.0
                return max(0.0, min(1.0, val))
            except ValueError:
                return 0.0
        if isinstance(v, (int, float)):
            val = float(v)
            if val > 1.0:
                val = val / 100.0
            return max(0.0, min(1.0, val))
        return 0.0
    
    @field_validator('sources', mode='before')
    @classmethod
    def ensure_sources_list(cls, v):
        """Ensure sources is always a list."""
        if v is None:
            return []
        if isinstance(v, dict):
            # Sometimes LLM returns single source as dict
            return [v]
        if not isinstance(v, list):
            return []
        return v
    
    @field_validator('answer', mode='before')
    @classmethod
    def ensure_answer_string(cls, v):
        """Ensure answer is always a string."""
        if v is None:
            return ""
        if isinstance(v, list):
            # Sometimes LLM returns answer as list of strings
            return "\n".join(str(item) for item in v)
        return str(v)
    
    @model_validator(mode='after')
    def calculate_confidence_from_sources(self):
        """
        If no explicit confidence, calculate from source confidences.
        """
        if self.confidence == 0.0 and self.sources:
            source_confidences = [s.confidence for s in self.sources if s.confidence > 0]
            if source_confidences:
                self.confidence = sum(source_confidences) / len(source_confidences)
        return self
    
    @classmethod
    def from_raw_cognee_response(cls, raw: dict[str, Any], query_text: str = "") -> "CogneeQueryResult":
        """
        Factory method to create validated result from raw Cognee response.
        
        Cognee returns various formats:
        - {"query", "results", "context", "timestamp"}
        - {"answer", "sources", "confidence"}
        - Direct list of results
        
        This method normalizes all formats.
        """
        if raw is None:
            return cls(query=query_text, answer="No response from knowledge graph")
        
        # Handle direct list response
        if isinstance(raw, list):
            raw = {"results": raw}
        
        # Extract answer - try multiple possible keys
        answer = ""
        if "answer" in raw:
            answer = raw["answer"]
        elif "results" in raw and isinstance(raw["results"], list):
            # Build answer from results
            results = raw["results"]
            answer_parts = []
            for r in results[:5]:  # Top 5 results
                if isinstance(r, dict):
                    text = r.get("text", r.get("content", r.get("description", "")))
                    if text:
                        answer_parts.append(str(text))
                elif isinstance(r, str):
                    answer_parts.append(r)
            answer = "\n\n".join(answer_parts)
        elif "context" in raw:
            answer = str(raw.get("context", ""))
        
        # Extract sources
        sources = []
        raw_sources = raw.get("sources", raw.get("results", []))
        if isinstance(raw_sources, list):
            for i, src in enumerate(raw_sources):
                if isinstance(src, dict):
                    sources.append(CogneeSource(
                        entity_id=src.get("entity_id", src.get("id", f"source_{i}")),
                        entity_type=src.get("entity_type", src.get("type", "unknown")),
                        entity_name=src.get("entity_name", src.get("name")),
                        content=src.get("content", src.get("text", ""))[:500] if src.get("content") or src.get("text") else None,
                        confidence=src.get("confidence", src.get("score", src.get("relevance", 0.0))),
                        relevance=src.get("relevance", src.get("score", 0.0)),
                        metadata=src.get("metadata", {})
                    ))
        
        # Extract confidence
        confidence = raw.get("confidence", 0.0)
        if confidence == 0.0 and sources:
            # Calculate from sources
            source_confs = [s.confidence for s in sources if s.confidence > 0]
            if source_confs:
                confidence = sum(source_confs) / len(source_confs)
        
        return cls(
            query=raw.get("query", query_text),
            answer=answer if answer else "No relevant information found.",
            sources=sources,
            confidence=confidence,
            reasoning_trace=raw.get("reasoning_trace", []),
            recommended_actions=raw.get("recommended_actions", []),
            forecast=raw.get("forecast"),
            timestamp=raw.get("timestamp", datetime.utcnow().isoformat()),
            raw_results=raw.get("results")
        )


class RAGChunk(BaseModel):
    """
    Validated RAG retrieval chunk.
    """
    id: str = ""
    text: str = ""
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    metadata: dict[str, Any] = Field(default_factory=dict)
    
    @field_validator('score', mode='before')
    @classmethod
    def coerce_score(cls, v):
        """Coerce score to valid float."""
        if v is None:
            return 0.0
        try:
            val = float(v)
            # Normalize if needed (some systems use 0-100)
            if val > 1.0:
                val = val / 100.0
            return max(0.0, min(1.0, val))
        except (ValueError, TypeError):
            return 0.0


class RAGResult(BaseModel):
    """
    Validated RAG retrieval result.
    """
    answer: str = ""
    chunks: list[RAGChunk] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    sources: list[dict[str, Any]] = Field(default_factory=list)
    
    @field_validator('confidence', mode='before')
    @classmethod
    def coerce_confidence(cls, v):
        """Coerce confidence to valid float."""
        if v is None:
            return 0.0
        try:
            val = float(v)
            if val > 1.0:
                val = val / 100.0
            return max(0.0, min(1.0, val))
        except (ValueError, TypeError):
            return 0.0
    
    @classmethod
    def from_raw_rag_response(cls, raw: dict[str, Any]) -> "RAGResult":
        """Factory method to create validated result from raw RAG response."""
        if raw is None:
            return cls()
        
        chunks = []
        raw_chunks = raw.get("chunks", raw.get("results", []))
        if isinstance(raw_chunks, list):
            for chunk in raw_chunks:
                if isinstance(chunk, dict):
                    chunks.append(RAGChunk(
                        id=chunk.get("id", ""),
                        text=chunk.get("text", chunk.get("content", "")),
                        score=chunk.get("score", chunk.get("similarity", 0.0)),
                        metadata=chunk.get("metadata", {})
                    ))
        
        return cls(
            answer=raw.get("answer", raw.get("insight", "")),
            chunks=chunks,
            confidence=raw.get("confidence", 0.85 if chunks else 0.0),
            sources=raw.get("sources", [])
        )


# Type alias for cleaner code
ValidatedCogneeResult = CogneeQueryResult
ValidatedRAGResult = RAGResult
