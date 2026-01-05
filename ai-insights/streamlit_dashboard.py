"""
Studio Pilot Vision - Executive Dashboard
Streamlit dashboard for Mastercard Studio Ambassador role.

Run with: streamlit run streamlit_dashboard.py
"""

import os
from datetime import datetime
import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

st.set_page_config(
    page_title="Studio Pilot Vision - Dashboard",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .big-metric {
        font-size: 2.5rem;
        font-weight: bold;
        color: #FF5F00;
    }
    .metric-label {
        font-size: 0.9rem;
        color: #666;
        text-transform: uppercase;
    }
    .alert-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #FFF3CD;
        border-left: 4px solid #FF5F00;
        margin: 1rem 0;
    }
    .success-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #D4EDDA;
        border-left: 4px solid: #28A745;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.image("https://www.mastercard.com/content/dam/public/mastercardcom/na/global-site/logos/mc-logo-52.svg", width=150)
    st.title("Studio Pilot Vision")
    st.markdown("### Mastercard North America")
    st.markdown("---")

    # Navigation
    page = st.radio(
        "Navigate",
        ["📊 Executive Summary", "📦 Product Portfolio", "⚠️ Risk Dashboard", "🎯 Governance Actions", "💬 Customer Feedback"],
    )

    st.markdown("---")
    st.markdown("**Studio Ambassador Dashboard**")
    st.markdown(f"*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*")

