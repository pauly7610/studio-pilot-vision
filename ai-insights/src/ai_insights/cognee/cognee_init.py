"""
Cognee Data Initialization
Loads product data into Cognee knowledge graph on startup.

NOTE: Cognee configuration is done via cognee.config API in cognee_client.py
      Environment variables alone do NOT configure Cognee's embedding provider!
"""

import asyncio
import os
from typing import Any

# Import cognee AFTER setting all environment variables
from ai_insights.cognee.cognee_client import get_cognee_client  # noqa: E402


async def initialize_cognee_with_products(products: list[dict[str, Any]]) -> bool:
    """
    Initialize Cognee knowledge graph with product data.

    Args:
        products: List of product dictionaries from Supabase

    Returns:
        True if successful, False otherwise
    """
    try:
        client = get_cognee_client()
        await client.initialize()

        print(f"📚 Adding {len(products)} products to Cognee...")

        # Add each product as structured data
        for product in products:
            # Convert product to text format for Cognee
            product_text = f"""
Product: {product.get('name', 'Unknown')}
ID: {product.get('id', 'unknown')}
Status: {product.get('rag_status', 'unknown')}
Region: {product.get('region', 'unknown')}
Description: {product.get('description', 'No description')}
"""
            await client.add_data(product_text, node_set="products")

        print("🧠 Processing data into knowledge graph...")
        await client.cognify()

        print("✅ Cognee initialized with product data successfully!")
        return True

    except Exception as e:
        print(f"❌ Failed to initialize Cognee: {e}")
        import traceback

        traceback.print_exc()
        return False


async def add_sample_data():
    """
    Add CAPPED sample data for memory optimization.

    CONSTRAINTS:
    - Last 2 quarters only
    - Top 5 products maximum
    - High-confidence actions only

    WHY: Preserves correctness while cutting RAM usage for demo/interview.
    """
    try:
        client = get_cognee_client()
        await client.initialize()

        # CAPPED: Only recent, high-value data
        sample_data = """
RECENT PRODUCT DECISIONS (Last 2 Quarters - Q3/Q4 2024):

TOP 5 PRODUCTS:

1. PayLink - Digital payment solution (North America)
   Status: Green | Decision: Accelerate to market Q4 2024
   Reason: Strong merchant demand, competitive advantage in speed

2. CardConnect - Card processing platform (Europe)
   Status: Amber | Decision: Monitor closely, compliance review needed
   Reason: Regulatory changes in EU payment directives

3. FraudShield - AI-powered fraud detection (Global)
   Status: Green | Decision: Scale investment, proven ROI
   Reason: 40% reduction in false positives, customer retention up 15%

4. MerchantHub - Business analytics dashboard (North America)
   Status: Red | Decision: Deprioritized to Q1 2025
   Reason: Resource constraints, focus on core payment products

5. PayoutExpress - Instant settlement service (APAC)
   Status: Amber | Decision: Pilot in Singapore, evaluate Q4 results
   Reason: Market validation needed before full rollout

KEY DECISIONS:
- Q3 2024: Deprioritized MerchantHub due to engineering capacity limits
- Q4 2024: Accelerated PayLink launch to capture holiday season demand
- Q4 2024: Increased FraudShield budget by 30% based on strong performance
        """

        # NOTE: cognify() is DISABLED - it's too heavy for web process
        # Run cognify() manually via Render Job or build command if needed
        print("📚 Adding sample data to Cognee...")
        await client.add_data(sample_data, node_set="sample")

        # REMOVED: await client.cognify() - causes 30-min timeout on Render
        # This should be run as a separate background job, not in the web process

        print("✅ Sample data added (cognify skipped for memory optimization)")
        return True

    except Exception as e:
        print(f"❌ Failed to add sample data: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Test with sample data
    asyncio.run(add_sample_data())
