package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"
)

// Our mainnet Albatross RPC; override with NIMIQ_RPC_URL for testnet or a local node.
const defaultNimiqRPCURL = "https://rpc-mainnet.nimiqscan.com/"

var rpcClient = &http.Client{Timeout: 6 * time.Second}

type balanceResponse struct {
	Address     string `json:"address"`
	BalanceLuna int64  `json:"balanceLuna"`
}

// handleBalance reads a NIM balance from the Nimiq RPC. Without an ?address=
// it falls back to the logged-in session address. The strict checksum check
// keeps this from becoming a generic proxy for arbitrary RPC input.
func (s *server) handleBalance(w http.ResponseWriter, r *http.Request) {
	address := normalizeNimiqAddress(r.URL.Query().Get("address"))
	if address == "" {
		if sessionAddress, ok := s.readSessionCookie(r); ok {
			address = sessionAddress
		}
	}
	if !validNimiqAddress(address) {
		http.Error(w, "invalid nimiq address", http.StatusBadRequest)
		return
	}

	luna, err := fetchBalanceLuna(address)
	if err != nil {
		http.Error(w, "balance lookup failed", http.StatusBadGateway)
		return
	}
	writeJSON(w, http.StatusOK, balanceResponse{Address: address, BalanceLuna: luna})
}

// validNimiqAddress checks the "NQ" + ISO 7064 mod-97-10 checksum structure.
func validNimiqAddress(address string) bool {
	if len(address) != 36 || !strings.HasPrefix(address, "NQ") {
		return false
	}
	for _, c := range address[2:] {
		if !strings.ContainsRune(nimiqBase32Alphabet, c) && (c < '0' || c > '9') {
			return false
		}
	}
	return ibanMod97(address[4:]+address[:4]) == 1
}

func fetchBalanceLuna(address string) (int64, error) {
	url := os.Getenv("NIMIQ_RPC_URL")
	if url == "" {
		url = defaultNimiqRPCURL
	}
	body, err := json.Marshal(map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "getAccountByAddress",
		"params":  []string{address},
	})
	if err != nil {
		return 0, err
	}
	res, err := rpcClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()

	var parsed struct {
		Result struct {
			// Albatross wraps payloads in {data, metadata}; older nodes don't.
			Data struct {
				Balance int64 `json:"balance"`
			} `json:"data"`
			Balance int64 `json:"balance"`
		} `json:"result"`
	}
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		return 0, err
	}
	if parsed.Result.Data.Balance > 0 {
		return parsed.Result.Data.Balance, nil
	}
	return parsed.Result.Balance, nil
}
