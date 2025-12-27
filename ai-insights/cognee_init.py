"""
Cognee Data Initialization
Loads product data into Cognee knowledge graph on startup.
"""

import os
import sys
import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime

# CRITICAL: Set ALL Cognee environment variables BEFORE importing cognee
# Cognee checks these on import, so they must be set first
if not os.getenv("LLM_API_KEY"):
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        os.environ["LLM_API_KEY"] = groq_key
        print(f"✓ Set LLM_API_KEY from GROQ_API_KEY")
    else:
        print("⚠️ WARNING: Neither LLM_API_KEY nor GROQ_API_KEY is set!")

# Set Groq as custom LLM provider BEFORE importing cognee
# Groq is OpenAI-compatible, so use "custom" provider with Groq endpoint
# LiteLLM requires provider prefix in model name
os.environ["LLM_PROVIDER"] = "custom"
os.environ["LLM_MODEL"] = "groq/llama-3.3-70b-versatile"  # Updated to current production model
os.environ["LLM_ENDPOINT"] = "https://api.groq.com/openai/v1"

# Configure embeddings - Groq doesn't have embedding models yet
# Use HuggingFace Inference API with custom provider
if not os.getenv("EMBEDDING_API_KEY"):
    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    if hf_key:
        os.environ["EMBEDDING_API_KEY"] = hf_key
        print(f"✓ Set EMBEDDING_API_KEY from HUGGINGFACE_API_KEY")
    else:
        print("⚠️ WARNING: HUGGINGFACE_API_KEY not set!")

os.environ["EMBEDDING_PROVIDER"] = "custom"
os.environ["EMBEDDING_MODEL"] = "huggingface/sentence-transformers/all-MiniLM-L6-v2"
os.environ["EMBEDDING_ENDPOINT"] = "https://api-inference.huggingface.co/pipeline/feature-extraction"
os.environ["EMBEDDING_DIMENSIONS"] = "384"

print(f"✓ Configured Cognee to use Groq via custom provider")
print(f"✓ Configured embeddings via HuggingFace Inference API")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import cognee AFTER setting all environment variables
from cognee_client import get_cognee_client


async def initialize_cognee_with_products(products: List[Dict[str, Any]]) -> bool:
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
    """Add sample data for testing when Supabase is not available."""
    try:
        client = get_cognee_client()
        await client.initialize()
        
        sample_data = """
        Product: PayLink
        Status: Green
        Region: North America
        Description: Digital payment solution for merchants
        
        Product: CardConnect
        Status: Amber
        Region: Europe
        Description: Card processing platform with risk monitoring
        
        Risk: Q1 revenue at risk due to external dependency on Stripe API
        Impact: $2.7M potential revenue loss
        """
        
        print("📚 Adding sample data to Cognee...")
        await client.add_data(sample_data, node_set="sample")
        
        print("🧠 Processing sample data...")
        await client.cognify()
        
        print("✅ Sample data added successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to add sample data: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Test with sample data
    asyncio.run(add_sample_data())
