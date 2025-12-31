# Test Coverage Improvement Plan
**Current Coverage: 22% | Target: 70%+ | Gap: 48%**

---

## 🚨 Critical Issues

### Issue 1: Test Files Not Running (0% Coverage)
**Impact:** 6 test files exist but show 0% coverage
```
❌ test_rate_limit.py (151 tests, 0% coverage)
❌ test_settings.py (89 tests, 0% coverage)
❌ test_orchestrator.py (95 tests, 0% coverage)
❌ test_integration.py (106 tests, 0% coverage)
❌ test_intent_classifier.py (61 tests, 0% coverage)
❌ test_cognee_diagnostic.py (87 tests, 0% coverage)
```

**Root Cause:** Tests exist but aren't being executed or have import/dependency issues

**Fix Priority:** 🔴 **CRITICAL** - Fix immediately
- These 589 tests could add ~30% coverage if they run
- Likely import errors or missing dependencies preventing execution

---

## 📊 Coverage Analysis by Module

### Tier 1: Critical Production Code (0% Coverage) 🔴
**Impact: +35% coverage potential**

| Module | Lines | Missing | Priority | Reason |
|--------|-------|---------|----------|---------|
| **main.py** | 370 | 370 (0%) | 🔴 CRITICAL | Core API endpoints, authentication, routing |
| **admin_endpoints.py** | 51 | 51 (0%) | 🔴 HIGH | Admin functionality, security-critical |
| **ingestion/governance_actions.py** | 90 | 90 (0%) | 🟡 MEDIUM | Data ingestion, governance rules |
| **ingestion/product_snapshot.py** | 92 | 92 (0%) | 🟡 MEDIUM | Product data processing |

### Tier 2: Utility Modules (Low Coverage) 🟡
**Impact: +15% coverage potential**

| Module | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
| **rate_limit.py** | 0% | 80% | +80% | 🔴 HIGH - Security critical |
| **config.py** | 56% | 90% | +34% | 🟡 MEDIUM |
| **logger.py** | 20% | 80% | +60% | 🟡 MEDIUM |
| **metrics.py** | 33% | 80% | +47% | 🟡 MEDIUM |
| **generator.py** | 26% | 70% | +44% | 🟢 LOW |
| **jira_parser.py** | 11% | 70% | +59% | 🟢 LOW |
| **auth.py** | 52% | 90% | +38% | 🟡 MEDIUM |

### Tier 3: Already Good Coverage ✅
| Module | Coverage | Status |
|--------|----------|--------|
| validation.py | 86% | ✅ Good |
| settings.py | 64% | ✅ Acceptable |
| test_auth.py | 90% | ✅ Excellent |
| test_validation.py | 96% | ✅ Excellent |

---

## 🎯 High-Priority Fixes (Immediate Action)

### Priority 1: Fix Non-Running Tests (Week 1)
**Estimated Impact: +30% coverage**

#### Action Items:
1. **Investigate why test files show 0% coverage**
   ```bash
   # Run each test file individually to find errors
   pytest tests/test_rate_limit.py -v
   pytest tests/test_settings.py -v
   pytest tests/test_orchestrator.py -v
   pytest tests/test_integration.py -v
   pytest tests/test_intent_classifier.py -v
   pytest tests/test_cognee_diagnostic.py -v
   ```

2. **Fix import errors**
   - Check for missing dependencies
   - Fix module path issues
   - Add missing fixtures

3. **Fix test implementation issues**
   - Update mocks to match actual implementations
   - Fix assertion errors
   - Add missing test data

**Expected Outcome:** All 589 existing tests running → +30% coverage

---

### Priority 2: Test main.py Endpoints (Week 1-2)
**Estimated Impact: +20% coverage**

#### Critical Endpoints to Test:
```python
# Health & Status
✅ GET /health
✅ GET /metrics

# Query Endpoints  
🔴 POST /ai/query (CRITICAL - main functionality)
🔴 POST /ai/product-insight
🔴 POST /ai/portfolio-insight
🔴 POST /ai/cognee-query

# Ingestion Endpoints
🟡 POST /ai/ingest
🟡 POST /ai/ingest/governance
🟡 POST /ai/ingest/product-snapshot

# Admin Endpoints
🟡 POST /admin/clear-cache
🟡 GET /admin/stats
```

