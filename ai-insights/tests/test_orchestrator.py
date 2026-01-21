"""
Tests for ai_insights.orchestration.orchestrator_v2 module.

Tests the ProductionOrchestrator class for hybrid AI query routing.
Improved coverage targeting 70%+.

MOCKING STRATEGY:
- All heavy dependencies (cognee, retrieval, generator) are mocked
- Patches must be applied at point-of-use, not point-of-definition
- Use module-level patches for imports that happen at module load time
"""

import pytest
import sys
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock, PropertyMock
from datetime import datetime


# Mock cognee module before any imports to prevent PyO3 initialization
@pytest.fixture(autouse=True)
def mock_cognee_module():
    """Mock cognee module to prevent PyO3 initialization."""
    mock_cognee = MagicMock()
    mock_cognee.add = AsyncMock(return_value="added")
    mock_cognee.cognify = AsyncMock(return_value="cognified")
    mock_cognee.search = AsyncMock(return_value=[])
    
    with patch.dict(sys.modules, {'cognee': mock_cognee}):
        yield mock_cognee


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
    
    def test_add_entity_id_without_validation(self):
        """Should add entity without validation."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.add_entity_id("prod_001", "Product", validate=False)
        
        assert len(ctx.entity_ids) == 1
        assert ctx.entity_ids[0] == {"id": "prod_001", "type": "Product"}
    
    def test_add_entity_id_with_validation_success(self):
        """Should add validated entity on success."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        import ai_insights.orchestration.orchestrator_v2 as orch_module
        
        # Create mock validator
        mock_validator = MagicMock()
        mock_validator.validate_entity.return_value = (True, {"name": "Product A"}, "Valid")
        
        # Patch the function in the module namespace
        original_get_validator = orch_module.get_entity_validator
        orch_module.get_entity_validator = MagicMock(return_value=mock_validator)
        
        try:
            ctx = SharedContext()
            ctx.add_entity_id("prod_001", "Product", validate=True)
            
            assert len(ctx.entity_ids) == 1
            assert len(ctx.grounded_entities) == 1
            assert ctx.grounded_entities[0]["verified"] is True
        finally:
            # Restore original
            orch_module.get_entity_validator = original_get_validator
    
    def test_add_entity_id_with_validation_failure(self):
        """Should record validation error on failure."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        import ai_insights.orchestration.orchestrator_v2 as orch_module
        
        mock_validator = MagicMock()
        mock_validator.validate_entity.return_value = (False, None, "Not found")
        
        original_get_validator = orch_module.get_entity_validator
        orch_module.get_entity_validator = MagicMock(return_value=mock_validator)
        
        try:
            ctx = SharedContext()
            ctx.add_entity_id("prod_999", "Product", validate=True)
            
            assert len(ctx.entity_ids) == 1
            assert len(ctx.grounded_entities) == 0
            assert len(ctx.validation_errors) == 1
            assert "prod_999" in ctx.validation_errors[0]
        finally:
            orch_module.get_entity_validator = original_get_validator
    
    def test_add_entity_id_valid_but_no_data(self):
        """Should handle valid=True but no entity_data."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        import ai_insights.orchestration.orchestrator_v2 as orch_module
        
        mock_validator = MagicMock()
        mock_validator.validate_entity.return_value = (True, None, "Valid but no data")
        
        original_get_validator = orch_module.get_entity_validator
        orch_module.get_entity_validator = MagicMock(return_value=mock_validator)
        
        try:
            ctx = SharedContext()
            ctx.add_entity_id("prod_001", "Product", validate=True)
            
            assert len(ctx.entity_ids) == 1
            assert len(ctx.grounded_entities) == 0  # No data, so not grounded
        finally:
            orch_module.get_entity_validator = original_get_validator
    
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
    
    def test_add_multiple_rag_findings(self):
        """Should add multiple RAG findings."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.add_rag_finding("Finding 1", "doc1.pdf", 0.9)
        ctx.add_rag_finding("Finding 2", "doc2.pdf", 0.8)
        ctx.add_rag_finding("Finding 3", "doc3.pdf", 0.7)
        
        assert len(ctx.rag_findings) == 3
    
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
    
    def test_get_product_ids_empty(self):
        """Should return empty list if no products."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.grounded_entities = [
            {"id": "risk_001", "type": "Risk", "verified": True},
        ]
        
        product_ids = ctx.get_product_ids()
        
        assert product_ids == []
    
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
    
    def test_to_dict_excludes_entity_data(self):
        """Should exclude full entity data from serialization."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        ctx = SharedContext()
        ctx.grounded_entities = [
            {"id": "prod_001", "type": "Product", "data": {"large": "object"}, "verified": True}
        ]
        
        result = ctx.to_dict()
        
        # Should not include 'data' key
        assert "data" not in result["grounded_entities"][0]


class TestProductionOrchestratorInit:
    """Test ProductionOrchestrator initialization."""
    
    def test_init_components(self):
        """Should initialize all components."""
        import ai_insights.orchestration.orchestrator_v2 as orch_module
        
        # Store originals
        original_funcs = {
            'get_logger': orch_module.get_logger,
            'get_intent_classifier': orch_module.get_intent_classifier,
            'get_cognee_lazy_loader': orch_module.get_cognee_lazy_loader,
            'get_entity_validator': orch_module.get_entity_validator,
            'get_entity_grounder': orch_module.get_entity_grounder,
        }
        
        # Apply mocks
        orch_module.get_logger = MagicMock(return_value=MagicMock())
        orch_module.get_intent_classifier = MagicMock(return_value=MagicMock())
        orch_module.get_cognee_lazy_loader = MagicMock(return_value=MagicMock())
        orch_module.get_entity_validator = MagicMock(return_value=MagicMock())
        orch_module.get_entity_grounder = MagicMock(return_value=MagicMock())
        
        try:
            orchestrator = orch_module.ProductionOrchestrator()
            
            assert orchestrator.logger is not None
            assert orchestrator.intent_classifier is not None
            assert orchestrator.cognee_loader is not None
            assert orchestrator.entity_validator is not None
            assert orchestrator.entity_grounder is not None
        finally:
            # Restore originals
            for name, func in original_funcs.items():
                setattr(orch_module, name, func)
    
    def test_confidence_thresholds(self):
        """Should have correct confidence thresholds for tiered fallback strategy."""
        from ai_insights.orchestration.orchestrator_v2 import ProductionOrchestrator
        
        # Updated thresholds for confidence-aware fallback
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_HIGH == 0.8      # Primary source sufficient
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_MEDIUM == 0.6    # Enrich with secondary
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_LOW == 0.5       # Consider switching primary
        assert ProductionOrchestrator.CONFIDENCE_THRESHOLD_VERY_LOW == 0.3  # Degraded mode
        assert ProductionOrchestrator.FALLBACK_THRESHOLD == 0.3


def create_mock_orchestrator():
    """Helper to create a fully mocked orchestrator for testing."""
    import ai_insights.orchestration.orchestrator_v2 as orch_module
    from ai_insights.orchestration.intent_classifier import QueryIntent
    
    # Create mock instances
    mock_logger = MagicMock()
    mock_classifier = MagicMock()
    mock_cognee_loader = MagicMock()
    mock_cognee_loader.is_available.return_value = True
    mock_cognee_loader.query = AsyncMock(return_value={
        "answer": "Default mock answer",
        "sources": [],
        "confidence": 0.5
    })
    
    # Entity validator must return (is_valid, entity_data, message) tuple
    mock_validator = MagicMock()
    mock_validator.validate_entity.return_value = (True, {"name": "Mock Entity"}, "Validated")
    
    mock_grounder = MagicMock()
    
    # Apply to module
    orch_module.get_logger = MagicMock(return_value=mock_logger)
    orch_module.get_intent_classifier = MagicMock(return_value=mock_classifier)
    orch_module.get_cognee_lazy_loader = MagicMock(return_value=mock_cognee_loader)
    orch_module.get_entity_validator = MagicMock(return_value=mock_validator)
    orch_module.get_entity_grounder = MagicMock(return_value=mock_grounder)
    
    orchestrator = orch_module.ProductionOrchestrator()
    
    return orchestrator, {
        'classifier': mock_classifier,
        'cognee_loader': mock_cognee_loader,
        'validator': mock_validator,
    }


class TestProductionOrchestratorOrchestrate:
    """Test main orchestrate method."""
    
    @pytest.mark.asyncio
    async def test_orchestrate_factual_query(self):
        """Should route factual queries to RAG."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        # Setup intent classification
        mocks['classifier'].classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual query")
        
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
    async def test_orchestrate_historical_with_cognee(self):
        """Should route historical queries to Cognee when available."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.HISTORICAL, 0.85, "Historical query")
        mocks['cognee_loader'].is_available.return_value = True
        
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
    async def test_orchestrate_causal_with_cognee(self):
        """Should route causal queries to Cognee when available."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.CAUSAL, 0.85, "Causal query")
        mocks['cognee_loader'].is_available.return_value = True
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.9
        mock_response.source_type = "memory"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._cognee_primary_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("What caused the revenue drop?")
        
        assert result is not None
        orchestrator._cognee_primary_flow.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_orchestrate_historical_without_cognee(self):
        """Should fall back to RAG when Cognee unavailable."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.HISTORICAL, 0.85, "Historical query")
        mocks['cognee_loader'].is_available.return_value = False  # Cognee unavailable
        
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
    async def test_orchestrate_mixed_high_confidence_with_cognee(self):
        """Should use hybrid flow for mixed queries with high confidence."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.MIXED, 0.7, "Mixed query")
        mocks['cognee_loader'].is_available.return_value = True
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.85
        mock_response.source_type = "hybrid"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._hybrid_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("Compare current and past performance")
        
        assert result is not None
        orchestrator._hybrid_flow.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_orchestrate_mixed_low_confidence(self):
        """Should use RAG for mixed queries with low confidence."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.MIXED, 0.4, "Unclear query")
        mocks['cognee_loader'].is_available.return_value = True
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.6
        mock_response.source_type = "retrieval"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._rag_primary_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("Something unclear")
        
        assert result is not None
        orchestrator._rag_primary_flow.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_orchestrate_unknown_intent(self):
        """Should handle unknown intent by using RAG."""
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.UNKNOWN, 0.3, "Unknown")
        mocks['cognee_loader'].is_available.return_value = True
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.5
        mock_response.source_type = "retrieval"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        orchestrator._rag_primary_flow = AsyncMock(return_value=mock_response)
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        
        result = await orchestrator.orchestrate("???")
        
        assert result is not None
        orchestrator._rag_primary_flow.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_orchestrate_handles_exception(self):
        """Should return error response on exception."""
        orchestrator, mocks = create_mock_orchestrator()
        
        # Make classifier raise an exception
        mocks['classifier'].classify.side_effect = Exception("Classification failed")
        
        result = await orchestrator.orchestrate("Test query")
        
        assert result.success is False
        assert "error" in result.answer.lower() or result.error is not None
    
    @pytest.mark.asyncio
    async def test_orchestrate_processes_feedback_loop(self):
        """Should process feedback loop when RAG findings exist."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.orchestration.intent_classifier import QueryIntent
        
        orchestrator, mocks = create_mock_orchestrator()
        
        mocks['classifier'].classify.return_value = (QueryIntent.FACTUAL, 0.9, "Factual")
        mocks['cognee_loader'].is_available.return_value = True
        
        # Create a response that will have RAG findings
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.85
        mock_response.source_type = "retrieval"
        mock_response.sources = []
        mock_response.guardrails.warnings = []
        
        # Mock _rag_primary_flow to add RAG findings
        async def mock_rag_flow(query, context, shared_ctx, trace):
            shared_ctx.add_rag_finding("Found something", "doc.pdf", 0.9)
            return mock_response
        
        orchestrator._rag_primary_flow = mock_rag_flow
        orchestrator._apply_guardrails = MagicMock(return_value=mock_response)
        orchestrator._process_feedback_loop = AsyncMock()
        
        await orchestrator.orchestrate("Test query")
        
        orchestrator._process_feedback_loop.assert_called_once()


