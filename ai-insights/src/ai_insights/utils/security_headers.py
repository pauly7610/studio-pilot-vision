"""
Security Headers Middleware
Adds security-related HTTP headers to all responses.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.
    
    Headers added:
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Legacy XSS protection for older browsers
    - Referrer-Policy: Controls referrer information sent
    - Permissions-Policy: Restricts browser features
    - Content-Security-Policy: Controls resource loading (permissive for API)
    - Strict-Transport-Security: Enforces HTTPS (only in production)
    """
    
    def __init__(self, app, include_hsts: bool = True):
        """
        Initialize the middleware.
        
        Args:
            app: The ASGI application
            include_hsts: Whether to include HSTS header (disable for local dev)
        """
        super().__init__(app)
        self.include_hsts = include_hsts
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add security headers to response."""
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking - deny all framing
        response.headers["X-Frame-Options"] = "DENY"
        
        # Legacy XSS protection for older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Restrict browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=()"
        )
        
        # Content Security Policy - permissive for API responses
        # APIs primarily serve JSON, so CSP is less critical but still good practice
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'none'; "
            "style-src 'none'; "
            "img-src 'none'; "
            "frame-ancestors 'none'"
        )
        
        # HTTP Strict Transport Security (HSTS)
        # Only include in production to avoid issues with local development
        if self.include_hsts:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        
        # Prevent caching of sensitive responses
        # Can be overridden by individual endpoints if needed
        if "Cache-Control" not in response.headers:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        
        return response
