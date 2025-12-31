"""
Tests for ai_insights.models.response_models module.

Tests the actual implementation:
- SourceType, ConfidenceLevel, AnswerType enums
- Source, ReasoningStep, ConfidenceBreakdown models
- RecommendedAction, Forecast, Guardrails models
- UnifiedAIResponse model and factory methods
- ConfidenceCalculator class
"""

from datetime import datetime

import pytest
from pydantic import ValidationError


class TestSourceTypeEnum:
    """Test SourceType enum."""

    def test_all_source_types_defined(self):
        """Should have all expected source types."""
        from ai_insights.models.response_models import SourceType

        assert SourceType.MEMORY == "memory"
        assert SourceType.RETRIEVAL == "retrieval"
        assert SourceType.HYBRID == "hybrid"
        assert SourceType.ERROR == "error"

    def test_source_type_is_string_enum(self):
        """Should be string enum for JSON serialization."""
        from ai_insights.models.response_models import SourceType

        assert isinstance(SourceType.MEMORY.value, str)


class TestConfidenceLevelEnum:
    """Test ConfidenceLevel enum."""

    def test_all_levels_defined(self):
        """Should have all expected confidence levels."""
        from ai_insights.models.response_models import ConfidenceLevel

        assert ConfidenceLevel.HIGH == "high"
        assert ConfidenceLevel.MEDIUM == "medium"
        assert ConfidenceLevel.LOW == "low"
        assert ConfidenceLevel.VERY_LOW == "very_low"


class TestAnswerTypeEnum:
    """Test AnswerType enum."""

    def test_all_answer_types_defined(self):
        """Should have all expected answer types."""
        from ai_insights.models.response_models import AnswerType

        assert AnswerType.GROUNDED == "grounded"
        assert AnswerType.SPECULATIVE == "speculative"
        assert AnswerType.PARTIAL == "partial"
        assert AnswerType.UNKNOWN == "unknown"


class TestSourceModel:
    """Test Source model."""

    def test_valid_source_creation(self):
        """Should create valid source."""
        from ai_insights.models.response_models import Source

        source = Source(source_id="src-123", source_type="memory", confidence=0.85)

        assert source.source_id == "src-123"
        assert source.source_type == "memory"
        assert source.confidence == 0.85

    def test_source_with_all_fields(self):
        """Should accept all optional fields."""
        from ai_insights.models.response_models import Source

        source = Source(
            source_id="src-123",
            source_type="retrieval",
            entity_type="Product",
            entity_id="prod-001",
            entity_name="Product Alpha",
            document_id="doc-001",
            chunk_id="chunk-001",
            content="Sample content",
            confidence=0.9,
            time_range="2024-Q1",
            verified=True,
        )

        assert source.entity_type == "Product"
        assert source.verified is True

    def test_confidence_bounds(self):
        """Should enforce confidence bounds [0, 1]."""
        from ai_insights.models.response_models import Source

        with pytest.raises(ValidationError):
            Source(source_id="s1", source_type="memory", confidence=1.5)

        with pytest.raises(ValidationError):
            Source(source_id="s1", source_type="memory", confidence=-0.1)


class TestReasoningStepModel:
    """Test ReasoningStep model."""

    def test_valid_reasoning_step(self):
        """Should create valid reasoning step."""
        from ai_insights.models.response_models import ReasoningStep

        step = ReasoningStep(step=1, action="Intent classification", confidence=0.9)

        assert step.step == 1
        assert step.action == "Intent classification"
        assert step.confidence == 0.9

    def test_reasoning_step_with_details(self):
        """Should accept optional details."""
        from ai_insights.models.response_models import ReasoningStep

        step = ReasoningStep(
            step=2,
            action="Entity extraction",
            details={"entities": ["Product A", "Product B"]},
            confidence=0.85,
        )

        assert step.details["entities"] == ["Product A", "Product B"]

    def test_auto_timestamp(self):
        """Should auto-generate timestamp."""
        from ai_insights.models.response_models import ReasoningStep

        step = ReasoningStep(step=1, action="Test", confidence=0.5)

        assert isinstance(step.timestamp, datetime)


