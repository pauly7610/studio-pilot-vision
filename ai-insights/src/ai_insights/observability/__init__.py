"""
Observability Module
OpenTelemetry tracing, metrics, and logging for AI pipeline.
"""

from ai_insights.observability.tracing import (
    init_tracing,
    get_tracer,
    trace_async,
    trace_sync,
    add_span_attributes,
    record_exception,
)

__all__ = [
    "init_tracing",
    "get_tracer",
    "trace_async",
    "trace_sync",
    "add_span_attributes",
    "record_exception",
]
