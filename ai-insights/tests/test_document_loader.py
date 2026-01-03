"""
Tests for ai_insights.retrieval.document_loader module.

Tests the DocumentLoader class for RAG document ingestion pipeline.
Currently at 19% coverage - targeting 80%+.
"""

import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest


class TestDocumentLoaderInit:
    """Test DocumentLoader initialization."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_init_with_defaults(self, mock_vector_store, mock_embeddings):
        """Should initialize with default configuration."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        assert loader.documents_path is not None
        assert loader.chunk_size > 0
        assert loader.chunk_overlap >= 0
        assert loader.splitter is not None

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_init_with_custom_params(self, mock_vector_store, mock_embeddings):
        """Should accept custom configuration."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader(documents_path="/custom/path", chunk_size=256, chunk_overlap=32)

        assert loader.documents_path == "/custom/path"
        assert loader.chunk_size == 256
        assert loader.chunk_overlap == 32

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_init_creates_splitter(self, mock_vector_store, mock_embeddings):
        """Should create SentenceSplitter with correct params."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader(chunk_size=512, chunk_overlap=50)

        assert loader.splitter is not None
        # SentenceSplitter should be configured
        assert hasattr(loader.splitter, "get_nodes_from_documents")


class TestGenerateDocId:
    """Test document ID generation."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_generates_unique_id(self, mock_vector_store, mock_embeddings):
        """Should generate unique ID from path and content."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        doc_id = loader._generate_doc_id("/path/to/document.pdf", "Some content here")

        assert doc_id is not None
        assert "document" in doc_id
        assert "_" in doc_id  # Format: filename_hash

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_different_content_different_ids(self, mock_vector_store, mock_embeddings):
        """Different content should produce different IDs."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        id1 = loader._generate_doc_id("/path/doc.pdf", "Content A")
        id2 = loader._generate_doc_id("/path/doc.pdf", "Content B")

        assert id1 != id2

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_same_content_same_ids(self, mock_vector_store, mock_embeddings):
        """Same content should produce same IDs."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        id1 = loader._generate_doc_id("/path/doc.pdf", "Same content")
        id2 = loader._generate_doc_id("/path/doc.pdf", "Same content")

        assert id1 == id2


class TestLoadDirectory:
    """Test directory loading functionality."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_nonexistent_directory_creates_it(self, mock_vector_store, mock_embeddings):
        """Should create directory if it doesn't exist."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        with tempfile.TemporaryDirectory() as tmpdir:
            new_dir = os.path.join(tmpdir, "new_docs_dir")
            loader = DocumentLoader(documents_path=new_dir)

            docs = loader.load_directory()

            assert os.path.exists(new_dir)
            assert docs == []

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    @patch("ai_insights.retrieval.document_loader.SimpleDirectoryReader")
    def test_load_empty_directory(self, mock_reader, mock_vector_store, mock_embeddings):
        """Should return empty list for empty directory."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        # Mock SimpleDirectoryReader to raise ValueError for empty directory
        mock_reader.return_value.load_data.side_effect = ValueError("No files found")

        with tempfile.TemporaryDirectory() as tmpdir:
            loader = DocumentLoader(documents_path=tmpdir)

            docs = loader.load_directory()

            assert docs == []

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_directory_with_text_file(self, mock_vector_store, mock_embeddings):
        """Should load .txt files from directory."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        with tempfile.TemporaryDirectory() as tmpdir:
            # Create a test file
            test_file = os.path.join(tmpdir, "test.txt")
            with open(test_file, "w") as f:
                f.write("This is test content for the document loader.")

            loader = DocumentLoader(documents_path=tmpdir)
            docs = loader.load_directory()

            assert len(docs) == 1
            assert "test content" in docs[0].text

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_directory_with_custom_path(self, mock_vector_store, mock_embeddings):
        """Should load from custom path parameter."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        with tempfile.TemporaryDirectory() as tmpdir:
            test_file = os.path.join(tmpdir, "custom.txt")
            with open(test_file, "w") as f:
                f.write("Custom path content")

            loader = DocumentLoader(documents_path="/some/other/path")
            docs = loader.load_directory(path=tmpdir)

            assert len(docs) == 1

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    @patch("ai_insights.retrieval.document_loader.SimpleDirectoryReader")
    def test_load_directory_handles_error(self, mock_reader, mock_vector_store, mock_embeddings):
        """Should handle errors gracefully."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        mock_reader.return_value.load_data.side_effect = Exception("Read error")

        with tempfile.TemporaryDirectory() as tmpdir:
            # Create a file so directory isn't empty
            with open(os.path.join(tmpdir, "test.txt"), "w") as f:
                f.write("test")

            loader = DocumentLoader(documents_path=tmpdir)
            docs = loader.load_directory()

            assert docs == []


