"""Utilities module - Helper functions and metrics."""

from .auth import require_api_key, verify_api_key
from .generator import get_generator
from .jira_parser import parse_jira_csv
from .metrics import (
    record_fallback,
    record_intent_classification,
    set_system_info,
    track_cognee_query,
    track_query_metrics,
    track_rag_query,
    update_cognee_availability,
)
from .validation import (
    CogneeQueryRequest,
    IngestRequest,
    PortfolioInsightRequest,
    ProductInsightRequest,
    QueryRequest,
    sanitize_filename,
    validate_file_upload,
    validate_request,
)

__all__ = [
    "track_query_metrics",
    "track_cognee_query",
    "track_rag_query",
    "record_intent_classification",
    "record_fallback",
    "update_cognee_availability",
    "set_system_info",
    "get_generator",
    "parse_jira_csv",
    "verify_api_key",
    "require_api_key",
    "QueryRequest",
    "ProductInsightRequest",
    "PortfolioInsightRequest",
    "IngestRequest",
    "CogneeQueryRequest",
    "validate_request",
    "sanitize_filename",
    "validate_file_upload",
]
