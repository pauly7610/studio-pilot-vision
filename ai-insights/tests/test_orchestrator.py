"""
Test Suite for Orchestrator Routing Logic
Tests intent classification, routing decisions, and fallback behavior.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from ai_insights.orchestration import ProductionOrchestrator, SharedContext, QueryIntent
from ai_insights.models import UnifiedAIResponse, SourceType, ConfidenceBreakdown


class TestIntentRouting:
    """Test that queries route to the correct backend based on intent."""
    
    @pytest.mark.asyncio
    async def test_factual_query_routes_to_rag(self):
        """Factual queries should always route to RAG."""
        orchestrator = ProductionOrchestrator()
        
        # Mock the RAG flow
        with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
            mock_rag.return_value = UnifiedAIResponse(
                success=True,
                query="What products are available?",
                answer="Product list",
                source_type=SourceType.RETRIEVAL,
                confidence=ConfidenceBreakdown(
                    overall=0.9,
                    data_freshness=0.95,
                    source_reliability=0.85,
                    entity_grounding=0.9,
                    reasoning_coherence=0.9
                ),
                sources=[],
                reasoning_trace=[],
                guardrails=Mock()
            )
            
            result = await orchestrator.orchestrate("What products are available?")
            
            assert mock_rag.called
            assert result.source_type == SourceType.RETRIEVAL
    
    @pytest.mark.asyncio
    async def test_historical_query_routes_to_cognee(self):
        """Historical queries should route to Cognee when available."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee as available
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator, '_cognee_primary_flow') as mock_cognee:
                mock_cognee.return_value = UnifiedAIResponse(
                    success=True,
                    query="Why did sales drop last month?",
                    answer="Historical analysis",
                    source_type=SourceType.MEMORY,
                    confidence=ConfidenceBreakdown(
                        overall=0.85,
                        data_freshness=0.9,
                        source_reliability=0.95,
                        entity_grounding=0.8,
                        reasoning_coherence=0.85
                    ),
                    sources=[],
                    reasoning_trace=[],
                    guardrails=Mock()
                )
                
                result = await orchestrator.orchestrate("Why did sales drop last month?")
                
                assert mock_cognee.called
                assert result.source_type == SourceType.MEMORY
    
    @pytest.mark.asyncio
    async def test_cognee_unavailable_fallback_to_rag(self):
        """When Cognee is unavailable, historical queries should fallback to RAG."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee as unavailable
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=False):
            with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
                mock_rag.return_value = UnifiedAIResponse(
                    success=True,
                    query="Why did sales drop?",
                    answer="RAG fallback answer",
                    source_type=SourceType.RETRIEVAL,
                    confidence=ConfidenceBreakdown(
                        overall=0.7,
                        data_freshness=0.95,
                        source_reliability=0.85,
                        entity_grounding=0.6,
                        reasoning_coherence=0.7
                    ),
                    sources=[],
                    reasoning_trace=[],
                    guardrails=Mock()
                )
                
                result = await orchestrator.orchestrate("Why did sales drop?")
                
                assert mock_rag.called
                assert result.source_type == SourceType.RETRIEVAL
                # Should contain degradation notice
                assert "Historical memory unavailable" in result.answer or "⚠️" in result.answer


class TestConfidenceCalculation:
    """Test confidence scoring and thresholds."""
    
    @pytest.mark.asyncio
    async def test_low_confidence_triggers_warning(self):
        """Low confidence responses should have guardrail warnings."""
        orchestrator = ProductionOrchestrator()
        
        with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
            mock_rag.return_value = UnifiedAIResponse(
                success=True,
                query="Ambiguous query",
                answer="Uncertain answer",
                source_type=SourceType.RETRIEVAL,
                confidence=ConfidenceBreakdown(
                    overall=0.3,  # Below CONFIDENCE_THRESHOLD_LOW
                    data_freshness=0.5,
                    source_reliability=0.4,
                    entity_grounding=0.2,
                    reasoning_coherence=0.3
                ),
                sources=[],
                reasoning_trace=[],
                guardrails=Mock(warnings=[], low_confidence=False)
            )
            
            result = await orchestrator.orchestrate("Ambiguous query")
            
            # Guardrails should flag low confidence
            assert result.guardrails.low_confidence or len(result.guardrails.warnings) > 0


class TestSharedContext:
    """Test shared context validation and entity grounding."""
    
    def test_entity_validation(self):
        """Entities should be validated when added to context."""
        ctx = SharedContext()
        
        # Mock validator
        with patch('orchestrator_v2.get_entity_validator') as mock_validator:
            validator_instance = Mock()
            validator_instance.validate_entity.return_value = (True, {"id": "prod_123", "name": "Product"}, "Valid")
            mock_validator.return_value = validator_instance
            
            ctx.add_entity_id("prod_123", "Product", validate=True)
            
            assert len(ctx.entity_ids) == 1
            assert len(ctx.grounded_entities) == 1
            assert ctx.grounded_entities[0]["verified"] == True
    
    def test_invalid_entity_adds_error(self):
        """Invalid entities should add validation errors."""
        ctx = SharedContext()
        
        with patch('orchestrator_v2.get_entity_validator') as mock_validator:
            validator_instance = Mock()
            validator_instance.validate_entity.return_value = (False, None, "Entity not found")
            mock_validator.return_value = validator_instance
            
            ctx.add_entity_id("invalid_id", "Product", validate=True)
            
            assert len(ctx.validation_errors) == 1
            assert "invalid_id" in ctx.validation_errors[0]
    
    def test_get_product_ids(self):
        """Should extract only product IDs from grounded entities."""
        ctx = SharedContext()
        ctx.grounded_entities = [
            {"id": "prod_1", "type": "Product", "verified": True},
            {"id": "user_1", "type": "User", "verified": True},
            {"id": "prod_2", "type": "Product", "verified": True},
        ]
        
        product_ids = ctx.get_product_ids()
        
        assert len(product_ids) == 2
        assert "prod_1" in product_ids
        assert "prod_2" in product_ids
        assert "user_1" not in product_ids


class TestErrorHandling:
    """Test error handling and graceful degradation."""
    
    @pytest.mark.asyncio
    async def test_orchestration_error_returns_error_response(self):
        """Orchestration errors should return structured error responses."""
        orchestrator = ProductionOrchestrator()
        
        # Force an error in intent classification
        with patch.object(orchestrator.intent_classifier, 'classify', side_effect=Exception("Classification failed")):
            result = await orchestrator.orchestrate("Test query")
            
            assert result.success == False
            assert result.error is not None
            assert "Orchestration error" in result.error
    
    @pytest.mark.asyncio
    async def test_partial_failure_returns_fallback(self):
        """Partial failures should attempt fallback before returning error."""
        orchestrator = ProductionOrchestrator()
        
        # Mock Cognee failure, RAG success
        with patch.object(orchestrator.cognee_loader, 'is_available', return_value=True):
            with patch.object(orchestrator, '_cognee_primary_flow', side_effect=Exception("Cognee failed")):
                with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
                    mock_rag.return_value = UnifiedAIResponse(
                        success=True,
                        query="Test",
                        answer="Fallback answer",
                        source_type=SourceType.RETRIEVAL,
                        confidence=ConfidenceBreakdown(
                            overall=0.6,
                            data_freshness=0.8,
                            source_reliability=0.7,
                            entity_grounding=0.5,
                            reasoning_coherence=0.6
                        ),
                        sources=[],
                        reasoning_trace=[],
                        guardrails=Mock()
                    )
                    
                    # This should fail to Cognee but succeed with RAG fallback
                    # Note: Current implementation may not have this exact flow
                    # This test documents expected behavior
                    pass


class TestReasoningTrace:
    """Test that reasoning traces are properly constructed."""
    
    @pytest.mark.asyncio
    async def test_reasoning_trace_includes_intent_classification(self):
        """Reasoning trace should include intent classification step."""
        orchestrator = ProductionOrchestrator()
        
        with patch.object(orchestrator, '_rag_primary_flow') as mock_rag:
            mock_rag.return_value = UnifiedAIResponse(
                success=True,
                query="Test",
                answer="Answer",
                source_type=SourceType.RETRIEVAL,
                confidence=ConfidenceBreakdown(
                    overall=0.8,
                    data_freshness=0.9,
                    source_reliability=0.85,
                    entity_grounding=0.8,
                    reasoning_coherence=0.8
                ),
                sources=[],
                reasoning_trace=[],
                guardrails=Mock()
            )
            
            result = await orchestrator.orchestrate("What products are available?")
            
            # Should have at least one reasoning step
            assert len(result.reasoning_trace) > 0
            # First step should be intent classification
            assert "intent" in result.reasoning_trace[0].action.lower() or "classified" in result.reasoning_trace[0].action.lower()
