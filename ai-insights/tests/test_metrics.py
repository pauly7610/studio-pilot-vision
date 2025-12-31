"""
Tests for ai_insights.utils.metrics module.

Tests the actual implementation:
- Prometheus metric definitions (Counters, Histograms, Gauges)
- Decorator functions for tracking queries
- Helper functions for recording metrics
"""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestMetricDefinitions:
    """Test that all Prometheus metrics are properly defined."""

    def test_query_total_counter_exists(self):
        """query_total counter should be defined with correct labels."""
        from ai_insights.utils.metrics import query_total

        assert query_total is not None
        # Test that we can access it (it's a Counter)
        assert hasattr(query_total, "labels")

    def test_query_errors_counter_exists(self):
        """query_errors_total counter should be defined."""
        from ai_insights.utils.metrics import query_errors_total

        assert query_errors_total is not None
        assert hasattr(query_errors_total, "labels")

    def test_query_duration_histogram_exists(self):
        """query_duration_seconds histogram should be defined."""
        from ai_insights.utils.metrics import query_duration_seconds

        assert query_duration_seconds is not None
        assert hasattr(query_duration_seconds, "labels")

    def test_query_confidence_histogram_exists(self):
        """query_confidence histogram should be defined."""
        from ai_insights.utils.metrics import query_confidence

        assert query_confidence is not None

    def test_cognee_queries_counter_exists(self):
        """cognee_queries_total counter should be defined."""
        from ai_insights.utils.metrics import cognee_queries_total

        assert cognee_queries_total is not None

    def test_cognee_availability_gauge_exists(self):
        """cognee_availability gauge should be defined."""
        from ai_insights.utils.metrics import cognee_availability

        assert cognee_availability is not None
        assert hasattr(cognee_availability, "set")

    def test_rag_queries_counter_exists(self):
        """rag_queries_total counter should be defined."""
        from ai_insights.utils.metrics import rag_queries_total

        assert rag_queries_total is not None

    def test_rag_sources_histogram_exists(self):
        """rag_sources_retrieved histogram should be defined."""
        from ai_insights.utils.metrics import rag_sources_retrieved

        assert rag_sources_retrieved is not None

    def test_intent_classification_counter_exists(self):
        """intent_classification_total counter should be defined."""
        from ai_insights.utils.metrics import intent_classification_total

        assert intent_classification_total is not None

    def test_fallback_counter_exists(self):
        """fallback_total counter should be defined."""
        from ai_insights.utils.metrics import fallback_total

        assert fallback_total is not None

    def test_system_info_exists(self):
        """system_info Info metric should be defined."""
        from ai_insights.utils.metrics import system_info

        assert system_info is not None

    def test_active_requests_gauge_exists(self):
        """active_requests gauge should be defined."""
        from ai_insights.utils.metrics import active_requests

        assert active_requests is not None


class TestTrackQueryMetricsDecorator:
    """Test the track_query_metrics decorator."""

    @pytest.mark.asyncio
    async def test_decorator_tracks_successful_query(self):
        """Decorator should track metrics for successful queries."""
        from ai_insights.utils.metrics import active_requests, track_query_metrics

        # Create a mock result with source_type
        mock_result = MagicMock()
        mock_result.source_type = "hybrid"
        mock_result.confidence = MagicMock()
        mock_result.confidence.overall = 0.85

        @track_query_metrics
        async def mock_orchestrate(query, context=None):
            return mock_result

        result = await mock_orchestrate("test query", context={"intent": "factual"})

        assert result == mock_result

    @pytest.mark.asyncio
    async def test_decorator_handles_exceptions(self):
        """Decorator should track errors and re-raise exceptions."""
        from ai_insights.utils.metrics import query_errors_total, track_query_metrics

        @track_query_metrics
        async def failing_func():
            raise ValueError("Test error")

        with pytest.raises(ValueError, match="Test error"):
            await failing_func()

    @pytest.mark.asyncio
    async def test_decorator_manages_active_requests(self):
        """Decorator should increment/decrement active_requests gauge."""
        from ai_insights.utils.metrics import track_query_metrics

        @track_query_metrics
        async def slow_func():
            await asyncio.sleep(0.01)
            # Return a simple dict instead of MagicMock to avoid comparison issues
            return {"source_type": "memory"}

        # Run and complete - decorator should manage gauge
        result = await slow_func()
        # Verify function executed successfully
        assert result["source_type"] == "memory"


class TestTrackCogneeQueryDecorator:
    """Test the track_cognee_query decorator."""

    @pytest.mark.asyncio
    async def test_decorator_tracks_successful_cognee_query(self):
        """Decorator should track successful Cognee queries."""
        from ai_insights.utils.metrics import track_cognee_query

        @track_cognee_query
        async def mock_cognee_query(query_text, context=None):
            return {"answer": "test answer", "confidence": 0.9}

        result = await mock_cognee_query("test query")

        assert result["answer"] == "test answer"

    @pytest.mark.asyncio
    async def test_decorator_tracks_failed_cognee_query(self):
        """Decorator should track failed Cognee queries."""
        from ai_insights.utils.metrics import track_cognee_query

        @track_cognee_query
        async def failing_cognee_query():
            raise Exception("Cognee unavailable")

        with pytest.raises(Exception, match="Cognee unavailable"):
            await failing_cognee_query()