class TestConfidenceBreakdownModel:
    """Test ConfidenceBreakdown model."""

    def test_valid_confidence_breakdown(self):
        """Should create valid confidence breakdown."""
        from ai_insights.models.response_models import ConfidenceBreakdown

        breakdown = ConfidenceBreakdown(
            overall=0.85,
            data_freshness=0.9,
            source_reliability=0.8,
            entity_grounding=0.85,
            reasoning_coherence=0.85,
        )

        assert breakdown.overall == 0.85
        assert breakdown.data_freshness == 0.9

    def test_confidence_level_property_high(self):
        """Should return HIGH for overall >= 0.8."""
        from ai_insights.models.response_models import ConfidenceBreakdown, ConfidenceLevel

        breakdown = ConfidenceBreakdown(
            overall=0.85,
            data_freshness=0.9,
            source_reliability=0.9,
            entity_grounding=0.9,
            reasoning_coherence=0.9,
        )

        assert breakdown.level == ConfidenceLevel.HIGH

    def test_confidence_level_property_medium(self):
        """Should return MEDIUM for overall 0.6-0.8."""
        from ai_insights.models.response_models import ConfidenceBreakdown, ConfidenceLevel

        breakdown = ConfidenceBreakdown(
            overall=0.7,
            data_freshness=0.7,
            source_reliability=0.7,
            entity_grounding=0.7,
            reasoning_coherence=0.7,
        )

        assert breakdown.level == ConfidenceLevel.MEDIUM

    def test_confidence_level_property_low(self):
        """Should return LOW for overall 0.4-0.6."""
        from ai_insights.models.response_models import ConfidenceBreakdown, ConfidenceLevel

        breakdown = ConfidenceBreakdown(
            overall=0.5,
            data_freshness=0.5,
            source_reliability=0.5,
            entity_grounding=0.5,
            reasoning_coherence=0.5,
        )

        assert breakdown.level == ConfidenceLevel.LOW

    def test_confidence_level_property_very_low(self):
        """Should return VERY_LOW for overall < 0.4."""
        from ai_insights.models.response_models import ConfidenceBreakdown, ConfidenceLevel

        breakdown = ConfidenceBreakdown(
            overall=0.2,
            data_freshness=0.2,
            source_reliability=0.2,
            entity_grounding=0.2,
            reasoning_coherence=0.2,
        )

        assert breakdown.level == ConfidenceLevel.VERY_LOW

    def test_optional_historical_accuracy(self):
        """Should accept optional historical_accuracy."""
        from ai_insights.models.response_models import ConfidenceBreakdown

        breakdown = ConfidenceBreakdown(
            overall=0.8,
            data_freshness=0.8,
            source_reliability=0.8,
            entity_grounding=0.8,
            reasoning_coherence=0.8,
            historical_accuracy=0.9,
        )

        assert breakdown.historical_accuracy == 0.9


class TestGuardrailsModel:
    """Test Guardrails model."""

    def test_valid_guardrails(self):
        """Should create valid guardrails."""
        from ai_insights.models.response_models import AnswerType, Guardrails

        guardrails = Guardrails(answer_type=AnswerType.GROUNDED)

        assert guardrails.answer_type == AnswerType.GROUNDED
        assert guardrails.warnings == []
        assert guardrails.fallback_used is False

    def test_guardrails_with_warnings(self):
        """Should accept warnings list."""
        from ai_insights.models.response_models import AnswerType, Guardrails

        guardrails = Guardrails(
            answer_type=AnswerType.PARTIAL,
            warnings=["Limited data available", "Some sources unavailable"],
            limitations=["Historical data only"],
            fallback_used=True,
            low_confidence=True,
        )

        assert len(guardrails.warnings) == 2
        assert guardrails.fallback_used is True
        assert guardrails.low_confidence is True


