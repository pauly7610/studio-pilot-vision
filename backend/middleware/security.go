package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders returns a middleware that adds security-related HTTP headers
// to all responses.
//
// Headers added:
// - X-Content-Type-Options: Prevents MIME type sniffing
// - X-Frame-Options: Prevents clickjacking
// - X-XSS-Protection: Legacy XSS protection for older browsers
// - Referrer-Policy: Controls referrer information sent
// - Permissions-Policy: Restricts browser features
// - Content-Security-Policy: Controls resource loading
// - Strict-Transport-Security: Enforces HTTPS (only in production)
func SecurityHeaders() gin.HandlerFunc {
	// Determine if we're in production based on environment
	isProduction := os.Getenv("GIN_MODE") == "release" ||
		os.Getenv("RENDER") == "true" ||
		os.Getenv("PRODUCTION") == "true"

	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking - deny all framing
		c.Header("X-Frame-Options", "DENY")

		// Legacy XSS protection for older browsers
		c.Header("X-XSS-Protection", "1; mode=block")

		// Control referrer information
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict browser features
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=()")

		// Content Security Policy - permissive for API responses
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'none'; style-src 'none'; img-src 'none'; frame-ancestors 'none'")

		// HTTP Strict Transport Security (HSTS)
		// Only include in production to avoid issues with local development
		if isProduction {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		// Prevent caching of sensitive responses by default
		// Individual handlers can override this if needed
		if c.Writer.Header().Get("Cache-Control") == "" {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate")
		}

		c.Next()
	}
}
