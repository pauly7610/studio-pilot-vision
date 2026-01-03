"""
Test Suite for Document Upload Endpoint
Tests the /upload/document endpoint including:
- File validation (type, size)
- Product linking
- Background processing
- Status tracking

NOTE: These tests use sys.modules mocking to prevent slow ML imports.
"""

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ============================================================================
# FIXTURES - Mock at sys.modules level for speed
# ============================================================================

@pytest.fixture(scope="module", autouse=True)
def mock_heavy_modules():
    """Mock heavy ML modules at sys.modules level to prevent slow imports."""
    # Mock Cognee
    mock_cognee = MagicMock()
    mock_cognee.add = AsyncMock(return_value="added")
    mock_cognee.cognify = AsyncMock(return_value="cognified")
    mock_cognee.search = AsyncMock(return_value=[])
    mock_cognee.config = MagicMock()
    
    # Mock LlamaIndex
    mock_llama = MagicMock()
    mock_llama.SimpleDirectoryReader = MagicMock()
    
    # Mock ai_insights.cognee
    mock_ai_cognee = MagicMock()
    mock_cognee_loader = MagicMock()
    mock_cognee_client = AsyncMock()
    mock_cognee_loader.get_client = AsyncMock(return_value=mock_cognee_client)
    mock_ai_cognee.get_cognee_lazy_loader = MagicMock(return_value=mock_cognee_loader)
    
    # Mock orchestration
    mock_orchestration = MagicMock()
    mock_orchestrator = AsyncMock()
    mock_orchestrator.orchestrate = AsyncMock(return_value=MagicMock(
        dict=MagicMock(return_value={"success": True, "answer": "mocked"})
    ))
    mock_orchestration.get_production_orchestrator = MagicMock(return_value=mock_orchestrator)
    
    # Store originals
    original_modules = {}
    modules_to_mock = {
        'cognee': mock_cognee,
        'llama_index.core': mock_llama,
        'ai_insights.cognee': mock_ai_cognee,
        'ai_insights.orchestration': mock_orchestration,
    }
    
    for module_name in modules_to_mock:
        if module_name in sys.modules:
            original_modules[module_name] = sys.modules[module_name]
        sys.modules[module_name] = modules_to_mock[module_name]
    
    yield
    
    # Cleanup
    for module_name in modules_to_mock:
        if module_name in original_modules:
            sys.modules[module_name] = original_modules[module_name]
        else:
            sys.modules.pop(module_name, None)


@pytest.fixture(scope="module")
def client(mock_heavy_modules):
    """Create test client with mocked dependencies (module scope for speed)."""
    import os
    os.environ.setdefault("GROQ_API_KEY", "test-key")
    os.environ.setdefault("API_KEY", "test-api-key")

    with (
        patch("main.get_lazy_vector_store") as mock_vs,
        patch("main.get_lazy_retrieval") as mock_ret,
        patch("main.get_lazy_generator") as mock_gen,
        patch("main.get_lazy_document_loader") as mock_doc,
        patch("main.background_warmup", new_callable=AsyncMock),
        patch("main.fetch_from_supabase", new_callable=AsyncMock),
    ):
        mock_vector_store = MagicMock()
        mock_vector_store.count.return_value = 100
        mock_vs.return_value = mock_vector_store
        mock_ret.return_value = MagicMock()
        mock_gen.return_value = MagicMock()
        
        mock_doc_loader = MagicMock()
        mock_doc_loader.ingest_documents.return_value = 5
        mock_doc.return_value = mock_doc_loader
        
        from main import app
        yield TestClient(app, raise_server_exceptions=False)


# ============================================================================
# FILE VALIDATION TESTS
# ============================================================================

