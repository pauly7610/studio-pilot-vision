"""
Tests for ai_insights.retrieval.reranker module.

Tests the cross-encoder reranking functionality.
"""

import pytest
from unittest.mock import MagicMock, patch


class TestCrossEncoderReranker:
    """Tests for CrossEncoderReranker class."""

    def test_reranker_initialization(self):
        """Should initialize with default model name."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        assert reranker.model_name == "cross-encoder/ms-marco-MiniLM-L-6-v2"
        assert reranker._model is None  # Lazy loading

    def test_reranker_custom_model(self):
        """Should accept custom model name."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker(model_name="custom/model")
        assert reranker.model_name == "custom/model"

    def test_reranker_empty_documents(self):
        """Should handle empty document list."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        result = reranker.rerank("test query", [])
        assert result == []

    def test_reranker_single_document(self):
        """Should handle single document."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        docs = [{"text": "test document", "score": 0.5}]
        
        # Without model loaded, returns original
        result = reranker.rerank("test query", docs)
        assert len(result) == 1

    @patch("ai_insights.retrieval.reranker.CrossEncoderReranker._load_model")
    def test_reranker_respects_top_n(self, mock_load):
        """Should return only top_n results."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        reranker._available = False  # Skip model loading
        
        docs = [
            {"text": f"doc {i}", "score": 0.5} 
            for i in range(10)
        ]
        
        result = reranker.rerank("query", docs, top_n=3)
        assert len(result) == 3

    def test_reranker_handles_dict_documents(self):
        """Should extract text from dict documents."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        reranker._available = False
        
        docs = [
            {"text": "text in text field"},
            {"content": "text in content field"},
            {"other": "text in other field"},
        ]
        
        result = reranker.rerank("query", docs, top_n=3)
        assert len(result) == 3

    def test_is_available_without_import(self):
        """Should return False when model unavailable."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        reranker._available = False
        assert reranker.is_available() is False


class TestRerankerWithMetadataBoost:
    """Tests for metadata boosting functionality."""

    def test_boost_with_no_fields(self):
        """Should work without boost fields."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        reranker._available = False
        
        docs = [{"text": "doc 1"}, {"text": "doc 2"}]
        result = reranker.rerank_with_metadata_boost("query", docs)
        
        assert len(result) == 2

    def test_boost_with_binary_fields(self):
        """Should apply binary boost for presence of fields."""
        from ai_insights.retrieval.reranker import CrossEncoderReranker

        reranker = CrossEncoderReranker()
        reranker._available = False
        
        docs = [
            {"text": "doc 1", "metadata": {"important": True}},
            {"text": "doc 2", "metadata": {}},
        ]
        
        result = reranker.rerank_with_metadata_boost(
            "query", 
            docs, 
            boost_fields={"important": 0.1}
        )
        
        assert len(result) == 2


class TestGetReranker:
    """Tests for get_reranker singleton function."""

    def test_get_reranker_returns_instance(self):
        """Should return reranker instance."""
        from ai_insights.retrieval.reranker import get_reranker

        reranker = get_reranker()
        assert reranker is not None

    def test_get_reranker_singleton(self):
        """Should return same instance on multiple calls."""
        from ai_insights.retrieval import reranker as reranker_module
        
        # Reset singleton
        reranker_module._reranker = None
        
        r1 = reranker_module.get_reranker()
        r2 = reranker_module.get_reranker()
        
        assert r1 is r2