class TestLoadFromText:
    """Test creating documents from raw text."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_from_text_basic(self, mock_vector_store, mock_embeddings):
        """Should create document from text."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        doc = loader.load_from_text("This is some test content")

        assert doc.text == "This is some test content"
        assert doc.metadata == {}

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_from_text_with_metadata(self, mock_vector_store, mock_embeddings):
        """Should include metadata in document."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()
        metadata = {"source": "api", "user_id": "123"}

        doc = loader.load_from_text("Content here", metadata=metadata)

        assert doc.text == "Content here"
        assert doc.metadata["source"] == "api"
        assert doc.metadata["user_id"] == "123"


class TestLoadProductData:
    """Test converting product data to documents."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_basic(self, mock_vector_store, mock_embeddings):
        """Should convert product dict to document."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        products = [
            {
                "id": "prod_001",
                "name": "PayLink",
                "product_type": "Payment",
                "region": "North America",
                "lifecycle_stage": "pilot",
                "owner_email": "pm@example.com",
            }
        ]

        docs = loader.load_product_data(products)

        assert len(docs) == 1
        assert "PayLink" in docs[0].text
        assert "Payment" in docs[0].text
        assert "North America" in docs[0].text
        assert docs[0].metadata["product_id"] == "prod_001"

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_with_revenue_target(self, mock_vector_store, mock_embeddings):
        """Should include revenue target when present."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        products = [{"id": "prod_001", "name": "PayLink", "revenue_target": 1500000}]

        docs = loader.load_product_data(products)

        assert "$1,500,000" in docs[0].text

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_with_readiness(self, mock_vector_store, mock_embeddings):
        """Should include readiness data when present."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        products = [
            {
                "id": "prod_001",
                "name": "PayLink",
                "readiness": [{"overall_score": 75, "risk_band": "medium"}],
            }
        ]

        docs = loader.load_product_data(products)

        assert "Readiness Score: 75" in docs[0].text
        assert "Risk Band: medium" in docs[0].text

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_with_prediction(self, mock_vector_store, mock_embeddings):
        """Should include prediction data when present."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        products = [
            {
                "id": "prod_001",
                "name": "PayLink",
                "prediction": [{"revenue_probability": 85, "timeline_probability": 70}],
            }
        ]

        docs = loader.load_product_data(products)

        assert "Revenue Probability: 85" in docs[0].text
        assert "Timeline Probability: 70" in docs[0].text

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_with_compliance(self, mock_vector_store, mock_embeddings):
        """Should include compliance data when present."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        products = [{"id": "prod_001", "name": "PayLink", "compliance": [{"status": "approved"}]}]

        docs = loader.load_product_data(products)

        assert "Compliance Status: approved" in docs[0].text

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_multiple_products(self, mock_vector_store, mock_embeddings):
        """Should handle multiple products."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        products = [
            {"id": "prod_001", "name": "PayLink"},
            {"id": "prod_002", "name": "InstantPay"},
            {"id": "prod_003", "name": "FraudShield"},
        ]

        docs = loader.load_product_data(products)

        assert len(docs) == 3

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_product_data_empty_list(self, mock_vector_store, mock_embeddings):
        """Should handle empty product list."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        docs = loader.load_product_data([])

        assert docs == []


class TestLoadFeedbackData:
    """Test converting feedback data to documents."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_feedback_data_basic(self, mock_vector_store, mock_embeddings):
        """Should convert feedback dict to document."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        feedback = [
            {
                "id": "fb_001",
                "product_id": "prod_001",
                "raw_text": "Great product experience!",
                "source": "customer_survey",
                "theme": "usability",
                "sentiment_score": 0.8,
                "impact_level": "high",
            }
        ]

        docs = loader.load_feedback_data(feedback)

        assert len(docs) == 1
        assert "Great product experience!" in docs[0].text
        assert "customer_survey" in docs[0].text
        assert docs[0].metadata["feedback_id"] == "fb_001"
        assert docs[0].metadata["sentiment"] == "positive"

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_feedback_data_negative_sentiment(self, mock_vector_store, mock_embeddings):
        """Should detect negative sentiment."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        feedback = [{"id": "fb_002", "raw_text": "Poor experience", "sentiment_score": -0.5}]

        docs = loader.load_feedback_data(feedback)

        assert docs[0].metadata["sentiment"] == "negative"

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_load_feedback_data_multiple(self, mock_vector_store, mock_embeddings):
        """Should handle multiple feedback items."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        feedback = [
            {"id": "fb_001", "raw_text": "Good", "sentiment_score": 0.5},
            {"id": "fb_002", "raw_text": "Bad", "sentiment_score": -0.5},
        ]

        docs = loader.load_feedback_data(feedback)

        assert len(docs) == 2


class TestChunkDocuments:
    """Test document chunking functionality."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_chunk_documents_basic(self, mock_vector_store, mock_embeddings):
        """Should chunk documents into smaller pieces."""
        from llama_index.core import Document

        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader(chunk_size=100, chunk_overlap=10)

        # Create a document with enough text to be chunked
        long_text = "This is a test sentence. " * 50
        doc = Document(text=long_text, metadata={"source": "test"})

        chunks = loader.chunk_documents([doc])

        assert len(chunks) > 1
        assert all("text" in c for c in chunks)
        assert all("doc_id" in c for c in chunks)
        assert all("chunk_id" in c for c in chunks)

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_chunk_documents_preserves_metadata(self, mock_vector_store, mock_embeddings):
        """Should preserve document metadata in chunks."""
        from llama_index.core import Document

        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        doc = Document(
            text="Test content " * 100, metadata={"source": "test", "product_id": "prod_001"}
        )

        chunks = loader.chunk_documents([doc])

        for chunk in chunks:
            assert chunk["metadata"]["source"] == "test"
            assert chunk["metadata"]["product_id"] == "prod_001"
            assert "chunk_index" in chunk["metadata"]

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_chunk_documents_empty_list(self, mock_vector_store, mock_embeddings):
        """Should handle empty document list."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        chunks = loader.chunk_documents([])

        assert chunks == []


class TestIngestDocuments:
    """Test full ingestion pipeline."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_ingest_documents_empty(self, mock_vector_store, mock_embeddings):
        """Should return 0 for empty documents."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        loader = DocumentLoader()

        count = loader.ingest_documents([])

        assert count == 0

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_ingest_documents_full_pipeline(self, mock_vector_store, mock_embeddings):
        """Should run full pipeline: chunk, embed, store."""
        import numpy as np
        from llama_index.core import Document

        from ai_insights.retrieval.document_loader import DocumentLoader

        # Setup mocks
        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(5, 384).astype(np.float32),
            np.random.rand(5, 48).astype(np.uint8),
        )
        mock_embeddings.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.insert.return_value = ["id1", "id2", "id3", "id4", "id5"]
        mock_vector_store.return_value = mock_vs_instance

        loader = DocumentLoader()
        loader.embeddings = mock_emb_instance
        loader.vector_store = mock_vs_instance

        # Create test documents
        docs = [Document(text="Test content " * 50, metadata={"source": "test"})]

        count = loader.ingest_documents(docs)

        assert count > 0
        mock_emb_instance.embed_and_quantize.assert_called()
        mock_vs_instance.insert.assert_called()


class TestIngestFromDirectory:
    """Test directory ingestion."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    @patch("ai_insights.retrieval.document_loader.SimpleDirectoryReader")
    def test_ingest_from_directory_empty(self, mock_reader, mock_vector_store, mock_embeddings):
        """Should return 0 for empty directory."""
        from ai_insights.retrieval.document_loader import DocumentLoader

        # Mock SimpleDirectoryReader to raise ValueError for empty directory
        mock_reader.return_value.load_data.side_effect = ValueError("No files found")

        with tempfile.TemporaryDirectory() as tmpdir:
            loader = DocumentLoader(documents_path=tmpdir)

            count = loader.ingest_from_directory()

            assert count == 0


class TestGetDocumentLoader:
    """Test singleton factory function."""

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_get_document_loader_returns_instance(self, mock_vector_store, mock_embeddings):
        """Should return DocumentLoader instance."""
        import ai_insights.retrieval.document_loader as dl_module

        # Reset singleton
        dl_module._loader_instance = None

        loader = dl_module.get_document_loader()

        assert isinstance(loader, dl_module.DocumentLoader)

    @patch("ai_insights.retrieval.document_loader.get_embeddings")
    @patch("ai_insights.retrieval.document_loader.get_vector_store")
    def test_get_document_loader_returns_singleton(self, mock_vector_store, mock_embeddings):
        """Should return same instance on multiple calls."""
        import ai_insights.retrieval.document_loader as dl_module

        # Reset singleton
        dl_module._loader_instance = None

        loader1 = dl_module.get_document_loader()
        loader2 = dl_module.get_document_loader()

        assert loader1 is loader2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
