"""
Tests for ai_insights.retrieval.embeddings module.

Tests the BinaryEmbeddings class for embedding generation and quantization.
Currently at 32% coverage - targeting 80%+.
"""

from unittest.mock import MagicMock, Mock, patch

import numpy as np
import pytest


class TestBinaryEmbeddingsInit:
    """Test BinaryEmbeddings initialization."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_init_with_default_model(self, mock_st):
        """Should initialize with default model."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        mock_st.assert_called_once()
        assert embeddings.model is not None

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_init_with_custom_model(self, mock_st):
        """Should accept custom model name."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        BinaryEmbeddings(model_name="custom-model")

        mock_st.assert_called_with("custom-model")

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_init_sets_dimension(self, mock_st):
        """Should set embedding dimension."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        assert embeddings.dim > 0


class TestEmbedText:
    """Test text embedding generation."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_embed_single_text(self, mock_st):
        """Should embed single text string."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([[0.1, 0.2, 0.3] * 128])  # 384 dims
        mock_st.return_value = mock_model

        embeddings = BinaryEmbeddings()
        result = embeddings.embed_text("Test sentence")

        mock_model.encode.assert_called_once()
        assert result.dtype == np.float32

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_embed_text_list(self, mock_st):
        """Should embed list of texts."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        mock_model = MagicMock()
        mock_model.encode.return_value = np.random.rand(3, 384).astype(np.float32)
        mock_st.return_value = mock_model

        embeddings = BinaryEmbeddings()
        result = embeddings.embed_text(["Text 1", "Text 2", "Text 3"])

        assert result.shape[0] == 3

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_embed_text_converts_string_to_list(self, mock_st):
        """Should convert single string to list internally."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        mock_model = MagicMock()
        mock_model.encode.return_value = np.random.rand(1, 384).astype(np.float32)
        mock_st.return_value = mock_model

        embeddings = BinaryEmbeddings()
        embeddings.embed_text("Single string")

        # Check that encode was called with a list
        call_args = mock_model.encode.call_args
        assert isinstance(call_args[0][0], list)


class TestQuantizeToBinary:
    """Test binary quantization."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_quantize_positive_values(self, mock_st):
        """Positive values should become 1."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()
        embeddings.dim = 8  # Simple case

        # All positive values
        float_emb = np.array([[0.5, 0.3, 0.8, 0.1, 0.9, 0.2, 0.7, 0.4]])
        binary = embeddings.quantize_to_binary(float_emb)

        # Should be packed into 1 byte (8 bits)
        assert binary.shape == (1, 1)
        assert binary.dtype == np.uint8
        # All positive -> all 1s -> 0xFF = 255
        assert binary[0, 0] == 255

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_quantize_negative_values(self, mock_st):
        """Negative values should become 0."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()
        embeddings.dim = 8

        # All negative values
        float_emb = np.array([[-0.5, -0.3, -0.8, -0.1, -0.9, -0.2, -0.7, -0.4]])
        binary = embeddings.quantize_to_binary(float_emb)

        # All negative -> all 0s -> 0x00 = 0
        assert binary[0, 0] == 0

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_quantize_mixed_values(self, mock_st):
        """Mixed values should produce expected pattern."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()
        embeddings.dim = 8

        # Pattern: +, -, +, -, +, -, +, -
        float_emb = np.array([[0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5]])
        binary = embeddings.quantize_to_binary(float_emb)

        # Binary: 10101010 = 0xAA = 170
        assert binary[0, 0] == 170

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_quantize_384_dimensions(self, mock_st):
        """Should handle full 384-dimensional embeddings."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()
        embeddings.dim = 384

        float_emb = np.random.randn(5, 384).astype(np.float32)
        binary = embeddings.quantize_to_binary(float_emb)

        # 384 bits = 48 bytes
        assert binary.shape == (5, 48)
        assert binary.dtype == np.uint8


class TestEmbedAndQuantize:
    """Test combined embed and quantize operation."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_embed_and_quantize_returns_both(self, mock_st):
        """Should return both float and binary embeddings."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        mock_model = MagicMock()
        mock_model.encode.return_value = np.random.randn(2, 384).astype(np.float32)
        mock_st.return_value = mock_model

        embeddings = BinaryEmbeddings()
        float_emb, binary_emb = embeddings.embed_and_quantize(["Text 1", "Text 2"])

        assert float_emb.shape == (2, 384)
        assert float_emb.dtype == np.float32
        assert binary_emb.shape == (2, 48)  # 384/8 = 48
        assert binary_emb.dtype == np.uint8

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_embed_and_quantize_single_string(self, mock_st):
        """Should handle single string input."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        mock_model = MagicMock()
        mock_model.encode.return_value = np.random.randn(1, 384).astype(np.float32)
        mock_st.return_value = mock_model

        embeddings = BinaryEmbeddings()
        float_emb, binary_emb = embeddings.embed_and_quantize("Single text")

        assert float_emb.shape == (1, 384)
        assert binary_emb.shape == (1, 48)