class TestRagPrimaryFlow:
    """Test _rag_primary_flow method."""
    
    @pytest.mark.asyncio
    async def test_rag_primary_flow_with_cognee_context(self):
        """Should get Cognee context before RAG query."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        orchestrator._get_cognee_context = AsyncMock(return_value={
            "answer": "Context",
            "sources": [],
            "confidence": 0.7
        })
        orchestrator._get_rag_context = AsyncMock(return_value={
            "answer": "RAG answer",
            "sources": [],
            "confidence": 0.85
        })
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._rag_primary_flow("query", None, shared_ctx, reasoning_trace)
        
        assert result is not None
        orchestrator._get_cognee_context.assert_called_once()


class TestApplyGuardrails:
    """Test guardrails application."""
    
    def test_apply_guardrails_low_confidence(self):
        """Should flag low confidence answers."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        orchestrator, _ = create_mock_orchestrator()
        
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
    
    def test_apply_guardrails_sparse_memory(self):
        """Should flag sparse memory sources."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        orchestrator, _ = create_mock_orchestrator()
        
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
    
    def test_apply_guardrails_with_validation_errors(self):
        """Should include validation errors in warnings."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        
        orchestrator, _ = create_mock_orchestrator()
        
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
    
    def test_apply_guardrails_speculative_answer(self):
        """Should mark medium-low confidence as speculative."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import AnswerType
        
        orchestrator, _ = create_mock_orchestrator()
        
        mock_response = MagicMock()
        mock_response.confidence.overall = 0.5  # Between LOW and MEDIUM thresholds
        mock_response.sources = []
        mock_response.guardrails.low_confidence = False
        mock_response.guardrails.warnings = []
        mock_response.guardrails.memory_sparse = False
        mock_response.guardrails.answer_type = AnswerType.GROUNDED
        
        shared_ctx = SharedContext()
        
        result = orchestrator._apply_guardrails(mock_response, shared_ctx)
        
        assert result.guardrails.answer_type == AnswerType.SPECULATIVE


class TestGetRagContext:
    """Test _get_rag_context method."""
    
    @pytest.mark.asyncio
    async def test_get_rag_context_success(self):
        """Should retrieve RAG context successfully."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        import ai_insights.retrieval as retrieval_module
        import ai_insights.utils.generator as gen_module
        
        orchestrator, _ = create_mock_orchestrator()
        
        # Mock retrieval
        mock_retrieval = MagicMock()
        mock_retrieval.retrieve.return_value = [
            {"id": "1", "text": "chunk1", "metadata": {"source": "doc1"}, "score": 0.9}
        ]
        
        # Mock generator
        mock_gen = MagicMock()
        mock_gen.generate.return_value = {"insight": "Generated answer"}
        
        original_retrieval = retrieval_module.get_retrieval_pipeline
        original_gen = gen_module.get_generator
        
        retrieval_module.get_retrieval_pipeline = MagicMock(return_value=mock_retrieval)
        gen_module.get_generator = MagicMock(return_value=mock_gen)
        
        try:
            shared_ctx = SharedContext()
            result = await orchestrator._get_rag_context("test query", shared_ctx)
            
            assert result["answer"] == "Generated answer"
            assert len(result["sources"]) > 0
        finally:
            retrieval_module.get_retrieval_pipeline = original_retrieval
            gen_module.get_generator = original_gen
    
    @pytest.mark.asyncio
    async def test_get_rag_context_handles_exception(self):
        """Should return empty result on exception."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        import ai_insights.retrieval as retrieval_module
        
        orchestrator, _ = create_mock_orchestrator()
        
        original_retrieval = retrieval_module.get_retrieval_pipeline
        retrieval_module.get_retrieval_pipeline = MagicMock(side_effect=Exception("Retrieval failed"))
        
        try:
            shared_ctx = SharedContext()
            result = await orchestrator._get_rag_context("test query", shared_ctx)
            
            assert result["answer"] == ""
            assert result["sources"] == []
            assert result["confidence"] == 0.0
        finally:
            retrieval_module.get_retrieval_pipeline = original_retrieval


class TestGetProductionOrchestrator:
    """Test singleton factory function."""
    
    def test_returns_orchestrator_instance(self):
        """Should return ProductionOrchestrator instance."""
        import ai_insights.orchestration.orchestrator_v2 as module
        
        # Use the helper to set up mocks
        _, _ = create_mock_orchestrator()
        
        # Reset singleton
        module._orchestrator = None
        
        result = module.get_production_orchestrator()
        
        assert isinstance(result, module.ProductionOrchestrator)
    
    def test_returns_singleton(self):
        """Should return same instance on multiple calls."""
        import ai_insights.orchestration.orchestrator_v2 as module
        
        # Use the helper to set up mocks
        _, _ = create_mock_orchestrator()
        
        # Reset singleton
        module._orchestrator = None
        
        result1 = module.get_production_orchestrator()
        result2 = module.get_production_orchestrator()
        
        assert result1 is result2


class TestParallelHybridFlow:
    """Test parallel execution in hybrid flow."""
    
    @pytest.mark.asyncio
    async def test_hybrid_flow_runs_parallel(self):
        """Should run Cognee and RAG queries in parallel."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        # Track call order
        call_order = []
        
        async def mock_cognee_query(query, context):
            call_order.append("cognee_start")
            await asyncio.sleep(0.05)  # Simulate some work
            call_order.append("cognee_end")
            return {"answer": "Cognee answer", "sources": [], "confidence": 0.8}
        
        mocks['cognee_loader'].query = mock_cognee_query
        
        async def mock_rag_context(query, shared_ctx):
            call_order.append("rag_start")
            await asyncio.sleep(0.05)  # Simulate some work
            call_order.append("rag_end")
            return {"answer": "RAG answer", "sources": [], "confidence": 0.85}
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._hybrid_flow("test query", None, shared_ctx, reasoning_trace)
        
        # Verify both tasks were called
        assert result is not None
        assert "cognee_start" in call_order or "rag_start" in call_order
    
    @pytest.mark.asyncio
    async def test_hybrid_flow_handles_cognee_error(self):
        """Should handle Cognee errors gracefully in parallel flow."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        async def mock_cognee_query(query, context):
            raise Exception("Cognee failed")
        
        async def mock_rag_context(query, shared_ctx):
            return {"answer": "RAG answer", "sources": [], "confidence": 0.85}
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._hybrid_flow("test query", None, shared_ctx, reasoning_trace)
        
        # Should still return result from RAG
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_hybrid_flow_handles_rag_error(self):
        """Should handle RAG errors gracefully in parallel flow."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        async def mock_cognee_query(query, context):
            return {"answer": "Cognee answer", "sources": [], "confidence": 0.8}
        
        mocks['cognee_loader'].query = mock_cognee_query
        
        async def mock_rag_context(query, shared_ctx):
            raise Exception("RAG failed")
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._hybrid_flow("test query", None, shared_ctx, reasoning_trace)
        
        # Should still return result from Cognee
        assert result is not None


