# AI Insights Test Suite

Comprehensive test coverage for the AI insights orchestration system.

## Running Tests

### Run all tests
```bash
pytest
```

### Run with coverage report
```bash
pytest --cov=src/ai_insights --cov-report=html
```

### Run specific test file
```bash
pytest tests/test_orchestrator.py
```

### Run specific test class
```bash
pytest tests/test_orchestrator.py::TestIntentRouting
```

### Run specific test
```bash
pytest tests/test_orchestrator.py::TestIntentRouting::test_factual_query_routes_to_rag
```

## Test Structure

- `test_orchestrator.py` - Orchestrator routing logic and integration
- `test_intent_classifier.py` - Intent classification (heuristic + LLM)
- `test_settings.py` - Pydantic settings validation
- `test_integration.py` - End-to-end Cognee/RAG integration tests
- `test_cognee_diagnostic.py` - Cognee diagnostic and troubleshooting script

## Test Categories

### Unit Tests
Test individual components in isolation with mocked dependencies.

### Integration Tests
Test component interactions (marked with `@pytest.mark.integration`).

### Async Tests
All orchestrator tests are async (marked with `@pytest.mark.asyncio`).

## Coverage Goals

- **Orchestrator**: 80%+ coverage of routing logic
- **Intent Classifier**: 90%+ coverage of classification paths
- **Settings**: 100% coverage of validation logic

## Adding New Tests

1. Create test file: `tests/test_<module>.py`
2. Import from package: `from ai_insights.orchestration import ...`
3. Use descriptive class names: `TestFeatureName`
4. Use descriptive test names: `test_specific_behavior`
5. Mock external dependencies (Groq API, Cognee, etc.)
6. Add docstrings explaining what is being tested

## Import Pattern

All tests use the new package structure:

```python
from ai_insights.orchestration import ProductionOrchestrator, QueryIntent
from ai_insights.models import UnifiedAIResponse, SourceType
from ai_insights.config import get_settings, get_logger
```

## Mocking Guidelines

- Mock external API calls (Groq, HuggingFace)
- Mock Cognee client for orchestrator tests
- Use `AsyncMock` for async functions
- Patch at the point of use, not definition
