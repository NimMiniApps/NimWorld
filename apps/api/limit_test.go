package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRateLimiterSpendsAndRefuses(t *testing.T) {
	// 2 tokens, refilling slowly enough that the test never sees a refill.
	l := newRateLimiter(2, 0.001)
	if !l.allow("a") || !l.allow("a") {
		t.Fatal("first two requests should be allowed")
	}
	if l.allow("a") {
		t.Fatal("third request should be refused")
	}
	// Buckets are per key.
	if !l.allow("b") {
		t.Fatal("a different client should have its own bucket")
	}
}

func TestLimitMiddlewareAnswers429(t *testing.T) {
	l := newRateLimiter(1, 0.001)
	handler := l.limit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	first := httptest.NewRecorder()
	handler(first, httptest.NewRequest(http.MethodGet, "/", nil))
	if first.Code != http.StatusOK {
		t.Fatalf("first call: got %d, want 200", first.Code)
	}

	second := httptest.NewRecorder()
	handler(second, httptest.NewRequest(http.MethodGet, "/", nil))
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("second call: got %d, want 429", second.Code)
	}
}

// A spoofed X-Forwarded-For must not buy a fresh bucket: without a trusted
// proxy in front, one attacker would otherwise have unlimited attempts.
func TestSpoofedForwardedForCannotBypassTheLimit(t *testing.T) {
	l := newRateLimiter(1, 0.001)
	l.trustProxy = false
	handler := l.limit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	request := func(forwarded string) int {
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.RemoteAddr = "198.51.100.4:5555"
		r.Header.Set("X-Forwarded-For", forwarded)
		rec := httptest.NewRecorder()
		handler(rec, r)
		return rec.Code
	}

	if code := request("203.0.113.1"); code != http.StatusOK {
		t.Fatalf("first call: got %d, want 200", code)
	}
	if code := request("203.0.113.2"); code != http.StatusTooManyRequests {
		t.Fatalf("spoofed second call: got %d, want 429", code)
	}
}

func TestClientKeyUsesForwardedHopOnlyWhenTrusted(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.RemoteAddr = "10.0.0.9:5555"
	r.Header.Set("X-Forwarded-For", " 203.0.113.7 , 10.0.0.1")

	trusting := newRateLimiter(1, 1)
	trusting.trustProxy = true
	if got := trusting.clientKey(r); got != "203.0.113.7" {
		t.Fatalf("trusted proxy: got %q, want the first forwarded hop", got)
	}

	plain := newRateLimiter(1, 1)
	plain.trustProxy = false
	if got := plain.clientKey(r); got != "10.0.0.9" {
		t.Fatalf("untrusted: got %q, want the socket host", got)
	}
}

func TestNewRateLimiterReadsProxyTrustFromEnv(t *testing.T) {
	if newRateLimiter(1, 1).trustProxy {
		t.Fatal("proxy headers must not be trusted by default")
	}
	t.Setenv("TRUST_PROXY_HEADERS", "1")
	if !newRateLimiter(1, 1).trustProxy {
		t.Fatal("TRUST_PROXY_HEADERS should opt in")
	}
}

// A cross-site page must not be able to open an authenticated plaza socket.
func TestCheckOriginRejectsForeignOrigins(t *testing.T) {
	s := &server{allowOrigin: "https://nimworld.example"}

	cases := []struct {
		origin string
		want   bool
	}{
		{"", true},                         // non-browser client
		{"https://nimworld.example", true}, // configured origin
		{"http://api.local", true},         // same host as the request
		{"https://evil.example", false},    // the one that matters
		{"https://nimworld.example.co", false},
	}
	for _, tc := range cases {
		r := httptest.NewRequest(http.MethodGet, "http://api.local/presence", nil)
		if tc.origin != "" {
			r.Header.Set("Origin", tc.origin)
		}
		if got := s.checkOrigin(r); got != tc.want {
			t.Fatalf("origin %q: got %v, want %v", tc.origin, got, tc.want)
		}
	}
}
