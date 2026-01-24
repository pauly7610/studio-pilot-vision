"""
OpenTelemetry Tracing Module
Distributed tracing for AI pipeline debugging and performance analysis.

WHY: Tracing enables:
1. Performance debugging (where is time spent?)
2. Error tracking (where do failures occur?)
3. Request flow visualization (how do requests flow through the system?)
4. Correlation (link logs/metrics to specific requests)

USAGE:
    from ai_insights.observability import trace_async, get_tracer
    
    tracer = get_tracer(__name__)
    
    @trace_async("my_function")
    async def my_function():
        ...
        
    # Or manual spans:
    with tracer.start_as_current_span("operation") as span:
        span.set_attribute("query.length", len(query))
        ...
"""

import functools
import os
from contextlib import contextmanager
from typing import Any, Callable, Optional, TypeVar

from ai_insights.config import get_logger


# Type variable for generic function signatures
F = TypeVar("F", bound=Callable[..., Any])

# Global state
_tracer = None
_provider = None
_initialized = False


def init_tracing(
    service_name: str = "ai-insights",
    endpoint: Optional[str] = None,
    sample_rate: float = 1.0,
) -> bool:
    """
    Initialize OpenTelemetry tracing.
    
    Args:
        service_name: Name of this service in traces
        endpoint: OTLP endpoint URL (default: OTEL_EXPORTER_OTLP_ENDPOINT env var)
        sample_rate: Fraction of traces to sample (0.0-1.0)
        
    Returns:
        True if initialization successful, False otherwise
        
    WHY: Centralized initialization ensures consistent configuration
         and prevents multiple initializations.
    """
    global _tracer, _provider, _initialized
    
    if _initialized:
        return True
    
    logger = get_logger(__name__)
    
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.semconv.resource import ResourceAttributes
        
        # Get endpoint from environment or parameter
        otel_endpoint = endpoint or os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
        
        # Create resource with service info
        resource = Resource.create({
            ResourceAttributes.SERVICE_NAME: service_name,
            ResourceAttributes.SERVICE_VERSION: os.getenv("APP_VERSION", "1.0.0"),
            ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.getenv("ENVIRONMENT", "development"),
        })
        
        # Create provider
        _provider = TracerProvider(resource=resource)
        
        # Add exporter if endpoint configured
        if otel_endpoint:
            try:
                from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
                
                exporter = OTLPSpanExporter(endpoint=otel_endpoint)
                _provider.add_span_processor(BatchSpanProcessor(exporter))
                logger.info(f"OpenTelemetry tracing initialized with OTLP endpoint: {otel_endpoint}")
            except ImportError:
                logger.warning("OTLP exporter not installed - using console exporter")
                from opentelemetry.sdk.trace.export import ConsoleSpanExporter
                _provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
        else:
            # Use console exporter for local development
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter
            _provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
            logger.info("OpenTelemetry tracing initialized with console exporter (no OTLP endpoint)")
        
        # Set as global provider
        trace.set_tracer_provider(_provider)
        
        # Create tracer
        _tracer = trace.get_tracer(service_name)
        
        _initialized = True
        return True
        
    except ImportError:
        logger.warning("OpenTelemetry not installed - tracing disabled")
        return False
    except Exception as e:
        logger.error(f"Failed to initialize tracing: {e}")
        return False


def get_tracer(name: Optional[str] = None):
    """
    Get a tracer instance.
    
    Args:
        name: Tracer name (usually __name__)
        
    Returns:
        Tracer instance or NoOpTracer if tracing not available
    """
    global _tracer, _initialized
    
    if not _initialized:
        # Try to initialize with defaults
        init_tracing()
    
    if _tracer is not None:
        return _tracer
    
    # Return a no-op tracer if OpenTelemetry not available
    return NoOpTracer()


class NoOpTracer:
    """No-op tracer for when OpenTelemetry is not available."""
    
    @contextmanager
    def start_as_current_span(self, name: str, **kwargs):
        """Return a no-op context manager."""
        yield NoOpSpan()
    
    def start_span(self, name: str, **kwargs):
        """Return a no-op span."""
        return NoOpSpan()


class NoOpSpan:
    """No-op span for when OpenTelemetry is not available."""
    
    def set_attribute(self, key: str, value: Any):
        """No-op."""
        pass
    
    def set_attributes(self, attributes: dict[str, Any]):
        """No-op."""
        pass
    
    def add_event(self, name: str, attributes: Optional[dict] = None):
        """No-op."""
        pass
    
    def record_exception(self, exception: Exception):
        """No-op."""
        pass
    
    def set_status(self, status):
        """No-op."""
        pass
    
    def end(self):
        """No-op."""
        pass
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        pass


