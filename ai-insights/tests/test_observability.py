"""
Tests for ai_insights.observability module.

Tests the OpenTelemetry tracing functionality.
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock


class TestNoOpTracer:
    """Tests for NoOpTracer fallback."""

    def test_noop_tracer_context_manager(self):
        """Should work as context manager."""
        from ai_insights.observability.tracing import NoOpTracer

        tracer = NoOpTracer()
        
        with tracer.start_as_current_span("test") as span:
            span.set_attribute("key", "value")
            span.add_event("event")
        
        # Should not raise

    def test_noop_tracer_start_span(self):
        """Should return NoOpSpan."""
        from ai_insights.observability.tracing import NoOpTracer, NoOpSpan

        tracer = NoOpTracer()
        span = tracer.start_span("test")
        
        assert isinstance(span, NoOpSpan)


class TestNoOpSpan:
    """Tests for NoOpSpan fallback."""

    def test_noop_span_all_methods(self):
        """All methods should be no-ops."""
        from ai_insights.observability.tracing import NoOpSpan

        span = NoOpSpan()
        
        # All these should not raise
        span.set_attribute("key", "value")
        span.set_attributes({"k1": "v1", "k2": "v2"})
        span.add_event("event", {"attr": "value"})
        span.record_exception(Exception("test"))
        span.set_status(None)
        span.end()

    def test_noop_span_context_manager(self):
        """Should work as context manager."""
        from ai_insights.observability.tracing import NoOpSpan

        span = NoOpSpan()
        
        with span:
            pass  # Should not raise


class TestGetTracer:
    """Tests for get_tracer function."""

    def test_get_tracer_returns_tracer(self):
        """Should return a tracer instance."""
        from ai_insights.observability.tracing import get_tracer

        tracer = get_tracer()
        assert tracer is not None

    def test_get_tracer_has_start_as_current_span(self):
        """Tracer should have start_as_current_span method."""
        from ai_insights.observability.tracing import get_tracer

        tracer = get_tracer()
        assert hasattr(tracer, "start_as_current_span")


class TestTraceSyncDecorator:
    """Tests for trace_sync decorator."""

    def test_trace_sync_decorator_works(self):
        """Should decorate sync functions."""
        from ai_insights.observability.tracing import trace_sync

        @trace_sync("test_operation")
        def my_function(x, y):
            return x + y
        
        result = my_function(1, 2)
        assert result == 3

    def test_trace_sync_preserves_function_name(self):
        """Should preserve function metadata."""
        from ai_insights.observability.tracing import trace_sync

        @trace_sync()
        def my_function():
            pass
        
        assert my_function.__name__ == "my_function"

    def test_trace_sync_with_exception(self):
        """Should propagate exceptions."""
        from ai_insights.observability.tracing import trace_sync

        @trace_sync()
        def failing_function():
            raise ValueError("test error")
        
        with pytest.raises(ValueError, match="test error"):
            failing_function()


class TestTraceAsyncDecorator:
    """Tests for trace_async decorator."""

    @pytest.mark.asyncio
    async def test_trace_async_decorator_works(self):
        """Should decorate async functions."""
        from ai_insights.observability.tracing import trace_async

        @trace_async("test_operation")
        async def my_async_function(x, y):
            return x + y
        
        result = await my_async_function(1, 2)
        assert result == 3

    @pytest.mark.asyncio
    async def test_trace_async_preserves_function_name(self):
        """Should preserve function metadata."""
        from ai_insights.observability.tracing import trace_async

        @trace_async()
        async def my_async_function():
            pass
        
        assert my_async_function.__name__ == "my_async_function"

    @pytest.mark.asyncio
    async def test_trace_async_with_exception(self):
        """Should propagate exceptions."""
        from ai_insights.observability.tracing import trace_async

        @trace_async()
        async def failing_async_function():
            raise ValueError("async error")
        
        with pytest.raises(ValueError, match="async error"):
            await failing_async_function()


class TestAddSpanAttributes:
    """Tests for add_span_attributes helper."""

    def test_add_span_attributes_no_error(self):
        """Should not raise even without active span."""
        from ai_insights.observability.tracing import add_span_attributes

        # Should not raise
        add_span_attributes({
            "key1": "value1",
            "key2": 123,
            "key3": {"nested": "dict"},
        })


class TestRecordException:
    """Tests for record_exception helper."""

    def test_record_exception_no_error(self):
        """Should not raise even without active span."""
        from ai_insights.observability.tracing import record_exception

        # Should not raise
        record_exception(
            ValueError("test"),
            attributes={"context": "test"}
        )


class TestAISpanHelpers:
    """Tests for AI-specific span helpers."""

    def test_create_ai_span(self):
        """Should create AI span with attributes as context manager."""
        from ai_insights.observability.tracing import create_ai_span

        # Should work as context manager
        with create_ai_span(
            operation="orchestrate",
            query="What is X?",
            model="llama-3.3-70b",
        ) as span:
            # Should return a span-like object
            assert span is not None
            # Should be able to set attributes
            span.set_attribute("custom", "value")

    def test_end_ai_span(self):
        """Should end AI span with result attributes."""
        from ai_insights.observability.tracing import (
            create_ai_span, 
            end_ai_span,
            NoOpSpan
        )

        span = NoOpSpan()
        
        # Should not raise
        end_ai_span(
            span,
            success=True,
            confidence=0.85,
            latency_ms=150,
            source_type="hybrid",
        )

    def test_end_ai_span_with_error(self):
        """Should handle error case."""
        from ai_insights.observability.tracing import end_ai_span, NoOpSpan

        span = NoOpSpan()
        
        # Should not raise
        end_ai_span(
            span,
            success=False,
            error="Test error message",
        )


class TestInitTracing:
    """Tests for init_tracing function."""

    def test_init_tracing_returns_bool(self):
        """Should return True/False based on success."""
        from ai_insights.observability.tracing import init_tracing

        # Reset state
        import ai_insights.observability.tracing as tracing_module
        tracing_module._initialized = False
        tracing_module._tracer = None
        tracing_module._provider = None
        
        result = init_tracing()
        # Should return bool (True if OpenTelemetry available, False otherwise)
        assert isinstance(result, bool)

    def test_init_tracing_idempotent(self):
        """Should be idempotent (safe to call multiple times)."""
        from ai_insights.observability.tracing import init_tracing

        result1 = init_tracing()
        result2 = init_tracing()
        
        assert result1 == result2  # Same result both times
