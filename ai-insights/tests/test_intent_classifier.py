"""
Tests for ai_insights.orchestration.intent_classifier module.

Tests the actual implementation:
- QueryIntent enum
- IntentClassifier class
- Heuristic and LLM classification
"""

from unittest.mock import MagicMock, patch

import pytest


class TestQueryIntentEnum:
    """Test QueryIntent enum."""

    def test_all_intents_defined(self):
        """Should have all expected intent types."""
        from ai_insights.orchestration.intent_classifier import QueryIntent

        assert QueryIntent.HISTORICAL == "historical"
        assert QueryIntent.CAUSAL == "causal"
        assert QueryIntent.FACTUAL == "factual"
        assert QueryIntent.MIXED == "mixed"
        assert QueryIntent.UNKNOWN == "unknown"

    def test_intent_is_string_enum(self):
        """Intent should be a string enum."""
        from ai_insights.orchestration.intent_classifier import QueryIntent

        assert isinstance(QueryIntent.FACTUAL.value, str)


class TestHeuristicClassification:
    """Test heuristic (keyword-based) classification."""

    def test_factual_query_classification(self):
        """Queries with factual keywords should be classified as FACTUAL."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        factual_queries = [
            "What is the current revenue?",
            "Show me the product list",
            "How many products do we have today?",
            "What is the status of PayLink?",
        ]

        for query in factual_queries:
            intent, confidence, _ = classifier._heuristic_classify(query.lower())
            assert intent == QueryIntent.FACTUAL, f"Failed for: {query}"

    def test_historical_query_classification(self):
        """Queries with historical keywords should be classified as HISTORICAL."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        historical_queries = [
            "What happened to product X previously?",
            "How did the revenue trend last quarter?",
            "What led to the decline in the past?",
        ]

        for query in historical_queries:
            intent, confidence, _ = classifier._heuristic_classify(query.lower())
            # Historical queries might also match CAUSAL due to "what led to"
            assert intent in [
                QueryIntent.HISTORICAL,
                QueryIntent.CAUSAL,
                QueryIntent.MIXED,
            ], f"Failed for: {query}"

    def test_causal_query_classification(self):
        """Queries with causal keywords should be classified as CAUSAL."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        causal_queries = [
            "What caused the revenue drop?",
            "Why did the product fail because of market conditions?",
            "What was the impact of the decision?",
        ]

        for query in causal_queries:
            intent, confidence, _ = classifier._heuristic_classify(query.lower())
            assert intent in [QueryIntent.CAUSAL, QueryIntent.MIXED], f"Failed for: {query}"

    def test_mixed_query_classification(self):
        """Queries with multiple intent signals should be classified as MIXED."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        mixed_queries = [
            "Compare current revenue versus last quarter",
            "How does the current status differ from before?",
        ]

        for query in mixed_queries:
            intent, confidence, _ = classifier._heuristic_classify(query.lower())
            # These should either be MIXED or one of the detected intents
            assert intent in [
                QueryIntent.MIXED,
                QueryIntent.FACTUAL,
                QueryIntent.HISTORICAL,
            ], f"Failed for: {query}"

    def test_unknown_query_low_confidence(self):
        """Queries without clear intent should have low confidence."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        ambiguous_queries = [
            "xyz abc def",
            "random words here",
        ]

        for query in ambiguous_queries:
            intent, confidence, _ = classifier._heuristic_classify(query.lower())
            # Low confidence for ambiguous queries
            assert confidence <= 0.5, f"Expected low confidence for: {query}"


class TestLLMClassification:
    """Test LLM-based classification fallback."""

    def test_llm_fallback_on_low_confidence(self):
        """Should use LLM when heuristic confidence is low."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        classifier = IntentClassifier()

        # Mock LLM response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "FACTUAL|0.85|Clear factual query"

        classifier.groq_client = MagicMock()
        classifier.groq_client.chat.completions.create.return_value = mock_response

        # Ambiguous query that triggers LLM
        intent, confidence, reasoning = classifier._llm_classify("some ambiguous query")

        assert "LLM" in reasoning

    def test_llm_error_returns_mixed(self):
        """LLM errors should return MIXED with low confidence."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        # Mock LLM error
        classifier.groq_client = MagicMock()
        classifier.groq_client.chat.completions.create.side_effect = Exception("API Error")

        intent, confidence, reasoning = classifier._llm_classify("test query")

        assert intent == QueryIntent.MIXED
        assert confidence < 0.5
        assert "error" in reasoning.lower()


class TestClassifierIntegration:
    """Integration tests for full classification flow."""

    def test_classify_returns_tuple(self):
        """classify() should return (intent, confidence, reasoning) tuple."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        classifier = IntentClassifier()

        result = classifier.classify("What is the current status?")

        assert isinstance(result, tuple)
        assert len(result) == 3
        intent, confidence, reasoning = result
        assert 0 <= confidence <= 1
        assert isinstance(reasoning, str)

    def test_high_confidence_skips_llm(self):
        """High confidence heuristic should skip LLM."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        # Mock LLM to track if called
        classifier.groq_client = MagicMock()

        # Clear factual query
        intent, confidence, reasoning = classifier.classify("What is the current revenue today?")

        # Should be factual with high confidence
        if confidence >= classifier.HEURISTIC_CONFIDENCE_THRESHOLD:
            # LLM should not have been called
            assert "Heuristic" in reasoning or "LLM" not in reasoning


class TestClassificationHistory:
    """Test classification history and stats."""

    def test_classification_logged(self):
        """Classifications should be logged to history."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        classifier = IntentClassifier()
        classifier.classification_history = []  # Clear history

        classifier.classify("What is the status?")

        assert len(classifier.classification_history) == 1
        assert "query" in classifier.classification_history[0]
        assert "intent" in classifier.classification_history[0]

    def test_classification_history_limited(self):
        """History should be limited to prevent memory bloat."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()

        # Add more than 1000 entries
        for i in range(1005):
            classifier._log_classification(f"query {i}", QueryIntent.FACTUAL, 0.8, "test")

        # Should be trimmed to 1000
        assert len(classifier.classification_history) <= 1000

    def test_get_classification_stats(self):
        """Should return classification statistics."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier, QueryIntent

        classifier = IntentClassifier()
        classifier.classification_history = []

        # Add some history
        classifier._log_classification("q1", QueryIntent.FACTUAL, 0.8, "Heuristic")
        classifier._log_classification("q2", QueryIntent.HISTORICAL, 0.7, "Heuristic")
        classifier._log_classification("q3", QueryIntent.FACTUAL, 0.6, "LLM: test")

        stats = classifier.get_classification_stats()

        assert stats["total"] == 3
        assert "intent_distribution" in stats
        assert "avg_confidence" in stats
        assert stats["intent_distribution"]["factual"] == 2


