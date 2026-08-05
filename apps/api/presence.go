package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

// A join carries a label plus two coordinates; a move carries two.
const presenceMaxFrameBytes = 1024

type presencePeer struct {
	ID    string  `json:"id"`
	Label string  `json:"label"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
}

type presenceClient struct {
	conn    *websocket.Conn
	address string
	label   string
	x, y    float64
	joined  bool
	send    chan []byte
}

type plazaHub struct {
	mu      sync.Mutex
	clients map[string]*presenceClient // address -> client
}

func newPlazaHub() *plazaHub {
	return &plazaHub{clients: make(map[string]*presenceClient)}
}

// The session cookie rides along on a cross-site WebSocket handshake, so
// without an origin check any page could open an authenticated plaza socket
// for a logged-in visitor. Same-origin and the configured ALLOW_ORIGIN only.
func (s *server) checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true // non-browser client; the session cookie still gates it
	}
	if s.allowOrigin != "" && origin == s.allowOrigin {
		return true
	}
	u, err := url.Parse(origin)
	return err == nil && strings.EqualFold(u.Host, r.Host)
}

func (s *server) handlePresence(w http.ResponseWriter, r *http.Request) {
	address, ok := s.readSessionCookie(r)
	if !ok {
		http.Error(w, "not logged in", http.StatusUnauthorized)
		return
	}

	upgrader := websocket.Upgrader{CheckOrigin: s.checkOrigin}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("presence upgrade: %v", err)
		return
	}

	client := &presenceClient{
		conn:    conn,
		address: address,
		send:    make(chan []byte, 16),
	}

	go client.writePump()
	s.hub.register(client)
	defer func() {
		s.hub.unregister(client)
		close(client.send)
		_ = conn.Close()
	}()

	// Frames are two coordinates and a label; anything larger is not presence.
	conn.SetReadLimit(presenceMaxFrameBytes)
	// The client publishes at ~10 Hz, so this only bites on a misbehaving one.
	moves := newRateLimiter(30, 20)

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}
		if !moves.allow(address) {
			continue
		}
		var msg map[string]any
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}
		s.hub.handleMessage(client, msg)
	}
}

func (c *presenceClient) writePump() {
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func (c *presenceClient) enqueue(v any) {
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	select {
	case c.send <- data:
	default:
		// Drop if slow; presence is best-effort.
	}
}

func (h *plazaHub) register(c *presenceClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if prev, ok := h.clients[c.address]; ok && prev != c {
		// Replace prior socket for this address. Closing the conn lets the
		// old read loop exit; its defer owns closing prev.send.
		delete(h.clients, c.address)
		if prev.joined {
			h.broadcastLocked(c.address, map[string]any{
				"type": "peer_leave",
				"id":   prev.address,
			})
		}
		_ = prev.conn.Close()
	}
	h.clients[c.address] = c
}

func (h *plazaHub) unregister(c *presenceClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	cur, ok := h.clients[c.address]
	if !ok || cur != c {
		return
	}
	delete(h.clients, c.address)
	if c.joined {
		h.broadcastLocked(c.address, map[string]any{
			"type": "peer_leave",
			"id":   c.address,
		})
	}
}

func (h *plazaHub) handleMessage(c *presenceClient, msg map[string]any) {
	typ, _ := msg["type"].(string)
	switch typ {
	case "join":
		h.handleJoin(c, msg)
	case "move":
		h.handleMove(c, msg)
	}
}

func (h *plazaHub) handleJoin(c *presenceClient, msg map[string]any) {
	h.mu.Lock()
	defer h.mu.Unlock()

	c.x = asFloat(msg["x"])
	c.y = asFloat(msg["y"])
	if label, ok := msg["label"].(string); ok && label != "" {
		c.label = label
	} else {
		c.label = shortAddressLabel(c.address)
	}
	c.joined = true

	peers := make([]presencePeer, 0, len(h.clients))
	for addr, other := range h.clients {
		if addr == c.address || !other.joined {
			continue
		}
		peers = append(peers, presencePeer{
			ID: other.address, Label: other.label, X: other.x, Y: other.y,
		})
	}
	c.enqueue(map[string]any{"type": "snapshot", "peers": peers})

	h.broadcastLocked(c.address, map[string]any{
		"type":  "peer_join",
		"id":    c.address,
		"label": c.label,
		"x":     c.x,
		"y":     c.y,
	})
}

func (h *plazaHub) handleMove(c *presenceClient, msg map[string]any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if !c.joined {
		return
	}
	c.x = asFloat(msg["x"])
	c.y = asFloat(msg["y"])
	h.broadcastLocked(c.address, map[string]any{
		"type": "peer_move",
		"id":   c.address,
		"x":    c.x,
		"y":    c.y,
	})
}

func (h *plazaHub) broadcastLocked(except string, v any) {
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	for addr, c := range h.clients {
		if addr == except || !c.joined {
			continue
		}
		select {
		case c.send <- data:
		default:
		}
	}
}

func asFloat(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case json.Number:
		f, _ := n.Float64()
		return f
	default:
		return 0
	}
}

func shortAddressLabel(address string) string {
	trimmed := address
	if len(trimmed) <= 12 {
		return trimmed
	}
	return trimmed[:8] + "…"
}
