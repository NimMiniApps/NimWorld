package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const (
	challengeTTL = 5 * time.Minute
	sessionTTL   = 30 * 24 * time.Hour
)

var errInvalidToken = errors.New("invalid token")

// signedToken is a small self-verifying "payload|expiry|mac" format used for
// both the login challenge and the session cookie, so neither needs server
// side storage.
type signedToken struct {
	secret []byte
}

func (t signedToken) sign(payload string, ttl time.Duration) string {
	exp := time.Now().Add(ttl).Unix()
	body := fmt.Sprintf("%s|%d", payload, exp)
	mac := t.mac(body)
	return body + "|" + mac
}

func (t signedToken) verify(token string) (string, error) {
	parts := strings.SplitN(token, "|", 3)
	if len(parts) != 3 {
		return "", errInvalidToken
	}
	payload, expStr, mac := parts[0], parts[1], parts[2]
	body := payload + "|" + expStr
	if subtle.ConstantTimeCompare([]byte(mac), []byte(t.mac(body))) != 1 {
		return "", errInvalidToken
	}
	exp, err := strconv.ParseInt(expStr, 10, 64)
	if err != nil {
		return "", errInvalidToken
	}
	if time.Now().Unix() > exp {
		return "", errors.New("token expired")
	}
	return payload, nil
}

func (t signedToken) mac(body string) string {
	h := hmac.New(sha256.New, t.secret)
	h.Write([]byte(body))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

func randomNonce() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
