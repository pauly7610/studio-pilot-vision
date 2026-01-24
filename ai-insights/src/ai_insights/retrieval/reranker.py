"""
Cross-Encoder Reranking Module
Improves retrieval accuracy by reranking initial results with a cross-encoder model.

WHY: Vector similarity (bi-encoder) retrieves candidates quickly but may miss
     semantic nuances. Cross-encoders jointly encode query+document for better
     relevance scoring, improving accuracy by 10-20% on complex queries.

ARCHITECTURE:
1. Initial retrieval: Fast bi-encoder (top-k=20)
2. Reranking: Slow cross-encoder (rerank to top-n=5)
3. Result: Best of both - speed + accuracy
"""

import os
from typing import Any, Optional

from ai_insights.config import get_logger


class CrossEncoderReranker:
    """
    Cross-encoder reranker for improving retrieval precision.

    Uses a lightweight cross-encoder model that jointly encodes query+document
    pairs to produce more accurate relevance scores than bi-encoder similarity.

    Design decisions:
    1. Lazy loading - model loaded on first use to save memory
    2. Configurable model - can swap models via environment variable
    3. Score normalization - outputs 0-1 range for consistency
    4. Fallback - returns original results if reranking fails
    """

    # Default model - small but effective
    DEFAULT_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize reranker with lazy model loading.

        Args:
            model_name: Cross-encoder model name (default: ms-marco-MiniLM-L-6-v2)
        """
        self.model_name = model_name or os.getenv(
            "RERANKER_MODEL", self.DEFAULT_MODEL
        )
        self._model = None
        self._available = None
        self.logger = get_logger(__name__)

    def _load_model(self):
        """Lazy load the cross-encoder model."""
        if self._model is not None:
            return

        try:
            from sentence_transformers import CrossEncoder

            self.logger.info(f"Loading cross-encoder model: {self.model_name}")
            self._model = CrossEncoder(self.model_name)
            self._available = True
            self.logger.info("Cross-encoder model loaded successfully")

        except ImportError:
            self.logger.warning(
                "sentence-transformers not installed - reranking disabled"
            )
            self._available = False

        except Exception as e:
            self.logger.error(f"Failed to load cross-encoder model: {e}")
            self._available = False

    def is_available(self) -> bool:
        """Check if reranker is available."""
        if self._available is None:
            self._load_model()
        return self._available

    def rerank(
        self,
        query: str,
        documents: list[dict[str, Any]],
        top_n: Optional[int] = None,
        text_key: str = "text",
    ) -> list[dict[str, Any]]:
        """
        Rerank documents using cross-encoder scoring.

        Args:
            query: User query
            documents: List of document dicts with text content
            top_n: Number of top results to return (default: all)
            text_key: Key to access document text (default: "text")

        Returns:
            Reranked documents with updated scores

        WHY: Cross-encoder scores are more accurate than bi-encoder cosine
             similarity because they jointly encode query+document context.
        """
        if not documents:
            return documents

        # Lazy load model
        self._load_model()

        # Fallback if model unavailable
        if not self._available:
            self.logger.warning("Reranker unavailable - returning original order")
            return documents[:top_n] if top_n else documents

        try:
            # Extract text from documents
            texts = []
            for doc in documents:
                if isinstance(doc, dict):
                    text = doc.get(text_key, "") or doc.get("content", "") or str(doc)
                else:
                    text = str(doc)
                texts.append(text)

            # Create query-document pairs for cross-encoder
            pairs = [(query, text) for text in texts]

            # Get cross-encoder scores
            scores = self._model.predict(pairs)

            # Normalize scores to 0-1 range using sigmoid
            import numpy as np
            normalized_scores = 1 / (1 + np.exp(-scores))

            # Attach scores to documents
            scored_docs = []
            for i, doc in enumerate(documents):
                doc_copy = doc.copy() if isinstance(doc, dict) else {"content": str(doc)}
                doc_copy["rerank_score"] = float(normalized_scores[i])
                doc_copy["original_score"] = doc.get("score", 0.0) if isinstance(doc, dict) else 0.0
                scored_docs.append(doc_copy)

            # Sort by rerank score (descending)
            scored_docs.sort(key=lambda x: x["rerank_score"], reverse=True)

            # Return top_n results
            result = scored_docs[:top_n] if top_n else scored_docs

            self.logger.debug(
                f"Reranked {len(documents)} docs -> top {len(result)} "
                f"(best score: {result[0]['rerank_score']:.3f})"
            )

            return result

        except Exception as e:
            self.logger.error(f"Reranking failed: {e}")
            return documents[:top_n] if top_n else documents

    def rerank_with_metadata_boost(
        self,
        query: str,
        documents: list[dict[str, Any]],
        top_n: Optional[int] = None,
        boost_fields: Optional[dict[str, float]] = None,
    ) -> list[dict[str, Any]]:
        """
        Rerank with metadata boosting for domain-specific relevance.

        Args:
            query: User query
            documents: List of document dicts
            top_n: Number of top results
            boost_fields: Dict of {metadata_field: boost_weight}
                         e.g., {"product_id_match": 0.1, "recency": 0.05}

        Returns:
            Reranked documents with combined scores

        WHY: Pure semantic relevance may not capture domain importance.
             Boosting recent documents or product-specific matches improves
             practical relevance.
        """
        # First do semantic reranking
        reranked = self.rerank(query, documents, top_n=None)

        if not boost_fields:
            return reranked[:top_n] if top_n else reranked

        # Apply metadata boosts
        for doc in reranked:
            boost = 0.0
            metadata = doc.get("metadata", {})

            for field, weight in boost_fields.items():
                if field == "recency" and "timestamp" in metadata:
                    # Boost recent documents (decay over 30 days)
                    from datetime import datetime
                    try:
                        doc_time = datetime.fromisoformat(metadata["timestamp"])
                        age_days = (datetime.utcnow() - doc_time).days
                        recency_score = max(0, 1 - (age_days / 30))
                        boost += weight * recency_score
                    except (ValueError, TypeError):
                        pass

                elif field in metadata and metadata[field]:
                    # Binary boost for presence of field
                    boost += weight

            # Combine rerank score with boost (capped at 1.0)
            # Use rerank_score if available, otherwise use original score or default
            base_score = doc.get("rerank_score", doc.get("score", 0.5))
            doc["final_score"] = min(1.0, base_score + boost)

        # Re-sort by final score
        reranked.sort(key=lambda x: x.get("final_score", x.get("rerank_score", x.get("score", 0))), reverse=True)

        return reranked[:top_n] if top_n else reranked


# Global instance
_reranker: Optional[CrossEncoderReranker] = None


def get_reranker() -> CrossEncoderReranker:
    """Get or create global reranker instance."""
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoderReranker()
    return _reranker