class TestHammingDistance:
    """Test Hamming distance calculation."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_hamming_distance_identical(self, mock_st):
        """Identical vectors should have distance 0."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        a = np.array([255, 0, 170], dtype=np.uint8)  # 11111111 00000000 10101010
        b = np.array([255, 0, 170], dtype=np.uint8)

        distance = embeddings.hamming_distance(a, b)

        assert distance == 0

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_hamming_distance_opposite(self, mock_st):
        """Completely opposite vectors should have max distance."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        a = np.array([255], dtype=np.uint8)  # 11111111
        b = np.array([0], dtype=np.uint8)  # 00000000

        distance = embeddings.hamming_distance(a, b)

        assert distance == 8  # All 8 bits different

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_hamming_distance_one_bit(self, mock_st):
        """One bit difference should return 1."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        a = np.array([0b11111111], dtype=np.uint8)
        b = np.array([0b11111110], dtype=np.uint8)

        distance = embeddings.hamming_distance(a, b)

        assert distance == 1


class TestBatchHammingDistance:
    """Test batch Hamming distance calculation."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_batch_hamming_distance(self, mock_st):
        """Should calculate distances to multiple vectors."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        query = np.array([255, 0], dtype=np.uint8)
        corpus = np.array(
            [
                [255, 0],  # Same as query
                [0, 255],  # Opposite
                [255, 255],  # Half different
            ],
            dtype=np.uint8,
        )

        distances = embeddings.batch_hamming_distance(query, corpus)

        assert len(distances) == 3
        assert distances[0] == 0  # Identical
        assert distances[1] == 16  # All bits different (8+8)
        assert distances[2] == 8  # Half different (0+8)

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_batch_hamming_returns_array(self, mock_st):
        """Should return numpy array of distances."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        embeddings = BinaryEmbeddings()

        query = np.array([128], dtype=np.uint8)
        corpus = np.array([[128], [64], [0]], dtype=np.uint8)

        distances = embeddings.batch_hamming_distance(query, corpus)

        assert isinstance(distances, np.ndarray)


class TestGetEmbeddings:
    """Test singleton factory function."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_get_embeddings_returns_instance(self, mock_st):
        """Should return BinaryEmbeddings instance."""
        import ai_insights.retrieval.embeddings as emb_module

        # Reset singleton
        emb_module._embeddings_instance = None

        embeddings = emb_module.get_embeddings()

        assert isinstance(embeddings, emb_module.BinaryEmbeddings)

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_get_embeddings_returns_singleton(self, mock_st):
        """Should return same instance on multiple calls."""
        import ai_insights.retrieval.embeddings as emb_module

        # Reset singleton
        emb_module._embeddings_instance = None

        emb1 = emb_module.get_embeddings()
        emb2 = emb_module.get_embeddings()

        assert emb1 is emb2


class TestMemoryReduction:
    """Test that binary quantization achieves memory reduction."""

    @patch("ai_insights.retrieval.embeddings.SentenceTransformer")
    def test_32x_memory_reduction(self, mock_st):
        """Binary embeddings should use 32x less memory."""
        from ai_insights.retrieval.embeddings import BinaryEmbeddings

        mock_model = MagicMock()
        mock_model.encode.return_value = np.random.randn(100, 384).astype(np.float32)
        mock_st.return_value = mock_model

        embeddings = BinaryEmbeddings()
        float_emb, binary_emb = embeddings.embed_and_quantize(["text"] * 100)

        float_bytes = float_emb.nbytes
        binary_bytes = binary_emb.nbytes

        # Float32: 100 * 384 * 4 bytes = 153,600 bytes
        # Binary: 100 * 48 * 1 byte = 4,800 bytes
        # Ratio should be ~32x

        ratio = float_bytes / binary_bytes
        assert ratio >= 30  # Allow some tolerance


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
