"""
Test Suite for Intent Classifier
Tests heuristic and LLM-based classification.
"""

import pytest
from ai_insights.orchestration import IntentClassifier, QueryIntent


class TestHeuristicClassification:
    """Test keyword-based intent classification."""
    
    def test_factual_query_classification(self):
        """Factual queries should be classified correctly."""
        classifier = IntentClassifier()
        
        queries = [
            "What products are available?",
            "Show me current inventory",
            "List all items in stock",
            "What is the status of order #123?"
        ]
        
        for query in queries:
            intent, confidence, reasoning = classifier.classify(query)
            assert intent == QueryIntent.FACTUAL
            assert confidence > 0.5
    
    def test_historical_query_classification(self):
        """Historical queries should be classified correctly."""
        classifier = IntentClassifier()
        
        queries = [
            "Why did sales drop last month?",
            "What happened to product X?",
            "How did we perform in Q3?",
            "What was the trend in 2024?"
        ]
        
        for query in queries:
            intent, confidence, reasoning = classifier.classify(query)
            assert intent == QueryIntent.HISTORICAL
            assert confidence > 0.5
    
    def test_causal_query_classification(self):
        """Causal queries should be classified correctly."""
        classifier = IntentClassifier()
        
        queries = [
            "What caused the inventory shortage?",
            "Why did customers stop buying product Y?",
            "What led to the price increase?",
            "What's the relationship between marketing spend and sales?"
        ]
        
        for query in queries:
            intent, confidence, reasoning = classifier.classify(query)
            assert intent == QueryIntent.CAUSAL
            assert confidence > 0.5
    
    def test_mixed_query_classification(self):
        """Mixed queries should be classified as MIXED."""
        classifier = IntentClassifier()
        
        queries = [
            "Compare current sales to last year",
            "How does product A differ from product B?",
            "What's the difference between Q1 and Q2 performance?"
        ]
        
        for query in queries:
            intent, confidence, reasoning = classifier.classify(query)
            assert intent == QueryIntent.MIXED
    
    def test_unknown_query_low_confidence(self):
        """Queries with no keyword matches should have low confidence."""
        classifier = IntentClassifier()
        
        intent, confidence, reasoning = classifier.classify("xyz abc def")
        
        assert confidence < 0.5
        assert "No keyword matches" in reasoning or intent == QueryIntent.UNKNOWN


class TestConfidenceScoring:
    """Test confidence score calculation."""
    
    def test_multiple_keyword_matches_increase_confidence(self):
        """More keyword matches should increase confidence."""
        classifier = IntentClassifier()
        
        # Single keyword
        intent1, conf1, _ = classifier.classify("What is the current status?")
        
        # Multiple keywords
        intent2, conf2, _ = classifier.classify("What is the current status right now today?")
        
        # More matches should give higher confidence (or at least not lower)
        assert conf2 >= conf1
    
    def test_confidence_bounded_by_threshold(self):
        """Confidence should be bounded appropriately."""
        classifier = IntentClassifier()
        
        intent, confidence, _ = classifier.classify("What products are available now?")
        
        assert 0.0 <= confidence <= 1.0


class TestClassificationHistory:
    """Test classification logging and statistics."""
    
    def test_classification_logged(self):
        """Classifications should be logged to history."""
        classifier = IntentClassifier()
        
        initial_count = len(classifier.classification_history)
        
        classifier.classify("Test query")
        
        assert len(classifier.classification_history) == initial_count + 1
    
    def test_get_classification_stats(self):
        """Should return valid statistics."""
        classifier = IntentClassifier()
        
        # Perform some classifications
        classifier.classify("What products are available?")
        classifier.classify("Why did sales drop?")
        classifier.classify("What caused the issue?")
        
        stats = classifier.get_classification_stats()
        
        assert "total" in stats
        assert stats["total"] >= 3
        assert "intent_distribution" in stats
        assert "avg_confidence" in stats
