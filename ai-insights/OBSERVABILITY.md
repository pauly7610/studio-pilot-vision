# Observability Guide

Complete guide for monitoring, logging, and tracing the AI Insights service.

## Structured Logging

### Configuration

Logging is configured via environment variables:

```bash
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Log Format

All logs use structured JSON format:

```json
{
  "timestamp": "2025-12-30T16:00:00.000Z",
  "level": "INFO",
  "logger": "ai_insights.orchestration",
  "message": "Query orchestrated successfully",
  "query": "What are the risks?",
  "intent": "factual",
  "source": "rag",
  "confidence": 0.85,
  "duration_ms": 234
}
```

### Usage in Code

```python
from ai_insights.config import get_logger

logger = get_logger(__name__)

# Structured logging with context
logger.info(
    "Query processed",
    extra={
        "query": query,
        "intent": intent.value,
        "confidence": result.confidence.overall,
        "duration_ms": duration
    }
)
```

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General operational events
- **WARNING**: Warning messages for recoverable issues
- **ERROR**: Error events that still allow the app to continue
- **CRITICAL**: Severe errors causing application failure

## Prometheus Metrics

### Available Metrics

#### Query Metrics
```
# Total queries processed
ai_query_total{intent="factual|historical|causal|mixed"}

# Query latency histogram
ai_query_duration_seconds{intent="factual|historical|causal|mixed"}

# Query confidence distribution
ai_query_confidence{intent="factual|historical|causal|mixed"}
```

#### Cognee Metrics
```
# Cognee availability (0 or 1)
cognee_available

# Cognee query latency
cognee_query_duration_seconds

# Cognee query success/failure
cognee_query_total{status="success|failure"}
```

#### RAG Metrics
```
# RAG query latency
rag_query_duration_seconds

# RAG retrieval count
rag_retrieval_total

# RAG document count
rag_documents_indexed
```

#### Intent Classification Metrics
```
# Intent classification latency
intent_classification_duration_seconds

# Intent classification confidence
intent_classification_confidence{intent="factual|historical|causal|mixed"}

# Intent classification method
intent_classification_total{method="heuristic|llm"}
```

#### Fallback Metrics
```
# Fallback triggers
fallback_triggered_total{reason="cognee_unavailable|low_confidence|error"}
```

### Accessing Metrics

Metrics are exposed at the `/metrics` endpoint:

```bash
curl http://localhost:8001/metrics
```

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'ai-insights'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8001']
```

### Grafana Dashboards

Import the provided dashboard JSON from `monitoring/grafana-dashboard.json`.

Key panels:
- Query throughput and latency
- Confidence score distribution
- Intent classification breakdown
- Cognee availability timeline
- Error rate and fallback triggers

## Distributed Tracing (OpenTelemetry)

### Setup

Install OpenTelemetry:

```bash
pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi
```

### Configuration

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Configure tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Export to Jaeger/Tempo
otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4317")
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)
```

### Usage

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@tracer.start_as_current_span("orchestrate_query")
async def orchestrate(query: str):
    span = trace.get_current_span()
    span.set_attribute("query.text", query)
    span.set_attribute("query.length", len(query))
    
    # Your code here
    
    span.set_attribute("result.confidence", confidence)
    return result
```

### Trace Context

Traces automatically propagate across:
- FastAPI endpoints
- HTTP client calls (httpx)
- Database queries
- External API calls (Groq, Cognee)

## Health Checks

### Liveness Probe

Checks if the service is running:

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T16:00:00.000Z",
  "version": "1.0.0"
}
```

### Readiness Probe

Checks if the service is ready to accept traffic:

```bash
GET /health/ready
```

Response:
```json
{
  "status": "ready",
  "checks": {
    "vector_store": "ok",
    "cognee": "degraded",
    "llm": "ok"
  }
}
```

### Kubernetes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 5
```

## Alerting Rules

### Prometheus Alerts

```yaml
groups:
  - name: ai-insights
    rules:
      - alert: HighErrorRate
        expr: rate(ai_query_total{status="error"}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate in AI Insights"
      
      - alert: LowConfidence
        expr: avg(ai_query_confidence) < 0.5
        for: 10m
        annotations:
          summary: "Average query confidence below threshold"
      
      - alert: CogneeDown
        expr: cognee_available == 0
        for: 5m
        annotations:
          summary: "Cognee service unavailable"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, ai_query_duration_seconds) > 5
        for: 5m
        annotations:
          summary: "95th percentile query latency above 5s"
```

## Log Aggregation

### ELK Stack

Ship logs to Elasticsearch:

```python
from logging.handlers import SocketHandler

# Add Logstash handler
logstash_handler = SocketHandler('localhost', 5000)
logger.addHandler(logstash_handler)
```

### Loki

Use Promtail to ship logs to Loki:

```yaml
# promtail-config.yml
clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: ai-insights
    static_configs:
      - targets:
          - localhost
        labels:
          job: ai-insights
          __path__: /var/log/ai-insights/*.log
```

## Performance Monitoring

### Key Metrics to Monitor

1. **Query Latency**: P50, P95, P99
2. **Throughput**: Requests per second
3. **Error Rate**: Percentage of failed requests
4. **Confidence Distribution**: Average and distribution
5. **Cognee Availability**: Uptime percentage
6. **Memory Usage**: RSS and heap size
7. **CPU Usage**: Per-core utilization

### SLIs and SLOs

```yaml
SLIs:
  - name: Availability
    target: 99.9%
    measurement: uptime
  
  - name: Latency
    target: 95% < 2s
    measurement: p95_latency
  
  - name: Error Rate
    target: < 1%
    measurement: error_percentage
  
  - name: Confidence
    target: avg > 0.7
    measurement: avg_confidence
```

## Debugging

### Enable Debug Logging

```bash
export LOG_LEVEL=DEBUG
python main.py
```

### View Metrics Locally

```bash
# Install Prometheus
docker run -p 9090:9090 prom/prometheus

# View metrics
open http://localhost:9090
```

### Trace a Request

```bash
# Enable tracing
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# View in Jaeger
docker run -p 16686:16686 jaegertracing/all-in-one
open http://localhost:16686
```

## Production Checklist

- [ ] Structured logging configured
- [ ] Prometheus metrics endpoint exposed
- [ ] Health checks implemented
- [ ] Alerts configured in Prometheus
- [ ] Logs shipped to aggregation system
- [ ] Distributed tracing enabled
- [ ] Grafana dashboards imported
- [ ] SLIs and SLOs defined
- [ ] On-call runbook created
- [ ] Incident response plan documented
