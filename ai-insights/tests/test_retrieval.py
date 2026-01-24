"""
Tests for ai_insights.retrieval.retrieval module.

Tests the RetrievalPipeline class for RAG query retrieval.
Currently at 37% coverage - targeting 80%+.
"""

from unittest.mock import MagicMock, patch

import numpy as np
import pytest


class TestRetrievalPipelineInit:
    """Test RetrievalPipeline initialization."""

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_init_with_default_top_k(self, mock_vs, mock_emb):
        """Should initialize with default top_k."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        pipeline = RetrievalPipeline()

        assert pipeline.top_k > 0
        assert pipeline.embeddings is not None
        assert pipeline.vector_store is not None

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_init_with_custom_top_k(self, mock_vs, mock_emb):
        """Should accept custom top_k."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        pipeline = RetrievalPipeline(top_k=10)

        assert pipeline.top_k == 10


class TestRetrieve:
    """Test basic retrieval functionality."""

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_basic(self, mock_vs, mock_emb):
        """Should retrieve relevant documents for query."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        # Setup mocks
        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "doc1_0", "score": 0.95, "text": "Relevant content", "metadata": {}},
            {"id": "doc2_0", "score": 0.85, "text": "Also relevant", "metadata": {}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve("What are the product risks?")

        assert len(results) == 2
        assert results[0]["score"] == 0.95
        mock_emb_instance.embed_and_quantize.assert_called_once()
        mock_vs_instance.search.assert_called_once()

    @patch("ai_insights.retrieval.retrieval.get_reranker")
    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_with_custom_top_k(self, mock_vs, mock_emb, mock_reranker):
        """Should use custom top_k parameter (without reranking)."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = []
        mock_vs.return_value = mock_vs_instance
        
        # Disable reranking to test basic behavior
        mock_reranker_instance = MagicMock()
        mock_reranker_instance.is_available.return_value = False
        mock_reranker.return_value = mock_reranker_instance

        pipeline = RetrievalPipeline(top_k=5, use_reranking=False)
        pipeline.retrieve("test query", top_k=10, use_reranking=False)

        # Verify search was called with top_k=10 (no multiplier when reranking disabled)
        call_args = mock_vs_instance.search.call_args
        assert call_args.kwargs.get("top_k") == 10

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_empty_results(self, mock_vs, mock_emb):
        """Should handle empty results gracefully."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = []
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve("obscure query")

        assert results == []

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_uses_float_embeddings(self, mock_vs, mock_emb):
        """Should use float embeddings for search (not binary)."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        float_emb = np.random.rand(1, 384).astype(np.float32)
        binary_emb = np.random.rand(1, 48).astype(np.uint8)

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (float_emb, binary_emb)
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = []
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        pipeline.retrieve("test")

        # Verify search was called with float embedding (first element)
        call_args = mock_vs_instance.search.call_args
        query_vector = call_args.kwargs.get("query_vector")
        assert query_vector.shape == (384,)  # Should be float embedding


class TestRetrieveForProduct:
    """Test product-filtered retrieval."""

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_for_product_filters_results(self, mock_vs, mock_emb):
        """Should filter results by product_id."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        # Return mixed results
        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "1", "score": 0.95, "text": "Text 1", "metadata": {"product_id": "prod_001"}},
            {"id": "2", "score": 0.90, "text": "Text 2", "metadata": {"product_id": "prod_002"}},
            {"id": "3", "score": 0.85, "text": "Text 3", "metadata": {"product_id": "prod_001"}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve_for_product("prod_001", "risk analysis")

        # Should prioritize prod_001 results
        filtered_ids = [
            r["metadata"]["product_id"]
            for r in results
            if r["metadata"].get("product_id") == "prod_001"
        ]
        assert len(filtered_ids) >= 2

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_for_product_includes_general_if_needed(self, mock_vs, mock_emb):
        """Should include general results if not enough product-specific."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        # Return only 1 product-specific result
        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "1", "score": 0.95, "text": "Text 1", "metadata": {"product_id": "prod_001"}},
            {"id": "2", "score": 0.90, "text": "Text 2", "metadata": {"product_id": "prod_002"}},
            {"id": "3", "score": 0.85, "text": "Text 3", "metadata": {"product_id": "prod_003"}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline(top_k=3)
        results = pipeline.retrieve_for_product("prod_001", "test", top_k=3)

        # Should have 3 results (1 specific + 2 general)
        assert len(results) == 3

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_for_product_no_matches(self, mock_vs, mock_emb):
        """Should return general results if no product matches."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "1", "score": 0.95, "text": "Text 1", "metadata": {"product_id": "other"}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve_for_product("nonexistent", "test")

        # Should fall back to general results
        assert len(results) == 1


class TestRetrieveByTheme:
    """Test theme-filtered retrieval."""

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_by_theme_filters_results(self, mock_vs, mock_emb):
        """Should filter results by theme."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "1", "score": 0.95, "text": "Text 1", "metadata": {"theme": "usability"}},
            {"id": "2", "score": 0.90, "text": "Text 2", "metadata": {"theme": "performance"}},
            {"id": "3", "score": 0.85, "text": "Text 3", "metadata": {"theme": "usability"}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve_by_theme("usability", "feedback analysis")

        # Should only return usability results
        assert len(results) == 2
        assert all(r["metadata"]["theme"] == "usability" for r in results)

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_by_theme_case_insensitive(self, mock_vs, mock_emb):
        """Should match themes case-insensitively."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "1", "score": 0.95, "text": "Text 1", "metadata": {"theme": "Usability"}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve_by_theme("usability", "test")

        assert len(results) == 1

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_retrieve_by_theme_returns_all_if_no_matches(self, mock_vs, mock_emb):
        """Should return all results if no theme matches."""
        from ai_insights.retrieval.retrieval import RetrievalPipeline

        mock_emb_instance = MagicMock()
        mock_emb_instance.embed_and_quantize.return_value = (
            np.random.rand(1, 384).astype(np.float32),
            np.random.rand(1, 48).astype(np.uint8),
        )
        mock_emb.return_value = mock_emb_instance

        mock_vs_instance = MagicMock()
        mock_vs_instance.search.return_value = [
            {"id": "1", "score": 0.95, "text": "Text 1", "metadata": {"theme": "other"}},
            {"id": "2", "score": 0.90, "text": "Text 2", "metadata": {"theme": "different"}},
        ]
        mock_vs.return_value = mock_vs_instance

        pipeline = RetrievalPipeline()
        results = pipeline.retrieve_by_theme("nonexistent", "test")

        # Should fall back to all results
        assert len(results) == 2


class TestGetRetrievalPipeline:
    """Test singleton factory function."""

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_get_retrieval_pipeline_returns_instance(self, mock_vs, mock_emb):
        """Should return RetrievalPipeline instance."""
        import ai_insights.retrieval.retrieval as ret_module

        # Reset singleton
        ret_module._retrieval_instance = None

        pipeline = ret_module.get_retrieval_pipeline()

        assert isinstance(pipeline, ret_module.RetrievalPipeline)

    @patch("ai_insights.retrieval.retrieval.get_embeddings")
    @patch("ai_insights.retrieval.retrieval.get_vector_store")
    def test_get_retrieval_pipeline_returns_singleton(self, mock_vs, mock_emb):
        """Should return same instance on multiple calls."""
        import ai_insights.retrieval.retrieval as ret_module

        # Reset singleton
        ret_module._retrieval_instance = None

        p1 = ret_module.get_retrieval_pipeline()
        p2 = ret_module.get_retrieval_pipeline()

        assert p1 is p2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
