"""
Unified Response Models
Single source of truth for all AI query responses.

WHY: Having 3 different response formats (RAG, Cognee, Unified) creates
     confusion and makes frontend integration brittle. This module enforces
     a single contract across all endpoints.
"""

from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class SourceType(str, Enum):
    """Type of information source."""
    MEMORY = "memory"          # From Cognee knowledge graph
    RETRIEVAL = "retrieval"    # From RAG pipeline
    HYBRID = "hybrid"          # Combined from both
    ERROR = "error"            # Error state


class ConfidenceLevel(str, Enum):
    """Human-readable confidence levels."""
    HIGH = "high"       # >= 0.8
    MEDIUM = "medium"   # 0.6 - 0.8
    LOW = "low"         # 0.4 - 0.6
    VERY_LOW = "very_low"  # < 0.4


class AnswerType(str, Enum):
    """Type of answer provided."""
    GROUNDED = "grounded"        # Based on verified facts
    SPECULATIVE = "speculative"  # Inferred or predicted
    PARTIAL = "partial"          # Incomplete information
    UNKNOWN = "unknown"          # Cannot answer


class Source(BaseModel):
    """Individual source citation."""
    source_id: str
    source_type: Literal["memory", "retrieval"]
    entity_type: Optional[str] = None  # For memory sources
    entity_id: Optional[str] = None    # For memory sources
    entity_name: Optional[str] = None  # For memory sources
    document_id: Optional[str] = None  # For retrieval sources
    chunk_id: Optional[str] = None     # For retrieval sources
    content: Optional[str] = None      # Source content snippet
    confidence: float = Field(ge=0.0, le=1.0)
    time_range: Optional[str] = None   # Temporal context
    verified: bool = False             # Has this been fact-checked?
    
    class Config:
        use_enum_values = True


class ReasoningStep(BaseModel):
    """Single step in reasoning trace."""
    step: int
    action: str
    details: Optional[Dict[str, Any]] = None
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ConfidenceBreakdown(BaseModel):
    """
    Detailed confidence scoring breakdown.
    
    WHY: Single confidence number is opaque. Breaking it down by component
         allows debugging and helps users understand answer quality.
    """
    overall: float = Field(ge=0.0, le=1.0)
    data_freshness: float = Field(ge=0.0, le=1.0)
    source_reliability: float = Field(ge=0.0, le=1.0)
    entity_grounding: float = Field(ge=0.0, le=1.0)
    reasoning_coherence: float = Field(ge=0.0, le=1.0)
    historical_accuracy: Optional[float] = Field(None, ge=0.0, le=1.0)
    explanation: str
    
    @property
    def level(self) -> ConfidenceLevel:
        """Convert numeric confidence to human-readable level."""
        if self.overall >= 0.8:
            return ConfidenceLevel.HIGH
        elif self.overall >= 0.6:
            return ConfidenceLevel.MEDIUM
        elif self.overall >= 0.4:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW


class RecommendedAction(BaseModel):
    """Recommended action based on query results."""
    action_type: str
    tier: Optional[str] = None
    rationale: str
    confidence: float = Field(ge=0.0, le=1.0)
    priority: Optional[str] = None


class Forecast(BaseModel):
    """Forecast for "if no action taken" scenarios."""
    scenario: str
    impact: str
    probability: float = Field(ge=0.0, le=1.0)
    time_horizon: str
    based_on: Optional[str] = None


class Guardrails(BaseModel):
    """
    Guardrails and warnings about answer quality.
    
    WHY: Critical for production systems. Users need to know when
         answers are speculative, incomplete, or potentially unreliable.
    """
    answer_type: AnswerType
    warnings: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    fallback_used: bool = False
    memory_sparse: bool = False
    low_confidence: bool = False


