"""
Tests for ai_insights.models.cognee_schemas module.

Tests schema validation for Cognee and RAG responses.
Validates that malformed LLM outputs are properly normalized.
"""

import pytest
from datetime import datetime


class TestCogneeSource:
    """Test CogneeSource schema validation."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource()
        
        assert source.entity_id == ""
        assert source.entity_type == "unknown"
        assert source.entity_name is None
        assert source.confidence == 0.0
        assert source.relevance == 0.0
        assert source.metadata == {}
    
    def test_coerce_string_confidence(self):
        """Should coerce string confidence to float."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence="0.85"
        )
        
        assert source.confidence == 0.85
    
    def test_coerce_percentage_confidence(self):
        """Should coerce percentage string to 0-1 float."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence="85%"
        )
        
        assert source.confidence == 0.85
    
    def test_coerce_large_number_confidence(self):
        """Should normalize values > 1 as percentages."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence=95
        )
        
        assert source.confidence == 0.95
    
    def test_coerce_none_confidence(self):
        """Should handle None confidence."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence=None
        )
        
        assert source.confidence == 0.0
    
    def test_coerce_invalid_string_confidence(self):
        """Should handle invalid string confidence."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence="high"  # Invalid string
        )
        
        assert source.confidence == 0.0
    
    def test_clamp_negative_confidence(self):
        """Should clamp negative confidence to 0."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence=-0.5
        )
        
        assert source.confidence == 0.0
    
    def test_clamp_high_confidence(self):
        """Should clamp confidence > 1 (after normalization)."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        # 150 should become 1.5, then clamped to 1.0
        source = CogneeSource(
            entity_id="prod_001",
            entity_type="Product",
            confidence=150
        )
        
        assert source.confidence == 1.0
    
    def test_ensure_string_entity_id(self):
        """Should convert entity_id to string."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id=12345,  # Integer
            entity_type="Product"
        )
        
        assert source.entity_id == "12345"
    
    def test_ensure_string_entity_type(self):
        """Should convert entity_type to string."""
        from ai_insights.models.cognee_schemas import CogneeSource
        
        source = CogneeSource(
            entity_id="prod_001",
            entity_type=None  # None
        )
        
        assert source.entity_type == ""


class TestCogneeQueryResult:
    """Test CogneeQueryResult schema validation."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult()
        
        assert result.query == ""
        assert result.answer == ""
        assert result.sources == []
        assert result.confidence == 0.0
        assert result.reasoning_trace == []
        assert result.recommended_actions == []
    
    def test_ensure_sources_list_from_none(self):
        """Should convert None sources to empty list."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult(sources=None)
        
        assert result.sources == []
    
    def test_ensure_sources_list_from_dict(self):
        """Should wrap single dict source in list."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult(
            sources={"entity_id": "prod_001", "entity_type": "Product"}
        )
        
        assert len(result.sources) == 1
    
    def test_ensure_answer_string_from_none(self):
        """Should convert None answer to empty string."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult(answer=None)
        
        assert result.answer == ""
    
    def test_ensure_answer_string_from_list(self):
        """Should join list answer into string."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult(
            answer=["Part 1", "Part 2", "Part 3"]
        )
        
        assert result.answer == "Part 1\nPart 2\nPart 3"
    
    def test_calculate_confidence_from_sources(self):
        """Should calculate confidence from sources if not provided."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult, CogneeSource
        
        result = CogneeQueryResult(
            sources=[
                CogneeSource(entity_id="1", confidence=0.9),
                CogneeSource(entity_id="2", confidence=0.8),
                CogneeSource(entity_id="3", confidence=0.7),
            ],
            confidence=0.0  # Explicit zero
        )
        
        # Should calculate average: (0.9 + 0.8 + 0.7) / 3 = 0.8
        # Use pytest.approx for floating point comparison
        assert result.confidence == pytest.approx(0.8, rel=1e-9)
    
    def test_from_raw_cognee_response_none(self):
        """Should handle None response."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult.from_raw_cognee_response(None, "test query")
        
        assert result.query == "test query"
        assert "No response" in result.answer
    
    def test_from_raw_cognee_response_list(self):
        """Should handle list response."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult.from_raw_cognee_response(
            [{"text": "Result 1"}, {"text": "Result 2"}],
            "test query"
        )
        
        assert "Result 1" in result.answer
        assert "Result 2" in result.answer
    
    def test_from_raw_cognee_response_with_answer(self):
        """Should extract answer from 'answer' key."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult.from_raw_cognee_response(
            {"answer": "Direct answer", "confidence": 0.9},
            "test query"
        )
        
        assert result.answer == "Direct answer"
        assert result.confidence == 0.9
    
    def test_from_raw_cognee_response_with_results(self):
        """Should extract answer from 'results' key."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult.from_raw_cognee_response(
            {"results": [{"text": "Result 1"}, {"content": "Result 2"}]},
            "test query"
        )
        
        assert "Result 1" in result.answer
        assert "Result 2" in result.answer
    
    def test_from_raw_cognee_response_with_context(self):
        """Should fall back to 'context' key for answer."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult.from_raw_cognee_response(
            {"context": "Context as answer"},
            "test query"
        )
        
        assert result.answer == "Context as answer"
    
    def test_from_raw_cognee_response_extracts_sources(self):
        """Should extract and validate sources."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        result = CogneeQueryResult.from_raw_cognee_response(
            {
                "answer": "Test",
                "sources": [
                    {"entity_id": "prod_001", "entity_type": "Product", "score": 0.9},
                    {"id": "prod_002", "type": "Product", "relevance": 0.8},
                ]
            },
            "test query"
        )
        
        assert len(result.sources) == 2
        assert result.sources[0].entity_id == "prod_001"
        assert result.sources[0].confidence == 0.9
        assert result.sources[1].entity_id == "prod_002"
        assert result.sources[1].relevance == 0.8


class TestRAGChunk:
    """Test RAGChunk schema validation."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        from ai_insights.models.cognee_schemas import RAGChunk
        
        chunk = RAGChunk()
        
        assert chunk.id == ""
        assert chunk.text == ""
        assert chunk.score == 0.0
        assert chunk.metadata == {}
    
    def test_coerce_score_from_string(self):
        """Should coerce string score to float."""
        from ai_insights.models.cognee_schemas import RAGChunk
        
        chunk = RAGChunk(id="1", text="Test", score="0.85")
        
        assert chunk.score == 0.85
    
    def test_coerce_score_from_percentage(self):
        """Should normalize percentage scores."""
        from ai_insights.models.cognee_schemas import RAGChunk
        
        chunk = RAGChunk(id="1", text="Test", score=95)
        
        assert chunk.score == 0.95
    
    def test_coerce_score_from_none(self):
        """Should handle None score."""
        from ai_insights.models.cognee_schemas import RAGChunk
        
        chunk = RAGChunk(id="1", text="Test", score=None)
        
        assert chunk.score == 0.0


