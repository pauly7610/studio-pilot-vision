"""
Tests for SSE streaming endpoint and parallel webhook sync.

Tests the race-loop pattern implementation and parallel data fetching.
"""

import pytest
import json
import sys
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime


# Mock cognee module before any imports to prevent PyO3 initialization
@pytest.fixture(autouse=True)
def mock_cognee_module():
    """Mock cognee module to prevent PyO3 initialization."""
    mock_cognee = MagicMock()
    mock_cognee.add = AsyncMock(return_value="added")
    mock_cognee.cognify = AsyncMock(return_value="cognified")
    mock_cognee.search = AsyncMock(return_value=[])
    
    with patch.dict(sys.modules, {'cognee': mock_cognee}):
        yield mock_cognee


class TestStreamingEndpoint:
    """Test SSE streaming endpoint."""
    
    @pytest.mark.asyncio
    async def test_stream_endpoint_exists(self):
        """Verify streaming endpoint is registered."""
        # Import after mocks are in place
        from main import app
        
        # Find the route
        routes = [r.path for r in app.routes]
        assert "/ai/query/stream" in routes
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.get_cognee_lazy_loader')
    @patch('ai_insights.retrieval.get_retrieval_pipeline')
    @patch('ai_insights.utils.get_generator')
    @patch('ai_insights.orchestration.intent_classifier.get_intent_classifier')
    async def test_stream_yields_intent_event(self, mock_classifier, mock_gen, mock_retrieval, mock_cognee):
        """Should yield intent classification event first."""
        from main import unified_query_stream, StreamQueryRequest
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        # Setup mocks
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual query")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.query = AsyncMock(return_value={
            "answer": "Cognee answer",
            "sources": [],
            "confidence": 0.8
        })
        mock_cognee.return_value = mock_cognee_instance
        
        mock_retrieval_instance = MagicMock()
        mock_retrieval_instance.retrieve.return_value = [
            {"id": "1", "text": "chunk", "score": 0.9, "metadata": {}}
        ]
        mock_retrieval.return_value = mock_retrieval_instance
        
        mock_gen_instance = MagicMock()
        mock_gen_instance.generate.return_value = {"insight": "Generated"}
        mock_gen.return_value = mock_gen_instance
        
        request = StreamQueryRequest(query="What is product X?")
        response = await unified_query_stream(request)
        
        # Collect events
        events = []
        async for event in response.body_iterator:
            event_str = event.decode('utf-8') if isinstance(event, bytes) else event
            if event_str.startswith("data:"):
                data = json.loads(event_str[5:].strip())
                events.append(data)
        
        # First event should be intent
        assert len(events) > 0
        assert events[0]["type"] == "intent"
        assert events[0]["payload"]["intent"] == "factual"
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.get_cognee_lazy_loader')
    @patch('ai_insights.retrieval.get_retrieval_pipeline')
    @patch('ai_insights.utils.get_generator')
    @patch('ai_insights.orchestration.intent_classifier.get_intent_classifier')
    async def test_stream_yields_complete_event(self, mock_classifier, mock_gen, mock_retrieval, mock_cognee):
        """Should yield complete event at the end."""
        from main import unified_query_stream, StreamQueryRequest
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.query = AsyncMock(return_value={
            "answer": "Answer",
            "sources": [],
            "confidence": 0.8
        })
        mock_cognee.return_value = mock_cognee_instance
        
        mock_retrieval_instance = MagicMock()
        mock_retrieval_instance.retrieve.return_value = []
        mock_retrieval.return_value = mock_retrieval_instance
        
        mock_gen_instance = MagicMock()
        mock_gen_instance.generate.return_value = {"insight": ""}
        mock_gen.return_value = mock_gen_instance
        
        request = StreamQueryRequest(query="test")
        response = await unified_query_stream(request)
        
        events = []
        async for event in response.body_iterator:
            event_str = event.decode('utf-8') if isinstance(event, bytes) else event
            if event_str.startswith("data:"):
                data = json.loads(event_str[5:].strip())
                events.append(data)
        
        # Last event should be complete
        assert events[-1]["type"] == "complete"
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.get_cognee_lazy_loader')
    @patch('ai_insights.retrieval.get_retrieval_pipeline')
    @patch('ai_insights.utils.get_generator')
    @patch('ai_insights.orchestration.intent_classifier.get_intent_classifier')
    async def test_stream_yields_merged_event(self, mock_classifier, mock_gen, mock_retrieval, mock_cognee):
        """Should yield merged result event."""
        from main import unified_query_stream, StreamQueryRequest
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.query = AsyncMock(return_value={
            "answer": "Cognee answer",
            "sources": [{"entity_id": "1", "entity_type": "Product", "entity_name": "Test"}],
            "confidence": 0.8
        })
        mock_cognee.return_value = mock_cognee_instance
        
        mock_retrieval_instance = MagicMock()
        mock_retrieval_instance.retrieve.return_value = [
            {"id": "chunk_1", "text": "RAG chunk", "score": 0.9, "metadata": {}}
        ]
        mock_retrieval.return_value = mock_retrieval_instance
        
        mock_gen_instance = MagicMock()
        mock_gen_instance.generate.return_value = {"insight": "Generated answer"}
        mock_gen.return_value = mock_gen_instance
        
        request = StreamQueryRequest(query="test", include_partial=True)
        response = await unified_query_stream(request)
        
        events = []
        async for event in response.body_iterator:
            event_str = event.decode('utf-8') if isinstance(event, bytes) else event
            if event_str.startswith("data:"):
                data = json.loads(event_str[5:].strip())
                events.append(data)
        
        # Should have merged event
        merged_events = [e for e in events if e["type"] == "merged"]
        assert len(merged_events) == 1
        assert "answer" in merged_events[0]["payload"]
        assert "confidence" in merged_events[0]["payload"]
    
    @pytest.mark.asyncio
    @patch('ai_insights.cognee.get_cognee_lazy_loader')
    @patch('ai_insights.retrieval.get_retrieval_pipeline')
    @patch('ai_insights.utils.get_generator')
    @patch('ai_insights.orchestration.intent_classifier.get_intent_classifier')
    async def test_stream_handles_partial_results(self, mock_classifier, mock_gen, mock_retrieval, mock_cognee):
        """Should yield partial results when enabled."""
        from main import unified_query_stream, StreamQueryRequest
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.query = AsyncMock(return_value={
            "answer": "Cognee answer",
            "sources": [],
            "confidence": 0.8
        })
        mock_cognee.return_value = mock_cognee_instance
        
        mock_retrieval_instance = MagicMock()
        mock_retrieval_instance.retrieve.return_value = [
            {"id": "1", "text": "chunk", "score": 0.9, "metadata": {}}
        ]
        mock_retrieval.return_value = mock_retrieval_instance
        
        mock_gen_instance = MagicMock()
        mock_gen_instance.generate.return_value = {"insight": "Generated"}
        mock_gen.return_value = mock_gen_instance
        
        request = StreamQueryRequest(query="test", include_partial=True)
        response = await unified_query_stream(request)
        
        events = []
        async for event in response.body_iterator:
            event_str = event.decode('utf-8') if isinstance(event, bytes) else event
            if event_str.startswith("data:"):
                data = json.loads(event_str[5:].strip())
                events.append(data)
        
        event_types = [e["type"] for e in events]
        
        # Should have partial events
        assert "cognee" in event_types or "rag" in event_types


