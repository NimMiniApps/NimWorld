# NimWorld Plaza — Design

**Date:** 2026-07-31  
**Status:** Approved for Phase 1 prototype (user: proceed with recommended approach)

## Vision

NimWorld is a mobile-first interactive social plaza for the Nimiq Mini Apps ecosystem. It is a visual lobby, not an MMO and not a replacement for NimConnect or NimiqMiniApps.

Boundaries:

- **NimConnect** — identity and social (handles, public profiles; friends/achievements/inventory later)
- **NimiqMiniApps** — catalog and discovery
- **NimWorld** — interactive plaza + Vue overlays
- **Individual apps** — own gameplay and authoritative state

## Visual direction

Mood board: `assets/moodboard/nimconnect-plaza-moodboard.png`

Preserve: compact isometric plaza, central glowing crystal fountain, distinct Arena / Arcade / Town Hall / Social Club / Marketplace, Nimiq purple/blue/cyan/gold, friendly 2.5D pixel feel, world as focus, Vue for detailed screens, ambient NPCs/ghosts.

Do not copy the mood board UI chrome literally (chat, dense sidebars). Phase 1 UI is lean: profile chip, interaction prompt, location overlays, mobile joystick.

## Chosen approach

**Phaser-authored compact plaza** with geometric/pixel-inspired art, collision circles, proximity interaction, and Vue overlays. Tiled maps deferred until the walkable experience is proven.

## Stack

- Vue 3 + TypeScript + Vite + Pinia + Vue Router
- Tailwind CSS for overlays
- Phaser 3 for the world
- Vitest for adapters/manifest validation
- `@nimconnect/profile-client` for public profile/handle only
- NimiqMiniApps public API for catalog data
- `@nimiq/mini-app-sdk` for wallet context when available

## Repo structure

```text
apps/web/                 # Vue + Phaser mini app
packages/app-manifest/    # types, JSON Schema, validation
assets/moodboard/         # visual reference
maps/plaza/               # reserved for future Tiled
docs/                     # architecture + plans
```

## Adapter boundaries

| Adapter | Phase 1 source |
|--------|----------------|
| `NimConnectAdapter` | Real `profile-client` for public profile; mock for friends/achievements/inventory |
| `MiniAppCatalogAdapter` | Real NimiqMiniApps public API (+ local fallback) |
| `AppLauncher` | Window navigation with safe return/source query params |
| `NimiqPaymentAdapter` | Mini App SDK when present; labelled mock otherwise |
| `PresenceAdapter` | Local recent-activity ghosts only (no WebSocket) |
| `ArenaStatusAdapter` | Mock NimBomber challenge/stats behind interface |

UI and Phaser never import mock data directly — only adapters.

## World ↔ UI bridge

Phaser emits typed `WorldEvent`s; Vue listens and opens overlays. Vue sends `UiCommand`s (pause movement, restore position, close overlay). No Vue state inside Phaser game objects.

## Phase 1 acceptance (first deliverable)

1. Runnable plaza with movement (WASD/arrows + virtual joystick)
2. Central fountain + Arena + Arcade (+ other location zones)
3. Interaction prompts → Vue overlays
4. Mock NimConnect profile (or real public profile when wallet/address available)
5. App-manifest types + JSON Schema + validation tests
6. README with run instructions
7. No backend for presence/achievements yet

## Risks

- Full NimConnect social SDK does not exist — mocks must stay clearly labelled
- Catalog CORS may require proxy in Vite; fallback to bundled featured apps
- Pixel art quality is placeholder until a tileset pass