class TestRAGResult:
    """Test RAGResult schema validation."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        from ai_insights.models.cognee_schemas import RAGResult
        
        result = RAGResult()
        
        assert result.answer == ""
        assert result.chunks == []
        assert result.confidence == 0.0
        assert result.sources == []
    
    def test_from_raw_rag_response_none(self):
        """Should handle None response."""
        from ai_insights.models.cognee_schemas import RAGResult
        
        result = RAGResult.from_raw_rag_response(None)
        
        assert result.answer == ""
        assert result.chunks == []
    
    def test_from_raw_rag_response_with_chunks(self):
        """Should extract and validate chunks."""
        from ai_insights.models.cognee_schemas import RAGResult
        
        result = RAGResult.from_raw_rag_response({
            "answer": "Generated answer",
            "chunks": [
                {"id": "1", "text": "Chunk 1", "score": 0.9},
                {"id": "2", "content": "Chunk 2", "similarity": 0.8},
            ]
        })
        
        assert result.answer == "Generated answer"
        assert len(result.chunks) == 2
        assert result.chunks[0].text == "Chunk 1"
        assert result.chunks[0].score == 0.9
        assert result.chunks[1].text == "Chunk 2"
        assert result.chunks[1].score == 0.8
    
    def test_from_raw_rag_response_with_insight(self):
        """Should extract answer from 'insight' key."""
        from ai_insights.models.cognee_schemas import RAGResult
        
        result = RAGResult.from_raw_rag_response({
            "insight": "Insight answer",
            "chunks": []
        })
        
        assert result.answer == "Insight answer"
    
    def test_from_raw_rag_response_default_confidence(self):
        """Should set default confidence based on chunks."""
        from ai_insights.models.cognee_schemas import RAGResult
        
        result = RAGResult.from_raw_rag_response({
            "chunks": [{"id": "1", "text": "Test"}]
        })
        
        assert result.confidence == 0.85  # Default when chunks exist


class TestSchemaIntegration:
    """Integration tests for schema validation."""
    
    def test_validates_real_cognee_response(self):
        """Should validate a realistic Cognee response."""
        from ai_insights.models.cognee_schemas import CogneeQueryResult
        
        raw_response = {
            "query": "What are the blockers for Product X?",
            "results": [
                {
                    "entity_id": "prod_001",
                    "entity_type": "Product",
                    "entity_name": "Mastercard Send",
                    "text": "Product has 3 blockers: API delay, resources, security review",
                    "score": "0.92",  # String score
                    "metadata": {"source": "product_docs"}
                },
                {
                    "id": "dep_001",  # Alternative key
                    "type": "Dependency",  # Alternative key
                    "content": "Partner API integration delayed by 2 weeks",
                    "relevance": 85,  # Percentage
                }
            ],
            "confidence": "88%",  # Percentage string
            "timestamp": "2025-01-04T10:30:00Z"
        }
        
        result = CogneeQueryResult.from_raw_cognee_response(raw_response, "test")
        
        assert result.confidence == 0.88
        assert len(result.sources) == 2
        assert result.sources[0].entity_name == "Mastercard Send"
        assert result.sources[0].confidence == 0.92
        assert result.sources[1].relevance == 0.85
    
    def test_validates_real_rag_response(self):
        """Should validate a realistic RAG response."""
        from ai_insights.models.cognee_schemas import RAGResult
        
        raw_response = {
            "insight": "Based on the documents, Product X has 3 blockers...",
            "chunks": [
                {"id": "chunk_1", "text": "Product spec mentions API dependency", "score": 0.95, "metadata": {"source": "spec.pdf"}},
                {"id": "chunk_2", "text": "Resource allocation is constrained", "similarity": 87},  # Percentage
                {"id": "chunk_3", "content": "Security review pending", "score": "0.82"},  # String
            ],
            "sources": [{"doc_id": "spec.pdf"}, {"doc_id": "resources.pdf"}]
        }
        
        result = RAGResult.from_raw_rag_response(raw_response)
        
        assert "3 blockers" in result.answer
        assert len(result.chunks) == 3
        assert result.chunks[0].score == 0.95
        assert result.chunks[1].score == 0.87
        assert result.chunks[2].score == 0.82


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
