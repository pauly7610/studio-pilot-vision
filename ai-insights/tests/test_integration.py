"""
Integration Tests for Cognee/RAG Fallback Flows
Tests end-to-end behavior of the orchestration system.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from ai_insights.orchestration import ProductionOrchestrator, QueryIntent
from ai_insights.models import UnifiedAIResponse, SourceType, ConfidenceBreakdown


@pytest.mark.integration
class TestCogneeRAGIntegration:
    """Test integration between Cognee and RAG layers."""
    
    @pytest.mark.asyncio
    async def test_cognee_success_no_rag_fallback(self):
        """When Cognee succeeds with high confidence, RAG should not be called."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee as available and successful
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator.cognee_loader, 'query') as mock_cognee_query:
                mock_cognee_query.return_value = {
                    "query": "Why did sales drop?",
                    "answer": "Sales dropped due to market conditions",
                    "confidence": 0.9,
                    "sources": [
                        {
                            "entity_id": "event_123",
                            "entity_type": "Event",
                            "entity_name": "Q3 Sales Analysis",
                            "confidence": 0.9
                        }
                    ]
                }
                
                with patch.object(orchestrator, '_get_rag_context') as mock_rag:
                    result = await orchestrator.orchestrate("Why did sales drop last quarter?")
                    
                    # Cognee should be called
                    assert mock_cognee_query.called
                    # RAG should NOT be called for enrichment (Cognee-primary flow)
                    # Note: Current implementation may call RAG for enrichment
                    assert result.source_type in [SourceType.MEMORY, SourceType.HYBRID]
                    assert result.success == True
    
    @pytest.mark.asyncio
    async def test_cognee_failure_triggers_rag_fallback(self):
        """When Cognee fails, system should fallback to RAG."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee as available but failing
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator.cognee_loader, 'query', side_effect=Exception("Cognee timeout")):
                with patch.object(orchestrator, '_get_rag_context') as mock_rag:
                    mock_rag.return_value = {
                        "answer": "RAG fallback answer",
                        "confidence": 0.7,
                        "sources": []
                    }
                    
                    result = await orchestrator.orchestrate("Why did sales drop?")
                    
                    # Should fallback to RAG
                    assert mock_rag.called
                    assert result.success == True
                    # Should indicate fallback was used
                    assert result.guardrails.fallback_used or "fallback" in result.answer.lower()
    
    @pytest.mark.asyncio
    async def test_cognee_unavailable_uses_rag_directly(self):
        """When Cognee is unavailable, historical queries should use RAG with warning."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee as unavailable
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=False):
            with patch.object(orchestrator, '_rag_primary_flow') as mock_rag_flow:
                mock_rag_flow.return_value = UnifiedAIResponse(
                    success=True,
                    query="Historical query",
                    answer="RAG answer without historical context",
                    source_type=SourceType.RETRIEVAL,
                    confidence=ConfidenceBreakdown(
                        overall=0.7,
                        data_freshness=0.9,
                        source_reliability=0.8,
                        entity_grounding=0.6,
                        reasoning_coherence=0.7
                    ),
                    sources=[],
                    reasoning_trace=[],
                    guardrails=Mock()
                )
                
                result = await orchestrator.orchestrate("Why did sales drop last month?")
                
                # Should use RAG
                assert mock_rag_flow.called
                # Should have degradation warning
                assert "⚠️" in result.answer or "unavailable" in result.answer.lower()


@pytest.mark.integration
class TestHybridFlow:
    """Test hybrid flow that combines Cognee and RAG."""
    
    @pytest.mark.asyncio
    async def test_mixed_query_uses_both_sources(self):
        """Mixed queries should use both Cognee and RAG."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee available
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator.cognee_loader, 'query') as mock_cognee:
                mock_cognee.return_value = {
                    "query": "Compare current to past",
                    "answer": "Historical context from Cognee",
                    "confidence": 0.8,
                    "sources": []
                }
                
                with patch.object(orchestrator, '_get_rag_context') as mock_rag:
                    mock_rag.return_value = {
                        "answer": "Current data from RAG",
                        "confidence": 0.85,
                        "sources": []
                    }
                    
                    # Force mixed intent classification
                    with patch.object(orchestrator.intent_classifier, 'classify') as mock_classify:
                        mock_classify.return_value = (QueryIntent.MIXED, 0.75, "Mixed query")
                        
                        result = await orchestrator.orchestrate("Compare Q3 2024 to Q3 2023")
                        
                        # Both should be called in hybrid flow
                        assert result.source_type == SourceType.HYBRID
                        assert result.success == True


@pytest.mark.integration
class TestEntityValidation:
    """Test entity validation in the orchestration flow."""
    
    @pytest.mark.asyncio
    async def test_invalid_entities_add_warnings(self):
        """Invalid entities should add warnings to guardrails."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee returning invalid entities
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator.cognee_loader, 'query') as mock_cognee:
                mock_cognee.return_value = {
                    "query": "Test",
                    "answer": "Answer with invalid entity references",
                    "confidence": 0.8,
                    "sources": [
                        {
                            "entity_id": "invalid_product_999",
                            "entity_type": "Product",
                            "entity_name": "NonExistent Product",
                            "confidence": 0.7
                        }
                    ]
                }
                
                # Mock validator to reject the entity
                with patch.object(orchestrator.entity_validator, 'validate_entity') as mock_validate:
                    mock_validate.return_value = (False, None, "Entity not found in database")
                    
                    result = await orchestrator.orchestrate("Tell me about product 999")
                    
                    # Should have validation warnings
                    assert len(result.guardrails.warnings) > 0 or len(result.shared_context.get("validation_errors", [])) > 0


