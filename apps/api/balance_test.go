package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidNimiqAddress(t *testing.T) {
	valid := normalizeNimiqAddress("NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C")
	if !validNimiqAddress(valid) {
		t.Fatalf("expected %q to be valid", valid)
	}
	// Flip one character: the checksum must reject it.
	broken := "NQ58" + valid[4:]
	if validNimiqAddress(broken) {
		t.Fatal("expected bad checksum to be rejected")
	}
	if validNimiqAddress("") || validNimiqAddress("NQ57") {
		t.Fatal("expected malformed addresses to be rejected")
	}
}

func TestHandleBalance(t *testing.T) {
	rpc := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":{"data":{"balance":123456789}}}`))
	}))
	defer rpc.Close()
	t.Setenv("NIMIQ_RPC_URL", rpc.URL)

	s := &server{tokens: signedToken{secret: []byte("test-secret")}}

	rec := httptest.NewRecorder()
	s.handleBalance(rec, httptest.NewRequest(http.MethodGet, "/balance?address=NQ57+7NBS+GKF1+R9B8+CHF1+0P92+67VG+02FF+AL5C", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	if got := rec.Body.String(); !strings.Contains(got, `"balanceLuna":123456789`) {
		t.Fatalf("unexpected body: %s", got)
	}

	bad := httptest.NewRecorder()
	s.handleBalance(bad, httptest.NewRequest(http.MethodGet, "/balance?address=nope", nil))
	if bad.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid address, got %d", bad.Code)
	}
}