def trace_async(
    span_name: Optional[str] = None,
    attributes: Optional[dict[str, Any]] = None,
) -> Callable[[F], F]:
    """
    Decorator to trace async functions.
    
    Args:
        span_name: Custom span name (default: function name)
        attributes: Static attributes to add to span
        
    Usage:
        @trace_async("query_cognee")
        async def query_cognee(query: str):
            ...
            
        @trace_async(attributes={"component": "orchestrator"})
        async def orchestrate(query: str):
            ...
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or func.__name__
            
            with tracer.start_as_current_span(name) as span:
                # Add static attributes
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                
                # Add function info
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = await func(*args, **kwargs)
                    return result
                except Exception as e:
                    span.record_exception(e)
                    try:
                        from opentelemetry.trace import StatusCode
                        span.set_status(StatusCode.ERROR, str(e))
                    except ImportError:
                        pass
                    raise
        
        return wrapper  # type: ignore
    
    return decorator


def trace_sync(
    span_name: Optional[str] = None,
    attributes: Optional[dict[str, Any]] = None,
) -> Callable[[F], F]:
    """
    Decorator to trace sync functions.
    
    Args:
        span_name: Custom span name (default: function name)
        attributes: Static attributes to add to span
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or func.__name__
            
            with tracer.start_as_current_span(name) as span:
                # Add static attributes
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                
                # Add function info
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    span.record_exception(e)
                    try:
                        from opentelemetry.trace import StatusCode
                        span.set_status(StatusCode.ERROR, str(e))
                    except ImportError:
                        pass
                    raise
        
        return wrapper  # type: ignore
    
    return decorator


def add_span_attributes(attributes: dict[str, Any]):
    """
    Add attributes to the current span.
    
    Args:
        attributes: Key-value pairs to add
        
    Usage:
        add_span_attributes({
            "query.length": len(query),
            "intent": intent.value,
            "confidence": confidence,
        })
    """
    try:
        from opentelemetry import trace
        
        span = trace.get_current_span()
        if span:
            for key, value in attributes.items():
                # Convert complex types to strings
                if isinstance(value, (dict, list)):
                    import json
                    value = json.dumps(value)
                span.set_attribute(key, value)
    except ImportError:
        pass


def record_exception(exception: Exception, attributes: Optional[dict[str, Any]] = None):
    """
    Record an exception in the current span.
    
    Args:
        exception: The exception to record
        attributes: Additional attributes to add
    """
    try:
        from opentelemetry import trace
        from opentelemetry.trace import StatusCode
        
        span = trace.get_current_span()
        if span:
            span.record_exception(exception)
            span.set_status(StatusCode.ERROR, str(exception))
            
            if attributes:
                for key, value in attributes.items():
                    span.set_attribute(key, value)
    except ImportError:
        pass


# AI-specific span helpers
@contextmanager
def create_ai_span(
    operation: str,
    query: str,
    model: Optional[str] = None,
):
    """
    Create a span for AI operations with standard attributes.
    
    Args:
        operation: Operation name (e.g., "orchestrate", "intent_classify")
        query: User query
        model: Model name if applicable
        
    Yields:
        Span object
        
    Usage:
        with create_ai_span("orchestrate", "What is X?") as span:
            # ... do work
            span.set_attribute("result", "success")
    """
    tracer = get_tracer()
    
    with tracer.start_as_current_span(f"ai.{operation}") as span:
        # Add AI-specific attributes following semantic conventions
        span.set_attribute("ai.operation", operation)
        span.set_attribute("ai.query.text", query[:500])  # Truncate for safety
        span.set_attribute("ai.query.length", len(query))
        
        if model:
            span.set_attribute("ai.model", model)
        
        yield span


def end_ai_span(
    span: Any,
    success: bool,
    confidence: Optional[float] = None,
    latency_ms: Optional[int] = None,
    source_type: Optional[str] = None,
    error: Optional[str] = None,
):
    """
    End an AI span with result attributes.
    
    Args:
        span: The span to end
        success: Whether the operation succeeded
        confidence: Confidence score (0-1)
        latency_ms: Operation latency in milliseconds
        source_type: Source type (rag, cognee, hybrid)
        error: Error message if failed
    """
    try:
        span.set_attribute("ai.success", success)
        
        if confidence is not None:
            span.set_attribute("ai.confidence", confidence)
        
        if latency_ms is not None:
            span.set_attribute("ai.latency_ms", latency_ms)
        
        if source_type:
            span.set_attribute("ai.source_type", source_type)
        
        if error:
            span.set_attribute("ai.error", error)
            try:
                from opentelemetry.trace import StatusCode
                span.set_status(StatusCode.ERROR, error)
            except ImportError:
                pass
        
        span.end()
    except Exception:
        pass
