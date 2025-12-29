"""
Lazy-loading wrapper for Cognee to minimize memory footprint.

WHY: Cognee + dependencies consume ~200Mi RAM just by importing.
     By lazy-loading, we only pay this cost when actually needed.
     
STRATEGY: 
- Import cognee only when first query requires it
- Cache the client after first load
- Gracefully handle import failures (degraded mode)
"""

import os
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime


class CogneeLazyLoader:
    """
    Lazy-loading wrapper for Cognee client.
    
    Design decisions:
    1. Don't import cognee until first use
    2. Cache client after first load
    3. Track availability status for graceful degradation
    4. Provide clear error messages when unavailable
    """
    
    def __init__(self):
        """Initialize loader without importing cognee."""
        self._client = None
        self._available = None  # None = unknown, True = available, False = unavailable
        self._last_error = None
        self._load_attempted_at = None
        self._lock = asyncio.Lock()  # Prevents multiple threads from loading at once
    
    def is_available(self) -> bool:
        """
        Check if Cognee is available without loading it.
        
        WHY: Allows orchestrator to make routing decisions
             without triggering expensive imports.
        """
        if self._available is not None:
            return self._available
        
        # Quick check: are dependencies installed?
        try:
            import importlib.util
            spec = importlib.util.find_spec("cognee")
            return spec is not None
        except Exception:
            return False
    
    async def get_client(self):
        """
        Get Cognee client, loading it if necessary (ASYNC + THREAD-SAFE).
        
        Returns:
            Cognee client instance or None if unavailable
            
        WHY: This is where the actual import happens.
             Only called when we need to use Cognee.
             Uses asyncio.Lock to prevent race conditions when multiple
             requests try to load Cognee simultaneously.
        """
        # Return cached client if already loaded
        if self._client is not None:
            return self._client
        
        # If we know it's unavailable, don't retry
        if self._available is False:
            return None
        
        # Only one request can trigger the load at a time
        async with self._lock:
            # Double-check after acquiring lock (another request may have loaded it)
            if self._client is not None:
                return self._client
            
            try:
                self._load_attempted_at = datetime.now()
                
                # Move the sync import to a background thread to avoid blocking
                def _sync_load():
                    from cognee_client import get_cognee_client
                    return get_cognee_client()
                
                self._client = await asyncio.to_thread(_sync_load)
                self._available = True
                
                print(f"✓ Cognee loaded successfully (memory impact: ~200Mi)")
                
                return self._client
                
            except ImportError as e:
                self._available = False
                self._last_error = f"Import error: {str(e)}"
                print(f"⚠️ Cognee unavailable: {self._last_error}")
                return None
                
            except Exception as e:
                self._available = False
                self._last_error = f"Load error: {str(e)}"
                print(f"⚠️ Cognee load failed: {self._last_error}")
                return None
    
    async def query(
        self,
        query_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Query Cognee with graceful degradation.
        
        Args:
            query_text: Natural language query
            context: Additional context
            
        Returns:
            Query results or None if unavailable
            
        WHY: Provides single entry point for Cognee queries
             with built-in error handling.
        """
        client = await self.get_client()  # Now awaited
        
        if client is None:
            return None
        
        try:
            result = await client.query(query_text, context)
            return result
            
        except Exception as e:
            print(f"⚠️ Cognee query failed: {str(e)}")
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get loader status for debugging/monitoring.
        
        WHY: Helps diagnose why Cognee might be unavailable.
        """
        return {
            "available": self._available,
            "client_loaded": self._client is not None,
            "last_error": self._last_error,
            "load_attempted_at": str(self._load_attempted_at) if self._load_attempted_at else None,
        }


# Global lazy loader instance
_lazy_loader: Optional[CogneeLazyLoader] = None


def get_cognee_lazy_loader() -> CogneeLazyLoader:
    """Get or create global Cognee lazy loader."""
    global _lazy_loader
    if _lazy_loader is None:
        _lazy_loader = CogneeLazyLoader()
    return _lazy_loader
