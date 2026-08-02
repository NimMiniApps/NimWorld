package main

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strconv"
	"testing"
)

func TestLoginFlowEndToEnd(t *testing.T) {
	s := &server{tokens: signedToken{secret: []byte("test-secret")}, cookieSecure: false}
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/challenge", s.handleChallenge)
	mux.HandleFunc("/auth/verify", s.handleVerify)
	mux.HandleFunc("/auth/me", s.handleMe)
	mux.HandleFunc("/auth/logout", s.handleLogout)
	ts := httptest.NewServer(mux)
	defer ts.Close()

	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar}

	// me: not logged in yet
	if resp, _ := client.Get(ts.URL + "/auth/me"); resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 before login, got %d", resp.StatusCode)
	}

	// challenge
	var ch challengeResponse
	resp, err := client.Post(ts.URL+"/auth/challenge", "application/json", nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.NewDecoder(resp.Body).Decode(&ch); err != nil {
		t.Fatal(err)
	}

	// sign the nonce like Nimiq Hub/Keyguard would
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	message := []byte(ch.Nonce)
	lengthStr := strconv.Itoa(len(message))
	data := append([]byte(signMessagePrefix), lengthStr...)
	data = append(data, message...)
	hash := sha256.Sum256(data)
	sig := ed25519.Sign(priv, hash[:])
	wantAddress, err := nimiqAddressFromPublicKey(pub)
	if err != nil {
		t.Fatal(err)
	}

	verifyBody, _ := json.Marshal(verifyRequest{
		Token:           ch.Token,
		Nonce:           ch.Nonce,
		Signer:          wantAddress,
		SignerPublicKey: base64.StdEncoding.EncodeToString(pub),
		Signature:       base64.StdEncoding.EncodeToString(sig),
	})
	resp, err = client.Post(ts.URL+"/auth/verify", "application/json", bytes.NewReader(verifyBody))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("verify failed: %d", resp.StatusCode)
	}
	var verified meResponse
	json.NewDecoder(resp.Body).Decode(&verified)
	if verified.Address != wantAddress {
		t.Fatalf("got address %s, want %s", verified.Address, wantAddress)
	}

	// me: now logged in, cookie carried by the client jar
	resp, err = client.Get(ts.URL + "/auth/me")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 after login, got %d", resp.StatusCode)
	}
	var me meResponse
	json.NewDecoder(resp.Body).Decode(&me)
	if me.Address != wantAddress {
		t.Fatalf("got address %s, want %s", me.Address, wantAddress)
	}

	// logout clears the session
	if resp, _ := client.Post(ts.URL+"/auth/logout", "application/json", nil); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("expected 204 on logout, got %d", resp.StatusCode)
	}
	if resp, _ := client.Get(ts.URL + "/auth/me"); resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 after logout, got %d", resp.StatusCode)
	}
}

func TestVerifyRejectsWrongSigner(t *testing.T) {
	s := &server{tokens: signedToken{secret: []byte("test-secret")}, cookieSecure: false}
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/challenge", s.handleChallenge)
	mux.HandleFunc("/auth/verify", s.handleVerify)
	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := ts.Client()
	resp, _ := client.Post(ts.URL+"/auth/challenge", "application/json", nil)
	var ch challengeResponse
	json.NewDecoder(resp.Body).Decode(&ch)

	pub, priv, _ := ed25519.GenerateKey(nil)
	message := []byte(ch.Nonce)
	lengthStr := strconv.Itoa(len(message))
	data := append([]byte(signMessagePrefix), lengthStr...)
	data = append(data, message...)
	hash := sha256.Sum256(data)
	sig := ed25519.Sign(priv, hash[:])

	verifyBody, _ := json.Marshal(verifyRequest{
		Token:           ch.Token,
		Nonce:           ch.Nonce,
		Signer:          "NQ07 0000 0000 0000 0000 0000 0000 0000 0000", // wrong address for this key
		SignerPublicKey: base64.StdEncoding.EncodeToString(pub),
		Signature:       base64.StdEncoding.EncodeToString(sig),
	})
	resp, _ = client.Post(ts.URL+"/auth/verify", "application/json", bytes.NewReader(verifyBody))
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401 for mismatched signer, got %d", resp.StatusCode)
	}
}
