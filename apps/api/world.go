package main

import (
	"net/http"
	"os"
)

// The tip jar is the one piece of world config that must be changeable without
// rebuilding the client, so it is the only thing here. Add a field when
// something else genuinely needs to change at runtime, not before.
const fallbackTipAddress = "NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C"

type worldResponse struct {
	Version    int    `json:"version"`
	TipAddress string `json:"tipAddress"`
}

func (s *server) handleWorld(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, worldResponse{Version: 1, TipAddress: s.tipAddress})
}

func configuredTipAddress() string {
	if addr := normalizeNimiqAddress(os.Getenv("TIP_ADDRESS")); validNimiqAddress(addr) {
		return addr
	}
	// Normalized either way, so /world always answers in one form.
	return normalizeNimiqAddress(fallbackTipAddress)
}