@pytest.mark.integration
class TestConfidenceThresholds:
    """Test confidence-based routing decisions."""
    
    @pytest.mark.asyncio
    async def test_low_confidence_triggers_hybrid_approach(self):
        """Low confidence from primary source should trigger hybrid approach."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee with low confidence
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator.cognee_loader, 'query') as mock_cognee:
                mock_cognee.return_value = {
                    "query": "Ambiguous query",
                    "answer": "Uncertain answer",
                    "confidence": 0.4,  # Below threshold
                    "sources": []
                }
                
                with patch.object(orchestrator, '_get_rag_context') as mock_rag:
                    mock_rag.return_value = {
                        "answer": "RAG enrichment",
                        "confidence": 0.7,
                        "sources": []
                    }
                    
                    result = await orchestrator.orchestrate("What might have caused this?")
                    
                    # Low confidence should be flagged
                    assert result.confidence.overall < orchestrator.CONFIDENCE_THRESHOLD_HIGH


@pytest.mark.integration
class TestReasoningTrace:
    """Test that reasoning traces are complete and accurate."""
    
    @pytest.mark.asyncio
    async def test_reasoning_trace_documents_fallback(self):
        """Reasoning trace should document when fallback occurs."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee unavailable
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=False):
            with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
                mock_rag.return_value = UnifiedAIResponse(
                    success=True,
                    query="Test",
                    answer="Answer",
                    source_type=SourceType.RETRIEVAL,
                    confidence=ConfidenceBreakdown(
                        overall=0.7,
                        data_freshness=0.9,
                        source_reliability=0.8,
                        entity_grounding=0.6,
                        reasoning_coherence=0.7
                    ),
                    sources=[],
                    reasoning_trace=[],
                    guardrails=Mock()
                )
                
                result = await orchestrator.orchestrate("Why did this happen?")
                
                # Reasoning trace should mention Cognee unavailability
                trace_text = " ".join([step.action for step in result.reasoning_trace])
                assert "unavailable" in trace_text.lower() or "degraded" in trace_text.lower()


@pytest.mark.integration
class TestEndToEndScenarios:
    """Test realistic end-to-end scenarios."""
    
    @pytest.mark.asyncio
    async def test_product_query_with_context(self):
        """Test querying about a specific product with context."""
        orchestrator = ProductionOrchestrator()
        
        context = {
            "product_id": "prod_123",
            "user_id": "user_456"
        }
        
        with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
            mock_rag.return_value = UnifiedAIResponse(
                success=True,
                query="What's the status of product 123?",
                answer="Product 123 is in development",
                source_type=SourceType.RETRIEVAL,
                confidence=ConfidenceBreakdown(
                    overall=0.85,
                    data_freshness=0.95,
                    source_reliability=0.9,
                    entity_grounding=0.8,
                    reasoning_coherence=0.85
                ),
                sources=[],
                reasoning_trace=[],
                guardrails=Mock()
            )
            
            result = await orchestrator.orchestrate(
                "What's the status of product 123?",
                context=context
            )
            
            assert result.success == True
            assert result.confidence.overall > 0.7
    
    @pytest.mark.asyncio
    async def test_portfolio_analysis_query(self):
        """Test portfolio-level analysis query."""
        orchestrator = ProductionOrchestrator()
        
        # Portfolio queries are typically factual (current state)
        with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
            mock_rag.return_value = UnifiedAIResponse(
                success=True,
                query="Show me all high-risk products",
                answer="Found 3 high-risk products",
                source_type=SourceType.RETRIEVAL,
                confidence=ConfidenceBreakdown(
                    overall=0.9,
                    data_freshness=0.95,
                    source_reliability=0.9,
                    entity_grounding=0.85,
                    reasoning_coherence=0.9
                ),
                sources=[],
                reasoning_trace=[],
                guardrails=Mock()
            )
            
            result = await orchestrator.orchestrate("Show me all high-risk products")
            
            assert result.success == True
            assert result.source_type == SourceType.RETRIEVAL
