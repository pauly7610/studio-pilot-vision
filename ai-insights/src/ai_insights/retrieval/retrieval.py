"""
Retrieval Pipeline Module
Two-stage retrieval: Fast bi-encoder search + Cross-encoder reranking.

ARCHITECTURE:
1. Stage 1: Bi-encoder embedding search (fast, top-k=20)
2. Stage 2: Cross-encoder reranking (accurate, top-n=5)

WHY: Bi-encoders are fast but less accurate. Cross-encoders are accurate
     but slow (O(n) inference). Two-stage gives best of both.
"""

from typing import Any, Optional

from ai_insights.config.config import TOP_K
from ai_insights.retrieval.embeddings import get_embeddings
from ai_insights.retrieval.vector_store import get_vector_store
from ai_insights.retrieval.reranker import get_reranker


class RetrievalPipeline:
    """
    Two-stage retrieval pipeline with optional reranking.

    Stage 1: Fast bi-encoder vector search
    Stage 2: Accurate cross-encoder reranking (optional)
    """

    # Retrieve more candidates for reranking
    RERANK_CANDIDATE_MULTIPLIER = 4

    def __init__(self, top_k: int = TOP_K, use_reranking: bool = True):
        self.embeddings = get_embeddings()
        self.vector_store = get_vector_store()
        self.reranker = get_reranker()
        self.top_k = top_k
        self.use_reranking = use_reranking

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        use_hybrid: bool = False,  # Not used in Lite mode
        use_reranking: Optional[bool] = None,
    ) -> list[dict[str, Any]]:
        """
        Retrieve relevant documents for a query with optional reranking.

        Args:
            query: User query string
            top_k: Number of final results to return
            use_hybrid: Ignored in Lite mode (uses cosine similarity)
            use_reranking: Override default reranking setting

        Returns:
            List of relevant document chunks with metadata

        PERFORMANCE:
        - Without reranking: ~50-100ms
        - With reranking: ~150-250ms (but 10-20% more accurate)
        """
        k = top_k or self.top_k
        should_rerank = use_reranking if use_reranking is not None else self.use_reranking

        # Generate embeddings for query
        float_emb, _ = self.embeddings.embed_and_quantize(query)

        # Stage 1: Fast bi-encoder search
        # Retrieve more candidates if reranking is enabled
        search_k = k * self.RERANK_CANDIDATE_MULTIPLIER if should_rerank else k

        results = self.vector_store.search(
            query_vector=float_emb[0],
            top_k=search_k,
        )

        # Stage 2: Cross-encoder reranking (if enabled and available)
        if should_rerank and self.reranker.is_available() and len(results) > 1:
            results = self.reranker.rerank(
                query=query,
                documents=results,
                top_n=k,
                text_key="text",
            )
        else:
            results = results[:k]

        return results

    def retrieve_for_product(
        self,
        product_id: str,
        query: str,
        top_k: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """Retrieve documents filtered by product ID."""
        results = self.retrieve(query, top_k)

        # Filter results by product_id
        filtered = [r for r in results if r.get("metadata", {}).get("product_id") == product_id]

        # If not enough product-specific results, include general ones
        if len(filtered) < (top_k or self.top_k):
            general = [r for r in results if r not in filtered]
            filtered.extend(general[: ((top_k or self.top_k) - len(filtered))])

        return filtered

    def retrieve_by_theme(
        self,
        theme: str,
        query: str,
        top_k: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """Retrieve documents filtered by theme (e.g., feedback theme)."""
        results = self.retrieve(query, top_k)

        # Filter results by theme
        filtered = [
            r for r in results if r.get("metadata", {}).get("theme", "").lower() == theme.lower()
        ]

        return filtered if filtered else results


# Singleton instance
_retrieval_instance = None


def get_retrieval_pipeline() -> RetrievalPipeline:
    """Get or create singleton retrieval pipeline instance."""
    global _retrieval_instance
    if _retrieval_instance is None:
        _retrieval_instance = RetrievalPipeline()
    return _retrieval_instance
