package main

import (
	"testing"
	"time"
)

func TestSignedTokenRoundTrip(t *testing.T) {
	tokens := signedToken{secret: []byte("test-secret")}
	token := tokens.sign("hello", time.Minute)

	payload, err := tokens.verify(token)
	if err != nil {
		t.Fatal(err)
	}
	if payload != "hello" {
		t.Fatalf("got %q, want %q", payload, "hello")
	}
}

func TestSignedTokenRejectsTamperedPayload(t *testing.T) {
	tokens := signedToken{secret: []byte("test-secret")}
	token := tokens.sign("hello", time.Minute)
	tampered := "goodbye" + token[len("hello"):]

	if _, err := tokens.verify(tampered); err == nil {
		t.Fatal("expected tampered token to be rejected")
	}
}

func TestSignedTokenRejectsExpired(t *testing.T) {
	tokens := signedToken{secret: []byte("test-secret")}
	token := tokens.sign("hello", -time.Minute)

	if _, err := tokens.verify(token); err == nil {
		t.Fatal("expected expired token to be rejected")
	}
}

func TestSignedTokenRejectsWrongSecret(t *testing.T) {
	token := signedToken{secret: []byte("secret-a")}.sign("hello", time.Minute)

	if _, err := (signedToken{secret: []byte("secret-b")}).verify(token); err == nil {
		t.Fatal("expected token signed with a different secret to be rejected")
	}
}
