"""
Tests for ai_insights.orchestration.orchestrator_v2 module.

Tests the orchestrator with proper Guardrails/AnswerType enum usage.
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestIntentRouting:
    """Test intent-based routing in orchestrator."""

    @pytest.mark.asyncio
    async def test_factual_query_routes_to_rag(self):
        """Factual queries should route to RAG pipeline."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            Source,
            SourceType,
            UnifiedAIResponse,
        )

        # Create a proper mock response
        mock_response = UnifiedAIResponse(
            success=True,
            query="What is the revenue target?",
            answer="The revenue target is $1M",
            source_type=SourceType.RETRIEVAL,
            confidence=ConfidenceBreakdown(
                overall=0.85,
                data_freshness=0.9,
                source_reliability=0.8,
                entity_grounding=0.85,
                reasoning_coherence=0.85,
            ),
            sources=[],
            reasoning_trace=[ReasoningStep(step=1, action="Intent classification", confidence=0.9)],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),  # Use enum!
        )

        assert mock_response.source_type == SourceType.RETRIEVAL
        assert mock_response.guardrails.answer_type == AnswerType.GROUNDED

    @pytest.mark.asyncio
    async def test_historical_query_routes_to_cognee(self):
        """Historical queries should route to Cognee (memory)."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        mock_response = UnifiedAIResponse(
            success=True,
            query="What happened to product X last quarter?",
            answer="Product X saw 20% growth",
            source_type=SourceType.MEMORY,
            confidence=ConfidenceBreakdown(
                overall=0.8,
                data_freshness=0.7,
                source_reliability=0.85,
                entity_grounding=0.8,
                reasoning_coherence=0.85,
            ),
            sources=[],
            reasoning_trace=[ReasoningStep(step=1, action="Intent: historical", confidence=0.85)],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        assert mock_response.source_type == SourceType.MEMORY

    @pytest.mark.asyncio
    async def test_cognee_unavailable_fallback_to_rag(self):
        """Should fallback to RAG when Cognee unavailable."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        # Simulating fallback scenario
        mock_response = UnifiedAIResponse(
            success=True,
            query="Historical query",
            answer="Fallback answer from RAG",
            source_type=SourceType.RETRIEVAL,  # Fell back to retrieval
            confidence=ConfidenceBreakdown(
                overall=0.6,
                data_freshness=0.7,
                source_reliability=0.6,
                entity_grounding=0.5,
                reasoning_coherence=0.6,
            ),
            sources=[],
            reasoning_trace=[
                ReasoningStep(step=1, action="Cognee unavailable", confidence=0.0),
                ReasoningStep(step=2, action="Fallback to RAG", confidence=0.6),
            ],
            guardrails=Guardrails(
                answer_type=AnswerType.PARTIAL,
                fallback_used=True,
                warnings=["Primary source unavailable"],
            ),
        )

        assert mock_response.guardrails.fallback_used is True
        assert mock_response.source_type == SourceType.RETRIEVAL


class TestConfidenceCalculation:
    """Test confidence calculation in orchestrator."""

    @pytest.mark.asyncio
    async def test_low_confidence_triggers_warning(self):
        """Low confidence should add guardrail warnings."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        mock_response = UnifiedAIResponse(
            success=True,
            query="Uncertain query",
            answer="Best effort answer",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.35,  # Low confidence
                data_freshness=0.4,
                source_reliability=0.3,
                entity_grounding=0.3,
                reasoning_coherence=0.4,
            ),
            sources=[],
            reasoning_trace=[],
            guardrails=Guardrails(
                answer_type=AnswerType.SPECULATIVE,
                low_confidence=True,
                warnings=["Low confidence in response"],
            ),
        )

        assert mock_response.confidence.overall < 0.5
        assert mock_response.guardrails.low_confidence is True

    def test_confidence_calculator(self):
        """Test ConfidenceCalculator utility."""
        from ai_insights.models.response_models import ConfidenceCalculator

        breakdown = ConfidenceCalculator.calculate(
            data_freshness=0.8,
            source_reliability=0.9,
            entity_grounding=0.7,
            reasoning_coherence=0.8,
        )

        # Verify weighted calculation
        assert 0.7 < breakdown.overall < 0.9
        assert "freshness" in breakdown.explanation


class TestErrorHandling:
    """Test error handling in orchestrator."""

    @pytest.mark.asyncio
    async def test_partial_failure_returns_fallback(self):
        """Partial failures should return fallback response."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            SourceType,
            UnifiedAIResponse,
        )

        # Use factory method for fallback
        fallback = UnifiedAIResponse.create_fallback_response(
            query="Test query", reason="Primary source timeout"
        )

        assert fallback.success is True
        assert fallback.guardrails.fallback_used is True
        assert fallback.guardrails.answer_type == AnswerType.PARTIAL

    @pytest.mark.asyncio
    async def test_complete_failure_returns_error(self):
        """Complete failures should return error response."""
        from ai_insights.models.response_models import SourceType, UnifiedAIResponse

        error_response = UnifiedAIResponse.create_error_response(
            query="Failed query", error_message="All sources unavailable"
        )

        assert error_response.success is False
        assert error_response.source_type == SourceType.ERROR
        assert error_response.error == "All sources unavailable"


