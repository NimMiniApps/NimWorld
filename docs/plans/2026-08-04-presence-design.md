# Real-time Presence Design

Date: 2026-08-04
Status: approved

## Goal

Logged-in users see each other as walking avatars in the plaza (two browser tabs = two visible players). NPCs/ghosts remain the offline fallback.

## Approach

In-memory WebSocket room on `apps/api`, authenticated with the existing `nw_session` cookie. Client `RealtimePresenceAdapter` merges live peers with local NPCs/ghosts. PlazaScene upserts `online` actors at runtime.

## Architecture

```
Browser A / B
  └─ RealtimePresenceAdapter ──WS──► apps/api /presence
                                         └─ in-memory PlazaHub
  └─ PlazaScene ambientActors ◄── SYNC_ONLINE_ACTORS (UiCommand)
```

- Auth: cookie → address (same as `/auth/me`)
- One global plaza room; reconnect = rejoin
- Same address reconnecting replaces the previous socket
- Self never appears in peer list / snapshot

## Protocol (JSON)

Client → server:

- `{ "type": "join", "label"?: string, "x": number, "y": number }`
- `{ "type": "move", "x": number, "y": number }`

Server → client:

- `{ "type": "snapshot", "peers": [{ "id", "label", "x", "y" }] }`
- `{ "type": "peer_join", "id", "label", "x", "y" }`
- `{ "type": "peer_move", "id", "x", "y" }`
- `{ "type": "peer_leave", "id" }`

`id` is the Nimiq address. `label` defaults to a short address form when omitted.

## Client

- Extend `PresenceAdapter` with `publishPosition`, `onActorsChanged`, `dispose`
- `RealtimePresenceAdapter` tries WS; on failure keeps `LocalPresenceAdapter` actors only
- Throttle publishes to ~10 Hz from `PLAYER_MOVED`
- `GameCanvas` / store push online-actor sync into Phaser via `SYNC_ONLINE_ACTORS`
- PlazaScene: spawn/move/remove actors with `kind: 'online'`; skip ambient waypoint stroll for them (lerp/snap to target)

## Fallback

WS unavailable or auth missing → local NPCs/ghosts only; plaza still loads. No fake “online” labels for local ghosts.

## Out of scope

- Nimiq Pay embedded session → API cookie bridge
- Friends graph, chat, persistence, multi-instance hub, rate-limit hardening beyond basic move throttle
- Recently-active DB ghosts

## Testing

- Go: two clients join with session cookies; move broadcasts; leave removes; unauthenticated WS rejected
- TS: adapter merges peers + NPCs; publish throttle; fallback when WS fails
