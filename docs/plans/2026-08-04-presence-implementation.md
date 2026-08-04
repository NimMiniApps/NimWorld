# Real-time Presence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Logged-in users see each other as walking plaza avatars via a cookie-authed WebSocket presence hub.

**Architecture:** In-memory Go hub on `apps/api` at `/presence`; `RealtimePresenceAdapter` merges live peers with local NPCs; PlazaScene upserts `online` actors via `SYNC_ONLINE_ACTORS`.

**Tech Stack:** Go + gorilla/websocket, Vue/TS PresenceAdapter, Phaser PlazaScene, Vitest + `go test`

---

### Task 1: Go presence hub (TDD)

**Files:**
- Create: `apps/api/presence.go`
- Create: `apps/api/presence_test.go`
- Modify: `apps/api/main.go` (register `/presence`, CORS methods for WS)
- Modify: `apps/api/go.mod` (add gorilla/websocket)

**Steps:** Write failing tests for unauthenticated reject, two-peer join/snapshot/move/leave; implement hub; `go test ./...` green; commit.

### Task 2: PresenceAdapter interface + RealtimePresenceAdapter (TDD)

**Files:**
- Modify: `apps/web/src/adapters/presence/PresenceAdapter.ts`
- Create: `apps/web/src/adapters/presence/RealtimePresenceAdapter.ts`
- Create/Modify: tests under `apps/web/src/adapters/presence/`

**Steps:** Failing tests for merge, publish, fallback; implement; wire `createAdapters` + vite `ws: true`; commit.

### Task 3: Bridge + PlazaScene online avatars

**Files:**
- Modify: `apps/web/src/domain/types.ts` (`SYNC_ONLINE_ACTORS`)
- Modify: `apps/web/src/game/scenes/PlazaScene.ts`
- Modify: `apps/web/src/components/GameCanvas.vue` / `plazaStore.ts`
- Modify: `docs/architecture.md` (presence row)

**Steps:** Publish on `PLAYER_MOVED`; sync online actors into scene; online actors snap/lerp without NPC ambient paths; tests where feasible; commit.

### Task 4: Verify

Run `go test ./...` in `apps/api`, `npm test`, smoke two-tab manual check notes in README if needed.
