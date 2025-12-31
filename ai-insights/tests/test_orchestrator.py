"""
Tests for ai_insights.orchestration.orchestrator_v2 module.

Tests the ProductionOrchestrator class for hybrid AI query routing.
Currently at 50% coverage - targeting 70%+.
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime


class TestSharedContext:
    """Test SharedContext class."""
    
    def test_init_defaults(self):
        """Should initialize with empty defaults."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        
        assert ctx.entity_ids == []
        assert ctx.grounded_entities == []
        assert ctx.historical_context == ""
        assert ctx.relevant_time_windows == []
        assert ctx.prior_decisions == []
        assert ctx.causal_chains == []
        assert ctx.confidence_modifiers == {}
        assert ctx.validation_errors == []
        assert ctx.rag_findings == []
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    def test_add_entity_id_without_validation(self, mock_get_validator):
        """Should add entity without validation."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.add_entity_id("prod_001", "Product", validate=False)
        
        assert len(ctx.entity_ids) == 1
        assert ctx.entity_ids[0] == {"id": "prod_001", "type": "Product"}
        mock_get_validator.assert_not_called()
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    def test_add_entity_id_with_validation_success(self, mock_get_validator):
        """Should add validated entity on success."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        mock_validator = MagicMock()
        mock_validator.validate_entity.return_value = (True, {"name": "Product A"}, "Valid")
        mock_get_validator.return_value = mock_validator
        
        ctx = SharedContext()
        ctx.add_entity_id("prod_001", "Product", validate=True)
        
        assert len(ctx.entity_ids) == 1
        assert len(ctx.grounded_entities) == 1
        assert ctx.grounded_entities[0]["verified"] is True
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    def test_add_entity_id_with_validation_failure(self, mock_get_validator):
        """Should record validation error on failure."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        mock_validator = MagicMock()
        mock_validator.validate_entity.return_value = (False, None, "Not found")
        mock_get_validator.return_value = mock_validator
        
        ctx = SharedContext()
        ctx.add_entity_id("prod_999", "Product", validate=True)
        
        assert len(ctx.entity_ids) == 1
        assert len(ctx.grounded_entities) == 0
        assert len(ctx.validation_errors) == 1
        assert "prod_999" in ctx.validation_errors[0]
    
    def test_add_rag_finding(self):
        """Should add RAG finding with timestamp."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.add_rag_finding("Important discovery", "doc1.pdf", 0.9)
        
        assert len(ctx.rag_findings) == 1
        assert ctx.rag_findings[0]["finding"] == "Important discovery"
        assert ctx.rag_findings[0]["source"] == "doc1.pdf"
        assert ctx.rag_findings[0]["confidence"] == 0.9
        assert "timestamp" in ctx.rag_findings[0]
    
    def test_get_product_ids(self):
        """Should extract product IDs from grounded entities."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.grounded_entities = [
            {"id": "prod_001", "type": "Product", "verified": True},
            {"id": "risk_001", "type": "Risk", "verified": True},
            {"id": "prod_002", "type": "Product", "verified": True},
        ]
        
        product_ids = ctx.get_product_ids()
        
        assert product_ids == ["prod_001", "prod_002"]
    
    def test_to_dict(self):
        """Should convert to dictionary."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.entity_ids = [{"id": "prod_001", "type": "Product"}]
        ctx.historical_context = "Some history"
        ctx.rag_findings = [{"finding": "test"}]
        
        result = ctx.to_dict()
        
        assert isinstance(result, dict)
        assert result["entity_ids"] == [{"id": "prod_001", "type": "Product"}]
        assert result["historical_context"] == "Some history"
        assert result["rag_findings_count"] == 1


