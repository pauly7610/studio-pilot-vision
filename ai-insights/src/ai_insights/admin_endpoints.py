"""
Protected Admin Endpoints for Cognee Management

WHY: cognify() is too heavy to run in the query path (30+ minutes).
     These endpoints allow manual triggering for knowledge graph building.

SECURITY: Protected by API key to prevent abuse.
"""

import os
from datetime import datetime
from typing import Any

from fastapi import Header, HTTPException


async def verify_admin_key(x_admin_key: str = Header(None)) -> bool:
    """
    Verify admin API key for protected endpoints.

    WHY: cognify() is expensive and should only be triggered by authorized users.
    """
    expected_key = os.getenv("ADMIN_API_KEY")

    if not expected_key:
        raise HTTPException(status_code=500, detail="ADMIN_API_KEY not configured on server")

    if not x_admin_key:
        raise HTTPException(status_code=401, detail="Missing X-Admin-Key header")

    if x_admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    return True


async def trigger_cognify(x_admin_key: str = Header(None)) -> dict[str, Any]:
    """
    Manually trigger cognify() to build the knowledge graph.

    WHY: cognify() performs LLM-based entity extraction and relationship mapping.
         This is too heavy for the query path, so it's triggered manually.

    WHEN TO USE:
    - After adding new data via /cognee/ingest endpoints
    - After deployment to build initial graph
    - Periodically to refresh graph with new insights

    PROTECTED: Requires X-Admin-Key header
    """
    await verify_admin_key(x_admin_key)

    try:
        from ai_insights.cognee import get_cognee_lazy_loader

        loader = get_cognee_lazy_loader()
        client = await loader.get_client()

        if not client:
            raise HTTPException(status_code=503, detail="Cognee client unavailable")

        print("🧠 Admin triggered cognify() - this may take 5-30 minutes...")
        start_time = datetime.now()

        # Run cognify to build knowledge graph
        await client.cognify()

        duration = (datetime.now() - start_time).total_seconds()

        return {
            "success": True,
            "message": "Knowledge graph built successfully",
            "duration_seconds": duration,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"cognify() failed: {str(e)}")


async def get_cognee_status(x_admin_key: str = Header(None)) -> dict[str, Any]:
    """
    Get Cognee system status and statistics.

    PROTECTED: Requires X-Admin-Key header
    """
    await verify_admin_key(x_admin_key)

    try:
        from ai_insights.cognee import get_cognee_lazy_loader

        loader = get_cognee_lazy_loader()
        status = loader.get_status()

        # Add data path info
        data_path = os.getenv("COGNEE_DATA_PATH", "./cognee_data")

        return {
            "success": True,
            "cognee_status": status,
            "data_path": data_path,
            "persistent_disk": "/data" in data_path,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")


async def reset_cognee(x_admin_key: str = Header(None)) -> dict[str, Any]:
    """
    Reset Cognee knowledge graph (DANGEROUS).

    WHY: Sometimes you need to start fresh.

    PROTECTED: Requires X-Admin-Key header
    """
    await verify_admin_key(x_admin_key)

    try:
        from ai_insights.cognee import get_cognee_lazy_loader

        loader = get_cognee_lazy_loader()
        client = await loader.get_client()

        if not client:
            raise HTTPException(status_code=503, detail="Cognee client unavailable")

        print("⚠️ Admin triggered Cognee reset...")

        # Reset Cognee
        await client.reset()

        return {
            "success": True,
            "message": "Cognee knowledge graph reset successfully",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