# Helper functions
@st.cache_data(ttl=300)
def fetch_executive_summary():
    """Fetch executive summary from API."""
    try:
        response = requests.get(f"{API_BASE_URL}/api/reports/executive-summary", timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error fetching data: {e}")
        return None

@st.cache_data(ttl=300)
def fetch_products():
    """Fetch products from Supabase via API."""
    # Note: You'd need to add a /api/products endpoint
    # For now, we'll use mock data
    return []

def display_metric_card(label, value, delta=None, delta_color="normal"):
    """Display a metric card."""
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(f'<div class="metric-label">{label}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="big-metric">{value}</div>', unsafe_allow_html=True)
    if delta:
        with col2:
            st.metric("", "", delta, delta_color=delta_color)

# === PAGE: Executive Summary ===
if page == "📊 Executive Summary":
    st.title("📊 Executive Summary Dashboard")
    st.markdown("### Studio Portfolio Health - North America")

    # Fetch data
    summary = fetch_executive_summary()

    if summary and not summary.get("error"):
        portfolio = summary.get("portfolio_overview", {})
        risk_summary = summary.get("risk_summary", {})
        governance = summary.get("governance_actions", {})
        feedback = summary.get("customer_feedback", {})
        alerts = [a for a in summary.get("alerts", []) if a]

        # Top-level metrics
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            display_metric_card(
                "Total Products",
                portfolio.get("total_products", 0),
            )

        with col2:
            display_metric_card(
                "Revenue Target",
                portfolio.get("total_revenue_target", "$0"),
            )

        with col3:
            display_metric_card(
                "High-Risk Products",
                risk_summary.get("high_risk_count", 0),
            )

        with col4:
            display_metric_card(
                "Pending Actions",
                governance.get("high_priority_pending", 0),
            )

        st.markdown("---")

        # Alerts section
        if alerts:
            st.markdown("### 🚨 Attention Required")
            for alert in alerts:
                st.markdown(f'<div class="alert-box">⚠️ {alert}</div>', unsafe_allow_html=True)

        st.markdown("---")

        # Charts row 1
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("### Products by Lifecycle Stage")
            stages = portfolio.get("products_by_stage", {})
            if stages:
                fig = px.pie(
                    values=list(stages.values()),
                    names=list(stages.keys()),
                    color_discrete_sequence=["#FF5F00", "#F79E1B", "#EB001B", "#00A3E0", "#69BE28"],
                )
                fig.update_traces(textposition='inside', textinfo='percent+label')
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No product data available")

        with col2:
            st.markdown("### Risk Distribution")
            risk_bands = risk_summary.get("products_by_risk_band", {})
            if risk_bands:
                colors = {"low": "#69BE28", "medium": "#F79E1B", "high": "#EB001B"}
                fig = go.Figure(data=[
                    go.Bar(
                        x=list(risk_bands.keys()),
                        y=list(risk_bands.values()),
                        marker_color=[colors.get(k, "#666") for k in risk_bands.keys()],
                    )
                ])
                fig.update_layout(
                    yaxis_title="Number of Products",
                    showlegend=False,
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No risk data available")

        st.markdown("---")

        # Charts row 2
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("### Governance Actions Status")
            actions_status = governance.get("by_status", {})
            if actions_status:
                fig = go.Figure(data=[
                    go.Bar(
                        y=list(actions_status.keys()),
                        x=list(actions_status.values()),
                        orientation='h',
                        marker_color='#FF5F00',
                    )
                ])
                fig.update_layout(
                    xaxis_title="Number of Actions",
                    showlegend=False,
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No governance actions")

        with col2:
            st.markdown("### Customer Feedback Sentiment")
            avg_sentiment = feedback.get("average_sentiment", 0)
            sentiment_status = feedback.get("sentiment_status", "neutral")

            # Gauge chart
            fig = go.Figure(go.Indicator(
                mode="gauge+number+delta",
                value=avg_sentiment,
                domain={'x': [0, 1], 'y': [0, 1]},
                title={'text': f"Avg Sentiment ({sentiment_status})"},
                delta={'reference': 0},
                gauge={
                    'axis': {'range': [-1, 1]},
                    'bar': {'color': "#FF5F00"},
                    'steps': [
                        {'range': [-1, -0.3], 'color': "#FFE5E5"},
                        {'range': [-0.3, 0.3], 'color': "#FFF8E5"},
                        {'range': [0.3, 1], 'color': "#E5FFE5"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 0
                    }
                }
            ))
            st.plotly_chart(fig, use_container_width=True)

        st.markdown("---")

        # Summary stats
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown("### Recent Activity")
            st.metric("Launches (90d)", portfolio.get("recent_launches_90d", 0))
            st.metric("Total Actions", governance.get("total_actions", 0))

        with col2:
            st.markdown("### Financial Impact")
            st.metric("Revenue at Risk", risk_summary.get("revenue_at_risk", "$0"))

        with col3:
            st.markdown("### Customer Voice")
            st.metric("Feedback Items", feedback.get("total_feedback_items", 0))
            st.metric("Avg Sentiment", f"{avg_sentiment:+.2f}")

    else:
        st.error("Unable to load executive summary data. Check API connection.")
        if summary:
            st.code(summary.get("error", "Unknown error"))

# === PAGE: Product Portfolio ===
elif page == "📦 Product Portfolio":
    st.title("📦 Product Portfolio")
    st.markdown("### All Products - North America")

    st.info("🚧 This section connects to your Supabase products table. Add a /api/products endpoint to populate.")

    # Example table structure
    st.markdown("**Expected columns:**")
    st.code("""
    - Product Name
    - Type (payment_flows, core_products, data_services, partnerships)
    - Lifecycle Stage (concept, pilot, scaling, mature)
    - Revenue Target
    - Readiness Score
    - Risk Band
    - Owner
    """)

# === PAGE: Risk Dashboard ===
elif page == "⚠️ Risk Dashboard":
    st.title("⚠️ Risk Dashboard")
    st.markdown("### High-Risk Products Requiring Attention")

    st.info("🚧 This section shows products with high-risk band. Add filtering and drill-down capabilities.")

    # Example risk factors
    st.markdown("**Risk Factors Tracked:**")
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        - **Readiness Score < 70%**
        - **Compliance gaps**
        - **Partner delays**
        - **High churn rate (>5%)**
        """)

    with col2:
        st.markdown("""
        - **Revenue miss > 20%**
        - **Negative feedback trends**
        - **Integration issues**
        - **Regulatory concerns**
        """)

# === PAGE: Governance Actions ===
elif page == "🎯 Governance Actions":
    st.title("🎯 Governance Actions")
    st.markdown("### Active Governance Actions & Escalations")

    st.info("🚧 This section shows pending/in-progress governance actions with filters by tier, priority, status.")

    # Example action card
    with st.expander("📋 Example: Escalate Open Banking partnership delays to SteerCo"):
        st.markdown("**Priority:** High | **Tier:** SteerCo | **Status:** Pending")
        st.markdown("**Assigned to:** openbanking.lead@mastercard.com")
        st.markdown("**Due date:** 2025-01-15")
        st.markdown("---")
        st.markdown("""
        **Description:**
        Bank partnerships exceeding 6mo timeline, need executive engagement.

        Critical partner dependency blocking Open Banking Connect launch timeline.
        """)
        st.button("Mark In Progress")
        st.button("Add Comment")

# === PAGE: Customer Feedback ===
elif page == "💬 Customer Feedback":
    st.title("💬 Customer Feedback")
    st.markdown("### Recent Customer & Partner Feedback")

    st.info("🚧 This section shows feedback items with sentiment analysis and themes.")

    # Example feedback
    feedback_data = [
        {"product": "BNPL Gateway API", "source": "Partner Feedback", "theme": "Integration", "sentiment": -0.55, "text": "Integration with Klarna/Affirm taking longer than expected"},
        {"product": "Click to Pay", "source": "Customer Survey", "theme": "UX", "sentiment": 0.92, "text": "One-click checkout reduced cart abandonment significantly"},
        {"product": "Fraud Detection AI", "source": "Customer Survey", "theme": "Performance", "sentiment": 0.98, "text": "Reduced fraud losses by 63% while maintaining approval rates"},
    ]

    for item in feedback_data:
        sentiment_color = "🟢" if item["sentiment"] > 0.3 else "🟡" if item["sentiment"] > -0.3 else "🔴"
        with st.expander(f"{sentiment_color} {item['product']} - {item['theme']} ({item['sentiment']:+.2f})"):
            st.markdown(f"**Source:** {item['source']}")
            st.markdown(f"**Feedback:** {item['text']}")
            st.button(f"Create Action", key=f"action_{item['product']}")

# Footer
st.markdown("---")
st.markdown("**Studio Pilot Vision** | Built for Mastercard Studio Ambassador Role | Powered by AI & Knowledge Graphs")
