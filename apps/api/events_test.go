package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

const testEventAddress = "NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C"

func signedEventRequest(t *testing.T, appID, secret, body string) *http.Request {
	t.Helper()
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(body))
	req := httptest.NewRequest(http.MethodPost, "/events", bytes.NewBufferString(body))
	req.Header.Set("X-App-Id", appID)
	req.Header.Set("X-App-Signature", hex.EncodeToString(mac.Sum(nil)))
	return req
}

func eventBody(ts int64) string {
	return fmt.Sprintf(`{"address":%q,"type":"score.posted","ts":%d,"data":{"score":42}}`,
		testEventAddress, ts)
}

func TestEventWriteAcceptsSignedEvent(t *testing.T) {
	s := newTestServer()
	rec := httptest.NewRecorder()
	s.handleEvents(rec, signedEventRequest(t, "nimbomber", "app-secret", eventBody(time.Now().Unix())))
	if rec.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d %s", rec.Code, rec.Body)
	}

	stored := s.events.forAddress(normalizeNimiqAddress(testEventAddress), 10)
	if len(stored) != 1 || stored[0].AppID != "nimbomber" || stored[0].Type != "score.posted" {
		t.Fatalf("unexpected stored events: %+v", stored)
	}
}

func TestEventWriteRejectsBadInput(t *testing.T) {
	now := time.Now().Unix()
	cases := []struct {
		name       string
		req        func(t *testing.T) *http.Request
		wantStatus int
	}{
		{"unknown app", func(t *testing.T) *http.Request {
			return signedEventRequest(t, "ghostapp", "app-secret", eventBody(now))
		}, http.StatusUnauthorized},
		{"wrong secret", func(t *testing.T) *http.Request {
			return signedEventRequest(t, "nimbomber", "not-the-secret", eventBody(now))
		}, http.StatusUnauthorized},
		{"tampered body", func(t *testing.T) *http.Request {
			req := signedEventRequest(t, "nimbomber", "app-secret", eventBody(now))
			req.Body = httptest.NewRequest(http.MethodPost, "/events",
				bytes.NewBufferString(eventBody(now)+" ")).Body
			return req
		}, http.StatusUnauthorized},
		{"stale ts", func(t *testing.T) *http.Request {
			return signedEventRequest(t, "nimbomber", "app-secret",
				eventBody(time.Now().Add(-time.Hour).Unix()))
		}, http.StatusBadRequest},
		{"bad address", func(t *testing.T) *http.Request {
			return signedEventRequest(t, "nimbomber", "app-secret",
				fmt.Sprintf(`{"address":"NQ00 NOPE","type":"x","ts":%d}`, now))
		}, http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := newTestServer()
			rec := httptest.NewRecorder()
			s.handleEvents(rec, tc.req(t))
			if rec.Code != tc.wantStatus {
				t.Fatalf("expected %d, got %d %s", tc.wantStatus, rec.Code, rec.Body)
			}
			if len(s.events.forAddress(normalizeNimiqAddress(testEventAddress), 10)) != 0 {
				t.Fatal("rejected event must not be stored")
			}
		})
	}
}

// The browser holds no app secret, so a session alone can never write.
func TestEventWriteIgnoresSessionCookie(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodPost, "/events",
		bytes.NewBufferString(eventBody(time.Now().Unix())))
	req.AddCookie(&http.Cookie{
		Name:  sessionCookieName,
		Value: s.tokens.sign(normalizeNimiqAddress(testEventAddress), sessionTTL),
	})
	rec := httptest.NewRecorder()
	s.handleEvents(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without an app signature, got %d", rec.Code)
	}
}

func TestEventFeedShowsOnlyPublicEvents(t *testing.T) {
	s := newTestServer()
	address := normalizeNimiqAddress(testEventAddress)

	body := fmt.Sprintf(`{"address":%q,"type":"score.posted","ts":%d,"public":true,"text":"scored 4,200"}`,
		testEventAddress, time.Now().Unix())
	rec := httptest.NewRecorder()
	s.handleEvents(rec, signedEventRequest(t, "nimbomber", "app-secret", body))
	if rec.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d %s", rec.Code, rec.Body)
	}
	// A private event from the same app must stay out of the feed.
	rec = httptest.NewRecorder()
	s.handleEvents(rec, signedEventRequest(t, "nimbomber", "app-secret", eventBody(time.Now().Unix())))
	if rec.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d %s", rec.Code, rec.Body)
	}

	rec = httptest.NewRecorder()
	s.handleEventFeed(rec, httptest.NewRequest(http.MethodGet, "/events/feed", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("feed without a session should 401, got %d", rec.Code)
	}

	req := httptest.NewRequest(http.MethodGet, "/events/feed", nil)
	req.AddCookie(&http.Cookie{Name: sessionCookieName, Value: s.tokens.sign(address, sessionTTL)})
	rec = httptest.NewRecorder()
	s.handleEventFeed(rec, req)
	var feed struct{ Events []appEvent }
	if err := json.NewDecoder(rec.Body).Decode(&feed); err != nil {
		t.Fatal(err)
	}
	if len(feed.Events) != 1 || feed.Events[0].Text != "scored 4,200" {
		t.Fatalf("expected only the public event, got %+v", feed.Events)
	}
}

func TestPublicEventNeedsText(t *testing.T) {
	s := newTestServer()
	body := fmt.Sprintf(`{"address":%q,"type":"score.posted","ts":%d,"public":true}`,
		testEventAddress, time.Now().Unix())
	rec := httptest.NewRecorder()
	s.handleEvents(rec, signedEventRequest(t, "nimbomber", "app-secret", body))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for a public event with no text, got %d", rec.Code)
	}
}

func TestEventReadIsSessionScoped(t *testing.T) {
	s := newTestServer()
	address := normalizeNimiqAddress(testEventAddress)
	s.events.append(appEvent{AppID: "nimbomber", Address: address, Type: "score.posted"})
	s.events.append(appEvent{AppID: "nimbomber", Address: "NQ99 SOMEONE ELSE", Type: "score.posted"})

	rec := httptest.NewRecorder()
	s.handleEvents(rec, httptest.NewRequest(http.MethodGet, "/events", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without a session, got %d", rec.Code)
	}

	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.AddCookie(&http.Cookie{Name: sessionCookieName, Value: s.tokens.sign(address, sessionTTL)})
	rec = httptest.NewRecorder()
	s.handleEvents(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var body struct{ Events []appEvent }
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if len(body.Events) != 1 || body.Events[0].Address != address {
		t.Fatalf("expected only own events, got %+v", body.Events)
	}
}