class TestUnifiedAIResponseModel:
    """Test UnifiedAIResponse model."""

    def test_valid_response_creation(self):
        """Should create valid unified response."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="What are the risks?",
            answer="The main risks are...",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.85,
                data_freshness=0.9,
                source_reliability=0.8,
                entity_grounding=0.85,
                reasoning_coherence=0.85,
            ),
            sources=[],
            reasoning_trace=[],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        assert response.success is True
        assert response.query == "What are the risks?"
        assert response.source_type == SourceType.HYBRID

    def test_auto_timestamp(self):
        """Should auto-generate timestamp."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="test",
            answer="test answer",
            source_type=SourceType.MEMORY,
            confidence=ConfidenceBreakdown(
                overall=0.5,
                data_freshness=0.5,
                source_reliability=0.5,
                entity_grounding=0.5,
                reasoning_coherence=0.5,
            ),
            sources=[],
            reasoning_trace=[],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        assert isinstance(response.timestamp, datetime)

    def test_create_error_response(self):
        """Should create standardized error response."""
        from ai_insights.models.response_models import SourceType, UnifiedAIResponse

        error_response = UnifiedAIResponse.create_error_response(
            query="Test query", error_message="Database connection failed"
        )

        assert error_response.success is False
        assert error_response.source_type == SourceType.ERROR
        assert error_response.error == "Database connection failed"
        assert error_response.confidence.overall == 0.0
        assert len(error_response.guardrails.warnings) > 0

    def test_create_error_response_with_partial_answer(self):
        """Should include partial answer in error response."""
        from ai_insights.models.response_models import UnifiedAIResponse

        error_response = UnifiedAIResponse.create_error_response(
            query="Test query",
            error_message="Partial failure",
            partial_answer="Here is what we could determine...",
        )

        assert error_response.answer == "Here is what we could determine..."

    def test_create_fallback_response(self):
        """Should create fallback response."""
        from ai_insights.models.response_models import SourceType, UnifiedAIResponse

        fallback_response = UnifiedAIResponse.create_fallback_response(
            query="Test query", reason="Primary source unavailable"
        )

        assert fallback_response.success is True
        assert fallback_response.source_type == SourceType.HYBRID
        assert fallback_response.guardrails.fallback_used is True
        assert "fallback" in fallback_response.confidence.explanation.lower()


class TestConfidenceCalculator:
    """Test ConfidenceCalculator class."""

    def test_calculate_weighted_confidence(self):
        """Should calculate weighted confidence correctly."""
        from ai_insights.models.response_models import ConfidenceCalculator

        breakdown = ConfidenceCalculator.calculate(
            data_freshness=0.8,
            source_reliability=0.9,
            entity_grounding=0.7,
            reasoning_coherence=0.85,
        )

        # Verify weighted calculation
        expected = (
            0.8 * 0.25  # data_freshness
            + 0.9 * 0.30  # source_reliability
            + 0.7 * 0.20  # entity_grounding
            + 0.85 * 0.25  # reasoning_coherence
        )

        assert abs(breakdown.overall - expected) < 0.01

    def test_calculate_with_historical_accuracy(self):
        """Should apply historical accuracy as calibration."""
        from ai_insights.models.response_models import ConfidenceCalculator

        breakdown = ConfidenceCalculator.calculate(
            data_freshness=0.8,
            source_reliability=0.8,
            entity_grounding=0.8,
            reasoning_coherence=0.8,
            historical_accuracy=1.0,  # Perfect historical accuracy
        )

        # With perfect historical accuracy, should be boosted
        # Formula: overall * (0.7 + 0.3 * 1.0) = overall * 1.0
        assert breakdown.overall <= 1.0
        assert breakdown.historical_accuracy == 1.0

    def test_calculate_bounds_enforcement(self):
        """Should enforce [0, 1] bounds on overall."""
        from ai_insights.models.response_models import ConfidenceCalculator

        # Even with all 1.0 inputs, should stay <= 1.0
        breakdown = ConfidenceCalculator.calculate(
            data_freshness=1.0,
            source_reliability=1.0,
            entity_grounding=1.0,
            reasoning_coherence=1.0,
            historical_accuracy=1.0,
        )

        assert breakdown.overall <= 1.0
        assert breakdown.overall >= 0.0

    def test_calculate_generates_explanation(self):
        """Should generate explanation string."""
        from ai_insights.models.response_models import ConfidenceCalculator

        breakdown = ConfidenceCalculator.calculate(
            data_freshness=0.8,
            source_reliability=0.9,
            entity_grounding=0.7,
            reasoning_coherence=0.85,
        )

        assert "freshness" in breakdown.explanation
        assert "reliability" in breakdown.explanation
        assert "grounding" in breakdown.explanation
        assert "coherence" in breakdown.explanation

    def test_combine_confidences_default_weight(self):
        """Should combine confidences with default 0.6 Cognee weight."""
        from ai_insights.models.response_models import ConfidenceCalculator

        combined = ConfidenceCalculator.combine_confidences(
            cognee_confidence=0.9, rag_confidence=0.7
        )

        expected = 0.9 * 0.6 + 0.7 * 0.4
        assert abs(combined - expected) < 0.01

    def test_combine_confidences_custom_weight(self):
        """Should combine confidences with custom weight."""
        from ai_insights.models.response_models import ConfidenceCalculator

        combined = ConfidenceCalculator.combine_confidences(
            cognee_confidence=0.8, rag_confidence=0.9, cognee_weight=0.3  # Give more weight to RAG
        )

        expected = 0.8 * 0.3 + 0.9 * 0.7
        assert abs(combined - expected) < 0.01

    def test_combine_confidences_bounds(self):
        """Should enforce bounds on combined confidence."""
        from ai_insights.models.response_models import ConfidenceCalculator

        # Should stay within [0, 1]
        combined = ConfidenceCalculator.combine_confidences(
            cognee_confidence=1.0, rag_confidence=1.0
        )

        assert combined <= 1.0
        assert combined >= 0.0