class UnifiedAIResponse(BaseModel):
    """
    Canonical response model for ALL AI query endpoints.
    
    Design principles:
    1. Single source of truth - all endpoints return this format
    2. Explicit about uncertainty - guardrails, confidence breakdown
    3. Traceable - reasoning steps, source citations
    4. Temporal - timestamps for debugging
    5. Extensible - optional fields for future features
    
    WHY: Consistency across endpoints makes frontend integration trivial
         and ensures all responses have proper error handling, confidence
         scoring, and source attribution.
    """
    success: bool
    query: str
    answer: str
    source_type: SourceType
    confidence: ConfidenceBreakdown
    sources: List[Source]
    reasoning_trace: List[ReasoningStep]
    guardrails: Guardrails
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    forecast: Optional[Forecast] = None
    shared_context: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None
    
    class Config:
        use_enum_values = True
    
    @classmethod
    def create_error_response(
        cls,
        query: str,
        error_message: str,
        partial_answer: Optional[str] = None
    ) -> "UnifiedAIResponse":
        """
        Create standardized error response.
        
        WHY: Errors should be as informative as successes.
             Partial answers are better than nothing.
        """
        return cls(
            success=False,
            query=query,
            answer=partial_answer or "Unable to process query due to error.",
            source_type=SourceType.ERROR,
            confidence=ConfidenceBreakdown(
                overall=0.0,
                data_freshness=0.0,
                source_reliability=0.0,
                entity_grounding=0.0,
                reasoning_coherence=0.0,
                explanation="Error occurred during processing"
            ),
            sources=[],
            reasoning_trace=[
                ReasoningStep(
                    step=1,
                    action="Error encountered",
                    details={"error": error_message},
                    confidence=0.0
                )
            ],
            guardrails=Guardrails(
                answer_type=AnswerType.UNKNOWN,
                warnings=[error_message],
                fallback_used=True
            ),
            error=error_message
        )
    
    @classmethod
    def create_fallback_response(
        cls,
        query: str,
        reason: str,
        partial_sources: Optional[List[Source]] = None
    ) -> "UnifiedAIResponse":
        """
        Create response when primary method fails but fallback succeeds.
        
        WHY: Graceful degradation is better than hard failure.
             Users should know when they're getting fallback results.
        """
        return cls(
            success=True,
            query=query,
            answer="Limited information available. Using fallback method.",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.4,
                data_freshness=0.5,
                source_reliability=0.4,
                entity_grounding=0.3,
                reasoning_coherence=0.5,
                explanation=f"Fallback used: {reason}"
            ),
            sources=partial_sources or [],
            reasoning_trace=[
                ReasoningStep(
                    step=1,
                    action="Primary method failed",
                    details={"reason": reason},
                    confidence=0.0
                ),
                ReasoningStep(
                    step=2,
                    action="Fallback method used",
                    confidence=0.4
                )
            ],
            guardrails=Guardrails(
                answer_type=AnswerType.PARTIAL,
                warnings=[f"Fallback used: {reason}"],
                limitations=["Limited information available"],
                fallback_used=True
            )
        )


class ConfidenceCalculator:
    """
    Principled confidence calculation with calibration.
    
    WHY: Arbitrary confidence scores (e.g., 0.6 * cognee + 0.4 * rag)
         are not defensible. This provides a systematic approach based
         on multiple factors with clear justification.
    """
    
    # Weights for confidence components (must sum to 1.0)
    WEIGHTS = {
        "data_freshness": 0.25,
        "source_reliability": 0.30,
        "entity_grounding": 0.20,
        "reasoning_coherence": 0.25
    }
    
    @classmethod
    def calculate(
        cls,
        data_freshness: float,
        source_reliability: float,
        entity_grounding: float,
        reasoning_coherence: float,
        historical_accuracy: Optional[float] = None
    ) -> ConfidenceBreakdown:
        """
        Calculate confidence with weighted components.
        
        Args:
            data_freshness: How recent is the data (0-1)
            source_reliability: Trust in sources (0-1)
            entity_grounding: How well entities are validated (0-1)
            reasoning_coherence: Logical consistency (0-1)
            historical_accuracy: Past prediction accuracy (0-1, optional)
        
        Returns:
            ConfidenceBreakdown with overall score and explanation
        
        WHY: Each component represents a different aspect of answer quality.
             Weighting them explicitly makes the calculation auditable.
        """
        # Calculate weighted overall confidence
        overall = (
            data_freshness * cls.WEIGHTS["data_freshness"] +
            source_reliability * cls.WEIGHTS["source_reliability"] +
            entity_grounding * cls.WEIGHTS["entity_grounding"] +
            reasoning_coherence * cls.WEIGHTS["reasoning_coherence"]
        )
        
        # Apply historical accuracy as a calibration factor if available
        if historical_accuracy is not None:
            overall = overall * (0.7 + 0.3 * historical_accuracy)
        
        # Ensure bounds [0, 1]
        overall = max(0.0, min(1.0, overall))
        
        # Generate explanation
        components = [
            f"freshness={data_freshness:.2f}",
            f"reliability={source_reliability:.2f}",
            f"grounding={entity_grounding:.2f}",
            f"coherence={reasoning_coherence:.2f}"
        ]
        
        if historical_accuracy is not None:
            components.append(f"historical={historical_accuracy:.2f}")
        
        explanation = f"Weighted average: {', '.join(components)}"
        
        return ConfidenceBreakdown(
            overall=overall,
            data_freshness=data_freshness,
            source_reliability=source_reliability,
            entity_grounding=entity_grounding,
            reasoning_coherence=reasoning_coherence,
            historical_accuracy=historical_accuracy,
            explanation=explanation
        )
    
    @classmethod
    def combine_confidences(
        cls,
        cognee_confidence: float,
        rag_confidence: float,
        cognee_weight: float = 0.6
    ) -> float:
        """
        Combine confidences from multiple sources.
        
        WHY: When using both Cognee and RAG, we need a principled way
             to combine their confidence scores. Default gives more weight
             to Cognee (memory) since it has historical context.
        
        Args:
            cognee_confidence: Confidence from Cognee (0-1)
            rag_confidence: Confidence from RAG (0-1)
            cognee_weight: Weight for Cognee (default 0.6)
        
        Returns:
            Combined confidence score (0-1)
        """
        rag_weight = 1.0 - cognee_weight
        combined = cognee_confidence * cognee_weight + rag_confidence * rag_weight
        return max(0.0, min(1.0, combined))
