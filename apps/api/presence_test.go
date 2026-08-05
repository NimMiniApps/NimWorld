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

func TestPresenceRemembersRecentlyActive(t *testing.T) {
	s := newTestServer()
	ts := httptest.NewServer(s.mux())
	defer ts.Close()

	alice := dialPresence(t, ts, "NQ01 ALICE TEST ADDRESS 0000 0000 0000")
	defer alice.Close()
	bob := dialPresence(t, ts, "NQ02 BOB TEST ADDRESS 0000 0000 0000 00")

	mustWriteJSON(t, alice, map[string]any{"type": "join", "label": "@alice", "x": 100.0, "y": 200.0})
	mustReadPresence(t, alice) // own snapshot
	mustWriteJSON(t, bob, map[string]any{"type": "join", "label": "@bob", "x": 300.0, "y": 400.0})
	mustReadPresence(t, bob)   // own snapshot
	mustReadPresence(t, alice) // bob's peer_join

	mustWriteJSON(t, bob, map[string]any{"type": "activity", "app": "NimBomber"})
	act := mustReadPresence(t, alice)
	if act["type"] != "peer_activity" || act["app"] != "NimBomber" {
		t.Fatalf("alice expected peer_activity for NimBomber, got %v", act)
	}

	_ = bob.Close()
	leave := mustReadPresence(t, alice)
	if leave["type"] != "peer_leave" || leave["app"] != "NimBomber" {
		t.Fatalf("alice expected peer_leave carrying the app, got %v", leave)
	}

	carol := dialPresence(t, ts, "NQ03 CAROL TEST ADDRESS 0000 0000 000")
	defer carol.Close()
	mustWriteJSON(t, carol, map[string]any{"type": "join", "label": "@carol", "x": 10.0, "y": 20.0})
	snap := mustReadPresence(t, carol)
	recent, _ := snap["recent"].([]any)
	if len(recent) != 1 {
		t.Fatalf("carol expected 1 recent peer (alice is online), got %v", snap["recent"])
	}
	entry := recent[0].(map[string]any)
	if entry["label"] != "@bob" || entry["app"] != "NimBomber" {
		t.Fatalf("unexpected recent entry: %v", entry)
	}
	if ago, ok := entry["seenAgoMs"].(float64); !ok || ago < 0 {
		t.Fatalf("expected seenAgoMs, got %v", entry["seenAgoMs"])
	}

	// Rejoining clears the ghost.
	bob2 := dialPresence(t, ts, "NQ02 BOB TEST ADDRESS 0000 0000 0000 00")
	defer bob2.Close()
	mustWriteJSON(t, bob2, map[string]any{"type": "join", "label": "@bob", "x": 300.0, "y": 400.0})
	mustReadPresence(t, bob2)
	if got := len(s.hub.recent); got != 0 {
		t.Fatalf("expected bob dropped from recent on rejoin, %d left", got)
	}
}

func newTestServer() *server {
	s := &server{
		tokens:       signedToken{secret: []byte("test-secret")},
		cookieSecure: false,
		hub:          newPlazaHub(),
		events:       newEventStore(),
		appKeys:      map[string]string{"nimbomber": "app-secret"},
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
	mux.HandleFunc("/events", s.handleEvents)
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
