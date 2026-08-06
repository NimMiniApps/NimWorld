package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
	"unicode"
)

// Signed app events: the only trusted write path into NimWorld. A Mini App's
// server posts an event signed with its shared secret; the browser never has
// the secret, so a client cannot award itself anything. Reads are
// session-scoped — you only ever see your own events.
//
// ponytail: in-memory ring, no database. Events are a liveness signal today
// (Phase 4 turns them into achievements/inventory); swap the store for a real
// one when they must survive a restart.
const (
	eventMaxBodyBytes = 8 << 10
	eventMaxSkew      = 5 * time.Minute
	eventRingSize     = 500
	eventReadMax      = 50
	eventFeedMax      = 25
	eventTextMax      = 120
)

type appEvent struct {
	AppID   string          `json:"appId"`
	Address string          `json:"address"`
	Type    string          `json:"type"`
	Data    json.RawMessage `json:"data,omitempty"`
	TS      int64           `json:"ts"`
	// Public events appear in the plaza activity feed, which every logged-in
	// visitor can read. Private by default: an app opts a line in, and says
	// in Text exactly what the plaza may show ("scored 4,200").
	Public bool   `json:"public,omitempty"`
	Text   string `json:"text,omitempty"`
}

type eventStore struct {
	mu   sync.Mutex
	ring []appEvent
	next int
}

func newEventStore() *eventStore {
	return &eventStore{ring: make([]appEvent, eventRingSize)}
}

func (s *eventStore) append(e appEvent) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ring[s.next] = e
	s.next = (s.next + 1) % len(s.ring)
}

// forAddress returns that address's events, newest first.
func (s *eventStore) forAddress(address string, limit int) []appEvent {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]appEvent, 0, limit)
	for i := 1; i <= len(s.ring) && len(out) < limit; i++ {
		e := s.ring[(s.next-i+len(s.ring))%len(s.ring)]
		if e.Address == address {
			out = append(out, e)
		}
	}
	return out
}

// feedEntry is everything the plaza may see of someone else's event. Data
// never appears here: apps are told the payload is theirs, so publishing one
// line must not publish whatever internal state rode along with it.
type feedEntry struct {
	AppID   string `json:"appId"`
	Address string `json:"address"`
	Text    string `json:"text"`
	TS      int64  `json:"ts"`
}

// publicFeed returns the newest public events across all apps and players.
func (s *eventStore) publicFeed(limit int) []feedEntry {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]feedEntry, 0, limit)
	for i := 1; i <= len(s.ring) && len(out) < limit; i++ {
		e := s.ring[(s.next-i+len(s.ring))%len(s.ring)]
		if e.Public && e.Address != "" {
			out = append(out, feedEntry{
				AppID: e.AppID, Address: e.Address, Text: e.Text, TS: e.TS,
			})
		}
	}
	return out
}

// appKeys reads APP_KEYS="nimbomber:secret1,otherapp:secret2". Absent means no
// app can write — a missing config must not open the door.
func appKeys() map[string]string {
	keys := make(map[string]string)
	for _, pair := range strings.Split(os.Getenv("APP_KEYS"), ",") {
		id, secret, ok := strings.Cut(strings.TrimSpace(pair), ":")
		if !ok || id == "" || secret == "" {
			continue
		}
		keys[id] = secret
	}
	return keys
}

func (s *server) handleEvents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.handleEventWrite(w, r)
	case http.MethodGet:
		s.handleEventRead(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// sanitizeEventText bounds what an app can put on a plaza row. The feed shows
// this text beside a player's name, so a hostile app key would otherwise be
// able to put words in someone else's mouth: line breaks that fake a second
// row, or bidi overrides that reorder the rendered line. Truncation counts
// runes — slicing bytes can cut a character in half.
func sanitizeEventText(text string) string {
	cleaned := strings.Map(func(r rune) rune {
		switch {
		case r == '\n' || r == '\r' || r == '\t':
			return ' '
		case unicode.IsControl(r):
			return -1
		// Bidi overrides / isolates, and the zero-width joiners used to
		// disguise text as something it is not.
		case r >= 0x202A && r <= 0x202E, r >= 0x2066 && r <= 0x2069,
			r == 0x200E, r == 0x200F, r == 0x200B, r == 0xFEFF:
			return -1
		}
		return r
	}, text)

	cleaned = strings.Join(strings.Fields(cleaned), " ")
	runes := []rune(cleaned)
	if len(runes) > eventTextMax {
		cleaned = string(runes[:eventTextMax])
	}
	return cleaned
}

func (s *server) handleEventWrite(w http.ResponseWriter, r *http.Request) {
	appID := r.Header.Get("X-App-Id")
	secret, known := s.appKeys[appID]
	if !known {
		http.Error(w, "unknown app", http.StatusUnauthorized)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, eventMaxBodyBytes+1))
	if err != nil || len(body) > eventMaxBodyBytes {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	want := hmac.New(sha256.New, []byte(secret))
	want.Write(body)
	got, err := hex.DecodeString(r.Header.Get("X-App-Signature"))
	if err != nil || !hmac.Equal(got, want.Sum(nil)) {
		http.Error(w, "bad signature", http.StatusUnauthorized)
		return
	}

	var e appEvent
	if err := json.Unmarshal(body, &e); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	e.Address = normalizeNimiqAddress(e.Address)
	if !validNimiqAddress(e.Address) || e.Type == "" {
		http.Error(w, "address and type are required", http.StatusBadRequest)
		return
	}
	e.Text = sanitizeEventText(e.Text)
	// A public line with nothing to say would render as a blank row.
	if e.Public && e.Text == "" {
		http.Error(w, "public events need text", http.StatusBadRequest)
		return
	}
	// A signature is replayable forever without a freshness bound.
	now := time.Now()
	ts := time.Unix(e.TS, 0)
	if e.TS == 0 || ts.Before(now.Add(-eventMaxSkew)) || ts.After(now.Add(eventMaxSkew)) {
		http.Error(w, "stale or missing ts", http.StatusBadRequest)
		return
	}
	// The signing app owns the appId; a body claiming another app's id is
	// exactly the confusion this header prevents.
	e.AppID = appID

	s.events.append(e)
	w.WriteHeader(http.StatusAccepted)
}

// handleEventFeed serves the plaza's cross-app activity. Session-gated: the
// plaza is a logged-in space, and this is the one endpoint that hands one
// player's activity to another.
func (s *server) handleEventFeed(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.readSessionCookie(r); !ok {
		http.Error(w, "not logged in", http.StatusUnauthorized)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": s.events.publicFeed(eventFeedMax)})
}

func (s *server) handleEventRead(w http.ResponseWriter, r *http.Request) {
	address, ok := s.readSessionCookie(r)
	if !ok {
		http.Error(w, "not logged in", http.StatusUnauthorized)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"events": s.events.forAddress(address, eventReadMax),
	})
}
