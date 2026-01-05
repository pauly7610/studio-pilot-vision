"""
Governance Action Templates for Mastercard Products
Pre-defined action templates mapped to product types and risk scenarios.
"""

from typing import Dict, List
from enum import Enum


class ProductType(str, Enum):
    PAYMENT_FLOWS = "payment_flows"
    CORE_PRODUCTS = "core_products"
    DATA_SERVICES = "data_services"
    PARTNERSHIPS = "partnerships"


class RiskScenario(str, Enum):
    READINESS_LOW = "readiness_low"
    PARTNER_DELAY = "partner_delay"
    COMPLIANCE_GAP = "compliance_gap"
    HIGH_CHURN = "high_churn"
    REVENUE_MISS = "revenue_miss"
    NEGATIVE_FEEDBACK = "negative_feedback"
    INTEGRATION_ISSUES = "integration_issues"


GOVERNANCE_ACTION_TEMPLATES: Dict[RiskScenario, Dict[str, any]] = {
    RiskScenario.READINESS_LOW: {
        "action_type": "mitigation",
        "priority": "high",
        "title_template": "Address readiness gaps for {product_name}",
        "description_template": (
            "Product readiness score {readiness_score}% is below pilot threshold (70%). "
            "Key gaps identified:\n"
            "- Compliance: {compliance_complete}\n"
            "- Sales training: {sales_training_pct}%\n"
            "- Partner enablement: {partner_enabled_pct}%\n"
            "- Documentation: {documentation_score}%\n\n"
            "Required actions:\n"
            "1. Complete compliance certification\n"
            "2. Schedule sales training sessions\n"
            "3. Update partner enablement materials\n"
            "4. Review and enhance documentation"
        ),
        "tier": "ambassador",
        "days_to_complete": 14,
    },
    RiskScenario.PARTNER_DELAY: {
        "action_type": "escalation",
        "priority": "high",
        "title_template": "Escalate {product_name} partner delays to SteerCo",
        "description_template": (
            "Critical partner dependency blocking {product_name} launch timeline.\n\n"
            "Partner: {partner_name}\n"
            "Original timeline: {expected_date}\n"
            "Current status: {delay_status}\n"
            "Impact: {delay_impact}\n\n"
            "Recommended actions:\n"
            "1. Executive engagement with partner leadership\n"
            "2. Explore alternative partners or workarounds\n"
            "3. Adjust launch timeline if needed\n"
            "4. Weekly status updates to SteerCo"
        ),
        "tier": "steerco",
        "days_to_complete": 7,
    },
    RiskScenario.COMPLIANCE_GAP: {
        "action_type": "compliance",
        "priority": "critical",
        "title_template": "Complete {certification_type} certification for {product_name}",
        "description_template": (
            "Compliance certification {certification_type} required before pilot expansion.\n\n"
            "Status: {compliance_status}\n"
            "Required for: {product_type} products in {region}\n"
            "Regulatory requirement: {regulatory_body}\n\n"
            "Action plan:\n"
            "1. Engage compliance team for gap assessment\n"
            "2. Remediate identified gaps\n"
            "3. Schedule certification audit\n"
            "4. Obtain certification before {target_date}\n\n"
            "⚠️ Product cannot scale without this certification."
        ),
        "tier": "ambassador",
        "days_to_complete": 30,
    },
    RiskScenario.HIGH_CHURN: {
        "action_type": "intervention",
        "priority": "high",
        "title_template": "Address {product_name} customer churn ({churn_rate}%)",
        "description_template": (
            "Customer churn rate {churn_rate}% exceeds healthy threshold (3%).\n\n"
            "Customer feedback themes:\n"
            "{feedback_themes}\n\n"
            "Potential causes:\n"
            "- Value proposition not resonating\n"
            "- Competitive pressure\n"
            "- Technical/usability issues\n"
            "- Pricing concerns\n\n"
            "Required actions:\n"
            "1. Conduct customer interviews to understand churn drivers\n"
            "2. Review and strengthen value proposition\n"
            "3. Address top 3 customer pain points\n"
            "4. Implement win-back campaign for recently churned customers\n"
            "5. Monthly churn tracking and reporting"
        ),
        "tier": "ambassador",
        "days_to_complete": 21,
    },
    RiskScenario.REVENUE_MISS: {
        "action_type": "review",
        "priority": "medium",
        "title_template": "Review {product_name} revenue performance vs target",
        "description_template": (
            "Q{quarter} revenue tracking below target.\n\n"
            "Target: ${revenue_target:,.0f}\n"
            "Actual: ${actual_revenue:,.0f}\n"
            "Gap: ${revenue_gap:,.0f} ({gap_percentage}%)\n\n"
            "Contributing factors:\n"
            "- Adoption rate: {adoption_rate}%\n"
            "- Active users: {active_users:,}\n"
            "- Transaction volume: {transaction_volume:,}\n\n"
            "Recommended actions:\n"
            "1. Analyze sales pipeline and conversion rates\n"
            "2. Review pricing and packaging strategy\n"
            "3. Accelerate customer acquisition efforts\n"
            "4. Consider promotional campaigns or pilot incentives\n"
            "5. Bi-weekly revenue tracking with sales team"
        ),
        "tier": "ambassador",
        "days_to_complete": 14,
    },
    RiskScenario.NEGATIVE_FEEDBACK: {
        "action_type": "other",
        "priority": "medium",
        "title_template": "Address negative feedback for {product_name}: {feedback_theme}",
        "description_template": (
            "High-impact negative feedback requiring response.\n\n"
            "Theme: {feedback_theme}\n"
            "Sentiment score: {sentiment_score}\n"
            "Volume: {feedback_volume} reports\n"
            "Source: {feedback_source}\n\n"
            "Sample feedback:\n"
            "\"{sample_feedback}\"\n\n"
            "Required actions:\n"
            "1. Triage and prioritize feedback items\n"
            "2. Root cause analysis with product/engineering team\n"
            "3. Develop remediation plan\n"
            "4. Communicate resolution timeline to affected customers\n"
            "5. Track resolution and customer satisfaction post-fix"
        ),
        "tier": "ambassador",
        "days_to_complete": 10,
    },
    RiskScenario.INTEGRATION_ISSUES: {
        "action_type": "other",
        "priority": "high",
        "title_template": "Fix {product_name} integration issues: {integration_partner}",
        "description_template": (
            "Critical integration issues delaying customer onboarding.\n\n"
            "Integration partner: {integration_partner}\n"
            "Issue description: {issue_description}\n"
            "Customers impacted: {customers_impacted}\n"
            "Average integration time: {integration_time_days} days (target: {target_time_days})\n\n"
            "Technical issues identified:\n"
            "{technical_issues}\n\n"
            "Required actions:\n"
            "1. Joint troubleshooting session with partner engineering team\n"
            "2. Update API documentation with common pitfalls\n"
            "3. Provide integration examples and SDKs\n"
            "4. Establish integration support SLA\n"
            "5. Weekly sync until integration time < target"
        ),
        "tier": "ambassador",
        "days_to_complete": 7,
    },
}


