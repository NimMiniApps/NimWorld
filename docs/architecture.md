# Architecture

## Layers

```text
Vue HUD / overlays  <── WorldBridge ──>  Phaser plaza
        │                                      │
   Pinia store                           scenes/entities
        │
   Adapters (NimConnect, Catalog, Launcher, Presence, Payment, Arena)
```

- Phaser owns rendering, movement, collisions, proximity, ambient actors
- Vue owns panels, profile chrome, location sheets, permissions copy
- Adapters own all external/mock data access

## Packages

| Path | Role |
|------|------|
| `apps/web` | Vue + Phaser mini app |
| `packages/app-manifest` | Versioned manifest types, JSON Schema, validation |

## Integrations

| System | Phase 1 |
|--------|---------|
| NimConnect profile-client | Real public profile/handle |
| NimConnect friends/achievements/inventory | Mock adapters, labelled in UI |
| NimiqMiniApps API | Real via `/catalog-api` proxy, fallback to manifests |
| Mini App SDK (embedded Pay) | `init` + `listAccounts` → `resolvedAddress`; Hub login only outside Pay |
| App launch / return | Hybrid: Pay `location.assign`, browser `window.open`; `returnUrl` includes `returnedFrom=<appId>` |
| Mini App SDK payments | Hybrid: Pay `sendBasicTransaction`; desktop Hub `checkout`; tip jar + Nearby send + request-link |
| Presence WebSocket | `apps/api` `/presence` (cookie session); client merges live peers + local NPCs/ghosts; falls back when WS unavailable |

## Bridge events

World → UI: `INTERACTION_AVAILABLE`, `INTERACTION_CLEARED`, `OPEN_LOCATION`, `PLAYER_MOVED`, `PLAYER_READY`, `RETURNED_FROM_APP`

UI → World: `PAUSE_MOVEMENT`, `RESUME_MOVEMENT`, `RESTORE_POSITION`, `SET_INPUT_VECTOR`, `TRIGGER_INTERACT`
