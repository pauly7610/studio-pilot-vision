package middleware

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// AuditAction represents types of actions that should be audited
type AuditAction string

const (
	// Authentication events
	AuditAuthSuccess AuditAction = "auth.success"
	AuditAuthFailure AuditAction = "auth.failure"

	// Data access events
	AuditDataAccess AuditAction = "data.access"
	AuditDataCreate AuditAction = "data.create"
	AuditDataUpdate AuditAction = "data.update"
	AuditDataDelete AuditAction = "data.delete"

	// Admin events
	AuditAdminAction AuditAction = "admin.action"

	// Security events
	AuditSecurityRateLimit    AuditAction = "security.rate_limit"
	AuditSecurityUnauthorized AuditAction = "security.unauthorized"
)

// AuditRecord represents a single audit log entry
type AuditRecord struct {
	Timestamp   string                 `json:"timestamp"`
	Action      AuditAction            `json:"action"`
	Resource    string                 `json:"resource"`
	Method      string                 `json:"method"`
	IP          string                 `json:"ip"`
	UserID      string                 `json:"user_id,omitempty"`
	UserEmail   string                 `json:"user_email,omitempty"`
	StatusCode  int                    `json:"status_code"`
	DurationMs  int64                  `json:"duration_ms"`
	Success     bool                   `json:"success"`
	Details     map[string]interface{} `json:"details,omitempty"`
	Error       string                 `json:"error,omitempty"`
}

// AuditLogger provides methods for logging audit events
type AuditLogger struct {
	// In production, this would be a structured logger or send to a logging service
}

// NewAuditLogger creates a new audit logger instance
func NewAuditLogger() *AuditLogger {
	return &AuditLogger{}
}

// Log writes an audit record to the log
func (al *AuditLogger) Log(record AuditRecord) {
	// Serialize to JSON for structured logging
	data, err := json.Marshal(record)
	if err != nil {
		log.Printf("AUDIT_ERROR: Failed to serialize audit record: %v", err)
		return
	}

	// In production, this would go to a dedicated audit log
	// For now, prefix with AUDIT: for easy filtering
	log.Printf("AUDIT: %s", string(data))
}

// LogEvent is a convenience method for logging simple events
func (al *AuditLogger) LogEvent(action AuditAction, resource string, ip string, success bool, details map[string]interface{}) {
	record := AuditRecord{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Action:    action,
		Resource:  resource,
		IP:        ip,
		Success:   success,
		Details:   details,
	}
	al.Log(record)
}

// Global audit logger instance
var auditLogger = NewAuditLogger()

// GetAuditLogger returns the global audit logger
func GetAuditLogger() *AuditLogger {
	return auditLogger
}

// AuditMiddleware returns a middleware that logs all requests for audit purposes
func AuditMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		start := time.Now()

		// Get request info before processing
		path := c.Request.URL.Path
		method := c.Request.Method
		ip := c.ClientIP()

		// Process request
		c.Next()

		// Skip audit for health checks and static files
		if path == "/health" || path == "/favicon.ico" {
			return
		}

		// Calculate duration
		duration := time.Since(start)

		// Determine action based on method
		var action AuditAction
		switch method {
		case "GET":
			action = AuditDataAccess
		case "POST":
			action = AuditDataCreate
		case "PUT", "PATCH":
			action = AuditDataUpdate
		case "DELETE":
			action = AuditDataDelete
		default:
			action = AuditDataAccess
		}

		// Get user info if authenticated
		userID, _ := c.Get("userID")
		userEmail, _ := c.Get("email")

		userIDStr := ""
		if userID != nil {
			userIDStr, _ = userID.(string)
		}

		userEmailStr := ""
		if userEmail != nil {
			userEmailStr, _ = userEmail.(string)
		}

		// Create audit record
		record := AuditRecord{
			Timestamp:  time.Now().UTC().Format(time.RFC3339),
			Action:     action,
			Resource:   path,
			Method:     method,
			IP:         ip,
			UserID:     userIDStr,
			UserEmail:  userEmailStr,
			StatusCode: c.Writer.Status(),
			DurationMs: duration.Milliseconds(),
			Success:    c.Writer.Status() < 400,
		}

		// Add error if present
		if len(c.Errors) > 0 {
			record.Error = c.Errors.String()
		}

		// Log the audit record
		auditLogger.Log(record)
	}
}

// LogAdminAction logs an administrative action
func LogAdminAction(c *gin.Context, description string, details map[string]interface{}) {
	ip := c.ClientIP()
	userID, _ := c.Get("userID")

	userIDStr := ""
	if userID != nil {
		userIDStr, _ = userID.(string)
	}

	if details == nil {
		details = make(map[string]interface{})
	}
	details["description"] = description

	record := AuditRecord{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Action:    AuditAdminAction,
		Resource:  c.Request.URL.Path,
		Method:    c.Request.Method,
		IP:        ip,
		UserID:    userIDStr,
		Success:   true,
		Details:   details,
	}

	auditLogger.Log(record)
}

// LogSecurityEvent logs a security-related event
func LogSecurityEvent(action AuditAction, ip string, details map[string]interface{}) {
	record := AuditRecord{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Action:    action,
		Resource:  "security",
		IP:        ip,
		Success:   false,
		Details:   details,
	}

	auditLogger.Log(record)
}