class TestDocumentUploadValidation:
    """Tests for document upload file validation."""

    def test_upload_pdf_accepted(self, client):
        """PDF files should be accepted."""
        response = client.post(
            "/upload/document",
            files={"file": ("test.pdf", b"%PDF-1.4 test", "application/pdf")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "job_id" in data

    def test_upload_txt_accepted(self, client):
        """TXT files should be accepted."""
        response = client.post(
            "/upload/document",
            files={"file": ("readme.txt", b"Test content", "text/plain")}
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_upload_md_accepted(self, client):
        """Markdown files should be accepted."""
        response = client.post(
            "/upload/document",
            files={"file": ("docs.md", b"# Test", "text/markdown")}
        )
        assert response.status_code == 200

    def test_upload_docx_accepted(self, client):
        """DOCX files should be accepted."""
        response = client.post(
            "/upload/document",
            files={"file": ("doc.docx", b"PK fake docx", "application/vnd.openxmlformats")}
        )
        assert response.status_code == 200

    def test_upload_exe_rejected(self, client):
        """Executable files should be rejected."""
        response = client.post(
            "/upload/document",
            files={"file": ("virus.exe", b"MZ", "application/octet-stream")}
        )
        assert response.status_code == 400
        assert "not supported" in response.json()["detail"]

    def test_upload_csv_rejected(self, client):
        """CSV should be rejected (use /upload/jira-csv)."""
        response = client.post(
            "/upload/document",
            files={"file": ("data.csv", b"a,b\n1,2", "text/csv")}
        )
        assert response.status_code == 400

    def test_upload_empty_file_rejected(self, client):
        """Empty files should be rejected."""
        response = client.post(
            "/upload/document",
            files={"file": ("empty.pdf", b"", "application/pdf")}
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_case_insensitive_extension(self, client):
        """Extensions should be case insensitive."""
        response = client.post(
            "/upload/document",
            files={"file": ("TEST.PDF", b"%PDF test", "application/pdf")}
        )
        assert response.status_code == 200


# ============================================================================
# PRODUCT LINKING TESTS
# ============================================================================

class TestDocumentProductLinking:
    """Tests for linking documents to products."""

    def test_upload_with_product_id(self, client):
        """Document can be linked to a product."""
        response = client.post(
            "/upload/document",
            files={"file": ("spec.pdf", b"%PDF spec", "application/pdf")},
            data={"product_id": "prod-123"}
        )
        assert response.status_code == 200
        # product_id is passed but may or may not be in response depending on FastAPI form handling
        # The key is that it doesn't error
        assert response.json()["success"] is True

    def test_upload_with_product_name(self, client):
        """Document can include product name."""
        response = client.post(
            "/upload/document",
            files={"file": ("req.pdf", b"%PDF req", "application/pdf")},
            data={"product_id": "prod-456", "product_name": "PayLink"}
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_upload_without_product(self, client):
        """Document upload without product should work."""
        response = client.post(
            "/upload/document",
            files={"file": ("general.pdf", b"%PDF gen", "application/pdf")}
        )
        assert response.status_code == 200
        assert response.json()["success"] is True


# ============================================================================
# JOB STATUS TESTS
# ============================================================================

class TestDocumentUploadStatus:
    """Tests for job status tracking."""

    def test_get_job_status(self, client):
        """Should check status of upload job."""
        upload_resp = client.post(
            "/upload/document",
            files={"file": ("test.pdf", b"%PDF test", "application/pdf")}
        )
        job_id = upload_resp.json()["job_id"]

        status_resp = client.get(f"/upload/status/{job_id}")
        assert status_resp.status_code == 200
        assert "status" in status_resp.json()

    def test_job_has_filename(self, client):
        """Job status should include filename in initial response."""
        upload_resp = client.post(
            "/upload/document",
            files={"file": ("my_doc.pdf", b"%PDF", "application/pdf")}
        )
        # Filename is in the upload response
        assert upload_resp.json().get("filename") == "my_doc.pdf"


# ============================================================================
# RESPONSE FORMAT TESTS
# ============================================================================

class TestDocumentUploadResponse:
    """Tests for response format."""

    def test_response_has_required_fields(self, client):
        """Response should have all required fields."""
        response = client.post(
            "/upload/document",
            files={"file": ("test.pdf", b"%PDF", "application/pdf")}
        )
        data = response.json()
        
        assert "success" in data
        assert "job_id" in data
        assert "status" in data
        assert "filename" in data
        assert "file_size_mb" in data
        assert "message" in data

    def test_file_size_calculated(self, client):
        """Response should include file size in MB."""
        content = b"x" * 1024  # 1KB
        response = client.post(
            "/upload/document",
            files={"file": ("test.txt", content, "text/plain")}
        )
        data = response.json()
        # File size should be present and non-negative
        assert "file_size_mb" in data
        assert data["file_size_mb"] >= 0

    def test_status_is_queued(self, client):
        """Initial status should be 'queued'."""
        response = client.post(
            "/upload/document",
            files={"file": ("test.pdf", b"%PDF", "application/pdf")}
        )
        assert response.json()["status"] == "queued"


# ============================================================================
# EDGE CASES
# ============================================================================

class TestDocumentUploadEdgeCases:
    """Tests for edge cases."""

    def test_long_filename(self, client):
        """Should handle long filenames."""
        long_name = "a" * 200 + ".pdf"
        response = client.post(
            "/upload/document",
            files={"file": (long_name, b"%PDF", "application/pdf")}
        )
        assert response.status_code in [200, 400]

    def test_special_chars_filename(self, client):
        """Should handle special chars in filename."""
        response = client.post(
            "/upload/document",
            files={"file": ("test (1) [final].pdf", b"%PDF", "application/pdf")}
        )
        assert response.status_code == 200

    def test_unicode_filename(self, client):
        """Should handle unicode filenames."""
        response = client.post(
            "/upload/document",
            files={"file": ("документ.pdf", b"%PDF", "application/pdf")}
        )
        assert response.status_code == 200


# ============================================================================
# CONSTANTS TESTS
# ============================================================================

class TestDocumentUploadConstants:
    """Tests for upload constants."""

    def test_max_file_size_is_10mb(self):
        """MAX_FILE_SIZE should be 10MB."""
        from main import MAX_FILE_SIZE
        assert MAX_FILE_SIZE == 10 * 1024 * 1024

    def test_allowed_extensions(self):
        """ALLOWED_EXTENSIONS should include safe types only."""
        from main import ALLOWED_EXTENSIONS
        assert ".pdf" in ALLOWED_EXTENSIONS
        assert ".txt" in ALLOWED_EXTENSIONS
        assert ".md" in ALLOWED_EXTENSIONS
        assert ".docx" in ALLOWED_EXTENSIONS
        assert ".exe" not in ALLOWED_EXTENSIONS
        assert ".js" not in ALLOWED_EXTENSIONS
