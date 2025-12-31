"""
Test script to diagnose Cognee initialization and query issues.
Run this to identify the exact failure point.
"""

import asyncio
import os
import sys

print("=" * 60)
print("COGNEE DIAGNOSTIC TEST")
print("=" * 60)

# Test 1: Import cognee
print("\n1. Testing cognee import...")
try:
    import cognee

    print("   ✓ cognee imported successfully")
    print(f"   Version: {cognee.__version__ if hasattr(cognee, '__version__') else 'unknown'}")
except ImportError as e:
    print(f"   ✗ FAILED: {e}")
    sys.exit(1)

# Test 2: Check available methods
print("\n2. Checking cognee methods...")
methods = ["config", "add", "cognify", "search", "prune"]
for method in methods:
    if hasattr(cognee, method):
        print(f"   ✓ cognee.{method} exists")
    else:
        print(f"   ✗ cognee.{method} NOT FOUND")

# Test 3: Check config methods
print("\n3. Checking cognee.config methods...")
if hasattr(cognee, "config"):
    config_methods = [
        "set_llm_provider",
        "set_llm_model",
        "set_vector_db_provider",
        "set_graph_db_provider",
    ]
    for method in config_methods:
        if hasattr(cognee.config, method):
            print(f"   ✓ cognee.config.{method} exists")
        else:
            print(f"   ✗ cognee.config.{method} NOT FOUND")
else:
    print("   ✗ cognee.config NOT FOUND")

# Test 4: Initialize Cognee
print("\n4. Testing Cognee initialization...")


async def test_init():
    try:
        # Check if GROQ_API_KEY is set
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            print(f"   ✓ GROQ_API_KEY found (length: {len(groq_key)})")
        else:
            print("   ✗ GROQ_API_KEY not set")

        # Try to configure Cognee
        print("   Configuring LLM provider...")
        await cognee.config.set_llm_provider("groq")
        print("   ✓ LLM provider set to groq")

        print("   Configuring LLM model...")
        await cognee.config.set_llm_model("llama-3.1-70b-versatile")
        print("   ✓ LLM model set")

        print("   Configuring vector DB...")
        await cognee.config.set_vector_db_provider("chroma")
        print("   ✓ Vector DB set to chroma")

        print("   Configuring graph DB...")
        await cognee.config.set_graph_db_provider("networkx")
        print("   ✓ Graph DB set to networkx")

        print("   ✓ Cognee initialized successfully")
        return True

    except Exception as e:
        print(f"   ✗ Initialization FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback

        traceback.print_exc()
        return False


# Test 5: Test search method
print("\n5. Testing cognee.search()...")


async def test_search():
    try:
        # Try a simple search
        print("   Attempting search...")
        results = await cognee.search("test query", search_type="INSIGHTS")
        print("   ✓ Search executed successfully")
        print(f"   Results type: {type(results)}")
        print(f"   Results: {results}")
        return True
    except Exception as e:
        print(f"   ✗ Search FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback

        traceback.print_exc()
        return False


# Run tests
async def run_all_tests():
    init_success = await test_init()

    if init_success:
        await test_search()
    else:
        print("\n⚠ Skipping search test due to initialization failure")


print("\n" + "=" * 60)
print("RUNNING ASYNC TESTS...")
print("=" * 60)

try:
    asyncio.run(run_all_tests())
except Exception as e:
    print(f"\n✗ FATAL ERROR: {e}")
    import traceback

    traceback.print_exc()

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