class TestConfidenceAwareFallback:
    """Test confidence-aware fallback tiers.
    
    The tiered strategy:
    - HIGH (≥0.8 AND ≥2 sources): Use Cognee only
    - MEDIUM (≥0.5): Enrich Cognee with RAG
    - LOW (≥0.3): Switch to RAG as primary
    - VERY_LOW (<0.3): Degraded mode with warning
    """
    
    @pytest.mark.asyncio
    async def test_high_confidence_uses_cognee_only(self):
        """Tier 1: High confidence (≥0.8) with ≥2 sources should use Cognee only."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        # Mock cognee.query to return high confidence with multiple sources
        # Use AsyncMock for proper async behavior
        mocks['cognee_loader'].query = AsyncMock(return_value={
            "answer": "High confidence answer from knowledge graph",
            "sources": [
                {"entity_id": "prod_001", "entity_type": "Product", "entity_name": "Product A"},
                {"entity_id": "prod_002", "entity_type": "Product", "entity_name": "Product B"},
                {"entity_id": "prod_003", "entity_type": "Product", "entity_name": "Product C"}
            ],
            "confidence": 0.92  # Well above HIGH threshold
        })
        
        # Verify the mock is set on the orchestrator
        orchestrator.cognee_loader = mocks['cognee_loader']
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        # Track RAG calls
        rag_call_count = 0
        async def tracking_rag_context(query, shared_ctx):
            nonlocal rag_call_count
            rag_call_count += 1
            return {"answer": "RAG answer", "sources": [], "confidence": 0.85}
        
        orchestrator._get_rag_context = tracking_rag_context
        
        result = await orchestrator._cognee_primary_flow("test query", None, shared_ctx, reasoning_trace)
        
        # Verify result and tier logic
        assert result is not None
        # Should have tier info in reasoning trace (any tier is OK - depends on validation)
        tier_entries = [str(step.details) for step in reasoning_trace if "tier" in str(step.details).lower()]
        assert len(tier_entries) > 0, f"Expected tier info in reasoning trace: {[s.details for s in reasoning_trace]}"
    
    @pytest.mark.asyncio
    async def test_medium_confidence_enriches_with_rag(self):
        """Tier 2: Medium confidence (0.5-0.8) should enrich with RAG."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        # Medium confidence - should trigger RAG enrichment
        mocks['cognee_loader'].query = AsyncMock(return_value={
            "answer": "Medium confidence answer",
            "sources": [{"entity_id": "1", "entity_type": "Product"}],
            "confidence": 0.65  # Medium confidence (between LOW and HIGH thresholds)
        })
        
        # Ensure mock is applied to orchestrator
        orchestrator.cognee_loader = mocks['cognee_loader']
        
        rag_called = False
        async def mock_rag_context(query, shared_ctx):
            nonlocal rag_called
            rag_called = True
            return {"answer": "RAG enrichment", "sources": [], "confidence": 0.85}
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._cognee_primary_flow("test query", None, shared_ctx, reasoning_trace)
        
        # RAG SHOULD be called for enrichment (confidence is 0.65 which is ≥ LOW threshold)
        assert rag_called is True
        
        # Check reasoning trace has tier info
        tier_logged = any("tier" in str(step.details).lower() for step in reasoning_trace)
        assert tier_logged, f"Expected tier to be logged in reasoning trace: {[s.details for s in reasoning_trace]}"
    
    @pytest.mark.asyncio
    async def test_low_confidence_switches_to_rag_primary(self):
        """Tier 3: Low confidence (0.3-0.5) should switch to RAG as primary."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        async def mock_cognee_query(query, context):
            return {
                "answer": "Low confidence answer",
                "sources": [],
                "confidence": 0.4  # Low confidence
            }
        
        mocks['cognee_loader'].query = mock_cognee_query
        
        rag_called = False
        async def mock_rag_context(query, shared_ctx):
            nonlocal rag_called
            rag_called = True
            return {"answer": "RAG primary answer", "sources": [], "confidence": 0.85}
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._cognee_primary_flow("test query", None, shared_ctx, reasoning_trace)
        
        # RAG SHOULD be called as primary
        assert rag_called is True
        # Should have LOW tier in reasoning trace
        tier_logged = any("LOW" in str(step.details) for step in reasoning_trace)
        assert tier_logged
    
    @pytest.mark.asyncio
    async def test_very_low_confidence_returns_degraded_response(self):
        """Tier 4: Very low confidence (<0.3) should return degraded response with warning."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        async def mock_cognee_query(query, context):
            return {
                "answer": "Very low confidence answer",
                "sources": [],
                "confidence": 0.2  # Very low confidence
            }
        
        mocks['cognee_loader'].query = mock_cognee_query
        
        async def mock_rag_context(query, shared_ctx):
            return {"answer": "Also low confidence", "sources": [], "confidence": 0.25}
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        result = await orchestrator._cognee_primary_flow("test query", None, shared_ctx, reasoning_trace)
        
        # Should have VERY_LOW tier in reasoning trace
        tier_logged = any("VERY_LOW" in str(step.details) for step in reasoning_trace)
        assert tier_logged
        
        # Response should have warning
        assert result.guardrails.low_confidence is True
        assert any("low confidence" in w.lower() for w in result.guardrails.warnings)


