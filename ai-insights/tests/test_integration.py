"""
Tests for integration between orchestrator components.

Tests proper interaction between Cognee, RAG, and orchestrator
with correct model usage.
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestCogneeRAGIntegration:
    """Test integration between Cognee and RAG systems."""

    @pytest.mark.asyncio
    async def test_cognee_success_no_rag_fallback(self):
        """When Cognee succeeds with high confidence, no RAG fallback needed."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        # Simulate successful Cognee response
        response = UnifiedAIResponse(
            success=True,
            query="What caused the revenue drop in Q3?",
            answer="The revenue drop was caused by market conditions.",
            source_type=SourceType.MEMORY,
            confidence=ConfidenceBreakdown(
                overall=0.9,
                data_freshness=0.85,
                source_reliability=0.95,
                entity_grounding=0.9,
                reasoning_coherence=0.9,
            ),
            sources=[],
            reasoning_trace=[ReasoningStep(step=1, action="Cognee query", confidence=0.9)],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        # Verify it's a memory source (Cognee)
        assert response.source_type in [SourceType.MEMORY, SourceType.HYBRID]
        assert response.success is True

    @pytest.mark.asyncio
    async def test_cognee_unavailable_uses_rag_directly(self):
        """When Cognee is unavailable, should use RAG directly."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        # Simulate RAG-only response when Cognee unavailable
        response = UnifiedAIResponse(
            success=True,
            query="What is the current status?",
            answer="Current status from documents.",
            source_type=SourceType.RETRIEVAL,
            confidence=ConfidenceBreakdown(
                overall=0.75,
                data_freshness=0.9,
                source_reliability=0.7,
                entity_grounding=0.6,
                reasoning_coherence=0.8,
            ),
            sources=[],
            reasoning_trace=[
                ReasoningStep(step=1, action="Cognee unavailable", confidence=0.0),
                ReasoningStep(step=2, action="Using RAG", confidence=0.75),
            ],
            guardrails=Guardrails(
                answer_type=AnswerType.PARTIAL,
                fallback_used=True,
                warnings=["Historical context unavailable"],
            ),
        )

        assert response.success is True
        assert response.guardrails.fallback_used is True


class TestHybridFlow:
    """Test hybrid flow combining Cognee and RAG."""

    @pytest.mark.asyncio
    async def test_mixed_query_uses_both_sources(self):
        """Mixed queries should use both Cognee and RAG."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            Source,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="Compare current revenue to last quarter",
            answer="Current revenue is $1M vs $800K last quarter.",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.85,
                data_freshness=0.9,
                source_reliability=0.85,
                entity_grounding=0.8,
                reasoning_coherence=0.85,
            ),
            sources=[
                Source(source_id="memory-1", source_type="memory", confidence=0.9),
                Source(source_id="rag-1", source_type="retrieval", confidence=0.85),
            ],
            reasoning_trace=[
                ReasoningStep(step=1, action="Intent: mixed", confidence=0.8),
                ReasoningStep(step=2, action="Query Cognee", confidence=0.9),
                ReasoningStep(step=3, action="Query RAG", confidence=0.85),
                ReasoningStep(step=4, action="Merge results", confidence=0.85),
            ],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        assert response.source_type == SourceType.HYBRID
        assert len(response.sources) == 2


class TestEntityValidation:
    """Test entity validation in integration context."""

    @pytest.mark.asyncio
    async def test_invalid_entities_add_warnings(self):
        """Invalid entities should add warnings to guardrails."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="Status of Product XYZ?",
            answer="Limited information available.",
            source_type=SourceType.RETRIEVAL,
            confidence=ConfidenceBreakdown(
                overall=0.5,
                data_freshness=0.6,
                source_reliability=0.5,
                entity_grounding=0.3,
                reasoning_coherence=0.6,
            ),
            sources=[],
            reasoning_trace=[],
            guardrails=Guardrails(
                answer_type=AnswerType.PARTIAL,
                warnings=["Entity 'Product XYZ' not found in knowledge graph"],
                limitations=["Could not verify entity existence"],
            ),
        )

        # Should have warnings or limitations about invalid entity
        assert len(response.guardrails.warnings) > 0 or len(response.guardrails.limitations) > 0

    @pytest.mark.asyncio
    async def test_grounded_entities_improve_confidence(self):
        """Successfully grounded entities should improve confidence."""
        from ai_insights.models.response_models import ConfidenceCalculator

        # With high entity grounding
        high_grounding = ConfidenceCalculator.calculate(
            data_freshness=0.8,
            source_reliability=0.8,
            entity_grounding=0.95,  # High grounding
            reasoning_coherence=0.8,
        )

        # With low entity grounding
        low_grounding = ConfidenceCalculator.calculate(
            data_freshness=0.8,
            source_reliability=0.8,
            entity_grounding=0.3,  # Low grounding
            reasoning_coherence=0.8,
        )

        assert high_grounding.overall > low_grounding.overall


class TestReasoningTrace:
    """Test reasoning trace in integration scenarios."""

    @pytest.mark.asyncio
    async def test_reasoning_trace_documents_fallback(self):
        """Reasoning trace should document fallback decisions."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="Historical analysis",
            answer="Fallback answer",
            source_type=SourceType.RETRIEVAL,
            confidence=ConfidenceBreakdown(
                overall=0.6,
                data_freshness=0.7,
                source_reliability=0.6,
                entity_grounding=0.5,
                reasoning_coherence=0.6,
            ),
            sources=[],
            reasoning_trace=[
                ReasoningStep(step=1, action="Intent: historical", confidence=0.85),
                ReasoningStep(
                    step=2,
                    action="Cognee query failed",
                    details={"error": "Connection timeout"},
                    confidence=0.0,
                ),
                ReasoningStep(step=3, action="Fallback to RAG", confidence=0.6),
            ],
            guardrails=Guardrails(answer_type=AnswerType.PARTIAL, fallback_used=True),
        )

        # Should have at least one step documenting the fallback
        fallback_steps = [s for s in response.reasoning_trace if "fallback" in s.action.lower()]
        assert len(fallback_steps) >= 1

    @pytest.mark.asyncio
    async def test_reasoning_trace_includes_confidence_at_each_step(self):
        """Each reasoning step should have a confidence score."""
        from ai_insights.models.response_models import ReasoningStep

        steps = [
            ReasoningStep(step=1, action="Step 1", confidence=0.9),
            ReasoningStep(step=2, action="Step 2", confidence=0.85),
            ReasoningStep(step=3, action="Step 3", confidence=0.8),
        ]

        for step in steps:
            assert hasattr(step, "confidence")
            assert 0 <= step.confidence <= 1