class TestProductionOrchestratorInit:
    """Test ProductionOrchestrator initialization."""
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    def test_init_components(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should initialize all components."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        
        orchestrator = ProductionOrchestrator()
        
        assert orchestrator.logger is not None
        assert orchestrator.intent_classifier is not None
        assert orchestrator.cognee_loader is not None
        assert orchestrator.entity_validator is not None
        assert orchestrator.entity_grounder is not None
    
    def test_confidence_thresholds(self):
        """Should have correct confidence thresholds."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_HIGH == 0.8
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_MEDIUM == 0.6
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_LOW == 0.4
        assert ProductionOrchestrator.FALLBACK_THRESHOLD == 0.3


class TestProductionOrchestratorOrchestrate:
    """Test main orchestrate method."""
    
    @pytest.mark.asyncio
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    async def test_orchestrate_factual_query(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should route factual queries to RAG."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        # Setup mocks
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual query")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.is_available.return_value = True
        mock_cognee.return_value = mock_cognee_instance
        
        orchestrator = ProductionOrchestrator()
        
        # Mock the _rag_primary_flow
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.85
        mock_response.source_type = "retrieval"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._rag_primary_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("What is product X?")
        
        assert result is not None
        orchestrator._rag_primary_flow.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    async def test_orchestrate_historical_with_cognee(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should route historical queries to Cognee when available."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.HISTORICAL, 0.85, "Historical query")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.is_available.return_value = True
        mock_cognee.return_value = mock_cognee_instance
        
        orchestrator = ProductionOrchestrator()
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.9
        mock_response.source_type = "memory"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._cognee_primary_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("Why did product X fail last year?")
        
        assert result is not None
        orchestrator._cognee_primary_flow.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    async def test_orchestrate_historical_without_cognee(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should fall back to RAG when Cognee unavailable."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.return_value = (QueryIntent.HISTORICAL, 0.85, "Historical query")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee_instance = MagicMock()
        mock_cognee_instance.is_available.return_value = False  # Cognee unavailable
        mock_cognee.return_value = mock_cognee_instance
        
        orchestrator = ProductionOrchestrator()
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.6
        mock_response.source_type = "retrieval"
        mock_response.answer = "RAG answer"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._rag_primary_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("Why did product X fail?")
        
        assert result is not None
        orchestrator._rag_primary_flow.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    async def test_orchestrate_handles_exception(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should return error response on exception."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.classify.side_effect = Exception("Classification failed")
        mock_classifier.return_value = mock_classifier_instance
        
        mock_cognee.return_value = MagicMock()
        
        orchestrator = ProductionOrchestrator()
        
        result = await orchestrator.orchestrate("Test query")
        
        assert result.success is False
        assert "error" in result.answer.lower() or result.error is not None


class TestApplyGuardrails:
    """Test guardrails application."""
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    def test_apply_guardrails_low_confidence(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should flag low confidence answers."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator, SharedContext
        
        orchestrator = ProductionOrchestrator()
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.3  # Low confidence
        mock_response.sources = []
        mock_response.guardrails.low_confidence = False
        mock_response.guardrails.warnings = []
        mock_response.guardrails.memory_sparse = False
        
        shared_ctx = SharedContext()
        
        result = orchestrator._apply_guardrails(mock_response, shared_ctx)
        
        assert result.guardrails.low_confidence is True
        assert len(result.guardrails.warnings) > 0
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    def test_apply_guardrails_sparse_memory(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should flag sparse memory sources."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator, SharedContext
        
        orchestrator = ProductionOrchestrator()
        
        # Only 1 memory source (sparse)
        mock_source = MagicMock()
        mock_source.source_type = "memory"
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.8
        mock_response.sources = [mock_source]
        mock_response.guardrails.low_confidence = False
        mock_response.guardrails.warnings = []
        mock_response.guardrails.memory_sparse = False
        
        shared_ctx = SharedContext()
        
        result = orchestrator._apply_guardrails(mock_response, shared_ctx)
        
        assert result.guardrails.memory_sparse is True
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    def test_apply_guardrails_with_validation_errors(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should include validation errors in warnings."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator, SharedContext
        
        orchestrator = ProductionOrchestrator()
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.8
        mock_response.sources = []
        mock_response.guardrails.low_confidence = False
        mock_response.guardrails.warnings = []
        mock_response.guardrails.memory_sparse = False
        
        shared_ctx = SharedContext()
        shared_ctx.validation_errors = ["Entity prod_999 not found"]
        
        result = orchestrator._apply_guardrails(mock_response, shared_ctx)
        
        assert "Entity prod_999 not found" in result.guardrails.warnings


class TestGetProductionOrchestrator:
    """Test singleton factory function."""
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    def test_returns_orchestrator_instance(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should return ProductionOrchestrator instance."""
        import ai_insights.orchestration.orchestrator_v2 as module
        
        # Reset singleton
        module._orchestrator = None
        
        result = module.get_production_orchestrator()
        
        assert isinstance(result, module.ProductionOrchestrator)
    
    @patch('ai_insights.orchestration.orchestrator_v2.get_logger')
    @patch('ai_insights.orchestration.orchestrator_v2.get_intent_classifier')
    @patch('ai_insights.orchestration.orchestrator_v2.get_cognee_lazy_loader')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_validator')
    @patch('ai_insights.orchestration.orchestrator_v2.get_entity_grounder')
    def test_returns_singleton(self, mock_grounder, mock_validator, mock_cognee, mock_classifier, mock_logger):
        """Should return same instance on multiple calls."""
        import ai_insights.orchestration.orchestrator_v2 as module
        
        # Reset singleton
        module._orchestrator = None
        
        result1 = module.get_production_orchestrator()
        result2 = module.get_production_orchestrator()
        
        assert result1 is result2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