#### Test Strategy:
```python
# Create: tests/test_main_endpoints.py

class TestHealthEndpoints:
    def test_health_check_returns_200()
    def test_metrics_endpoint_returns_prometheus_format()

class TestQueryEndpoints:
    def test_query_with_valid_api_key()
    def test_query_without_api_key_returns_403()
    def test_query_with_rate_limiting()
    def test_product_insight_endpoint()
    def test_portfolio_insight_endpoint()
    
class TestIngestionEndpoints:
    def test_ingest_csv_data()
    def test_ingest_with_validation()
    def test_governance_actions_ingestion()
```

**Expected Outcome:** main.py: 0% → 60% (+20% overall)

---

### Priority 3: Improve Utility Module Coverage (Week 2)
**Estimated Impact: +10% coverage**

#### 3.1 Rate Limiting Tests (0% → 80%)
```python
# Fix tests/test_rate_limit.py

class TestRateLimitMiddleware:
    def test_middleware_initialization()
    def test_requests_under_limit_allowed()
    def test_requests_over_limit_blocked()
    def test_rate_limit_headers_present()
    def test_per_ip_rate_limiting()
    def test_cleanup_old_entries()
    
class TestTokenBucketAlgorithm:
    def test_token_consumption()
    def test_token_refill()
    def test_burst_handling()
```

#### 3.2 Config & Logger Tests (20-56% → 80%)
```python
# Enhance tests/test_settings.py

class TestConfigLoading:
    def test_load_from_environment()
    def test_load_from_env_file()
    def test_config_validation()
    def test_default_values()

class TestLoggerConfiguration:
    def test_structured_logging_format()
    def test_log_levels()
    def test_log_rotation()
    def test_sensitive_data_masking()
```

#### 3.3 Metrics Tests (33% → 80%)
```python
# Create: tests/test_metrics.py

class TestPrometheusMetrics:
    def test_query_counter_increments()
    def test_query_duration_histogram()
    def test_error_counter()
    def test_cognee_availability_gauge()
    def test_metrics_endpoint_format()
```

**Expected Outcome:** Utility modules: 20-56% → 80% (+10% overall)

---

## 📋 Detailed Test Development Plan

### Week 1: Critical Path (Target: 52% coverage)

#### Day 1-2: Fix Non-Running Tests
- [ ] Run each test file individually
- [ ] Fix import errors in test_rate_limit.py
- [ ] Fix import errors in test_orchestrator.py
- [ ] Fix import errors in test_integration.py
- [ ] Fix mock issues in test_intent_classifier.py
- [ ] Fix dependency issues in test_cognee_diagnostic.py
- [ ] Verify all tests run: `pytest tests/ -v`

**Milestone:** All existing tests running (+30% coverage → 52%)

#### Day 3-4: Main Endpoint Tests
- [ ] Create tests/test_main_endpoints.py
- [ ] Test health and metrics endpoints
- [ ] Test query endpoints with authentication
- [ ] Test rate limiting on endpoints
- [ ] Test error handling (400, 403, 429, 500)
- [ ] Mock external dependencies (Groq, Supabase)

**Milestone:** main.py: 0% → 40% (+15% overall → 67%)

#### Day 5: Admin Endpoint Tests
- [ ] Test admin authentication
- [ ] Test cache clearing
- [ ] Test stats endpoint
- [ ] Test admin-only access control

**Milestone:** admin_endpoints.py: 0% → 60% (+3% overall → 70%)

---

### Week 2: Comprehensive Coverage (Target: 75% coverage)

#### Day 1-2: Utility Module Enhancement
- [ ] Complete rate_limit.py tests (0% → 80%)
- [ ] Enhance config.py tests (56% → 90%)
- [ ] Enhance logger.py tests (20% → 80%)
- [ ] Add metrics.py tests (33% → 80%)

**Milestone:** Utility modules at 80%+ (+5% overall → 75%)

#### Day 3-4: Integration Tests
- [ ] End-to-end query flow tests
- [ ] Multi-step orchestration tests
- [ ] Fallback mechanism tests
- [ ] Error recovery tests

**Milestone:** Integration coverage improved (+3% overall → 78%)

#### Day 5: Ingestion Module Tests
- [ ] CSV ingestion tests
- [ ] Governance action tests
- [ ] Product snapshot tests
- [ ] Data validation tests

**Milestone:** Ingestion modules: 0% → 50% (+2% overall → 80%)

