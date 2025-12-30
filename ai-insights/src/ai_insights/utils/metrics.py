"""
Prometheus Metrics for AI Insights
Production monitoring and observability.
"""

import time
from functools import wraps
from typing import Callable

from prometheus_client import Counter, Gauge, Histogram, Info

# Query Metrics
query_total = Counter(
    "ai_insights_queries_total", "Total number of AI queries processed", ["intent", "source_type"]
)

query_errors_total = Counter(
    "ai_insights_query_errors_total", "Total number of query errors", ["error_type"]
)

query_duration_seconds = Histogram(
    "ai_insights_query_duration_seconds",
    "Query processing duration in seconds",
    ["intent", "source_type"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

query_confidence = Histogram(
    "ai_insights_query_confidence",
    "Query response confidence scores",
    ["intent", "source_type"],
    buckets=[0.0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0],
)

# Cognee Metrics
cognee_queries_total = Counter(
    "ai_insights_cognee_queries_total", "Total number of Cognee queries", ["status"]
)

cognee_availability = Gauge(
    "ai_insights_cognee_available", "Cognee availability status (1=available, 0=unavailable)"
)

cognee_query_duration_seconds = Histogram(
    "ai_insights_cognee_query_duration_seconds",
    "Cognee query duration in seconds",
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
)

# RAG Metrics
rag_queries_total = Counter(
    "ai_insights_rag_queries_total", "Total number of RAG queries", ["status"]
)

rag_query_duration_seconds = Histogram(
    "ai_insights_rag_query_duration_seconds",
    "RAG query duration in seconds",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)

rag_sources_retrieved = Histogram(
    "ai_insights_rag_sources_retrieved",
    "Number of sources retrieved per query",
    buckets=[0, 1, 2, 3, 5, 10, 20],
)

# Intent Classification Metrics
intent_classification_total = Counter(
    "ai_insights_intent_classification_total", "Total intent classifications", ["intent", "method"]
)

intent_classification_confidence = Histogram(
    "ai_insights_intent_confidence",
    "Intent classification confidence",
    ["intent"],
    buckets=[0.0, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0],
)

llm_fallback_total = Counter(
    "ai_insights_llm_fallback_total",
    "Number of times LLM fallback was used for intent classification",
)

# Fallback Metrics
fallback_total = Counter(
    "ai_insights_fallback_total",
    "Total number of fallbacks",
    ["from_source", "to_source", "reason"],
)

# System Info
system_info = Info("ai_insights_system", "System information")

# Active Requests
active_requests = Gauge("ai_insights_active_requests", "Number of currently active requests")


def track_query_metrics(func: Callable) -> Callable:
    """
    Decorator to track query metrics.

    Usage:
        @track_query_metrics
        async def orchestrate(query, context):
            ...
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        active_requests.inc()
        start_time = time.time()

        try:
            result = await func(*args, **kwargs)

            duration = time.time() - start_time

            # Extract metrics from result
            if hasattr(result, "source_type"):
                intent = kwargs.get("context", {}).get("intent", "unknown")
                source_type = result.source_type

                query_total.labels(intent=intent, source_type=source_type).inc()

                query_duration_seconds.labels(intent=intent, source_type=source_type).observe(
                    duration
                )

                if hasattr(result, "confidence") and hasattr(result.confidence, "overall"):
                    query_confidence.labels(intent=intent, source_type=source_type).observe(
                        result.confidence.overall
                    )

            return result

        except Exception as e:
            error_type = type(e).__name__
            query_errors_total.labels(error_type=error_type).inc()
            raise

        finally:
            active_requests.dec()

    return wrapper


def track_cognee_query(func: Callable) -> Callable:
    """
    Decorator to track Cognee query metrics.

    Usage:
        @track_cognee_query
        async def query(query_text, context):
            ...
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()

        try:
            result = await func(*args, **kwargs)

            duration = time.time() - start_time
            cognee_queries_total.labels(status="success").inc()
            cognee_query_duration_seconds.observe(duration)

            return result

        except Exception:
            cognee_queries_total.labels(status="error").inc()
            raise

    return wrapper


def track_rag_query(func: Callable) -> Callable:
    """
    Decorator to track RAG query metrics.

    Usage:
        @track_rag_query
        async def retrieve(query):
            ...
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()

        try:
            result = await func(*args, **kwargs)

            duration = time.time() - start_time
            rag_queries_total.labels(status="success").inc()
            rag_query_duration_seconds.observe(duration)

            # Track number of sources if available
            if isinstance(result, dict) and "sources" in result:
                rag_sources_retrieved.observe(len(result["sources"]))

            return result

        except Exception:
            rag_queries_total.labels(status="error").inc()
            raise

    return wrapper


def record_intent_classification(intent: str, confidence: float, method: str = "heuristic"):
    """Record intent classification metrics."""
    intent_classification_total.labels(intent=intent, method=method).inc()

    intent_classification_confidence.labels(intent=intent).observe(confidence)

    if method == "llm":
        llm_fallback_total.inc()


def record_fallback(from_source: str, to_source: str, reason: str):
    """Record fallback event."""
    fallback_total.labels(from_source=from_source, to_source=to_source, reason=reason).inc()


def update_cognee_availability(available: bool):
    """Update Cognee availability gauge."""
    cognee_availability.set(1 if available else 0)


def set_system_info(version: str, environment: str, model: str):
    """Set system information."""
    system_info.info({"version": version, "environment": environment, "llm_model": model})
