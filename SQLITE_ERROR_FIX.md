# SQLite Database Access Error - Diagnosis & Fix

## 🐛 **Problem**

When querying "Mastercard Move", Render logs show:
```
Unable to access SQLite database file
```

## 🔍 **Root Cause**

**Three issues identified:**

### 1. Environment Variable Mismatch
- **Code expects:** `COGNEE_DATA_PATH` (cognee_client.py:70)
- **Settings provide:** `COGNEE_DATA_DIR` (settings.py:148)
- **Result:** Cognee falls back to default `./cognee_data`

### 2. Relative Path Issue
- **Current:** `./cognee_data` (relative path)
- **Problem:** On Render's ephemeral filesystem, relative paths might not have write permissions
- **Need:** Absolute path in Render's writable directory

### 3. Directory Not Created on Startup
- **Problem:** Code doesn't ensure directory exists with proper permissions
- **Result:** SQLite can't create database files when needed

## ✅ **Solution**

### **Fix 1: Align Environment Variable Names**

**File:** `ai-insights/src/ai_insights/cognee/cognee_client.py` (line 70)

**Change:**
```python
# OLD:
data_path = os.getenv("COGNEE_DATA_PATH", "./cognee_data")

# NEW:
data_path = os.getenv("COGNEE_DATA_DIR", os.getenv("COGNEE_DATA_PATH", "./cognee_data"))
```

This checks both `COGNEE_DATA_DIR` (from settings) and `COGNEE_DATA_PATH` (legacy) with fallback.

---

### **Fix 2: Ensure Directory Creation with Permissions**

**File:** `ai-insights/src/ai_insights/cognee/cognee_client.py`

**Add after line 71:**
```python
# Ensure data directory exists with proper permissions
try:
    os.makedirs(data_path, mode=0o755, exist_ok=True)
    print(f"✓ Cognee data directory ready: {data_path}")
except Exception as e:
    print(f"⚠️ Could not create data directory {data_path}: {e}")
```

---

### **Fix 3: Set Absolute Path in Render Environment**

**In Render Dashboard → Environment Variables:**

Add:
```
COGNEE_DATA_DIR=/opt/render/project/src/.cognee_data
```

This uses Render's writable project directory.

**Alternative (if above doesn't work):**
```
COGNEE_DATA_DIR=/tmp/cognee_data
```

This uses `/tmp` which is always writable on Render (but ephemeral - cleared on restart).

---

## 🔧 **Implementation Steps**

### **Step 1: Update cognee_client.py**

```python
@classmethod
def _apply_cognee_config(cls):
    """
    Apply Cognee configuration using its API.
    """
    if cls._config_applied:
        return

    # Get configuration from env vars (set in Render dashboard)
    embedding_provider = os.getenv("EMBEDDING_PROVIDER", "fastembed")
    embedding_model = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    llm_provider = os.getenv("LLM_PROVIDER", "custom")
    llm_model = os.getenv("LLM_MODEL", "groq/llama-3.3-70b-versatile")
    llm_endpoint = os.getenv("LLM_ENDPOINT", "https://api.groq.com/openai/v1")
    llm_api_key = os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY")

    # FIX 1: Check both env var names
    data_path = os.getenv("COGNEE_DATA_DIR", os.getenv("COGNEE_DATA_PATH", "./cognee_data"))

    # FIX 2: Ensure directory exists with proper permissions
    try:
        os.makedirs(data_path, mode=0o755, exist_ok=True)
        print(f"✓ Cognee data directory ready: {data_path}")
    except Exception as e:
        print(f"⚠️ Could not create data directory {data_path}: {e}")
        # Fall back to /tmp if current path fails
        data_path = "/tmp/cognee_data"
        os.makedirs(data_path, mode=0o755, exist_ok=True)
        print(f"✓ Using fallback data directory: {data_path}")

    # Set the data directory for Cognee
    os.environ["COGNEE_DATA_DIR"] = data_path

    print(f"🔧 Configuring Cognee: embeddings={embedding_provider}/{embedding_model}, llm={llm_provider}")

    # ... rest of the method unchanged
```

### **Step 2: Add Environment Variable in Render**

1. Go to Render Dashboard → Your Service → Environment
2. Add new environment variable:
   - **Key:** `COGNEE_DATA_DIR`
   - **Value:** `/opt/render/project/src/.cognee_data`
3. Click "Save Changes"
4. Redeploy the service

### **Step 3: Verify Fix**

After redeploying, check Render logs for:
```
✓ Cognee data directory ready: /opt/render/project/src/.cognee_data
```

Then test the query again: "Tell me about Mastercard Move"

---

## 🎯 **Why This Fixes It**

1. **Environment variable alignment:** Code now finds the correct data directory
2. **Directory creation:** Ensures directory exists before Cognee tries to write
3. **Absolute path:** Render knows exactly where to write files
4. **Fallback to /tmp:** If project directory fails, falls back to always-writable /tmp

---

## ⚠️ **Important Notes**

### **About /tmp Directory**
- **Pros:** Always writable, guaranteed to work
- **Cons:** Cleared on service restart (ephemeral)
- **Impact:** You'll need to re-sync data after restarts

### **About Project Directory**
- **Pros:** Persists between restarts (within same deployment)
- **Cons:** Might not persist across redeployments
- **Best for:** Development/demo where restarts are rare

### **For Production**
- Use **Render Persistent Disks** (paid feature)
- Mount at `/mnt/cognee_data`
- Set `COGNEE_DATA_DIR=/mnt/cognee_data`
- This survives restarts AND redeployments

---

## 🧪 **Testing Checklist**

After applying fixes:

1. ✅ Check Render logs for "Cognee data directory ready"
2. ✅ Query: "Which products are at risk?"
3. ✅ Query: "Tell me about Mastercard Move"
4. ✅ Check logs for no "database is locked" errors
5. ✅ Verify query returns results (not empty)

---

## 📊 **Expected Behavior After Fix**

**Before:**
```
Error: Unable to access SQLite database file
OperationalError: database is locked
```

**After:**
```
✓ Cognee data directory ready: /opt/render/project/src/.cognee_data
Query: "Tell me about Mastercard Move"
Found 10 results from knowledge graph
Response: Mastercard Move is a mature payment flow product...
```

---

## 🔄 **Alternative: Disable Cognee Temporarily**

If you need the demo to work immediately and can't wait for Render redeploy:

**Option:** Use Supabase-only mode (skip knowledge graph)

This is already implemented - if Cognee is unavailable, the orchestrator falls back to Supabase data only. The AI will still work, just without the knowledge graph relationships.

---

**Created:** 2026-01-05
**Issue:** SQLite database access error on Render
**Status:** Fix ready, awaiting deployment