---

## 🛠️ Implementation Strategy

### Test Infrastructure Setup
```python
# conftest.py enhancements needed

@pytest.fixture
def mock_groq_client():
    """Mock Groq API client"""
    
@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client"""
    
@pytest.fixture
def test_api_client():
    """FastAPI test client with auth"""
    
@pytest.fixture
def sample_products():
    """Sample product data for testing"""
    
@pytest.fixture
def mock_cognee():
    """Mock Cognee knowledge graph"""
```

### Test Data Management
```python
# tests/fixtures/
- sample_products.json
- sample_queries.json
- sample_governance_actions.csv
- expected_responses.json
```

### Mocking Strategy
```python
# Mock external services
- Groq API → Use recorded responses
- Supabase → Use in-memory database
- Cognee → Mock knowledge graph queries
- HuggingFace → Mock embeddings
```

---

## 📈 Coverage Milestones

| Milestone | Target | Modules | Estimated Time |
|-----------|--------|---------|----------------|
| **M1: Fix Existing Tests** | 52% | All test files running | 2 days |
| **M2: Main Endpoints** | 67% | main.py, admin_endpoints.py | 2 days |
| **M3: Utility Modules** | 75% | rate_limit, config, logger, metrics | 2 days |
| **M4: Integration** | 78% | Orchestration, end-to-end | 2 days |
| **M5: Ingestion** | 80% | Ingestion modules | 1 day |

**Total Estimated Time:** 9 days (2 weeks)

---

## 🎯 Success Criteria

### Minimum Acceptable Coverage (70%)
- ✅ All existing tests running
- ✅ main.py: 60%+
- ✅ Security modules (auth, validation, rate_limit): 80%+
- ✅ Config modules: 80%+
- ✅ Admin endpoints: 60%+

### Stretch Goal (80%)
- ✅ All critical paths tested
- ✅ Integration tests passing
- ✅ Ingestion modules: 50%+
- ✅ Error handling covered
- ✅ Edge cases tested

---

## 🚀 Quick Wins (Do These First)

### Immediate Actions (1-2 hours each)
1. **Fix test_rate_limit.py imports** → +8% coverage
2. **Fix test_settings.py execution** → +4% coverage
3. **Add main.py health endpoint test** → +2% coverage
4. **Fix test_orchestrator.py mocks** → +5% coverage
5. **Add metrics.py basic tests** → +3% coverage

**Total Quick Wins: +22% coverage (44% total) in 1 day**

---

## 📝 Testing Best Practices

### 1. Test Structure
```python
# Arrange - Act - Assert pattern
def test_feature():
    # Arrange: Set up test data
    data = {"query": "test"}
    
    # Act: Execute the code
    result = function(data)
    
    # Assert: Verify expectations
    assert result.status == "success"
```

### 2. Mocking External Dependencies
```python
@patch('ai_insights.external.groq_client')
def test_with_mock(mock_groq):
    mock_groq.return_value = {"response": "mocked"}
    # Test code here
```

### 3. Parametrized Tests
```python
@pytest.mark.parametrize("input,expected", [
    ("query1", "result1"),
    ("query2", "result2"),
])
def test_multiple_cases(input, expected):
    assert process(input) == expected
```

### 4. Integration Test Patterns
```python
@pytest.mark.integration
def test_end_to_end_flow():
    # Test complete user journey
    pass
```

---

## 🔍 Coverage Monitoring

### Daily Coverage Check
```bash
# Run tests with coverage
pytest --cov=src/ai_insights --cov-report=html --cov-report=term-missing

# View detailed report
open htmlcov/index.html
```

### CI/CD Integration
```yaml
# .github/workflows/ai-insights-ci.yml
- name: Run tests with coverage
  run: |
    pytest --cov=src/ai_insights --cov-report=xml --cov-fail-under=70
    
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
```

---

## 🎓 Key Takeaways

1. **Fix existing tests first** - 589 tests at 0% coverage is the biggest issue
2. **Focus on main.py** - 370 lines of core functionality untested
3. **Security is critical** - Auth, validation, rate limiting must be 80%+
4. **Mock external services** - Don't depend on live APIs in tests
5. **Incremental progress** - Target 70% first, then push to 80%

**Next Action:** Start with Priority 1 - Fix non-running test files to unlock +30% coverage immediately.
