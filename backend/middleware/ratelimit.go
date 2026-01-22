package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a sliding window rate limiter
type RateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter with the specified limit and window
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
	go rl.cleanup()
	return rl
}

// cleanup removes old request timestamps periodically to prevent memory leaks
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, timestamps := range rl.requests {
			// Keep only timestamps within the window
			valid := make([]time.Time, 0)
			for _, t := range timestamps {
				if now.Sub(t) < rl.window {
					valid = append(valid, t)
				}
			}
			if len(valid) == 0 {
				delete(rl.requests, ip)
			} else {
				rl.requests[ip] = valid
			}
		}
		rl.mu.Unlock()
	}
}

// allow checks if a request from the given IP should be allowed
func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	timestamps := rl.requests[ip]

	// Filter out old timestamps
	valid := make([]time.Time, 0)
	for _, t := range timestamps {
		if now.Sub(t) < rl.window {
			valid = append(valid, t)
		}
	}

	// Check if limit exceeded
	if len(valid) >= rl.limit {
		rl.requests[ip] = valid
		return false
	}

	// Add current request
	rl.requests[ip] = append(valid, now)
	return true
}

// remaining returns the number of requests remaining for the IP
func (rl *RateLimiter) remaining(ip string) int {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	now := time.Now()
	timestamps := rl.requests[ip]

	count := 0
	for _, t := range timestamps {
		if now.Sub(t) < rl.window {
			count++
		}
	}

	remaining := rl.limit - count
	if remaining < 0 {
		return 0
	}
	return remaining
}

// RateLimit returns a Gin middleware handler for rate limiting
func (rl *RateLimiter) RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip rate limiting for health checks
		if c.Request.URL.Path == "/health" {
			c.Next()
			return
		}

		ip := c.ClientIP()

		// Add rate limit headers
		c.Header("X-RateLimit-Limit", string(rune(rl.limit)))
		c.Header("X-RateLimit-Remaining", string(rune(rl.remaining(ip))))

		if !rl.allow(ip) {
			c.Header("Retry-After", "60")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// DefaultRateLimiter returns a rate limiter with sensible defaults
// 60 requests per minute
func DefaultRateLimiter() *RateLimiter {
	return NewRateLimiter(60, time.Minute)
}