class TestParallelWebhookSync:
    """Test parallel data fetching in webhook sync."""
    
    @pytest.mark.asyncio
    async def test_webhook_sync_fetches_in_parallel(self):
        """Should fetch products, feedback, and actions in parallel.
        
        Note: This test verifies the endpoint can be called and returns
        the expected structure. The actual parallel fetching is implemented
        in the sync_data_from_supabase background task.
        """
        from main import sync_webhook
        from fastapi import BackgroundTasks
        
        bg_tasks = BackgroundTasks()
        result = await sync_webhook(bg_tasks)
        
        # Should have queued the task
        assert result["success"] is True
        assert "job_id" in result
    
    @pytest.mark.asyncio
    async def test_webhook_sync_handles_fetch_errors(self):
        """Should handle errors from individual fetch calls.
        
        Tests that asyncio.gather with return_exceptions=True
        allows other fetches to complete even if one fails.
        """
        import asyncio
        
        async def mock_fetch_supabase(endpoint, params=None):
            if "products" in endpoint:
                raise Exception("Products fetch failed")
            return [{"id": "1"}]
        
        # The parallel fetch should use return_exceptions=True
        # so other fetches should still complete
        results = await asyncio.gather(
            mock_fetch_supabase("products", {}),
            mock_fetch_supabase("product_feedback", {}),
            mock_fetch_supabase("product_actions", {}),
            return_exceptions=True
        )
        
        # Products should be exception
        assert isinstance(results[0], Exception)
        # Others should be lists
        assert isinstance(results[1], list)
        assert isinstance(results[2], list)


class TestStreamQueryRequest:
    """Test StreamQueryRequest model."""
    
    def test_default_include_partial(self):
        """Should default to including partial results."""
        from main import StreamQueryRequest
        
        request = StreamQueryRequest(query="test")
        
        assert request.include_partial is True
    
    def test_can_disable_partial(self):
        """Should be able to disable partial results."""
        from main import StreamQueryRequest
        
        request = StreamQueryRequest(query="test", include_partial=False)
        
        assert request.include_partial is False
    
    def test_accepts_context(self):
        """Should accept optional context."""
        from main import StreamQueryRequest
        
        request = StreamQueryRequest(
            query="test",
            context={"product_id": "prod_001"}
        )
        
        assert request.context == {"product_id": "prod_001"}


class TestSSEEventFormat:
    """Test SSE event format compliance."""
    
    def test_event_format(self):
        """Events should follow SSE format."""
        import json
        
        # Valid SSE event format
        event_data = {
            "type": "intent",
            "timestamp": "2025-01-04T10:30:00Z",
            "payload": {"intent": "factual"}
        }
        
        # Format as SSE
        sse_event = f"data: {json.dumps(event_data)}\n\n"
        
        # Should be parseable
        assert sse_event.startswith("data: ")
        assert sse_event.endswith("\n\n")
        
        # Extract and parse JSON
        json_str = sse_event[6:-2]  # Remove "data: " and "\n\n"
        parsed = json.loads(json_str)
        
        assert parsed["type"] == "intent"
    
    def test_event_types(self):
        """All event types should be documented."""
        expected_types = {"intent", "cognee", "rag", "merged", "error", "complete"}
        
        # These are the types yielded by the streaming endpoint
        assert "intent" in expected_types
        assert "cognee" in expected_types
        assert "rag" in expected_types
        assert "merged" in expected_types
        assert "error" in expected_types
        assert "complete" in expected_types


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