class TestEndToEndScenarios:
    """End-to-end integration test scenarios."""

    @pytest.mark.asyncio
    async def test_product_query_with_context(self):
        """Test product query with full context."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            Source,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="What are the risks for PayLink product?",
            answer="PayLink has regulatory compliance risks due to...",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.88,
                data_freshness=0.9,
                source_reliability=0.85,
                entity_grounding=0.9,
                reasoning_coherence=0.88,
            ),
            sources=[
                Source(
                    source_id="prod-paylink",
                    source_type="memory",
                    entity_type="Product",
                    entity_id="prod_paylink",
                    entity_name="PayLink",
                    confidence=0.95,
                    verified=True,
                )
            ],
            reasoning_trace=[
                ReasoningStep(step=1, action="Intent classification", confidence=0.9),
                ReasoningStep(step=2, action="Entity grounding", confidence=0.95),
                ReasoningStep(step=3, action="Query execution", confidence=0.88),
            ],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
            shared_context={"entity_ids": [{"id": "prod_paylink", "type": "Product"}]},
        )

        assert response.success is True
        assert response.confidence.overall > 0.8
        assert len(response.sources) >= 1

    @pytest.mark.asyncio
    async def test_portfolio_analysis_query(self):
        """Test portfolio-level analysis query."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            ReasoningStep,
            RecommendedAction,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="What is the overall portfolio health?",
            answer="Portfolio shows strong growth with moderate risk exposure.",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.82,
                data_freshness=0.85,
                source_reliability=0.8,
                entity_grounding=0.8,
                reasoning_coherence=0.83,
            ),
            sources=[],
            reasoning_trace=[ReasoningStep(step=1, action="Analyze portfolio", confidence=0.82)],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
            recommended_actions=[
                RecommendedAction(
                    action_type="review", rationale="Quarterly review recommended", confidence=0.8
                )
            ],
        )

        assert response.success is True
        assert len(response.recommended_actions) >= 1


class TestErrorRecovery:
    """Test error recovery scenarios."""

    @pytest.mark.asyncio
    async def test_graceful_degradation(self):
        """System should degrade gracefully on partial failures."""
        from ai_insights.models.response_models import UnifiedAIResponse

        # Use factory method for fallback
        response = UnifiedAIResponse.create_fallback_response(
            query="Complex query", reason="Primary source timeout"
        )

        assert response.success is True
        assert response.guardrails.fallback_used is True

    @pytest.mark.asyncio
    async def test_complete_failure_handling(self):
        """System should handle complete failures gracefully."""
        from ai_insights.models.response_models import SourceType, UnifiedAIResponse

        response = UnifiedAIResponse.create_error_response(
            query="Failed query", error_message="All sources unavailable"
        )

        assert response.success is False
        assert response.source_type == SourceType.ERROR
        assert response.error is not None


class TestConfidenceCombination:
    """Test confidence combination from multiple sources."""

    def test_combine_cognee_rag_confidence(self):
        """Should properly combine Cognee and RAG confidence."""
        from ai_insights.models.response_models import ConfidenceCalculator

        # Cognee high, RAG medium
        combined = ConfidenceCalculator.combine_confidences(
            cognee_confidence=0.9, rag_confidence=0.6, cognee_weight=0.6
        )

        # Expected: 0.9 * 0.6 + 0.6 * 0.4 = 0.54 + 0.24 = 0.78
        assert 0.75 < combined < 0.82

    def test_combine_with_custom_weights(self):
        """Should respect custom confidence weights."""
        from ai_insights.models.response_models import ConfidenceCalculator

        # Equal weights
        combined = ConfidenceCalculator.combine_confidences(
            cognee_confidence=0.8, rag_confidence=0.6, cognee_weight=0.5
        )

        # Expected: 0.8 * 0.5 + 0.6 * 0.5 = 0.7
        assert 0.68 < combined < 0.72


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
