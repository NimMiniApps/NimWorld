package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestPresenceRejectsUnauthenticated(t *testing.T) {
	s := newTestServer()
	ts := httptest.NewServer(s.mux())
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http") + "/presence"
	_, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err == nil {
		t.Fatal("expected dial to fail without session cookie")
	}
}

func TestPresenceTwoPeersSeeEachOther(t *testing.T) {
	s := newTestServer()
	ts := httptest.NewServer(s.mux())
	defer ts.Close()

	alice := dialPresence(t, ts, "NQ01 ALICE TEST ADDRESS 0000 0000 0000")
	defer alice.Close()
	bob := dialPresence(t, ts, "NQ02 BOB TEST ADDRESS 0000 0000 0000 00")
	defer bob.Close()

	mustWriteJSON(t, alice, map[string]any{"type": "join", "label": "@alice", "x": 100.0, "y": 200.0})
	// Alice joins alone — empty snapshot
	snap := mustReadPresence(t, alice)
	if snap["type"] != "snapshot" {
		t.Fatalf("alice expected snapshot, got %v", snap["type"])
	}
	peers, _ := snap["peers"].([]any)
	if len(peers) != 0 {
		t.Fatalf("alice expected empty snapshot, got %v", peers)
	}

	mustWriteJSON(t, bob, map[string]any{"type": "join", "label": "@bob", "x": 300.0, "y": 400.0})
	bobSnap := mustReadPresence(t, bob)
	if bobSnap["type"] != "snapshot" {
		t.Fatalf("bob expected snapshot, got %v", bobSnap["type"])
	}
	bobPeers, _ := bobSnap["peers"].([]any)
	if len(bobPeers) != 1 {
		t.Fatalf("bob expected 1 peer, got %v", bobPeers)
	}
	peer0 := bobPeers[0].(map[string]any)
	if peer0["label"] != "@alice" {
		t.Fatalf("bob expected alice, got %v", peer0)
	}

	aliceJoin := mustReadPresence(t, alice)
	if aliceJoin["type"] != "peer_join" {
		t.Fatalf("alice expected peer_join, got %v", aliceJoin["type"])
	}
	if aliceJoin["label"] != "@bob" {
		t.Fatalf("alice expected @bob join, got %v", aliceJoin)
	}

	mustWriteJSON(t, bob, map[string]any{"type": "move", "x": 310.0, "y": 410.0})
	aliceMove := mustReadPresence(t, alice)
	if aliceMove["type"] != "peer_move" {
		t.Fatalf("alice expected peer_move, got %v", aliceMove["type"])
	}
	if aliceMove["x"].(float64) != 310 || aliceMove["y"].(float64) != 410 {
		t.Fatalf("unexpected move payload: %v", aliceMove)
	}

	_ = bob.Close()
	aliceLeave := mustReadPresence(t, alice)
	if aliceLeave["type"] != "peer_leave" {
		t.Fatalf("alice expected peer_leave, got %v", aliceLeave["type"])
	}
}

func newTestServer() *server {
	s := &server{
		tokens:       signedToken{secret: []byte("test-secret")},
		cookieSecure: false,
		hub:          newPlazaHub(),
	}
	return s
}

func (s *server) mux() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/challenge", s.handleChallenge)
	mux.HandleFunc("/auth/verify", s.handleVerify)
	mux.HandleFunc("/auth/me", s.handleMe)
	mux.HandleFunc("/auth/logout", s.handleLogout)
	mux.HandleFunc("/presence", s.handlePresence)
	return mux
}

func dialPresence(t *testing.T, ts *httptest.Server, address string) *websocket.Conn {
	t.Helper()
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http") + "/presence"
	tok := signedToken{secret: []byte("test-secret")}.sign(address, sessionTTL)
	header := http.Header{}
	header.Add("Cookie", sessionCookieName+"="+tok)

	conn, resp, err := websocket.DefaultDialer.Dial(wsURL, header)
	if err != nil {
		t.Fatalf("dial presence: %v (status %v)", err, respStatus(resp))
	}
	return conn
}

func respStatus(resp *http.Response) int {
	if resp == nil {
		return 0
	}
	return resp.StatusCode
}

func mustWriteJSON(t *testing.T, c *websocket.Conn, v any) {
	t.Helper()
	c.SetWriteDeadline(time.Now().Add(2 * time.Second))
	if err := c.WriteJSON(v); err != nil {
		t.Fatalf("write json: %v", err)
	}
}

func mustReadPresence(t *testing.T, c *websocket.Conn) map[string]any {
	t.Helper()
	c.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, data, err := c.ReadMessage()
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	var msg map[string]any
	if err := json.Unmarshal(data, &msg); err != nil {
		t.Fatalf("unmarshal: %v %s", err, data)
	}
	return msg
}
