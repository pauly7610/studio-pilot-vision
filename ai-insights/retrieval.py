"""Retrieval Pipeline Module"""
from typing import List, Dict, Any, Optional
from embeddings import get_embeddings
from vector_store import get_vector_store
from config import TOP_K


class RetrievalPipeline:
    """Retrieval pipeline using embeddings and vector similarity."""
    
    def __init__(self, top_k: int = TOP_K):
        self.embeddings = get_embeddings()
        self.vector_store = get_vector_store()
        self.top_k = top_k
    
    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        use_hybrid: bool = False,  # Not used in Lite mode
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: User query string
            top_k: Number of results to return
            use_hybrid: Ignored in Lite mode (uses cosine similarity)
        
        Returns:
            List of relevant document chunks with metadata
        """
        k = top_k or self.top_k
        
        # Generate embeddings for query
        float_emb, _ = self.embeddings.embed_and_quantize(query)
        
        # Use float embeddings for search (Milvus Lite uses cosine similarity)
        results = self.vector_store.search(
            query_vector=float_emb[0],
            top_k=k,
        )
        
        return results
    
    def retrieve_for_product(
        self,
        product_id: str,
        query: str,
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve documents filtered by product ID."""
        results = self.retrieve(query, top_k)
        
        # Filter results by product_id
        filtered = [
            r for r in results
            if r.get("metadata", {}).get("product_id") == product_id
        ]
        
        # If not enough product-specific results, include general ones
        if len(filtered) < (top_k or self.top_k):
            general = [r for r in results if r not in filtered]
            filtered.extend(general[:((top_k or self.top_k) - len(filtered))])
        
        return filtered
    
    def retrieve_by_theme(
        self,
        theme: str,
        query: str,
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve documents filtered by theme (e.g., feedback theme)."""
        results = self.retrieve(query, top_k)
        
        # Filter results by theme
        filtered = [
            r for r in results
            if r.get("metadata", {}).get("theme", "").lower() == theme.lower()
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