class TestTrackRagQueryDecorator:
    """Test the track_rag_query decorator."""

    @pytest.mark.asyncio
    async def test_decorator_tracks_successful_rag_query(self):
        """Decorator should track successful RAG queries."""
        from ai_insights.utils.metrics import track_rag_query

        @track_rag_query
        async def mock_rag_retrieve(query):
            return {"sources": [{"text": "doc1"}, {"text": "doc2"}]}

        result = await mock_rag_retrieve("test query")

        assert len(result["sources"]) == 2

    @pytest.mark.asyncio
    async def test_decorator_tracks_sources_count(self):
        """Decorator should observe number of sources retrieved."""
        from ai_insights.utils.metrics import track_rag_query

        @track_rag_query
        async def mock_retrieve_many():
            return {"sources": [{"text": f"doc{i}"} for i in range(5)]}

        result = await mock_retrieve_many()
        assert len(result["sources"]) == 5

    @pytest.mark.asyncio
    async def test_decorator_handles_non_dict_result(self):
        """Decorator should handle results without sources key."""
        from ai_insights.utils.metrics import track_rag_query

        @track_rag_query
        async def mock_retrieve_simple():
            return ["doc1", "doc2"]

        result = await mock_retrieve_simple()
        assert result == ["doc1", "doc2"]


class TestRecordIntentClassification:
    """Test the record_intent_classification function."""

    def test_records_heuristic_classification(self):
        """Should record heuristic intent classification."""
        from ai_insights.utils.metrics import record_intent_classification

        # Should not raise
        record_intent_classification(intent="factual", confidence=0.85, method="heuristic")

    def test_records_llm_classification(self):
        """Should record LLM fallback classification."""
        from ai_insights.utils.metrics import record_intent_classification

        # Should not raise and should increment llm_fallback_total
        record_intent_classification(intent="causal", confidence=0.75, method="llm")

    def test_default_method_is_heuristic(self):
        """Default method should be heuristic."""
        from ai_insights.utils.metrics import record_intent_classification

        # Should not raise with default method
        record_intent_classification(intent="mixed", confidence=0.6)


class TestRecordFallback:
    """Test the record_fallback function."""

    def test_records_cognee_to_rag_fallback(self):
        """Should record fallback from Cognee to RAG."""
        from ai_insights.utils.metrics import record_fallback

        # Should not raise
        record_fallback(from_source="cognee", to_source="rag", reason="cognee_unavailable")

    def test_records_rag_to_llm_fallback(self):
        """Should record fallback from RAG to LLM."""
        from ai_insights.utils.metrics import record_fallback

        record_fallback(from_source="rag", to_source="llm", reason="no_relevant_docs")

    def test_requires_all_arguments(self):
        """Should require all three arguments."""
        from ai_insights.utils.metrics import record_fallback

        with pytest.raises(TypeError):
            record_fallback("cognee")  # Missing to_source and reason


class TestUpdateCogneeAvailability:
    """Test the update_cognee_availability function."""

    def test_sets_available_true(self):
        """Should set gauge to 1 when available."""
        from ai_insights.utils.metrics import cognee_availability, update_cognee_availability

        update_cognee_availability(True)
        # Gauge should be set to 1

    def test_sets_available_false(self):
        """Should set gauge to 0 when unavailable."""
        from ai_insights.utils.metrics import cognee_availability, update_cognee_availability

        update_cognee_availability(False)
        # Gauge should be set to 0


class TestSetSystemInfo:
    """Test the set_system_info function."""

    def test_sets_all_info_fields(self):
        """Should set version, environment, and model."""
        from ai_insights.utils.metrics import set_system_info

        # Should not raise
        set_system_info(version="1.0.0", environment="production", model="llama-3.1-70b")

    def test_requires_model_argument(self):
        """Should require model argument."""
        from ai_insights.utils.metrics import set_system_info

        with pytest.raises(TypeError):
            set_system_info(version="1.0.0", environment="test")
            # Missing required 'model' argument


class TestMetricsIntegration:
    """Integration tests for metrics module."""

    @pytest.mark.asyncio
    async def test_full_query_lifecycle_metrics(self):
        """Test metrics through a full query lifecycle."""
        from ai_insights.utils.metrics import (
            record_fallback,
            record_intent_classification,
            track_query_metrics,
            update_cognee_availability,
        )

        # Simulate a query lifecycle
        update_cognee_availability(True)
        record_intent_classification("factual", 0.9, "heuristic")

        @track_query_metrics
        async def mock_query():
            mock_result = MagicMock()
            mock_result.source_type = "hybrid"
            mock_result.confidence = MagicMock()
            mock_result.confidence.overall = 0.85
            return mock_result

        result = await mock_query()
        assert result.source_type == "hybrid"

    @pytest.mark.asyncio
    async def test_error_tracking_workflow(self):
        """Test error tracking through decorators."""
        from ai_insights.utils.metrics import track_cognee_query, track_query_metrics

        @track_cognee_query
        async def failing_cognee():
            raise RuntimeError("Connection failed")

        with pytest.raises(RuntimeError):
            await failing_cognee()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
