# Quick Start Guide: Streamlit Dashboard

## Prerequisites
- Python 3.10+
- Backend API running (local or Render deployment)

## Installation

### 1. Install Dependencies
```bash
cd ai-insights
pip install -r requirements.txt
```

### 2. Configure API Endpoint

**For Local Development:**
```bash
export API_BASE_URL=http://localhost:8000
```

**For Production Demo:**
```bash
export API_BASE_URL=https://studio-pilot-vision.onrender.com
```

### 3. Launch Dashboard
```bash
streamlit run streamlit_dashboard.py
```

Dashboard will open at: **http://localhost:8501**

## Dashboard Pages

### 📊 Executive Summary
- **Portfolio Overview**: Total products, revenue targets, high-risk products, pending actions
- **Charts**: Products by lifecycle stage (pie), risk distribution (bar), governance status (horizontal bar), customer sentiment (gauge)
- **Alerts**: High-priority attention items
- **Key Metrics**: Recent launches, revenue at risk, feedback sentiment

### 📦 Product Portfolio
- Placeholder for product table view
- Connect to `/api/products` endpoint (not yet implemented)
- Shows expected schema for products table

### ⚠️ Risk Dashboard
- High-risk products requiring attention
- Risk factors tracked (readiness, compliance, churn, revenue miss, etc.)

### 🎯 Governance Actions
- Active governance actions with filters
- Example action card with tier, priority, status, due date
- Buttons for marking progress and adding comments

### 💬 Customer Feedback
- Recent customer and partner feedback
- Sentiment analysis with color coding (🟢 positive, 🟡 neutral, 🔴 negative)
- Theme extraction (Integration, UX, Performance, Pricing)
- Create Action button for each feedback item

## Troubleshooting

### Error: "Unable to load executive summary data"
- **Cause**: API not running or unreachable
- **Fix**: Verify API_BASE_URL is correct and API is running
  ```bash
  curl $API_BASE_URL/health
  ```

### Error: "Module not found: streamlit"
- **Cause**: Missing dependencies
- **Fix**: Install requirements
  ```bash
  pip install -r requirements.txt
  ```

### Error: Connection timeout
- **Cause**: Render deployment may be sleeping (free tier)
- **Fix**: Hit the API endpoint directly first to wake it up
  ```bash
  curl https://studio-pilot-vision.onrender.com/health
  ```
  Then refresh dashboard

## Customization

### Change Refresh Rate
Edit `streamlit_dashboard.py` line 74:
```python
@st.cache_data(ttl=300)  # 300 seconds = 5 minutes
```

### Add New Pages
Add to navigation radio button (line 64):
```python
page = st.radio(
    "Navigate",
    ["📊 Executive Summary", "📦 Product Portfolio", "⚠️ Risk Dashboard",
     "🎯 Governance Actions", "💬 Customer Feedback", "🆕 Your New Page"],
)
```

Then add page logic:
```python
elif page == "🆕 Your New Page":
    st.title("Your New Page")
    # Your content here
```

## Demo Tips

1. **Pre-load the dashboard** before demo to ensure cache is warm
2. **Open all tabs** (Executive Summary first) in sequence before presenting
3. **Have API docs open** in separate tab for live query demos
4. **Clear cache** if data looks stale: Click hamburger menu → Clear cache

## Next Steps

To connect real product data:
1. Implement `/api/products` endpoint in `main.py`
2. Update `fetch_products()` function in `streamlit_dashboard.py`
3. Add filtering and sorting to product table
4. Implement drill-down views for individual products

---

**For interview demo flow, see:** `DEMO_SCRIPT.md`
