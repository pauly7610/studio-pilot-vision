# Security Guide

Comprehensive security documentation for Studio Pilot Vision.

## Table of Contents

1. [Authentication](#authentication)
2. [Input Validation](#input-validation)
3. [Rate Limiting](#rate-limiting)
4. [Secrets Management](#secrets-management)
5. [API Security](#api-security)
6. [Database Security](#database-security)
7. [Deployment Security](#deployment-security)
8. [Security Checklist](#security-checklist)

## Authentication

### AI Insights API Authentication

API key authentication is implemented for all AI endpoints.

#### Setup

1. Generate a secure API key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. Set environment variable:
```bash
export AI_INSIGHTS_API_KEY=your_generated_key
```

3. Include in requests:
```bash
curl -X POST http://localhost:8001/ai/query \
  -H "X-API-Key: your_generated_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the risks?"}'
```

#### Disabling Authentication (Development Only)

If `AI_INSIGHTS_API_KEY` is not set, authentication is disabled. **Never deploy to production without authentication enabled.**

### Admin Endpoints Authentication

Admin endpoints use a separate API key for elevated privileges.

```bash
export ADMIN_API_KEY=your_admin_key

curl -X POST http://localhost:8001/admin/cognee/cognify \
  -H "X-Admin-Key: your_admin_key"
```

### Backend (Go) Authentication

The Go backend should integrate with your organization's SSO/LDAP:

```go
// middleware/auth.go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        
        // Validate JWT token
        claims, err := validateJWT(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }
        
        c.Set("user_id", claims.UserID)
        c.Next()
    }
}
```

## Input Validation

### Query Validation

All user inputs are validated using Pydantic models:

```python
from ai_insights.utils import QueryRequest, validate_request

# Automatic validation
request = QueryRequest(
    query="What are the risks?",
    product_id="abc-123",
    top_k=5
)
```

### Validation Rules

1. **Query Length**: 1-2000 characters
2. **Product ID**: Alphanumeric, hyphens, underscores only (max 100 chars)
3. **Top K**: 1-50 results
4. **Context Size**: Max 5000 characters

### SQL Injection Prevention

Queries are scanned for dangerous patterns:

```python
# Blocked patterns:
- DROP, DELETE, INSERT, UPDATE, EXEC
- SQL comments (-- or /* */)
- UNION SELECT attacks
```

### XSS Prevention

Script injection patterns are blocked:

```python
# Blocked patterns:
- <script> tags
- javascript: protocol
- on* event handlers
```

### File Upload Security

```python
from ai_insights.utils import validate_file_upload, sanitize_filename

# Validate file
validate_file_upload(
    file,
    allowed_extensions=['.csv', '.pdf', '.docx'],
    max_size_mb=50
)

# Sanitize filename
safe_name = sanitize_filename(file.filename)
```

## Rate Limiting

### Configuration

```bash
export RATE_LIMIT_PER_MINUTE=60
export RATE_LIMIT_PER_HOUR=1000
```

### Implementation

Rate limiting is applied per IP address:

```python
from ai_insights.utils.rate_limit import RateLimitMiddleware

app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    requests_per_hour=1000
)
```

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit-Minute: 60
X-RateLimit-Remaining-Minute: 45
```

### Handling Rate Limits

```bash
# 429 Too Many Requests
{
  "detail": "Rate limit exceeded: 60 requests per minute",
  "headers": {
    "Retry-After": "60"
  }
}
```

## Secrets Management

### Environment Variables

**Never commit secrets to git!**

1. Use `.env` for local development
2. Use secrets management in production

### GitHub Actions Secrets

Add secrets in repository settings:

```
Settings → Secrets and variables → Actions → New repository secret
```

Required secrets:
- `GROQ_API_KEY`
- `HUGGINGFACE_API_KEY`
- `AI_INSIGHTS_API_KEY`
- `ADMIN_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`

### Render Secrets

Add environment variables in Render dashboard:

```
Dashboard → Service → Environment → Add Environment Variable
```

### Kubernetes Secrets

```bash
kubectl create secret generic ai-insights-secrets \
  --from-literal=GROQ_API_KEY=xxx \
  --from-literal=AI_INSIGHTS_API_KEY=xxx \
  -n ai-insights
```

### Removing .env from Git History

If you accidentally committed `.env`:

```bash
# Run the cleanup script
chmod +x scripts/remove-env-from-git.sh
./scripts/remove-env-from-git.sh

# Force push (coordinate with team!)
git push origin --force --all
```

## API Security

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],  # Never use "*" in production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### HTTPS Only

Always use HTTPS in production:

```python
# Redirect HTTP to HTTPS
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

### Security Headers

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["your-domain.com", "*.your-domain.com"]
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

## Database Security

### Supabase Row Level Security (RLS)

Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organization's products
CREATE POLICY "Users see own org products"
ON products FOR SELECT
USING (organization_id = auth.jwt() ->> 'organization_id');
```

### Connection Security

Always use SSL for database connections:

```python
# Supabase automatically uses SSL
client = create_client(
    supabase_url,
    supabase_key,
    options=ClientOptions(
        postgrest_client_timeout=10,
        storage_client_timeout=10,
    )
)
```

### SQL Injection Prevention

Use parameterized queries:

```go
// Good - parameterized
db.Query("SELECT * FROM products WHERE id = $1", productID)

// Bad - string concatenation
db.Query("SELECT * FROM products WHERE id = '" + productID + "'")
```

## Deployment Security

### Docker Security

```dockerfile
# Use non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Scan for vulnerabilities
RUN trivy image your-image:latest
```

### Kubernetes Security

```yaml
# Security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL

# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-insights-netpol
spec:
  podSelector:
    matchLabels:
      app: ai-insights
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8001
```

### Cloud Provider Security

#### AWS
- Use IAM roles, not access keys
- Enable VPC for network isolation
- Use AWS Secrets Manager
- Enable CloudTrail for audit logs

#### GCP
- Use service accounts
- Enable VPC Service Controls
- Use Secret Manager
- Enable Cloud Audit Logs

#### Azure
- Use Managed Identities
- Enable Virtual Network
- Use Key Vault
- Enable Azure Monitor

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not code)
- [ ] `.env` not in git history
- [ ] API authentication enabled
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Database RLS enabled
- [ ] Non-root user in containers
- [ ] Dependencies scanned for vulnerabilities

### Post-Deployment

- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Authentication tested
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Backup and recovery tested

### Ongoing

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Annual compliance review
- [ ] Continuous vulnerability scanning
- [ ] Regular access reviews
- [ ] Security training for team

## Vulnerability Reporting

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security@your-domain.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 24 hours and patch critical vulnerabilities within 7 days.

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Go Security Checklist](https://github.com/securego/gosec)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Compliance

### GDPR
- User data minimization
- Right to erasure
- Data portability
- Consent management

### SOC 2
- Access controls
- Encryption at rest and in transit
- Audit logging
- Incident response

### HIPAA (if applicable)
- PHI encryption
- Access controls
- Audit trails
- Business associate agreements
