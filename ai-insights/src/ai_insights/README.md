# AI Insights Package

Production-grade AI query orchestration with hybrid Cognee/RAG architecture.

## Quick Start

```python
from ai_insights.orchestration import get_production_orchestrator
from ai_insights.config import get_settings

# Initialize settings
settings = get_settings()

# Create orchestrator
orchestrator = get_production_orchestrator()

# Run query
result = await orchestrator.orchestrate(
    query="Why did sales drop last quarter?",
    context={"user_id": "user_123"}
)

print(f"Answer: {result.answer}")
print(f"Confidence: {result.confidence.overall}")
print(f"Source: {result.source_type}")
```

## Package Structure

### `orchestration/`
Query routing and intent classification.

```python
from ai_insights.orchestration import (
    ProductionOrchestrator,
    IntentClassifier,
    QueryIntent,
)
```

### `retrieval/`
RAG pipeline and vector operations.

```python
from ai_insights.retrieval import (
    get_retrieval_pipeline,
    get_vector_store,
    get_document_loader,
)
```

### `cognee/`
Knowledge graph memory layer.

```python
from ai_insights.cognee import (
    CogneeClient,
    get_cognee_lazy_loader,
)
```

### `models/`
Response models and data structures.

```python
from ai_insights.models import (
    UnifiedAIResponse,
    ConfidenceBreakdown,
    SourceType,
)
```

### `config/`
Configuration and logging.

```python
from ai_insights.config import (
    get_settings,
    get_logger,
)
```

### `utils/`
Utilities and helpers.

```python
from ai_insights.utils import (
    track_query_metrics,
    get_generator,
)
```

## Installation

```bash
pip install -e .
```

## Configuration

Set required environment variables:

```bash
export GROQ_API_KEY="your-groq-api-key"
export HUGGINGFACE_API_KEY="your-hf-api-key"  # Optional
```

Or use `.env` file (see `.env.example`).

## Testing

```bash
# All tests
pytest

# With coverage
pytest --cov=src/ai_insights --cov-report=html

# Specific module
pytest tests/test_orchestrator.py
```

## Monitoring

Prometheus metrics available at `/metrics` endpoint:

- Query latency and confidence
- Cognee availability
- RAG performance
- Intent classification stats

## Architecture

```
Query → Intent Classification → Routing Decision
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            Cognee (Memory)                      RAG (Retrieval)
                    ↓                                   ↓
                    └─────────────────┬─────────────────┘
                                      ↓
                              Response Generation
                                      ↓
                              Guardrails & Validation
                                      ↓
                              UnifiedAIResponse
```

## Key Features

- **Hybrid Architecture**: Combines Cognee knowledge graph with RAG retrieval
- **Intent-Based Routing**: Automatic query classification and routing
- **Entity Validation**: Prevents hallucination through entity grounding
- **Confidence Scoring**: 4-component confidence breakdown
- **Graceful Degradation**: Automatic fallbacks when services unavailable
- **Production Monitoring**: Prometheus metrics and structured logging
- **Type Safety**: Full Pydantic validation

## License

MIT
