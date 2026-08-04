// Command api is NimWorld's login backend: verifies a Nimiq Hub signed
// message and issues a stateless, HMAC-signed session cookie. No database.
package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
)

const sessionCookieName = "nw_session"

type server struct {
	tokens       signedToken
	cookieSecure bool
	allowOrigin  string
	hub          *plazaHub
}

type challengeResponse struct {
	Nonce string `json:"nonce"`
	Token string `json:"token"`
}

type verifyRequest struct {
	Token           string `json:"token"`
	Nonce           string `json:"nonce"`
	Signer          string `json:"signer"`
	SignerPublicKey string `json:"signerPublicKey"` // base64
	Signature       string `json:"signature"`       // base64
}

type meResponse struct {
	Address string `json:"address"`
}

func main() {
	secret := os.Getenv("SESSION_SECRET")
	if secret == "" {
		log.Println("SESSION_SECRET not set, generating an ephemeral one (sessions won't survive a restart)")
		buf := make([]byte, 32)
		if _, err := rand.Read(buf); err != nil {
			log.Fatal(err)
		}
		secret = base64.RawURLEncoding.EncodeToString(buf)
	}

	s := &server{
		tokens:       signedToken{secret: []byte(secret)},
		cookieSecure: os.Getenv("COOKIE_INSECURE") == "",
		allowOrigin:  os.Getenv("ALLOW_ORIGIN"),
		hub:          newPlazaHub(),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/auth/challenge", s.withCORS(s.handleChallenge))
	mux.HandleFunc("/auth/verify", s.withCORS(s.handleVerify))
	mux.HandleFunc("/auth/me", s.withCORS(s.handleMe))
	mux.HandleFunc("/auth/logout", s.withCORS(s.handleLogout))
	mux.HandleFunc("/presence", s.withCORS(s.handlePresence))
	mux.HandleFunc("/balance", s.withCORS(s.handleBalance))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("nimworld api listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func (s *server) withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if s.allowOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", s.allowOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

// handleChallenge issues a nonce for the client to sign with Nimiq Hub. The
// nonce is embedded in a self-verifying token so we don't need to store it.
func (s *server) handleChallenge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	nonce, err := randomNonce()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, challengeResponse{
		Nonce: nonce,
		Token: s.tokens.sign(nonce, challengeTTL),
	})
}

// handleVerify checks the challenge token, verifies the Ed25519 signature
// over the nonce against the claimed public key, confirms the claimed
// address is actually derived from that public key, then sets the session
// cookie.
func (s *server) handleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req verifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	nonce, err := s.tokens.verify(req.Token)
	if err != nil || nonce != req.Nonce {
		http.Error(w, "invalid or expired challenge", http.StatusUnauthorized)
		return
	}

	pubKeyBytes, err := base64.StdEncoding.DecodeString(req.SignerPublicKey)
	if err != nil || len(pubKeyBytes) != ed25519.PublicKeySize {
		http.Error(w, "invalid public key", http.StatusBadRequest)
		return
	}
	sigBytes, err := base64.StdEncoding.DecodeString(req.Signature)
	if err != nil {
		http.Error(w, "invalid signature encoding", http.StatusBadRequest)
		return
	}

	if !verifyNimiqSignedMessage(pubKeyBytes, []byte(req.Nonce), sigBytes) {
		http.Error(w, "signature verification failed", http.StatusUnauthorized)
		return
	}

	derivedAddress, err := nimiqAddressFromPublicKey(pubKeyBytes)
	if err != nil || derivedAddress != normalizeNimiqAddress(req.Signer) {
		http.Error(w, "public key does not match claimed address", http.StatusUnauthorized)
		return
	}

	s.setSessionCookie(w, derivedAddress)
	writeJSON(w, http.StatusOK, meResponse{Address: derivedAddress})
}

func (s *server) handleMe(w http.ResponseWriter, r *http.Request) {
	address, ok := s.readSessionCookie(r)
	if !ok {
		http.Error(w, "not logged in", http.StatusUnauthorized)
		return
	}
	writeJSON(w, http.StatusOK, meResponse{Address: address})
}

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) setSessionCookie(w http.ResponseWriter, address string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    s.tokens.sign(address, sessionTTL),
		Path:     "/",
		MaxAge:   int(sessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   s.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (s *server) readSessionCookie(r *http.Request) (string, bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return "", false
	}
	address, err := s.tokens.verify(cookie.Value)
	if err != nil {
		return "", false
	}
	return address, true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
