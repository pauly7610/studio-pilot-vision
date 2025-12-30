"""Document Ingestion Module using LlamaIndex"""

import hashlib
import os
from pathlib import Path
from typing import Any, Optional

from llama_index.core import Document, SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter

from ai_insights.config.config import CHUNK_OVERLAP, CHUNK_SIZE, DOCUMENTS_PATH
from ai_insights.retrieval.embeddings import get_embeddings
from ai_insights.retrieval.vector_store import get_vector_store


class DocumentLoader:
    """Load and process documents for RAG pipeline."""

    def __init__(
        self,
        documents_path: str = DOCUMENTS_PATH,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP,
    ):
        self.documents_path = documents_path
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embeddings = get_embeddings()
        self.vector_store = get_vector_store()
        self.splitter = SentenceSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    def _generate_doc_id(self, file_path: str, content: str) -> str:
        """Generate unique document ID from file path and content hash."""
        content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
        file_name = Path(file_path).stem
        return f"{file_name}_{content_hash}"

    def load_directory(self, path: Optional[str] = None) -> list[Document]:
        """Load all documents from a directory."""
        load_path = path or self.documents_path

        if not os.path.exists(load_path):
            os.makedirs(load_path, exist_ok=True)
            print(f"Created documents directory: {load_path}")
            return []

        reader = SimpleDirectoryReader(
            input_dir=load_path,
            recursive=True,
            required_exts=[".pdf", ".txt", ".md", ".docx", ".csv", ".json"],
        )

        try:
            documents = reader.load_data()
            print(f"Loaded {len(documents)} documents from {load_path}")
            return documents
        except Exception as e:
            print(f"Error loading documents: {e}")
            return []

    def load_from_text(self, text: str, metadata: dict[str, Any] = None) -> Document:
        """Create a document from raw text."""
        return Document(
            text=text,
            metadata=metadata or {},
        )

    def load_product_data(self, products: list[dict[str, Any]]) -> list[Document]:
        """Convert product data from Supabase into documents."""
        documents = []

        for product in products:
            # Create rich text representation of product
            text_parts = [
                f"Product: {product.get('name', 'Unknown')}",
                f"Type: {product.get('product_type', 'Unknown')}",
                f"Region: {product.get('region', 'Unknown')}",
                f"Lifecycle Stage: {product.get('lifecycle_stage', 'Unknown')}",
                f"Owner: {product.get('owner_email', 'Unknown')}",
            ]

            if product.get("revenue_target"):
                text_parts.append(f"Revenue Target: ${product['revenue_target']:,.0f}")

            if product.get("launch_date"):
                text_parts.append(f"Launch Date: {product['launch_date']}")

            if product.get("success_metric"):
                text_parts.append(f"Success Metric: {product['success_metric']}")

            if product.get("gating_status"):
                text_parts.append(f"Gating Status: {product['gating_status']}")

            # Add readiness data
            readiness = product.get("readiness", [])
            if readiness and len(readiness) > 0:
                r = readiness[0] if isinstance(readiness, list) else readiness
                text_parts.append(f"Readiness Score: {r.get('overall_score', 'N/A')}%")
                text_parts.append(f"Risk Band: {r.get('risk_band', 'N/A')}")

            # Add prediction data
            prediction = product.get("prediction", [])
            if prediction and len(prediction) > 0:
                p = prediction[0] if isinstance(prediction, list) else prediction
                text_parts.append(f"Revenue Probability: {p.get('revenue_probability', 'N/A')}%")
                text_parts.append(f"Timeline Probability: {p.get('timeline_probability', 'N/A')}%")

            # Add compliance data
            compliance = product.get("compliance", [])
            if compliance and len(compliance) > 0:
                c = compliance[0] if isinstance(compliance, list) else compliance
                text_parts.append(f"Compliance Status: {c.get('status', 'N/A')}")

            text = "\n".join(text_parts)

            doc = Document(
                text=text,
                metadata={
                    "source": "supabase",
                    "product_id": product.get("id"),
                    "product_name": product.get("name"),
                    "product_type": product.get("product_type"),
                    "region": product.get("region"),
                    "lifecycle_stage": product.get("lifecycle_stage"),
                },
            )
            documents.append(doc)

        print(f"Created {len(documents)} documents from product data")
        return documents

    def load_feedback_data(self, feedback: list[dict[str, Any]]) -> list[Document]:
        """Convert feedback data into documents."""
        documents = []

        for fb in feedback:
            text_parts = [
                f"Feedback: {fb.get('raw_text', '')}",
                f"Source: {fb.get('source', 'Unknown')}",
                f"Theme: {fb.get('theme', 'Unknown')}",
                f"Sentiment Score: {fb.get('sentiment_score', 0)}",
                f"Impact Level: {fb.get('impact_level', 'Unknown')}",
            ]

            text = "\n".join(text_parts)

            doc = Document(
                text=text,
                metadata={
                    "source": "feedback",
                    "feedback_id": fb.get("id"),
                    "product_id": fb.get("product_id"),
                    "theme": fb.get("theme"),
                    "sentiment": "positive" if fb.get("sentiment_score", 0) > 0 else "negative",
                    "impact_level": fb.get("impact_level"),
                },
            )
            documents.append(doc)

        print(f"Created {len(documents)} documents from feedback data")
        return documents

    def chunk_documents(self, documents: list[Document]) -> list[dict[str, Any]]:
        """Split documents into chunks."""
        all_chunks = []

        for doc in documents:
            nodes = self.splitter.get_nodes_from_documents([doc])

            doc_id = self._generate_doc_id(
                doc.metadata.get("file_path", "unknown"),
                doc.text,
            )

            for i, node in enumerate(nodes):
                chunk = {
                    "doc_id": doc_id,
                    "chunk_id": i,
                    "text": node.text,
                    "metadata": {**doc.metadata, "chunk_index": i},
                }
                all_chunks.append(chunk)

        print(f"Created {len(all_chunks)} chunks from {len(documents)} documents")
        return all_chunks

    def ingest_documents(self, documents: list[Document]) -> int:
        """Full pipeline: chunk, embed, and store documents."""
        if not documents:
            return 0

        # Chunk documents
        chunks = self.chunk_documents(documents)

        if not chunks:
            return 0

        # Extract texts for embedding
        texts = [c["text"] for c in chunks]
        doc_ids = [c["doc_id"] for c in chunks]
        chunk_ids = [c["chunk_id"] for c in chunks]
        metadata = [c["metadata"] for c in chunks]

        # Generate embeddings
        float_embeddings, binary_embeddings = self.embeddings.embed_and_quantize(texts)

        # Store in vector database
        self.vector_store.create_collection()
        ids = self.vector_store.insert(
            texts=texts,
            float_embeddings=float_embeddings,
            binary_embeddings=binary_embeddings,
            doc_ids=doc_ids,
            chunk_ids=chunk_ids,
            metadata=metadata,
        )

        print(f"Ingested {len(ids)} chunks into vector store")
        return len(ids)

    def ingest_from_directory(self, path: Optional[str] = None) -> int:
        """Load and ingest all documents from a directory."""
        documents = self.load_directory(path)
        return self.ingest_documents(documents)


# Singleton instance
_loader_instance = None


def get_document_loader() -> DocumentLoader:
    """Get or create singleton document loader instance."""
    global _loader_instance
    if _loader_instance is None:
        _loader_instance = DocumentLoader()
    return _loader_instance