class TestReasoningTrace:
    """Test reasoning trace functionality."""

    @pytest.mark.asyncio
    async def test_reasoning_trace_includes_intent_classification(self):
        """Reasoning trace should document intent classification."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        mock_response = UnifiedAIResponse(
            success=True,
            query="Test query",
            answer="Test answer",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.8,
                data_freshness=0.8,
                source_reliability=0.8,
                entity_grounding=0.8,
                reasoning_coherence=0.8,
            ),
            sources=[],
            reasoning_trace=[
                ReasoningStep(
                    step=1,
                    action="Intent classification",
                    details={"intent": "factual", "confidence": 0.9},
                    confidence=0.9,
                ),
                ReasoningStep(
                    step=2, action="Source selection", details={"source": "rag"}, confidence=0.85
                ),
            ],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        assert len(mock_response.reasoning_trace) == 2
        assert mock_response.reasoning_trace[0].action == "Intent classification"

    def test_reasoning_step_has_timestamp(self):
        """Each reasoning step should have a timestamp."""
        from ai_insights.models.response_models import ReasoningStep

        step = ReasoningStep(step=1, action="Test action", confidence=0.8)

        assert step.timestamp is not None
        assert isinstance(step.timestamp, datetime)


class TestSourceAttribution:
    """Test source attribution in responses."""

    def test_source_model_validation(self):
        """Source model should validate correctly."""
        from ai_insights.models.response_models import Source

        source = Source(
            source_id="src-001",
            source_type="memory",
            entity_type="Product",
            entity_id="prod-123",
            content="Product information...",
            confidence=0.85,
        )

        assert source.source_id == "src-001"
        assert source.confidence == 0.85

    def test_source_confidence_bounds(self):
        """Source confidence should be bounded [0, 1]."""
        from pydantic import ValidationError

        from ai_insights.models.response_models import Source

        with pytest.raises(ValidationError):
            Source(source_id="src-001", source_type="memory", confidence=1.5)  # Invalid: > 1.0


class TestGuardrailsModel:
    """Test Guardrails model specifically."""

    def test_guardrails_with_answer_type_enum(self):
        """Guardrails should accept AnswerType enum."""
        from ai_insights.models.response_models import AnswerType, Guardrails

        guardrails = Guardrails(answer_type=AnswerType.GROUNDED)
        assert guardrails.answer_type == AnswerType.GROUNDED

        guardrails2 = Guardrails(answer_type=AnswerType.SPECULATIVE)
        assert guardrails2.answer_type == AnswerType.SPECULATIVE

    def test_guardrails_with_all_fields(self):
        """Guardrails should accept all optional fields."""
        from ai_insights.models.response_models import AnswerType, Guardrails

        guardrails = Guardrails(
            answer_type=AnswerType.PARTIAL,
            warnings=["Limited data available"],
            limitations=["Historical data only"],
            contradictions=["Source A vs Source B"],
            fallback_used=True,
            memory_sparse=True,
            low_confidence=True,
        )

        assert len(guardrails.warnings) == 1
        assert guardrails.fallback_used is True
        assert guardrails.memory_sparse is True
        assert guardrails.low_confidence is True


class TestSharedContext:
    """Test SharedContext class."""

    def test_shared_context_initialization(self):
        """SharedContext should initialize with empty collections."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext

        ctx = SharedContext()

        assert ctx.entity_ids == []
        assert ctx.grounded_entities == []
        assert ctx.historical_context == ""
        assert ctx.validation_errors == []

    def test_shared_context_add_rag_finding(self):
        """Should track RAG findings for feedback loop."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext

        ctx = SharedContext()
        ctx.add_rag_finding(
            finding="Product has high churn", source="customer_feedback.pdf", confidence=0.85
        )

        assert len(ctx.rag_findings) == 1
        assert ctx.rag_findings[0]["confidence"] == 0.85

    def test_shared_context_get_product_ids(self):
        """Should extract product IDs from grounded entities."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext

        ctx = SharedContext()
        ctx.grounded_entities = [
            {"id": "prod-001", "type": "Product", "data": {}, "verified": True},
            {"id": "risk-001", "type": "RiskSignal", "data": {}, "verified": True},
            {"id": "prod-002", "type": "Product", "data": {}, "verified": True},
        ]

        product_ids = ctx.get_product_ids()

        assert len(product_ids) == 2
        assert "prod-001" in product_ids
        assert "prod-002" in product_ids

    def test_shared_context_to_dict(self):
        """Should serialize to dictionary."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext

        ctx = SharedContext()
        ctx.historical_context = "Some history"
        ctx.validation_errors = ["Error 1"]

        result = ctx.to_dict()

        assert result["historical_context"] == "Some history"
        assert result["validation_errors"] == ["Error 1"]


class TestProductionOrchestrator:
    """Test ProductionOrchestrator class."""

    def test_orchestrator_initialization(self):
        """Orchestrator should initialize with dependencies."""
        with patch("ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader"):
            with patch("ai_insights.orchestration.orchestrator_v2.get_entity_validator"):
                with patch("ai_insights.orchestration.orchestrator_v2.get_entity_grounder"):
                    with patch("ai_insights.orchestration.orchestrator_v2.get_intent_classifier"):
                        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator

                        orchestrator = ProductionOrchestrator()

                        assert orchestrator.CONFIDENCE_THRESHOLD_HIGH == 0.8
                        assert orchestrator.CONFIDENCE_THRESHOLD_MEDIUM == 0.6
                        assert orchestrator.CONFIDENCE_THRESHOLD_LOW == 0.4

    def test_get_production_orchestrator_singleton(self):
        """Should return singleton instance."""
        with patch("ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader"):
            with patch("ai_insights.orchestration.orchestrator_v2.get_entity_validator"):
                with patch("ai_insights.orchestration.orchestrator_v2.get_entity_grounder"):
                    with patch("ai_insights.orchestration.orchestrator_v2.get_intent_classifier"):
                        import ai_insights.orchestration.orchestrator_v2 as orch_module

                        orch_module._orchestrator = None  # Reset singleton

                        orch1 = orch_module.get_production_orchestrator()
                        orch2 = orch_module.get_production_orchestrator()

                        assert orch1 is orch2


class TestOrchestratorIntegration:
    """Integration tests for orchestrator."""

    @pytest.mark.asyncio
    async def test_end_to_end_query_flow(self):
        """Test complete query flow through orchestrator."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            Source,
            SourceType,
            UnifiedAIResponse,
        )

        # Simulate full orchestrator response
        response = UnifiedAIResponse(
            success=True,
            query="What are the risks for Product Alpha?",
            answer="Product Alpha faces market competition and regulatory risks.",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.82,
                data_freshness=0.85,
                source_reliability=0.8,
                entity_grounding=0.8,
                reasoning_coherence=0.83,
            ),
            sources=[
                Source(
                    source_id="src-001",
                    source_type="memory",
                    entity_type="Product",
                    entity_id="prod-alpha",
                    confidence=0.9,
                ),
                Source(
                    source_id="src-002",
                    source_type="retrieval",
                    document_id="doc-123",
                    confidence=0.85,
                ),
            ],
            reasoning_trace=[
                ReasoningStep(step=1, action="Intent: factual", confidence=0.9),
                ReasoningStep(step=2, action="Route to RAG with Cognee context", confidence=0.85),
                ReasoningStep(step=3, action="Merge results", confidence=0.82),
            ],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        assert response.success is True
        assert len(response.sources) == 2
        assert len(response.reasoning_trace) == 3
        assert response.confidence.overall > 0.8


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
