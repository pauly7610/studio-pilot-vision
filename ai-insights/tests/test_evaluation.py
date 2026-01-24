"""
Tests for ai_insights.evaluation module.

Tests the answer evaluation and metrics tracking functionality.
"""

import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch


class TestAnswerEvaluator:
    """Tests for AnswerEvaluator class."""

    def test_evaluator_initialization(self):
        """Should initialize with default weights."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        assert evaluator.weights["relevance"] == 0.35
        assert evaluator.weights["groundedness"] == 0.30
        assert evaluator.weights["completeness"] == 0.20
        assert evaluator.weights["coherence"] == 0.15

    def test_evaluator_custom_weights(self):
        """Should accept custom weights."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        custom_weights = {
            "relevance": 0.4,
            "groundedness": 0.3,
            "completeness": 0.2,
            "coherence": 0.1,
        }
        evaluator = AnswerEvaluator(weights=custom_weights)
        assert evaluator.weights == custom_weights

    def test_evaluate_basic(self):
        """Should evaluate answer and return result."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        
        result = evaluator.evaluate(
            query="What is product X?",
            answer="Product X is a payment solution that enables fast transactions.",
            sources=[{"text": "Product X enables fast payment transactions."}],
            confidence=0.8,
            latency_ms=150,
        )
        
        assert result.query == "What is product X?"
        assert 0.0 <= result.overall <= 1.0
        assert 0.0 <= result.relevance <= 1.0
        assert 0.0 <= result.groundedness <= 1.0
        assert result.latency_ms == 150

    def test_evaluate_empty_answer(self):
        """Should handle empty answer."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        
        result = evaluator.evaluate(
            query="What is X?",
            answer="",
            sources=[],
            confidence=0.0,
            latency_ms=50,
        )
        
        assert result.overall < 0.5  # Low score for empty answer

    def test_evaluate_no_sources(self):
        """Should penalize answers without sources."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        
        result = evaluator.evaluate(
            query="What is X?",
            answer="X is a great product.",
            sources=[],
            confidence=0.5,
            latency_ms=100,
        )
        
        assert result.groundedness < 0.5  # Low groundedness without sources

    def test_evaluate_well_grounded(self):
        """Should reward well-grounded answers."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        
        result = evaluator.evaluate(
            query="What features does product X have?",
            answer="Product X has payment processing, fraud detection, and analytics features.",
            sources=[
                {"text": "Product X includes payment processing capabilities."},
                {"text": "Product X provides fraud detection and analytics."},
            ],
            confidence=0.9,
            latency_ms=200,
        )
        
        assert result.groundedness > 0.5

    def test_evaluate_identifies_no_info_response(self):
        """Should identify 'no information' type responses."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        
        result = evaluator.evaluate(
            query="What is X?",
            answer="I don't have information about that.",
            sources=[],
            confidence=0.1,
            latency_ms=50,
        )
        
        assert result.completeness < 0.3  # Very low completeness

    def test_quality_label_excellent(self):
        """Should label high scores as excellent."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        label = evaluator._get_quality_label(0.9)
        assert label == "Excellent"

    def test_quality_label_poor(self):
        """Should label low scores as poor."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        label = evaluator._get_quality_label(0.2)
        assert label == "Poor"


class TestEvaluationResult:
    """Tests for EvaluationResult dataclass."""

    def test_to_dict(self):
        """Should convert to dictionary."""
        from ai_insights.evaluation.evaluator import EvaluationResult, EvaluationSource

        result = EvaluationResult(
            query_id="test123",
            query="test query",
            timestamp=datetime.utcnow(),
            relevance=0.8,
            groundedness=0.7,
            completeness=0.9,
            coherence=0.85,
            overall=0.81,
            source=EvaluationSource.AUTOMATIC,
            source_count=2,
            confidence=0.8,
            latency_ms=150,
            explanation="Test explanation",
        )
        
        d = result.to_dict()
        assert d["query_id"] == "test123"
        assert d["relevance"] == 0.8
        assert d["source"] == "automatic"


class TestEvaluatorStatistics:
    """Tests for evaluation statistics."""

    def test_get_statistics_empty(self):
        """Should handle empty history."""
        from ai_insights.evaluation.evaluator import AnswerEvaluator

        evaluator = AnswerEvaluator()
        evaluator.history = []
        
        stats = evaluator.get_statistics(days=7)
        assert stats["total"] == 0

    def test_get_statistics_with_data(self):
        """Should calculate statistics correctly."""
        from ai_insights.evaluation.evaluator import (
            AnswerEvaluator, 
            EvaluationResult, 
            EvaluationSource
        )

        evaluator = AnswerEvaluator()
        
        # Add some mock results
        for i in range(5):
            evaluator.history.append(
                EvaluationResult(
                    query_id=f"q{i}",
                    query=f"query {i}",
                    timestamp=datetime.utcnow(),
                    relevance=0.8,
                    groundedness=0.7,
                    completeness=0.9,
                    coherence=0.85,
                    overall=0.81,
                    source=EvaluationSource.AUTOMATIC,
                    source_count=2,
                    confidence=0.8,
                    latency_ms=150,
                    explanation="Test",
                )
            )
        
        stats = evaluator.get_statistics(days=7)
        assert stats["total_evaluations"] == 5
        assert "averages" in stats
        assert stats["averages"]["overall"] == 0.81


class TestEvaluationMetrics:
    """Tests for Prometheus metrics."""

    def test_metrics_initialization(self):
        """Should initialize without error."""
        from ai_insights.evaluation.metrics import get_evaluation_metrics

        metrics = get_evaluation_metrics()
        # Should not raise
        assert metrics is not None

    def test_record_evaluation(self):
        """Should record evaluation metrics."""
        from ai_insights.evaluation.metrics import get_evaluation_metrics

        metrics = get_evaluation_metrics()
        
        # Should not raise even if Prometheus unavailable
        metrics.record_evaluation(
            overall=0.8,
            relevance=0.85,
            groundedness=0.75,
            completeness=0.9,
            coherence=0.8,
            latency_ms=150,
            intent="factual",
        )

    def test_record_feedback(self):
        """Should record feedback metrics."""
        from ai_insights.evaluation.metrics import get_evaluation_metrics

        metrics = get_evaluation_metrics()
        
        metrics.record_feedback(positive=True)
        metrics.record_feedback(positive=False)
        # Should not raise


class TestGetEvaluator:
    """Tests for get_evaluator singleton function."""

    def test_get_evaluator_returns_instance(self):
        """Should return evaluator instance."""
        from ai_insights.evaluation import get_evaluator

        evaluator = get_evaluator()
        assert evaluator is not None

    def test_get_evaluator_singleton(self):
        """Should return same instance on multiple calls."""
        from ai_insights.evaluation import evaluator as evaluator_module
        
        # Reset singleton
        evaluator_module._evaluator = None
        
        e1 = evaluator_module.get_evaluator()
        e2 = evaluator_module.get_evaluator()
        
        assert e1 is e2