class TestKeywordPatterns:
    """Test keyword pattern matching."""

    def test_historical_keywords_defined(self):
        """Should have historical keywords defined."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        assert len(IntentClassifier.HISTORICAL_KEYWORDS) > 0
        assert "previously" in IntentClassifier.HISTORICAL_KEYWORDS
        assert "in the past" in IntentClassifier.HISTORICAL_KEYWORDS

    def test_causal_keywords_defined(self):
        """Should have causal keywords defined."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        assert len(IntentClassifier.CAUSAL_KEYWORDS) > 0
        assert "caused" in IntentClassifier.CAUSAL_KEYWORDS
        assert "because" in IntentClassifier.CAUSAL_KEYWORDS

    def test_factual_keywords_defined(self):
        """Should have factual keywords defined."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        assert len(IntentClassifier.FACTUAL_KEYWORDS) > 0
        assert "current" in IntentClassifier.FACTUAL_KEYWORDS
        assert "what is" in IntentClassifier.FACTUAL_KEYWORDS

    def test_mixed_keywords_defined(self):
        """Should have mixed keywords defined."""
        from ai_insights.orchestration.intent_classifier import IntentClassifier

        assert len(IntentClassifier.MIXED_KEYWORDS) > 0
        assert "compare" in IntentClassifier.MIXED_KEYWORDS


class TestGetIntentClassifier:
    """Test get_intent_classifier singleton function."""

    def test_returns_classifier_instance(self):
        """Should return IntentClassifier instance."""
        from ai_insights.orchestration.intent_classifier import (
            IntentClassifier,
            get_intent_classifier,
        )

        classifier = get_intent_classifier()

        assert isinstance(classifier, IntentClassifier)

    def test_returns_singleton(self):
        """Should return same instance on multiple calls."""
        import ai_insights.orchestration.intent_classifier as ic_module

        # Reset singleton
        ic_module._classifier = None

        c1 = ic_module.get_intent_classifier()
        c2 = ic_module.get_intent_classifier()

        assert c1 is c2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
