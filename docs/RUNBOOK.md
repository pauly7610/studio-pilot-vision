# Operational Runbook - Studio Pilot Vision

## Overview

This runbook provides step-by-step procedures for operating, monitoring, and troubleshooting Studio Pilot Vision in production.

## Table of Contents

1. [System Health Checks](#system-health-checks)
2. [Common Issues & Resolution](#common-issues--resolution)
3. [Debugging Guides](#debugging-guides)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Incident Response](#incident-response)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Deployment Procedures](#deployment-procedures)
8. [Rollback Procedures](#rollback-procedures)

---

## System Health Checks

### Quick Health Check (5 minutes)

Run these checks to verify system health:

```bash
# 1. Check AI Service health
curl https://studio-pilot-vision.onrender.com/health

# Expected: {"status": "healthy", "timestamp": "2025-01-04T10:30:00Z"}

# 2. Check database connectivity
curl https://studio-pilot-vision.onrender.com/api/health/db

# Expected: {"database": "connected", "latency_ms": 15}

# 3. Check Cognee status
curl https://studio-pilot-vision.onrender.com/cognee/health

# Expected: {"cognee": "ready", "graph_db": "connected", "entities": 1234}

# 4. Check frontend
curl https://studio-pilot-vision.lovable.app/

# Expected: HTTP 200, HTML content

# 5. Test AI query
curl -X POST https://studio-pilot-vision.onrender.com/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "health check test"}'

# Expected: {"success": true, "answer": "...", "confidence": 0.x}
```

### Detailed Health Dashboard

Access health metrics at: `https://studio-pilot-vision.onrender.com/metrics`

**Key Metrics to Monitor:**
- Request rate (requests/sec)
- Error rate (%)
- Response time (95th percentile)
- Cache hit rate (%)
- Database connection pool usage
- Memory usage (MB)
- CPU usage (%)

**Healthy Baselines:**
- Error rate: < 1%
- Response time (p95): < 500ms
- Cache hit rate: > 60%
- Memory usage: < 1.5GB
- CPU usage: < 70%

---

## Common Issues & Resolution

### Issue 1: Slow AI Queries (> 5 seconds)

**Symptoms:**
- Users report slow response times
- AI query endpoint timing out
- High CPU usage on AI service

**Root Causes:**
1. Cognee query taking too long (graph traversal)
2. LLM API slow/unavailable (Groq)
3. ChromaDB index not optimized
4. Cold start (cache empty)

**Resolution:**

```bash
# Step 1: Check if it's a cold start issue
curl https://studio-pilot-vision.onrender.com/cognee/cache/stats

# If cache_hit_rate < 0.3, warm up cache:
curl -X POST https://studio-pilot-vision.onrender.com/cognee/warm-up

# Step 2: Check Groq API status
curl https://api.groq.com/health

# If Groq is down, queries will fall back to RAG only (slower but working)

# Step 3: Check ChromaDB performance
# Look for logs: "ChromaDB query took Xms"
# If X > 200ms, ChromaDB may need reindexing

# Step 4: Restart AI service (clears memory leaks)
# In Render dashboard: Manual Deploy → Restart
```

**Prevention:**
- Set up scheduled cache warm-up (every 6 hours)
- Monitor Groq API status
- Implement query timeout (5 seconds)

---

### Issue 2: Cognee Errors (Duplicate entities, failed ingestion)

**Symptoms:**
- Ingestion jobs failing
- Error logs: "Entity already exists"
- Inconsistent query results

**Root Causes:**
1. Duplicate webhook events
2. Inconsistent entity IDs
3. NetworkX state corruption (in-memory)
4. Race conditions in parallel ingestion

**Resolution:**

```bash
# Step 1: Check ingestion job status
curl https://studio-pilot-vision.onrender.com/cognee/ingest/status/{job_id}

# If status="failed", check error message

# Step 2: Clear Cognee data (destructive!)
curl -X POST https://studio-pilot-vision.onrender.com/cognee/reset
# WARNING: This deletes all Cognee data

# Step 3: Re-ingest from scratch
curl -X POST https://studio-pilot-vision.onrender.com/cognee/ingest/products
# Wait for completion, then:
curl -X POST https://studio-pilot-vision.onrender.com/cognee/ingest/actions

# Step 4: Verify data integrity
curl https://studio-pilot-vision.onrender.com/cognee/diagnostics
```

**Prevention:**
- Enable webhook debouncing (5-second window)
- Use stable hash-based entity IDs
- Migrate to Neo4j (persistent, transactional)
- Add entity validation before ingestion

---

### Issue 3: High Error Rate (> 5%)

**Symptoms:**
- Error rate spike in metrics
- Users seeing 500 errors
- CORS errors in browser console

**Root Causes:**
1. Database connection pool exhausted
2. Unhandled exceptions in AI logic
3. CORS misconfiguration
4. Rate limiting triggered

**Resolution:**

```bash
# Step 1: Check error logs
# In Render dashboard: Logs → Filter by "ERROR"

# Common errors:
# - "ConnectionError: database connection pool exhausted"
#   → Increase pool size or restart service
# - "CogneeError: graph database unavailable"
#   → Check NetworkX state or restart
# - "GroqAPIError: rate limit exceeded"
#   → Wait for rate limit reset (1 minute)

# Step 2: Check database connections
curl https://studio-pilot-vision.onrender.com/api/health/db

# If connection_pool_usage > 90%, restart Go backend

# Step 3: Enable graceful degradation
# AI service should fall back to RAG if Cognee fails
# Check logs for: "Cognee unavailable, using RAG fallback"

# Step 4: Fix CORS (if browser errors)
# Update allowed origins in ai-insights/.env:
# CORS_ORIGINS=https://studio-pilot-vision.lovable.app
```

**Prevention:**
- Set connection pool size: `DB_POOL_SIZE=20`
- Implement circuit breaker for Cognee
- Add rate limiting: 100 requests/min per IP
- Monitor error rate (alert if > 5%)

---

### Issue 4: Webhook Sync Failures

**Symptoms:**
- Products not appearing in AI queries
- Stale data in ChromaDB/Cognee
- Webhook endpoint returning 500

**Root Causes:**
1. AI service down during webhook delivery
2. Payload validation errors
3. Cognee ingestion timeout
4. Supabase webhook configuration issue

**Resolution:**

```bash
# Step 1: Check webhook configuration in Supabase
# Dashboard → Database → Webhooks
# URL: https://studio-pilot-vision.onrender.com/api/sync/webhook
# Events: INSERT, UPDATE on products table

# Step 2: Test webhook manually
curl -X POST https://studio-pilot-vision.onrender.com/api/sync/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "products",
    "record": {
      "id": "test-123",
      "name": "Test Product",
      "lifecycle_stage": "Develop"
    }
  }'

# Expected: {"success": true, "message": "Sync initiated"}

# Step 3: Check if data synced
curl "https://studio-pilot-vision.onrender.com/ai/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about Test Product"}'

# If product not found, sync failed

# Step 4: Manually trigger full sync
curl -X POST https://studio-pilot-vision.onrender.com/api/sync/ingest
# This will re-sync all products (takes 5-10 minutes)
```

**Prevention:**
- Implement webhook retry logic (3 attempts)
- Add idempotency keys to prevent duplicates
- Set webhook timeout to 10 seconds
- Monitor webhook success rate

---

## Debugging Guides

### Debugging AI Query Issues

**Problem:** Query returns wrong answer or low confidence

**Step-by-step Debug:**

```python
# 1. Check intent classification
query = "What blockers does Product X have?"

# Run intent classifier directly
curl -X POST https://studio-pilot-vision.onrender.com/debug/intent \
  -d '{"query": "What blockers does Product X have?"}'

# Expected: {"intent": "blockers", "confidence": 0.95, "route": "rag"}

# 2. Check RAG retrieval
curl -X POST https://studio-pilot-vision.onrender.com/debug/rag \
  -d '{"query": "What blockers does Product X have?", "product_id": "550e8400"}'

# Expected: {"chunks": [...], "relevance_scores": [0.9, 0.85, ...]}

# 3. Check Cognee query
curl -X POST https://studio-pilot-vision.onrender.com/debug/cognee \
  -d '{"query": "What blockers does Product X have?", "product_id": "550e8400"}'

# Expected: {"entities": [...], "relationships": [...]}

# 4. Check confidence calculation
curl -X POST https://studio-pilot-vision.onrender.com/debug/confidence \
  -d '{"product_id": "550e8400"}'

# Expected: {
#   "freshness": 0.9,
#   "reliability": 0.85,
#   "grounding": 0.95,
#   "coherence": 0.75,
#   "overall": 0.85
# }
```

**Common Issues:**

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| Low confidence (< 0.5) | Stale data | Re-ingest products |
| Wrong answer | Intent misclassified | Update intent rules |
| Missing sources | Entity not in graph | Check Cognee ingestion |
| Slow response (> 3s) | Large graph traversal | Optimize query or add caching |

---

### Debugging Cognee Ingestion

**Problem:** Products not appearing in knowledge graph

**Step-by-step Debug:**

```bash
# 1. Start ingestion job
curl -X POST https://studio-pilot-vision.onrender.com/cognee/ingest/products \
  -H "Content-Type: application/json" \
  -d '{"time_window_label": "Q1 2025 Week 1"}'

# Response: {"job_id": "abc123", "status": "started"}

# 2. Monitor job progress
watch -n 5 'curl https://studio-pilot-vision.onrender.com/cognee/ingest/status/abc123'

# 3. If job fails, check logs
# Render Dashboard → Logs → Search for "job_id: abc123"

# Common errors:
# - "Entity already exists" → Run with force_update=true
# - "Connection timeout" → Increase job timeout
# - "Validation error" → Check product data format

# 4. Verify ingestion
curl https://studio-pilot-vision.onrender.com/cognee/entities \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "Product", "limit": 10}'

# Expected: List of products with IDs

# 5. Test query with new data
curl -X POST https://studio-pilot-vision.onrender.com/cognee/query \
  -d '{"query": "Show me all products in Q1 2025 Week 1"}'
```

---

### Debugging Performance Issues

**Problem:** Service response time degraded

**Diagnostic Commands:**

```bash
# 1. Check service metrics
curl https://studio-pilot-vision.onrender.com/metrics | grep -E "(latency|memory|cpu)"

# 2. Check database query performance
# In Supabase Dashboard → Performance → Slow Queries
# Look for queries > 100ms

# 3. Check cache performance
curl https://studio-pilot-vision.onrender.com/cognee/cache/stats

# Expected: {
#   "cache_hit_rate": 0.75,
#   "cache_size": 500,
#   "avg_hit_latency_ms": 2,
#   "avg_miss_latency_ms": 200
# }

# If cache_hit_rate < 0.5, warm up cache:
curl -X POST https://studio-pilot-vision.onrender.com/cognee/warm-up

# 4. Profile a slow query
curl -X POST https://studio-pilot-vision.onrender.com/debug/profile \
  -d '{"query": "Tell me about Product X", "enable_profiling": true}'

# Response includes timing breakdown:
# {
#   "total_time_ms": 850,
#   "breakdown": {
#     "intent_classification": 5,
#     "rag_retrieval": 120,
#     "cognee_query": 500,
#     "llm_generation": 200,
#     "confidence_scoring": 10,
#     "response_assembly": 15
#   }
# }

# Identify bottleneck (in this case: cognee_query)
```

**Optimization Actions:**

| Bottleneck | Action | Expected Improvement |
|------------|--------|----------------------|
| Cognee query > 500ms | Add graph indexes, optimize traversal | 50% reduction |
| RAG retrieval > 200ms | Reindex ChromaDB, reduce top-k | 30% reduction |
| LLM generation > 500ms | Check Groq API, reduce max_tokens | 20% reduction |
| Cache miss rate > 50% | Increase cache size, TTL | 2x speedup |

---

## Performance Troubleshooting

### High Memory Usage (> 2GB)

**Symptoms:**
- Service crashes with OOM (Out of Memory)
- Slow performance, high swap usage
- Render auto-restart

**Investigation:**

```bash
# 1. Check current memory usage
curl https://studio-pilot-vision.onrender.com/metrics | grep memory_usage_mb

# 2. Identify memory hogs
# Common culprits:
# - ChromaDB index (500MB-1GB)
# - Cognee NetworkX graph (100-500MB)
# - Query cache (50-200MB)
# - LLM model (if loaded locally, 5GB+)

# 3. Clear caches
curl -X POST https://studio-pilot-vision.onrender.com/cache/clear

# 4. Restart service (temporary fix)
# Render Dashboard → Manual Deploy → Restart
```

**Long-term Fixes:**
- Increase Render instance size (512MB → 1GB → 2GB)
- Implement cache eviction (LRU with max size)
- Migrate Cognee to external Neo4j (offload graph memory)
- Use remote embeddings (offload model memory)

---

### High CPU Usage (> 90%)

**Symptoms:**
- Slow response times
- Request queue building up
- Service unresponsive

**Investigation:**

```bash
# 1. Check CPU usage
curl https://studio-pilot-vision.onrender.com/metrics | grep cpu_usage_percent

# 2. Check concurrent requests
curl https://studio-pilot-vision.onrender.com/metrics | grep active_requests

# If active_requests > 20, service is overloaded

# 3. Identify slow endpoints
# Render Dashboard → Logs → Filter by duration > 1000ms

# Common slow endpoints:
# - /cognee/query (graph traversal)
# - /upload/document (embedding generation)
# - /cognee/ingest/* (batch processing)
```

**Mitigations:**
- Add rate limiting: 100 req/min per IP
- Increase worker count (Render: `WEB_CONCURRENCY=4`)
- Offload batch jobs to background workers
- Implement request queue with timeout

---

## Incident Response

### Severity Levels

**P0 - Critical (Response: Immediate)**
- Service completely down (all endpoints 500/503)
- Data loss or corruption
- Security breach

**P1 - High (Response: < 30 minutes)**
- Core feature broken (AI queries failing)
- Error rate > 10%
- Performance degraded > 3x baseline

**P2 - Medium (Response: < 4 hours)**
- Non-core feature broken (document upload)
- Error rate 5-10%
- Performance degraded 2-3x baseline

**P3 - Low (Response: < 1 day)**
- Minor UI issues
- Error rate 1-5%
- Performance degraded < 2x baseline

---

### Incident Response Checklist

**Step 1: Assess Impact (5 minutes)**
- [ ] Check system health endpoints
- [ ] Review error rate and metrics
- [ ] Identify affected users/features
- [ ] Determine severity level

**Step 2: Initial Response (5-10 minutes)**
- [ ] Acknowledge incident (update status page if available)
- [ ] Gather logs and error messages
- [ ] Check recent deployments (rollback candidate?)
- [ ] Check external dependencies (Groq, Supabase)

**Step 3: Mitigation (10-30 minutes)**
- [ ] Apply quick fix (restart, rollback, enable fallback)
- [ ] Verify mitigation worked (recheck metrics)
- [ ] Update status (service restored or investigating)

**Step 4: Root Cause Analysis (1-2 hours)**
- [ ] Reproduce issue in dev environment
- [ ] Identify root cause
- [ ] Document findings

**Step 5: Permanent Fix (hours to days)**
- [ ] Implement fix
- [ ] Test thoroughly
- [ ] Deploy to production
- [ ] Monitor for recurrence

**Step 6: Post-Mortem (within 1 week)**
- [ ] Write incident report
- [ ] Identify preventative measures
- [ ] Update runbook
- [ ] Implement improvements

---

## Maintenance Procedures

### Weekly Maintenance Tasks

**Every Sunday, 2 AM UTC:**

```bash
# 1. Trigger weekly product snapshot ingestion
curl -X POST https://studio-pilot-vision.onrender.com/cognee/ingest/products \
  -d '{"time_window_label": "Q1 2025 Week 5"}'

# 2. Clear expired cache entries
curl -X POST https://studio-pilot-vision.onrender.com/cache/clear-expired

# 3. Vacuum database (in Supabase dashboard)
# SQL Editor → Run: VACUUM ANALYZE;

# 4. Check and rotate logs (if size > 1GB)
# Render Dashboard → Logs → Download → Delete old logs

# 5. Review metrics and alerts
# Check for anomalies in past week
```

### Monthly Maintenance Tasks

**First Sunday of each month:**

```bash
# 1. Update dependencies
# - Check for security updates: npm audit, pip-audit
# - Update minor versions
# - Test in dev environment
# - Deploy to production

# 2. Database optimization
# - Analyze query performance
# - Add indexes if needed
# - Archive old data (> 1 year)

# 3. Review and adjust capacity
# - Check average CPU/memory usage
# - Scale up/down Render instances
# - Adjust cache sizes

# 4. Security audit
# - Review access logs
# - Check for suspicious activity
# - Rotate API keys if needed

# 5. Cost optimization
# - Review Groq API usage
# - Review Render compute hours
# - Review Supabase storage
```

---

## Deployment Procedures

### Deploying AI Service Updates

**Pre-deployment Checklist:**
- [ ] All tests passing (pytest)
- [ ] Code reviewed and approved
- [ ] Environment variables updated (if needed)
- [ ] Database migrations tested (if needed)
- [ ] Rollback plan prepared

**Deployment Steps:**

```bash
# 1. Merge PR to main branch
git checkout main
git pull origin main

# 2. Render auto-deploys from main
# Monitor deployment: Render Dashboard → Deployments

# 3. Wait for health check (2-3 minutes)
# Render will run: python -m ai_insights.health_check

# 4. Verify deployment
curl https://studio-pilot-vision.onrender.com/health

# 5. Run smoke tests
curl -X POST https://studio-pilot-vision.onrender.com/ai/query \
  -d '{"query": "Test query after deployment"}'

# Expected: Valid response with success=true

# 6. Monitor for 30 minutes
# Watch metrics for errors, latency spikes
```

**Post-deployment Verification:**
- [ ] Health endpoint returns healthy
- [ ] Test AI query returns valid response
- [ ] Check error rate (should be < 1%)
- [ ] Check response time (should be baseline)
- [ ] Review first 100 logs for errors

---

## Rollback Procedures

### Rolling Back AI Service

**When to Rollback:**
- Error rate > 10% for > 5 minutes
- Critical feature broken
- Data corruption detected
- Performance degraded > 5x baseline

**Rollback Steps:**

```bash
# 1. In Render Dashboard:
# Deployments → Find last stable deployment → Manual Deploy

# 2. Render will redeploy previous version (2-3 minutes)

# 3. Verify rollback
curl https://studio-pilot-vision.onrender.com/health

# Check version:
curl https://studio-pilot-vision.onrender.com/version

# Expected: Previous version number

# 4. Test critical path
curl -X POST https://studio-pilot-vision.onrender.com/ai/query \
  -d '{"query": "Test after rollback"}'

# 5. Monitor for 15 minutes
# Ensure error rate returns to baseline

# 6. Communicate rollback
# Update team: "Rolled back AI service to v1.2.3 due to <issue>"
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Application Metrics:**
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Cache hit rate (%)

**Infrastructure Metrics:**
- CPU usage (%)
- Memory usage (MB)
- Database connections (active/total)
- Disk usage (MB)

**Business Metrics:**
- AI queries per day
- Unique users per day
- Average confidence score
- Products in system

### Alerting Rules (To Implement)

```yaml
# alert-rules.yml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: P1
    action: page_oncall

  - name: SlowResponses
    condition: response_time_p95 > 2s
    duration: 10m
    severity: P2
    action: slack_alert

  - name: ServiceDown
    condition: health_check == unhealthy
    duration: 1m
    severity: P0
    action: page_oncall + slack_alert

  - name: LowCacheHitRate
    condition: cache_hit_rate < 30%
    duration: 15m
    severity: P3
    action: slack_alert

  - name: HighMemoryUsage
    condition: memory_usage_mb > 1800
    duration: 5m
    severity: P2
    action: slack_alert
```

---

## Emergency Contacts

**On-Call Rotation:** (To be defined)

**Escalation Path:**
1. On-call engineer (immediate)
2. Team lead (if unresolved after 30 min)
3. Engineering manager (if P0 unresolved after 1 hour)

**External Vendor Contacts:**
- **Render Support:** support@render.com
- **Supabase Support:** support@supabase.com
- **Groq Support:** support@groq.com

---

## Related Documentation

- [System Architecture](./ARCHITECTURE.md)
- [AI Architecture](./AI_ARCHITECTURE.md)
- [Data Flow](./DATA_FLOW.md)
- [API Documentation](./API_DOCS.md)

---

**Last Updated:** 2026-01-04
**Version:** 1.0
**On-Call:** TBD
