"""
Tests for ai_insights.retrieval.vector_store module.

Tests the ChromaVectorStore class for vector similarity search.
Currently at 50% coverage - targeting 80%+.
"""

import tempfile
from unittest.mock import MagicMock, Mock, patch

import numpy as np
import pytest


class TestChromaVectorStoreInit:
    """Test ChromaVectorStore initialization."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_init_creates_persistent_client(self, mock_chromadb):
        """Should create persistent ChromaDB client."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore(persist_directory="./test_data")

        mock_chromadb.PersistentClient.assert_called_with(path="./test_data")
        assert store.collection is not None

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_init_fallback_to_memory_on_error(self, mock_chromadb):
        """Should fall back to in-memory client on error."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        # Make PersistentClient fail
        mock_chromadb.PersistentClient.side_effect = Exception("Disk error")

        # In-memory client should work
        mock_memory_client = MagicMock()
        mock_collection = MagicMock()
        mock_memory_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.Client.return_value = mock_memory_client

        store = ChromaVectorStore()

        mock_chromadb.Client.assert_called()
        assert store.collection is not None

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_init_creates_collection_with_cosine_space(self, mock_chromadb):
        """Should create collection with cosine similarity."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_chromadb.PersistentClient.return_value = mock_client

        ChromaVectorStore()

        call_args = mock_client.get_or_create_collection.call_args
        assert call_args.kwargs.get("metadata") == {"hnsw:space": "cosine"}


class TestInsert:
    """Test document insertion."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_insert_basic(self, mock_chromadb):
        """Should insert documents with embeddings."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        texts = ["Document 1", "Document 2"]
        float_embeddings = np.random.rand(2, 384).astype(np.float32)
        binary_embeddings = np.random.rand(2, 48).astype(np.uint8)
        doc_ids = ["doc1", "doc2"]
        chunk_ids = [0, 0]
        metadata = [{"source": "test"}, {"source": "test"}]

        ids = store.insert(
            texts=texts,
            float_embeddings=float_embeddings,
            binary_embeddings=binary_embeddings,
            doc_ids=doc_ids,
            chunk_ids=chunk_ids,
            metadata=metadata,
        )

        assert len(ids) == 2
        assert "doc1_0" in ids
        assert "doc2_0" in ids
        mock_collection.upsert.assert_called_once()

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_insert_generates_unique_ids(self, mock_chromadb):
        """Should generate unique IDs from doc_id and chunk_id."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        ids = store.insert(
            texts=["Text 1", "Text 2", "Text 3"],
            float_embeddings=np.random.rand(3, 384).astype(np.float32),
            binary_embeddings=np.random.rand(3, 48).astype(np.uint8),
            doc_ids=["doc1", "doc1", "doc2"],
            chunk_ids=[0, 1, 0],
            metadata=[{}, {}, {}],
        )

        assert ids == ["doc1_0", "doc1_1", "doc2_0"]

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_insert_flattens_metadata(self, mock_chromadb):
        """Should flatten metadata for ChromaDB."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        store.insert(
            texts=["Text"],
            float_embeddings=np.random.rand(1, 384).astype(np.float32),
            binary_embeddings=np.random.rand(1, 48).astype(np.uint8),
            doc_ids=["doc1"],
            chunk_ids=[0],
            metadata=[{"source": "test", "product_id": "prod_001"}],
        )

        call_args = mock_collection.upsert.call_args
        metadatas = call_args.kwargs.get("metadatas")

        # Should have flattened metadata
        assert metadatas[0]["source"] == "test"
        assert metadatas[0]["product_id"] == "prod_001"

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_insert_returns_empty_if_no_collection(self, mock_chromadb):
        """Should return empty list if collection is None."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        # Create store with working mock first
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        # NOW set collection to None to test edge case
        store.collection = None

        ids = store.insert(
            texts=["Text"],
            float_embeddings=np.random.rand(1, 384).astype(np.float32),
            binary_embeddings=np.random.rand(1, 48).astype(np.uint8),
            doc_ids=["doc1"],
            chunk_ids=[0],
            metadata=[{}],
        )

        assert ids == []


class TestSearch:
    """Test vector similarity search."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_search_basic(self, mock_chromadb):
        """Should search and return results."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "ids": [["doc1_0", "doc2_0"]],
            "distances": [[0.1, 0.2]],
            "documents": [["Text 1", "Text 2"]],
            "metadatas": [[{"doc_id": "doc1"}, {"doc_id": "doc2"}]],
        }
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        query_vector = np.random.rand(384).astype(np.float32)
        results = store.search(query_vector, top_k=5)

        assert len(results) == 2
        mock_collection.query.assert_called_once()

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_search_converts_distance_to_score(self, mock_chromadb):
        """Should convert distance to similarity score."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "ids": [["doc1_0"]],
            "distances": [[0.2]],  # Distance
            "documents": [["Text"]],
            "metadatas": [[{"doc_id": "doc1"}]],
        }
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        results = store.search(np.random.rand(384).astype(np.float32))

        # Score should be 1 - distance = 0.8
        assert results[0]["score"] == 0.8

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_search_includes_metadata(self, mock_chromadb):
        """Should include metadata in results."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "ids": [["doc1_0"]],
            "distances": [[0.1]],
            "documents": [["Text"]],
            "metadatas": [[{"doc_id": "doc1", "chunk_id": 0, "source": "test"}]],
        }
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        results = store.search(np.random.rand(384).astype(np.float32))

        assert results[0]["doc_id"] == "doc1"
        assert results[0]["chunk_id"] == 0
        assert results[0]["metadata"]["source"] == "test"

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_search_returns_empty_if_no_results(self, mock_chromadb):
        """Should return empty list if no results."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "ids": [[]],
            "distances": [[]],
            "documents": [[]],
            "metadatas": [[]],
        }
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        results = store.search(np.random.rand(384).astype(np.float32))

        assert results == []

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_search_returns_empty_if_no_collection(self, mock_chromadb):
        """Should return empty list if collection is None."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        # Create store with working mock first
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        # NOW set collection to None to test edge case
        store.collection = None

        results = store.search(np.random.rand(384).astype(np.float32))

        assert results == []


class TestSearchFloat:
    """Test float embedding search (alias for search)."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_search_float_delegates_to_search(self, mock_chromadb):
        """search_float should delegate to search."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "ids": [["doc1_0"]],
            "distances": [[0.1]],
            "documents": [["Text"]],
            "metadatas": [[{}]],
        }
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        query = np.random.rand(384).astype(np.float32)
        results = store.search_float(query, top_k=3)

        assert len(results) == 1
        mock_collection.query.assert_called_once()


class TestDeleteByDocId:
    """Test document deletion."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_delete_by_doc_id(self, mock_chromadb):
        """Should delete all chunks for a document."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        store.delete_by_doc_id("doc1")

        mock_collection.delete.assert_called_once_with(where={"doc_id": "doc1"})

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_delete_no_error_if_no_collection(self, mock_chromadb):
        """Should not error if collection is None."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        # Create store with working mock first
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        # NOW set collection to None to test edge case
        store.collection = None

        # Should not raise
        store.delete_by_doc_id("doc1")


