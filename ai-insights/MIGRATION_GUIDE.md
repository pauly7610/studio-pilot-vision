# Migration Guide: Restructured Package Layout

## Overview

The `ai-insights` module has been restructured into a proper Python package with the `src/` layout. This provides better organization, clearer module boundaries, and follows modern Python packaging standards.

## New Structure

```
ai-insights/
├── pyproject.toml              # Package metadata and dependencies
├── src/
│   └── ai_insights/
│       ├── __init__.py
│       ├── orchestration/      # Intent classification & routing
│       │   ├── __init__.py
│       │   ├── orchestrator_v2.py
│       │   ├── intent_classifier.py
│       │   └── entity_validator.py
│       ├── retrieval/          # RAG pipeline
│       │   ├── __init__.py
│       │   ├── retrieval.py
│       │   ├── vector_store.py
│       │   ├── document_loader.py
│       │   └── embeddings.py
│       ├── cognee/             # Knowledge graph memory
│       │   ├── __init__.py
│       │   ├── cognee_client.py
│       │   ├── cognee_lazy_loader.py
│       │   ├── cognee_init.py
│       │   ├── cognee_query.py
│       │   └── cognee_schema.py
│       ├── models/             # Response models
│       │   ├── __init__.py
│       │   └── response_models.py
│       ├── config/             # Configuration
│       │   ├── __init__.py
│       │   ├── settings.py
│       │   ├── logger.py
│       │   └── config.py
│       └── utils/              # Utilities
│           ├── __init__.py
│           ├── metrics.py
│           ├── generator.py
│           └── jira_parser.py
├── tests/                      # Test suite
├── main.py                     # FastAPI application (backward compatible)
└── README.md
```

## Installation

### Development Installation

```bash
# Install in editable mode with dev dependencies
cd ai-insights
pip install -e ".[dev]"
```

### Production Installation

```bash
pip install -e .
```

## Import Changes

### Old Imports (Root Level)
```python
from orchestrator_v2 import ProductionOrchestrator
from intent_classifier import QueryIntent
from response_models import UnifiedAIResponse
from settings import get_settings
from logger import get_logger
```

### New Imports (Package Structure)
```python
from ai_insights.orchestration import ProductionOrchestrator, QueryIntent
from ai_insights.models import UnifiedAIResponse
from ai_insights.config import get_settings, get_logger
```

## Migration Steps

### Option 1: Install as Package (Recommended)

1. **Install the package in editable mode:**
   ```bash
   cd ai-insights
   pip install -e .
   ```

2. **Update imports in your code:**
   ```python
   # Old
   from orchestrator_v2 import get_production_orchestrator
   
   # New
   from ai_insights.orchestration import get_production_orchestrator
   ```

3. **Run tests to verify:**
   ```bash
   pytest
   ```

### Option 2: Use Backward Compatible Wrapper

The root-level `main.py` maintains backward compatibility. You can continue using the old import style if needed, but this is not recommended for new code.

## Module Organization

### `ai_insights.orchestration`
- Query intent classification
- Entity validation and grounding
- Orchestrator routing logic

**Key exports:**
- `ProductionOrchestrator`
- `IntentClassifier`
- `QueryIntent`

### `ai_insights.retrieval`
- RAG pipeline
- Vector store operations
- Document loading and processing

**Key exports:**
- `get_retrieval_pipeline()`
- `get_vector_store()`
- `get_document_loader()`

### `ai_insights.cognee`
- Cognee client and lazy loading
- Knowledge graph operations

**Key exports:**
- `CogneeClient`
- `get_cognee_lazy_loader()`

### `ai_insights.models`
- Response models and data structures
- Confidence calculation
- Guardrails

**Key exports:**
- `UnifiedAIResponse`
- `ConfidenceBreakdown`
- `SourceType`

### `ai_insights.config`
- Settings validation (Pydantic)
- Logging configuration

**Key exports:**
- `get_settings()`
- `get_logger()`

### `ai_insights.utils`
- Metrics collection
- Response generation
- Jira parsing

**Key exports:**
- `track_query_metrics`
- `get_generator()`

## Testing

### Run All Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=src/ai_insights --cov-report=html
```

### Run Specific Test Module
```bash
pytest tests/test_orchestrator.py
```

## Benefits of New Structure

1. **Clear Module Boundaries**: Each subdirectory has a specific responsibility
2. **Better Imports**: Explicit package paths prevent naming conflicts
3. **Easier Testing**: Tests can import from installed package
4. **Professional Standard**: Follows PEP 621 and modern Python packaging
5. **IDE Support**: Better autocomplete and type checking
6. **Dependency Management**: `pyproject.toml` centralizes all configuration

## Troubleshooting

### Import Errors

If you get `ModuleNotFoundError: No module named 'ai_insights'`:

```bash
# Ensure package is installed
pip install -e .

# Or add to PYTHONPATH temporarily
export PYTHONPATH="${PYTHONPATH}:/path/to/ai-insights/src"
```

### Test Failures

If tests fail after migration:

1. Check that package is installed: `pip list | grep ai-insights`
2. Verify imports in test files use new package structure
3. Clear `__pycache__` directories: `find . -type d -name __pycache__ -exec rm -rf {} +`

## Backward Compatibility

The root-level files remain in place for backward compatibility during migration. However, new development should use the package structure.

**Deprecated (but still works):**
```python
import sys
sys.path.append('.')
from orchestrator_v2 import ProductionOrchestrator
```

**Recommended:**
```python
from ai_insights.orchestration import ProductionOrchestrator
```

## Next Steps

1. Install package: `pip install -e .`
2. Update imports in your code
3. Run tests: `pytest`
4. Update CI/CD pipelines to use `pyproject.toml`
5. Consider removing root-level files after migration is complete
