package main

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Token-bucket rate limiter keyed by client IP. The auth endpoints do ed25519
// work and /balance proxies an external RPC, so both are worth a cheap ceiling.
//
// ponytail: in-process and per-instance. Behind more than one API instance the
// effective limit multiplies by the instance count — move to a shared store
// (Redis) only when we actually run more than one.
type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	// burst tokens, refilled at rate per second.
	burst float64
	rate  float64
}

type bucket struct {
	tokens float64
	seen   time.Time
}

func newRateLimiter(burst, perSecond float64) *rateLimiter {
	return &rateLimiter{buckets: make(map[string]*bucket), burst: burst, rate: perSecond}
}

// allow reports whether the key may act now, spending one token if so.
func (l *rateLimiter) allow(key string) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()

	b, ok := l.buckets[key]
	if !ok {
		// A fresh key gets a full bucket, minus this request.
		l.buckets[key] = &bucket{tokens: l.burst - 1, seen: now}
		l.sweepLocked(now)
		return true
	}

	b.tokens = min(l.burst, b.tokens+now.Sub(b.seen).Seconds()*l.rate)
	b.seen = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// sweepLocked drops buckets that have been idle long enough to have refilled
// anyway, so the map cannot grow without bound.
func (l *rateLimiter) sweepLocked(now time.Time) {
	idle := time.Duration(float64(time.Second) * l.burst / l.rate * 2)
	for key, b := range l.buckets {
		if now.Sub(b.seen) > idle {
			delete(l.buckets, key)
		}
	}
}

// limit wraps a handler, answering 429 once a client outruns the bucket.
func (l *rateLimiter) limit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !l.allow(clientIP(r)) {
			w.Header().Set("Retry-After", "1")
			http.Error(w, "too many requests", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}

// clientIP prefers the first X-Forwarded-For hop when the API runs behind a
// proxy, and falls back to the socket address.
func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		first, _, _ := strings.Cut(fwd, ",")
		return strings.TrimSpace(first)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
