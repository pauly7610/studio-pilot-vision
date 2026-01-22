package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

// MaxBodySize is the maximum allowed request body size (10MB)
const MaxBodySize = 10 * 1024 * 1024

// uuidRegex matches valid UUID v4 format
var uuidRegex = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// RequestValidation returns a middleware that validates incoming requests.
//
// Validations performed:
// - Content-Type enforcement for POST/PUT/PATCH requests
// - Request body size limiting
func RequestValidation() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Enforce Content-Type for requests with body
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			contentType := c.GetHeader("Content-Type")

			// Skip content-type check for multipart (file uploads)
			if !strings.HasPrefix(contentType, "application/json") &&
				!strings.HasPrefix(contentType, "multipart/form-data") {
				// Allow empty content-type for some edge cases, but warn
				if contentType != "" && c.Request.ContentLength > 0 {
					c.JSON(http.StatusUnsupportedMediaType, gin.H{
						"error":   "Unsupported Content-Type",
						"message": "Content-Type must be application/json or multipart/form-data",
					})
					c.Abort()
					return
				}
			}
		}

		// Limit request body size
		if c.Request.ContentLength > MaxBodySize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error":   "Request body too large",
				"message": "Maximum request body size is 10MB",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ValidateUUID validates that a path parameter is a valid UUID
func ValidateUUID(paramName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param(paramName)

		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Missing parameter",
				"message": paramName + " is required",
			})
			c.Abort()
			return
		}

		if !uuidRegex.MatchString(id) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid UUID format",
				"message": paramName + " must be a valid UUID",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// SanitizeInput is a helper function to sanitize string inputs
// by trimming whitespace and limiting length
func SanitizeInput(input string, maxLength int) string {
	// Trim whitespace
	sanitized := strings.TrimSpace(input)

	// Limit length
	if len(sanitized) > maxLength {
		sanitized = sanitized[:maxLength]
	}

	return sanitized
}

// ValidateRequired checks that required fields are present in the request
func ValidateRequired(fields ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid request body",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		missingFields := make([]string, 0)
		for _, field := range fields {
			if _, exists := body[field]; !exists {
				missingFields = append(missingFields, field)
			}
		}

		if len(missingFields) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Missing required fields",
				"message": "The following fields are required: " + strings.Join(missingFields, ", "),
			})
			c.Abort()
			return
		}

		// Re-bind the body for the handler (since we consumed it)
		c.Set("validatedBody", body)
		c.Next()
	}
}
