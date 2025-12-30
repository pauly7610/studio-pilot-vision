"""Binary Embeddings Module with Quantization"""

from typing import Union

import numpy as np
from sentence_transformers import SentenceTransformer

from ai_insights.config.config import EMBEDDING_DIM, EMBEDDING_MODEL


class BinaryEmbeddings:
    """Generate binary quantized embeddings for 32x memory reduction."""

    def __init__(self, model_name: str = EMBEDDING_MODEL):
        self.model = SentenceTransformer(model_name)
        self.dim = EMBEDDING_DIM

    def embed_text(self, text: Union[str, list[str]]) -> np.ndarray:
        """Generate float32 embeddings."""
        if isinstance(text, str):
            text = [text]
        embeddings = self.model.encode(text, convert_to_numpy=True)
        return embeddings.astype(np.float32)

    def quantize_to_binary(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Convert float32 embeddings to binary vectors.
        Uses sign-based quantization: positive values -> 1, negative -> 0
        Packs bits into uint8 for 32x memory reduction.
        """
        # Sign-based binarization
        binary = (embeddings > 0).astype(np.uint8)

        # Pack bits into bytes (8 bits per byte)
        n_samples = binary.shape[0]
        n_bytes = self.dim // 8
        packed = np.zeros((n_samples, n_bytes), dtype=np.uint8)

        for i in range(n_bytes):
            for j in range(8):
                bit_idx = i * 8 + j
                if bit_idx < self.dim:
                    packed[:, i] |= binary[:, bit_idx] << (7 - j)

        return packed

    def embed_and_quantize(self, text: Union[str, list[str]]) -> tuple[np.ndarray, np.ndarray]:
        """Generate both float32 and binary embeddings."""
        float_embeddings = self.embed_text(text)
        binary_embeddings = self.quantize_to_binary(float_embeddings)
        return float_embeddings, binary_embeddings

    def hamming_distance(self, a: np.ndarray, b: np.ndarray) -> int:
        """Calculate Hamming distance between two binary vectors."""
        xor = np.bitwise_xor(a, b)
        return np.sum(np.unpackbits(xor))

    def batch_hamming_distance(self, query: np.ndarray, corpus: np.ndarray) -> np.ndarray:
        """Calculate Hamming distances between query and all corpus vectors."""
        # XOR and count bits
        xor = np.bitwise_xor(query, corpus)
        distances = np.array([np.sum(np.unpackbits(x)) for x in xor])
        return distances


# Singleton instance
_embeddings_instance = None


def get_embeddings() -> BinaryEmbeddings:
    """Get or create singleton embeddings instance."""
    global _embeddings_instance
    if _embeddings_instance is None:
        _embeddings_instance = BinaryEmbeddings()
    return _embeddings_instance
