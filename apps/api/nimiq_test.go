package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"strconv"
	"testing"
)

// Ground truth from the Nimiq network: the all-zero-byte address is the
// well-known "burn" address NQ07 0000 0000 0000 0000 0000 0000 0000 0000.
// This pins down the base32 alphabet + IBAN checksum independent of blake2b.
func TestIbanChecksumMatchesKnownBurnAddress(t *testing.T) {
	zero20 := make([]byte, 20)
	base32Str := nimiqBase32.EncodeToString(zero20)
	check := ibanMod97(base32Str + "NQ00")
	got := "NQ" + zeroPad2(98-check) + base32Str
	want := "NQ0700000000000000000000000000000000"
	if got != want {
		t.Fatalf("got %s, want %s", got, want)
	}
}

func TestNimiqAddressFromPublicKeyAndSignatureRoundTrip(t *testing.T) {
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	address, err := nimiqAddressFromPublicKey(pub)
	if err != nil {
		t.Fatal(err)
	}
	if len(address) != 36 || address[:2] != "NQ" {
		t.Fatalf("unexpected address shape: %s", address)
	}

	message := []byte("nimworld-login-nonce")
	lengthStr := strconv.Itoa(len(message))
	data := append([]byte(signMessagePrefix), lengthStr...)
	data = append(data, message...)
	hash := sha256.Sum256(data)
	sig := ed25519.Sign(priv, hash[:])

	if !verifyNimiqSignedMessage(pub, message, sig) {
		t.Fatal("expected signature to verify")
	}

	otherPub, _, _ := ed25519.GenerateKey(nil)
	if verifyNimiqSignedMessage(otherPub, message, sig) {
		t.Fatal("expected signature to fail against a different key")
	}
	if verifyNimiqSignedMessage(pub, []byte("tampered"), sig) {
		t.Fatal("expected signature to fail against a different message")
	}
}

func TestNormalizeNimiqAddressStripsSpacesAndUppercases(t *testing.T) {
	got := normalizeNimiqAddress("nq07 0000 0000 0000 0000 0000 0000 0000 0000")
	want := "NQ0700000000000000000000000000000000"
	if got != want {
		t.Fatalf("got %s, want %s", got, want)
	}
}