class TestCount:
    """Test vector count."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_count_returns_collection_count(self, mock_chromadb):
        """Should return number of vectors in collection."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_collection.count.return_value = 150
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        count = store.count()

        assert count == 150

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_count_returns_zero_if_no_collection(self, mock_chromadb):
        """Should return 0 if collection is None."""
        from ai_insights.retrieval.vector_store import ChromaVectorStore

        # Create store with working mock first
        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        store = ChromaVectorStore()

        # NOW set collection to None to test edge case
        store.collection = None

        count = store.count()

        assert count == 0


class TestGetVectorStore:
    """Test singleton factory function."""

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_get_vector_store_returns_instance(self, mock_chromadb):
        """Should return ChromaVectorStore instance."""
        import ai_insights.retrieval.vector_store as vs_module

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        # Reset singleton
        vs_module._vector_store_instance = None

        store = vs_module.get_vector_store()

        assert isinstance(store, vs_module.ChromaVectorStore)

    @patch("ai_insights.retrieval.vector_store.chromadb")
    def test_get_vector_store_returns_singleton(self, mock_chromadb):
        """Should return same instance on multiple calls."""
        import ai_insights.retrieval.vector_store as vs_module

        mock_client = MagicMock()
        mock_collection = MagicMock()
        mock_client.get_or_create_collection.return_value = mock_collection
        mock_chromadb.PersistentClient.return_value = mock_client

        # Reset singleton
        vs_module._vector_store_instance = None

        store1 = vs_module.get_vector_store()
        store2 = vs_module.get_vector_store()

        assert store1 is store2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
