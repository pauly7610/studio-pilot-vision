"""
Audit Logging Utilities
Provides structured audit logging for security-relevant events.

Usage:
    from ai_insights.utils.audit import log_audit_event, AuditAction
    
    log_audit_event(
        action=AuditAction.DATA_ACCESS,
        resource="products",
        user_ip=request.client.host,
        details={"product_id": "123", "fields": ["name", "status"]}
    )
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from ai_insights.config import get_logger

# Create a dedicated audit logger
audit_logger = get_logger("audit")


class AuditAction(str, Enum):
    """Enumeration of audit-able actions for compliance tracking."""
    
    # Authentication events
    AUTH_SUCCESS = "auth.success"
    AUTH_FAILURE = "auth.failure"
    AUTH_LOGOUT = "auth.logout"
    
    # Data access events
    DATA_ACCESS = "data.access"
    DATA_EXPORT = "data.export"
    DATA_QUERY = "data.query"
    
    # Data modification events
    DATA_CREATE = "data.create"
    DATA_UPDATE = "data.update"
    DATA_DELETE = "data.delete"
    
    # Admin events
    ADMIN_ACTION = "admin.action"
    ADMIN_CONFIG_CHANGE = "admin.config_change"
    
    # AI/ML events
    AI_QUERY = "ai.query"
    AI_INGEST = "ai.ingest"
    AI_COGNIFY = "ai.cognify"
    
    # Security events
    SECURITY_RATE_LIMIT = "security.rate_limit"
    SECURITY_INVALID_INPUT = "security.invalid_input"
    SECURITY_UNAUTHORIZED = "security.unauthorized"
    
    # File operations
    FILE_UPLOAD = "file.upload"
    FILE_DOWNLOAD = "file.download"


def log_audit_event(
    action: AuditAction | str,
    resource: str,
    user_ip: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    success: bool = True,
    error_message: Optional[str] = None,
) -> None:
    """
    Log a security-relevant event for compliance and audit purposes.
    
    Args:
        action: The type of action being performed (use AuditAction enum)
        resource: The resource being accessed (e.g., "products", "users")
        user_ip: IP address of the client making the request
        user_id: Optional user ID if authenticated
        user_email: Optional user email if authenticated
        details: Optional dictionary of additional context
        success: Whether the action succeeded
        error_message: Error message if action failed
    
    Example:
        log_audit_event(
            action=AuditAction.DATA_UPDATE,
            resource="products/prod_123",
            user_ip="192.168.1.1",
            user_id="user_456",
            details={"fields_updated": ["name", "status"]},
            success=True
        )
    """
    # Convert enum to string if needed
    action_str = action.value if isinstance(action, AuditAction) else str(action)
    
    # Build audit record
    audit_record = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": action_str,
        "resource": resource,
        "ip": user_ip,
        "success": success,
    }
    
    # Add optional fields
    if user_id:
        audit_record["user_id"] = user_id
    if user_email:
        audit_record["user_email"] = user_email
    if details:
        audit_record["details"] = details
    if error_message:
        audit_record["error"] = error_message
    
    # Log at appropriate level
    log_message = f"AUDIT: {action_str} on {resource}"
    
    if success:
        audit_logger.info(log_message, extra={"audit": audit_record})
    else:
        audit_logger.warning(log_message, extra={"audit": audit_record})


def log_admin_action(
    action_description: str,
    user_ip: str,
    user_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    """
    Convenience function for logging admin actions.
    
    Args:
        action_description: Human-readable description of the admin action
        user_ip: IP address of the admin
        user_id: Optional admin user ID
        details: Optional additional details
    """
    log_audit_event(
        action=AuditAction.ADMIN_ACTION,
        resource="admin",
        user_ip=user_ip,
        user_id=user_id,
        details={"description": action_description, **(details or {})},
    )


def log_ai_query(
    query: str,
    user_ip: str,
    query_type: str = "unified",
    confidence: Optional[float] = None,
    source_type: Optional[str] = None,
    duration_ms: Optional[int] = None,
) -> None:
    """
    Convenience function for logging AI queries.
    
    Args:
        query: The user's query text (truncated for privacy)
        user_ip: IP address of the client
        query_type: Type of query (unified, rag, cognee)
        confidence: Confidence score of the response
        source_type: Source type used (memory, retrieval, hybrid)
        duration_ms: Query duration in milliseconds
    """
    # Truncate query for privacy
    truncated_query = query[:200] + "..." if len(query) > 200 else query
    
    details = {
        "query_preview": truncated_query,
        "query_type": query_type,
    }
    
    if confidence is not None:
        details["confidence"] = confidence
    if source_type:
        details["source_type"] = source_type
    if duration_ms is not None:
        details["duration_ms"] = duration_ms
    
    log_audit_event(
        action=AuditAction.AI_QUERY,
        resource="ai/query",
        user_ip=user_ip,
        details=details,
    )


def log_security_event(
    event_type: str,
    user_ip: str,
    details: Optional[dict[str, Any]] = None,
) -> None:
    """
    Convenience function for logging security events.
    
    Args:
        event_type: Type of security event (rate_limit, invalid_input, unauthorized)
        user_ip: IP address involved
        details: Additional context
    """
    action_map = {
        "rate_limit": AuditAction.SECURITY_RATE_LIMIT,
        "invalid_input": AuditAction.SECURITY_INVALID_INPUT,
        "unauthorized": AuditAction.SECURITY_UNAUTHORIZED,
    }
    
    action = action_map.get(event_type, AuditAction.SECURITY_UNAUTHORIZED)
    
    log_audit_event(
        action=action,
        resource="security",
        user_ip=user_ip,
        details=details,
        success=False,
    )