# Product type specific templates
PRODUCT_TYPE_SPECIFIC_ACTIONS: Dict[ProductType, List[Dict[str, str]]] = {
    ProductType.PAYMENT_FLOWS: [
        {
            "scenario": "payment_processing_delay",
            "title": "Optimize payment processing latency",
            "description": "Transaction processing time exceeds SLA (>500ms). Work with engineering to optimize payment flow.",
            "priority": "high",
        },
        {
            "scenario": "fraud_rate_spike",
            "title": "Investigate fraud rate increase",
            "description": "Fraud/chargeback rate increased above threshold. Engage fraud team for ML model tuning.",
            "priority": "critical",
        },
        {
            "scenario": "network_downtime",
            "title": "Address payment network reliability",
            "description": "Payment network uptime below 99.9% SLA. Coordinate with infrastructure team on redundancy.",
            "priority": "critical",
        },
    ],
    ProductType.CORE_PRODUCTS: [
        {
            "scenario": "api_deprecation",
            "title": "Manage API version deprecation",
            "description": "API v1 deprecation scheduled. Coordinate customer migration to v2 with 90-day notice.",
            "priority": "medium",
        },
        {
            "scenario": "scalability_limits",
            "title": "Address scalability constraints",
            "description": "System approaching capacity limits. Plan infrastructure scaling or load optimization.",
            "priority": "high",
        },
    ],
    ProductType.DATA_SERVICES: [
        {
            "scenario": "data_quality_issues",
            "title": "Improve data quality and accuracy",
            "description": "Data quality scores below threshold. Review ETL pipelines and validation rules.",
            "priority": "high",
        },
        {
            "scenario": "gdpr_compliance",
            "title": "Ensure GDPR data handling compliance",
            "description": "Data retention policies need review for GDPR compliance. Engage legal and compliance teams.",
            "priority": "critical",
        },
    ],
    ProductType.PARTNERSHIPS: [
        {
            "scenario": "partner_sla_breach",
            "title": "Address partner SLA breach",
            "description": "Partner failing to meet contractual SLAs. Schedule executive review of partnership terms.",
            "priority": "high",
        },
        {
            "scenario": "partnership_expansion",
            "title": "Evaluate partnership expansion opportunity",
            "description": "Partner proposing expansion to new markets. Assess business case and ROI.",
            "priority": "medium",
        },
    ],
}


def get_action_template(risk_scenario: RiskScenario, context: Dict[str, any]) -> Dict[str, str]:
    """
    Get a governance action template populated with context.

    Args:
        risk_scenario: The risk scenario triggering the action
        context: Dictionary containing product data and scenario-specific details

    Returns:
        Populated action template ready for creation
    """
    template = GOVERNANCE_ACTION_TEMPLATES.get(risk_scenario)

    if not template:
        return None

    # Populate template with context
    populated = {
        "action_type": template["action_type"],
        "priority": template["priority"],
        "tier": template["tier"],
        "title": template["title_template"].format(**context),
        "description": template["description_template"].format(**context),
        "due_days": template["days_to_complete"],
    }

    return populated


def get_product_type_actions(product_type: ProductType) -> List[Dict[str, str]]:
    """
    Get product-type-specific action templates.

    Args:
        product_type: Type of product

    Returns:
        List of action templates specific to this product type
    """
    return PRODUCT_TYPE_SPECIFIC_ACTIONS.get(product_type, [])


# Example usage
if __name__ == "__main__":
    # Example: Generate readiness gap action
    context = {
        "product_name": "BNPL Gateway API",
        "readiness_score": 66,
        "compliance_complete": "Yes",
        "sales_training_pct": 68,
        "partner_enabled_pct": 55,
        "documentation_score": 72,
    }

    action = get_action_template(RiskScenario.READINESS_LOW, context)
    print("Generated Action:")
    print(f"Title: {action['title']}")
    print(f"Type: {action['action_type']}")
    print(f"Priority: {action['priority']}")
    print(f"Description:\n{action['description']}")