class TestRecommendedActionModel:
    """Test RecommendedAction model."""

    def test_valid_recommended_action(self):
        """Should create valid recommended action."""
        from ai_insights.models.response_models import RecommendedAction

        action = RecommendedAction(
            action_type="review", rationale="Product risk level increased", confidence=0.85
        )

        assert action.action_type == "review"
        assert action.rationale == "Product risk level increased"

    def test_recommended_action_with_tier(self):
        """Should accept optional tier and priority."""
        from ai_insights.models.response_models import RecommendedAction

        action = RecommendedAction(
            action_type="escalate",
            tier="tier1",
            rationale="Urgent action needed",
            confidence=0.9,
            priority="high",
        )

        assert action.tier == "tier1"
        assert action.priority == "high"


class TestForecastModel:
    """Test Forecast model."""

    def test_valid_forecast(self):
        """Should create valid forecast."""
        from ai_insights.models.response_models import Forecast

        forecast = Forecast(
            scenario="No action taken",
            impact="Revenue decline of 15%",
            probability=0.7,
            time_horizon="Q2 2024",
        )

        assert forecast.scenario == "No action taken"
        assert forecast.probability == 0.7

    def test_forecast_with_based_on(self):
        """Should accept optional based_on field."""
        from ai_insights.models.response_models import Forecast

        forecast = Forecast(
            scenario="Market downturn",
            impact="Reduced demand",
            probability=0.5,
            time_horizon="6 months",
            based_on="Historical market data",
        )

        assert forecast.based_on == "Historical market data"


class TestModelSerialization:
    """Test model serialization for API responses."""

    def test_unified_response_to_dict(self):
        """Should serialize to dictionary."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="test",
            answer="test answer",
            source_type=SourceType.MEMORY,
            confidence=ConfidenceBreakdown(
                overall=0.8,
                data_freshness=0.8,
                source_reliability=0.8,
                entity_grounding=0.8,
                reasoning_coherence=0.8,
            ),
            sources=[],
            reasoning_trace=[],
            guardrails=Guardrails(answer_type=AnswerType.GROUNDED),
        )

        data = response.model_dump()

        assert isinstance(data, dict)
        assert data["success"] is True
        assert data["source_type"] == "memory"  # Enum value

    def test_enum_values_serialized(self):
        """Should serialize enum values as strings."""
        from ai_insights.models.response_models import (
            AnswerType,
            ConfidenceBreakdown,
            Guardrails,
            SourceType,
            UnifiedAIResponse,
        )

        response = UnifiedAIResponse(
            success=True,
            query="test",
            answer="test answer",
            source_type=SourceType.HYBRID,
            confidence=ConfidenceBreakdown(
                overall=0.8,
                data_freshness=0.8,
                source_reliability=0.8,
                entity_grounding=0.8,
                reasoning_coherence=0.8,
            ),
            sources=[],
            reasoning_trace=[],
            guardrails=Guardrails(answer_type=AnswerType.PARTIAL),
        )

        data = response.model_dump()

        # Should be string values, not enum objects
        assert data["source_type"] == "hybrid"
        assert data["guardrails"]["answer_type"] == "partial"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
