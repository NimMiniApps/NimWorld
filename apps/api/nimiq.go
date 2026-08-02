package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base32"
	"errors"
	"strconv"
	"strings"

	"golang.org/x/crypto/blake2b"
)

// Matches nimiq-core-js BufferUtils.BASE32_ALPHABET.NIMIQ.
const nimiqBase32Alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVXY"

var nimiqBase32 = base32.NewEncoding(nimiqBase32Alphabet).WithPadding(base32.NoPadding)

// signMessagePrefix matches Nimiq Keyguard's SignMessagePrefix.SIGNED_MESSAGE.
const signMessagePrefix = "\x16Nimiq Signed Message:\n"

// nimiqAddressFromPublicKey reproduces PublicKey.toAddress(): Blake2b-256 the
// raw 32-byte Ed25519 public key, keep the first 20 bytes, base32-encode with
// the Nimiq alphabet, prefix with "NQ" + an ISO 7064 mod-97-10 check digit.
func nimiqAddressFromPublicKey(pub ed25519.PublicKey) (string, error) {
	if len(pub) != ed25519.PublicKeySize {
		return "", errors.New("invalid public key size")
	}
	hash := blake2b.Sum256(pub)
	raw := hash[:20]
	base32Str := nimiqBase32.EncodeToString(raw)
	check := ibanMod97(base32Str + "NQ00")
	return "NQ" + zeroPad2(98-check) + base32Str, nil
}

// normalizeNimiqAddress strips the display spaces Hub/Keyguard add every 4 chars.
func normalizeNimiqAddress(address string) string {
	return strings.ToUpper(strings.ReplaceAll(address, " ", ""))
}

// ibanMod97 implements ISO 7064 MOD 97-10 (the IBAN checksum algorithm Nimiq
// reuses), processing one character at a time so it never overflows.
func ibanMod97(s string) int {
	rem := 0
	for _, c := range strings.ToUpper(s) {
		switch {
		case c >= '0' && c <= '9':
			rem = (rem*10 + int(c-'0')) % 97
		case c >= 'A' && c <= 'Z':
			n := int(c-'A') + 10
			rem = (rem*10 + n/10) % 97
			rem = (rem*10 + n%10) % 97
		}
	}
	return rem
}

func zeroPad2(n int) string {
	s := strconv.Itoa(n)
	if len(s) >= 2 {
		return s
	}
	return "0" + s
}

// verifyNimiqSignedMessage reproduces Key.signMessage's verification side:
// hash = SHA256(prefix + len(message) + message), then Ed25519-verify.
func verifyNimiqSignedMessage(pub ed25519.PublicKey, message, signature []byte) bool {
	if len(pub) != ed25519.PublicKeySize || len(signature) != ed25519.SignatureSize {
		return false
	}
	lengthStr := strconv.Itoa(len(message))
	data := make([]byte, 0, len(signMessagePrefix)+len(lengthStr)+len(message))
	data = append(data, signMessagePrefix...)
	data = append(data, lengthStr...)
	data = append(data, message...)
	hash := sha256.Sum256(data)
	return ed25519.Verify(pub, hash[:], signature)
}
