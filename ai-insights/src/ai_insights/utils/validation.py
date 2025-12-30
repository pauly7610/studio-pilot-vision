"""
Input Validation and Sanitization
Prevents injection attacks and validates user input.
"""

import re
from typing import Any, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, ValidationError, field_validator


class QueryRequest(BaseModel):
    """Validated query request model."""

    query: str = Field(..., min_length=1, max_length=2000)
    product_id: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9\-_]{1,100}$")
    top_k: int = Field(5, ge=1, le=50)
    include_sources: bool = Field(True)
    context: Optional[dict[str, Any]] = Field(default_factory=dict)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Sanitize query string to prevent injection attacks."""
        # Remove potentially dangerous characters
        v = v.strip()

        # Check for SQL injection patterns
        sql_patterns = [
            r"(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bEXEC\b|\bEXECUTE\b)",
            r"(--|;|\/\*|\*\/)",
            r"(\bUNION\b.*\bSELECT\b)",
        ]

        for pattern in sql_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(
                    "Query contains potentially dangerous SQL patterns. "
                    "Please rephrase your query."
                )

        # Check for script injection
        script_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
        ]

        for pattern in script_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(
                    "Query contains potentially dangerous script patterns. "
                    "Please rephrase your query."
                )

        return v

    @field_validator("context")
    @classmethod
    def validate_context(cls, v: Optional[dict[str, Any]]) -> dict[str, Any]:
        """Validate context dictionary."""
        if v is None:
            return {}

        # Limit context size
        if len(str(v)) > 5000:
            raise ValueError("Context is too large (max 5000 characters)")

        # Ensure all keys are strings
        if not all(isinstance(k, str) for k in v.keys()):
            raise ValueError("All context keys must be strings")

        return v


class ProductInsightRequest(BaseModel):
    """Validated product insight request."""

    product_id: str = Field(..., pattern=r"^[a-zA-Z0-9\-_]{1,100}$")
    insight_type: str = Field(..., pattern=r"^(summary|risks|opportunities|recommendations)$")

    @field_validator("insight_type")
    @classmethod
    def validate_insight_type(cls, v: str) -> str:
        """Validate insight type."""
        allowed_types = ["summary", "risks", "opportunities", "recommendations"]
        if v not in allowed_types:
            raise ValueError(f"insight_type must be one of: {', '.join(allowed_types)}")
        return v


class PortfolioInsightRequest(BaseModel):
    """Validated portfolio insight request."""

    query: str = Field(..., min_length=1, max_length=2000)
    filters: Optional[dict[str, Any]] = Field(default_factory=dict)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Sanitize query string."""
        return QueryRequest.sanitize_query(v)

    @field_validator("filters")
    @classmethod
    def validate_filters(cls, v: Optional[dict[str, Any]]) -> dict[str, Any]:
        """Validate filters dictionary."""
        if v is None:
            return {}

        # Limit filter complexity
        if len(v) > 20:
            raise ValueError("Too many filters (max 20)")

        # Validate filter keys
        allowed_keys = [
            "lifecycle_stage",
            "risk_level",
            "revenue_range",
            "team",
            "region",
            "status",
            "priority",
        ]

        for key in v.keys():
            if key not in allowed_keys:
                raise ValueError(
                    f"Invalid filter key: {key}. " f"Allowed keys: {', '.join(allowed_keys)}"
                )

        return v


class IngestRequest(BaseModel):
    """Validated ingest request."""

    source: str = Field(..., pattern=r"^(products|feedback|documents)$")
    product_id: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9\-_]{1,100}$")

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        """Validate source type."""
        allowed_sources = ["products", "feedback", "documents"]
        if v not in allowed_sources:
            raise ValueError(f"source must be one of: {', '.join(allowed_sources)}")
        return v


class CogneeQueryRequest(BaseModel):
    """Validated Cognee query request."""

    query: str = Field(..., min_length=1, max_length=2000)
    context: Optional[dict[str, Any]] = Field(default_factory=dict)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Sanitize query string."""
        return QueryRequest.sanitize_query(v)

    @field_validator("context")
    @classmethod
    def validate_context(cls, v: Optional[dict[str, Any]]) -> dict[str, Any]:
        """Validate context dictionary."""
        return QueryRequest.validate_context(v)


def validate_request(model_class: type[BaseModel], data: dict[str, Any]) -> BaseModel:
    """
    Validate request data against a Pydantic model.

    Args:
        model_class: Pydantic model class to validate against
        data: Request data dictionary

    Returns:
        Validated model instance

    Raises:
        HTTPException: If validation fails
    """
    try:
        return model_class(**data)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "Validation failed", "details": e.errors()},
        ) from e


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = filename.split("/")[-1].split("\\")[-1]

    # Remove dangerous characters
    filename = re.sub(r"[^\w\s\-\.]", "", filename)

    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
        filename = name[:250] + ("." + ext if ext else "")

    return filename


def validate_file_upload(file: Any, allowed_extensions: list[str], max_size_mb: int = 50) -> None:
    """
    Validate uploaded file.

    Args:
        file: Uploaded file object
        allowed_extensions: List of allowed file extensions (e.g., ['.csv', '.pdf'])
        max_size_mb: Maximum file size in MB

    Raises:
        HTTPException: If validation fails
    """
    # Check file extension
    filename = file.filename.lower()
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}",
        )

    # Check file size (if available)
    if hasattr(file, "size") and file.size:
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {max_size_mb}MB",
            )