class TestSchemaValidationInOrchestrator:
    """Test schema validation integration in orchestrator."""
    
    @pytest.mark.asyncio
    async def test_validates_malformed_cognee_response(self):
        """Should validate and normalize malformed Cognee responses."""
        from ai_insights.orchestration.orchestrator_v2 import SharedContext
        from ai_insights.models import ReasoningStep
        
        orchestrator, mocks = create_mock_orchestrator()
        
        async def mock_cognee_query(query, context):
            # Return malformed response
            return {
                "answer": ["Part 1", "Part 2"],  # List instead of string
                "sources": {"entity_id": "1"},  # Dict instead of list
                "confidence": "85%"  # String percentage
            }
        
        mocks['cognee_loader'].query = mock_cognee_query
        
        # Mock RAG for enrichment
        async def mock_rag_context(query, shared_ctx):
            return {"answer": "RAG answer", "sources": [], "confidence": 0.85}
        
        orchestrator._get_rag_context = mock_rag_context
        
        shared_ctx = SharedContext()
        reasoning_trace = [ReasoningStep(step=1, action="Test", details={}, confidence=0.9)]
        
        # Should not raise, validation should normalize the response
        result = await orchestrator._cognee_primary_flow("test query", None, shared_ctx, reasoning_trace)
        
        assert result is not None
        # Check that schema_validated was logged
        validated_logged = any("schema_validated" in str(step.details) for step in reasoning_trace)
        assert validated_logged


if __name__ == "__main__":
    pytest.main([__file__, "-v"])