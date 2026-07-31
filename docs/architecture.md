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
| Mini App SDK payments | Best-effort; mock request-link fallback |
| Presence WebSocket | Not implemented; local ghosts/NPCs only |

## Bridge events

World → UI: `INTERACTION_AVAILABLE`, `INTERACTION_CLEARED`, `OPEN_LOCATION`, `PLAYER_MOVED`, `PLAYER_READY`, `RETURNED_FROM_APP`

UI → World: `PAUSE_MOVEMENT`, `RESUME_MOVEMENT`, `RESTORE_POSITION`, `SET_INPUT_VECTOR`, `TRIGGER_INTERACT`
