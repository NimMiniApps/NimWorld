# Project: NimWorld

## One-liner

Interactive social plaza (Vue 3 + Phaser 3) that fronts the Nimiq Mini Apps ecosystem, sitting alongside NimConnect (identity/social) and NimiqMiniApps (catalog) without duplicating either.

## Core Value

A user can walk through a polished plaza, see their real NimConnect identity, and launch a real Mini App (NimBomber) through an adapter boundary — with the world staying useful even with one user online and zero real-time presence.

## Source documents

- `prompt.md` — original product/technical spec (product vision, MVP locations, adapters, manifest schema, phases 0-5, acceptance criteria)
- `docs/architecture.md` — current implemented architecture (layers, packages, integration status, bridge events)
- `docs/app-manifest.md`, `docs/nimconnect-permissions.md`, `docs/adding-an-app.md`

## Current state (2026-08-01)

Already built (verified in repo, not re-planned):
- Vue↔Phaser bridge (`apps/web/src/game/bridge`), plaza scene, movement, collision, interaction zones
- All 6 MVP locations with overlays: Fountain, Arena, Arcade, Town Hall, Social Club, Marketplace (placeholder)
- Adapter boundaries in place: `NimConnectAdapter` (real profile client + mock fallback), `MiniAppCatalogAdapter`, `AppLauncher`, `NimiqPaymentAdapter`, `PresenceAdapter`, `ArenaStatusAdapter`
- `packages/app-manifest`: versioned schema, TS types, JSON Schema, validation, tests
- Two full art passes (Art Bible, World Bible, production fountain/portal/landmark kit)
- Unit tests: WorldBridge, AppLauncher, manifest validation, art manifest

Not yet real / not yet built (the gap this roadmap covers):
- NimConnect friends, achievements, inventory — still mock adapters (only profile is real)
- No real Nimiq Mini App environment initialization / wallet context wiring confirmed end-to-end
- Presence: `PresenceAdapter` exists but no WebSocket channel — architecture.md says "not implemented, local ghosts/NPCs only"
- No backend (`apps/api`) — manifests/presence/signed events/rate limiting from prompt.md §6 not started
- Return-state restoration after launching a Mini App not verified end-to-end
- No accessibility pass, no e2e tests, no sound controls, no perf-optimization pass
- No developer docs for "adding a new app portal" beyond the stub file

## Key Decisions

| Decision | Reasoning |
|---|---|
| Roadmap starts from current repo state, not greenfield | Phases 0-2 of prompt.md's own phase plan (foundation, plaza experience, art) are already shipped per git history |
| No backend planned unless a phase proves it's needed | prompt.md says backend is for presence/signed events/rate limiting — defer until presence/trusted-writes phase requires it (YAGNI) |
| Single blockchain (Nimiq) only, adapter pattern preserved | prompt.md explicit non-goal: no cross-chain in MVP |

## Constraints

- Must not duplicate NimConnect (identity/social) or NimiqMiniApps (catalog) functionality
- No private NimConnect financial data may enter NimWorld
- No blockchain writes for routine plaza movement
- Client code must not directly award trusted achievements/inventory — signed server events only
