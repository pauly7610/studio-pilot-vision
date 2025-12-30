"""
Test Suite for Input Validation and Sanitization
Tests Pydantic models, SQL injection prevention, XSS prevention, and file validation.
"""

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from ai_insights.utils.validation import (
    QueryRequest,
    ProductInsightRequest,
    PortfolioInsightRequest,
    IngestRequest,
    CogneeQueryRequest,
    validate_request,
    sanitize_filename,
    validate_file_upload,
)
from io import BytesIO


class TestQueryRequestValidation:
    """Test QueryRequest model validation."""

    def test_valid_query_request(self):
        """Valid query request should pass validation."""
        request = QueryRequest(query="What products are available?", context={})
        assert request.query == "What products are available?"
        assert request.context == {}

    def test_empty_query_fails(self):
        """Empty query should fail validation."""
        with pytest.raises(ValidationError):
            QueryRequest(query="", context={})

    def test_query_too_long_fails(self):
        """Query exceeding max length should fail."""
        long_query = "a" * 2001
        with pytest.raises(ValidationError):
            QueryRequest(query=long_query, context={})

    def test_sql_injection_detected(self):
        """SQL injection patterns should be detected and rejected."""
        malicious_queries = [
            "'; DROP TABLE products; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--",
        ]

        for query in malicious_queries:
            with pytest.raises(ValidationError) as exc_info:
                QueryRequest(query=query, context={})
            assert "dangerous SQL patterns" in str(exc_info.value)

    def test_xss_patterns_detected(self):
        """XSS patterns should be detected and rejected."""
        xss_queries = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
        ]

        for query in xss_queries:
            with pytest.raises(ValidationError) as exc_info:
                QueryRequest(query=query, context={})
            assert "XSS patterns" in str(exc_info.value)

    def test_context_validation(self):
        """Context dictionary should be validated."""
        request = QueryRequest(
            query="Test query", context={"user_id": "123", "session": "abc"}
        )
        assert request.context["user_id"] == "123"


class TestProductInsightRequestValidation:
    """Test ProductInsightRequest model validation."""

    def test_valid_product_insight_request(self):
        """Valid product insight request should pass."""
        request = ProductInsightRequest(
            query="Analyze product performance", product_ids=["prod_1", "prod_2"]
        )
        assert len(request.product_ids) == 2

    def test_empty_product_ids_allowed(self):
        """Empty product IDs list should be allowed."""
        request = ProductInsightRequest(query="General analysis", product_ids=[])
        assert request.product_ids == []

    def test_product_id_sanitization(self):
        """Product IDs should be sanitized."""
        request = ProductInsightRequest(
            query="Test", product_ids=["prod_1", "prod_2", "prod_1"]
        )
        # Verify IDs are stored (deduplication would be application logic)
        assert "prod_1" in request.product_ids


class TestPortfolioInsightRequestValidation:
    """Test PortfolioInsightRequest model validation."""

    def test_valid_portfolio_request(self):
        """Valid portfolio request should pass."""
        request = PortfolioInsightRequest(
            query="Portfolio analysis", filters={"status": "active"}
        )
        assert request.filters["status"] == "active"

    def test_empty_filters_allowed(self):
        """Empty filters should be allowed."""
        request = PortfolioInsightRequest(query="Show all", filters={})
        assert request.filters == {}


class TestIngestRequestValidation:
    """Test IngestRequest model validation."""

    def test_valid_ingest_request(self):
        """Valid ingest request should pass."""
        request = IngestRequest(
            source_type="csv",
            file_path="/data/products.csv",
            metadata={"uploaded_by": "admin"},
        )
        assert request.source_type == "csv"
        assert request.file_path == "/data/products.csv"

    def test_invalid_source_type_fails(self):
        """Invalid source type should fail."""
        with pytest.raises(ValidationError):
            IngestRequest(
                source_type="invalid_type",
                file_path="/data/file.txt",
                metadata={},
            )


class TestCogneeQueryRequestValidation:
    """Test CogneeQueryRequest model validation."""

    def test_valid_cognee_request(self):
        """Valid Cognee query request should pass."""
        request = CogneeQueryRequest(query="Historical analysis", context={})
        assert request.query == "Historical analysis"


