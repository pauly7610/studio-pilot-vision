"""ChromaDB Vector Store - Works on all platforms including Windows"""

from typing import Any, Optional

import chromadb
import numpy as np

# ChromaDB collection name
COLLECTION_NAME = "studio_pilot_insights"


class ChromaVectorStore:
    """Vector store using ChromaDB for cross-platform compatibility."""

    def __init__(self, persist_directory: str = "./chroma_data"):
        self.persist_directory = persist_directory
        self.client: Optional[chromadb.Client] = None
        self.collection = None
        self._connect()

    def _connect(self):
        """Initialize ChromaDB client."""
        try:
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
            )
            print(f"Connected to ChromaDB at {self.persist_directory}")
        except Exception as e:
            print(f"Warning: Could not connect to ChromaDB: {e}")
            # Fallback to in-memory
            self.client = chromadb.Client()
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
            )
            print("Using in-memory ChromaDB")

    def insert(
        self,
        texts: list[str],
        float_embeddings: np.ndarray,
        binary_embeddings: np.ndarray,  # Kept for API compatibility
        doc_ids: list[str],
        chunk_ids: list[int],
        metadata: list[dict[str, Any]],
    ) -> list[str]:
        """Insert documents with embeddings."""
        if self.collection is None:
            return []

        # Generate unique IDs
        ids = [f"{doc_id}_{chunk_id}" for doc_id, chunk_id in zip(doc_ids, chunk_ids)]

        # Prepare metadata (ChromaDB requires flat metadata)
        flat_metadata = []
        for i, meta in enumerate(metadata):
            flat_meta = {
                "doc_id": doc_ids[i],
                "chunk_id": chunk_ids[i],
                "source": str(meta.get("source", "")),
                "product_id": str(meta.get("product_id", "")),
            }
            flat_metadata.append(flat_meta)

        self.collection.upsert(
            ids=ids,
            embeddings=float_embeddings.tolist(),
            documents=texts,
            metadatas=flat_metadata,
        )

        return ids

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Search using embeddings with cosine similarity."""
        if self.collection is None:
            return []

        results = self.collection.query(
            query_embeddings=[query_vector.tolist()],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        hits = []
        if results and results["ids"] and len(results["ids"]) > 0:
            for i, doc_id in enumerate(results["ids"][0]):
                hits.append(
                    {
                        "id": doc_id,
                        "score": 1 - (results["distances"][0][i] if results["distances"] else 0),
                        "doc_id": (
                            results["metadatas"][0][i].get("doc_id")
                            if results["metadatas"]
                            else None
                        ),
                        "chunk_id": (
                            results["metadatas"][0][i].get("chunk_id")
                            if results["metadatas"]
                            else None
                        ),
                        "text": results["documents"][0][i] if results["documents"] else None,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    }
                )

        return hits

    def search_float(self, query_float: np.ndarray, top_k: int = 5) -> list[dict[str, Any]]:
        """Search using float embeddings."""
        return self.search(query_float, top_k)

    def delete_by_doc_id(self, doc_id: str):
        """Delete all chunks for a document."""
        if self.collection is None:
            return

        self.collection.delete(where={"doc_id": doc_id})

    def count(self) -> int:
        """Get total number of vectors in collection."""
        if self.collection is None:
            return 0
        return self.collection.count()


# Singleton instance
_vector_store_instance = None


def get_vector_store() -> ChromaVectorStore:
    """Get or create singleton vector store instance."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = ChromaVectorStore()
    return _vector_store_instance
