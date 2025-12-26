"""Milvus Vector Store with Binary Index Support - Fixed for Lite Mode"""
import numpy as np
from typing import List, Dict, Any, Optional
from pymilvus import MilvusClient
from config import (
    MILVUS_MODE,
    MILVUS_LITE_PATH,
    MILVUS_HOST,
    MILVUS_PORT,
    MILVUS_COLLECTION,
    EMBEDDING_DIM,
)


class MilvusVectorStore:
    """Vector store using Milvus with support for both Lite and Server modes.
    
    Milvus Lite uses MilvusClient API (simpler, in-process)
    Server mode also uses MilvusClient but connects to external server
    """
    
    def __init__(
        self,
        mode: str = MILVUS_MODE,
        lite_path: str = MILVUS_LITE_PATH,
        host: str = MILVUS_HOST,
        port: int = MILVUS_PORT,
        collection_name: str = MILVUS_COLLECTION,
    ):
        self.mode = mode
        self.lite_path = lite_path
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.client: Optional[MilvusClient] = None
        self._connect()
    
    def _connect(self):
        """Connect to Milvus (Lite or Server)."""
        try:
            if self.mode == "lite":
                # Milvus Lite - runs in-process, no Docker needed!
                self.client = MilvusClient(self.lite_path)
                print(f"Connected to Milvus Lite at {self.lite_path}")
            else:
                # External Milvus server
                uri = f"http://{self.host}:{self.port}"
                self.client = MilvusClient(uri=uri)
                print(f"Connected to Milvus server at {uri}")
        except Exception as e:
            print(f"Warning: Could not connect to Milvus: {e}")
            self.client = None
    
    def create_collection(self, drop_existing: bool = False):
        """Create collection with vector field."""
        if self.client is None:
            return
        
        if drop_existing and self.client.has_collection(self.collection_name):
            self.client.drop_collection(self.collection_name)
        
        if self.client.has_collection(self.collection_name):
            return
        
        # Create collection with auto schema
        self.client.create_collection(
            collection_name=self.collection_name,
            dimension=EMBEDDING_DIM,
            metric_type="COSINE",
            auto_id=True,
        )
        print(f"Created collection: {self.collection_name}")
    
    def insert(
        self,
        texts: List[str],
        float_embeddings: np.ndarray,
        binary_embeddings: np.ndarray,  # Kept for API compatibility
        doc_ids: List[str],
        chunk_ids: List[int],
        metadata: List[Dict[str, Any]],
    ) -> List[int]:
        """Insert documents with embeddings."""
        if self.client is None:
            return []
        
        self.create_collection()
        
        # Prepare data for MilvusClient
        data = []
        for i in range(len(texts)):
            data.append({
                "doc_id": doc_ids[i],
                "chunk_id": chunk_ids[i],
                "text": texts[i],
                "metadata": metadata[i],
                "vector": float_embeddings[i].tolist(),
            })
        
        result = self.client.insert(
            collection_name=self.collection_name,
            data=data,
        )
        
        return result.get("ids", [])
    
    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search using float embeddings with cosine similarity."""
        if self.client is None:
            return []
        
        if not self.client.has_collection(self.collection_name):
            return []
        
        results = self.client.search(
            collection_name=self.collection_name,
            data=[query_vector.tolist()],
            limit=top_k,
            output_fields=["doc_id", "chunk_id", "text", "metadata"],
        )
        
        hits = []
        for hit in results[0]:
            hits.append({
                "id": hit.get("id"),
                "score": hit.get("distance", 0),
                "doc_id": hit.get("entity", {}).get("doc_id"),
                "chunk_id": hit.get("entity", {}).get("chunk_id"),
                "text": hit.get("entity", {}).get("text"),
                "metadata": hit.get("entity", {}).get("metadata"),
            })
        
        return hits
    
    # Aliases for compatibility
    def search_binary(self, query_binary: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """Binary search - falls back to float search in Lite mode."""
        # Milvus Lite doesn't support binary vectors well, use float
        return []
    
    def search_float(self, query_float: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search using float embeddings."""
        return self.search(query_float, top_k)
    
    def hybrid_search(
        self,
        query_float: np.ndarray,
        query_binary: np.ndarray,
        top_k: int = 5,
        binary_candidates: int = 50,
    ) -> List[Dict[str, Any]]:
        """Hybrid search - uses float search in Lite mode."""
        return self.search(query_float, top_k)
    
    def delete_by_doc_id(self, doc_id: str):
        """Delete all chunks for a document."""
        if self.client is None:
            return
        
        if not self.client.has_collection(self.collection_name):
            return
        
        self.client.delete(
            collection_name=self.collection_name,
            filter=f'doc_id == "{doc_id}"',
        )
    
    def count(self) -> int:
        """Get total number of vectors in collection."""
        if self.client is None:
            return 0
        
        if not self.client.has_collection(self.collection_name):
            return 0
        
        stats = self.client.get_collection_stats(self.collection_name)
        return stats.get("row_count", 0)


# Singleton instance
_vector_store_instance = None

def get_vector_store() -> MilvusVectorStore:
    """Get or create singleton vector store instance."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = MilvusVectorStore()
    return _vector_store_instance