class TestValidateRequestFunction:
    """Test validate_request helper function."""

    def test_validate_request_success(self):
        """Valid data should return validated model instance."""
        data = {"query": "Test query", "context": {}}
        result = validate_request(QueryRequest, data)
        assert isinstance(result, QueryRequest)
        assert result.query == "Test query"

    def test_validate_request_failure_raises_http_exception(self):
        """Invalid data should raise HTTPException."""
        data = {"query": ""}  # Empty query is invalid
        with pytest.raises(HTTPException) as exc_info:
            validate_request(QueryRequest, data)
        assert exc_info.value.status_code == 422
        assert "Validation failed" in str(exc_info.value.detail)


class TestFilenameSanitization:
    """Test filename sanitization for security."""

    def test_sanitize_simple_filename(self):
        """Simple filename should remain unchanged."""
        result = sanitize_filename("document.pdf")
        assert result == "document.pdf"

    def test_remove_directory_traversal(self):
        """Directory traversal attempts should be removed."""
        result = sanitize_filename("../../etc/passwd")
        assert result == "etcpasswd"

    def test_remove_dangerous_characters(self):
        """Dangerous characters should be removed."""
        result = sanitize_filename("file<>:|?.txt")
        assert "<" not in result
        assert ">" not in result
        assert ":" not in result

    def test_limit_filename_length(self):
        """Very long filenames should be truncated."""
        long_name = "a" * 300 + ".txt"
        result = sanitize_filename(long_name)
        assert len(result) <= 255

    def test_preserve_extension(self):
        """File extension should be preserved when truncating."""
        long_name = "a" * 300 + ".pdf"
        result = sanitize_filename(long_name)
        assert result.endswith(".pdf")


class TestFileUploadValidation:
    """Test file upload validation."""

    def test_valid_file_upload(self):
        """Valid file should pass validation."""

        class MockFile:
            def __init__(self, filename, size):
                self.filename = filename
                self.size = size

        file = MockFile("document.pdf", 1024 * 1024)  # 1 MB
        # Should not raise exception
        validate_file_upload(file, allowed_extensions=[".pdf"], max_size_mb=5)

    def test_invalid_extension_rejected(self):
        """File with invalid extension should be rejected."""

        class MockFile:
            def __init__(self, filename):
                self.filename = filename

        file = MockFile("malware.exe")
        with pytest.raises(HTTPException) as exc_info:
            validate_file_upload(file, allowed_extensions=[".pdf", ".csv"])
        assert exc_info.value.status_code == 400
        assert "Invalid file type" in str(exc_info.value.detail)

    def test_file_too_large_rejected(self):
        """File exceeding size limit should be rejected."""

        class MockFile:
            def __init__(self, filename, size):
                self.filename = filename
                self.size = size

        file = MockFile("large.pdf", 10 * 1024 * 1024)  # 10 MB
        with pytest.raises(HTTPException) as exc_info:
            validate_file_upload(file, allowed_extensions=[".pdf"], max_size_mb=5)
        assert exc_info.value.status_code == 400
        assert "File too large" in str(exc_info.value.detail)

    def test_case_insensitive_extension_check(self):
        """Extension check should be case-insensitive."""

        class MockFile:
            def __init__(self, filename):
                self.filename = filename
                self.size = 1024

        file = MockFile("document.PDF")
        # Should not raise exception
        validate_file_upload(file, allowed_extensions=[".pdf"])


class TestSecurityEdgeCases:
    """Test edge cases and security scenarios."""

    def test_unicode_in_query(self):
        """Unicode characters should be handled properly."""
        request = QueryRequest(query="What about café products? 日本語", context={})
        assert "café" in request.query
        assert "日本語" in request.query

    def test_null_bytes_rejected(self):
        """Null bytes should be rejected."""
        with pytest.raises(ValidationError):
            QueryRequest(query="test\x00query", context={})

    def test_very_nested_context(self):
        """Deeply nested context should be handled."""
        nested = {"level1": {"level2": {"level3": {"data": "value"}}}}
        request = QueryRequest(query="Test", context=nested)
        assert request.context["level1"]["level2"]["level3"]["data"] == "value"
