# NimWorld Roadmap

Source: `prompt.md` (product/technical spec) + `docs/architecture.md` (current implementation). This is the target for AI agents working on this repo — what's already shipped, what's left, and in what order.

## Already shipped (do not re-plan)

- Vue↔Phaser bridge, plaza scene, movement, collision, interaction zones
- All 6 MVP locations with overlays: Fountain, Arena, Arcade, Town Hall, Social Club, Marketplace (placeholder)
- Adapter boundaries: `NimConnectAdapter` (real profile client + mock fallback), `MiniAppCatalogAdapter`, `AppLauncher`, `NimiqPaymentAdapter`, `PresenceAdapter`, `ArenaStatusAdapter`
- `packages/app-manifest`: versioned schema, TS types, JSON Schema, validation, tests
- Two art passes (Art Bible, World Bible, production fountain/portal/landmark kit)
- Real catalog integration — `HttpMiniAppCatalogAdapter` reads the NimiqMiniApps API and falls back to manifests
- Real Nimiq Pay session (`listAccounts`), Hub login for standalone browsers, verified by the Go `apps/api`
- Real payments — Pay SDK sends inside Pay, Hub checkout on desktop
- Return-state restoration after launching a Mini App, driven by `PLAYER_READY`
- Unit tests: WorldBridge, AppLauncher, session, payments, terrain, manifest validation, art manifest

## Gap this roadmap covers

- NimConnect achievements and inventory — still mock. **Blocked upstream:** NimConnect exposes no production API for these, as `requestScopes` states. Do not plan work that assumes them. (Friends are real since profile-client 0.6.0.)
- `apps/api` has no signed-event mechanism yet (spec §6); achievements/inventory writes have no trusted path
- No accessibility pass, no e2e tests, no sound controls, no perf-optimization pass
- `docs/adding-an-app.md` is a stub

## Ordering principle

Sequenced for the earliest compelling, demoable milestone — real platform loop first, then social value, then liveness, then ecosystem infrastructure, then hardening. Backend work (Phase 3) comes *after* the core loop works, not before.

---

## Phase 1 — Platform Integration — **done**

**Done when:** a user can open NimWorld inside Nimiq Pay, authenticate with real NimConnect, walk the plaza, inspect real profile data, and launch NimBomber (or another Mini App) before returning seamlessly to the plaza.

- ~~Real Nimiq Mini App environment initialization~~
- Real NimConnect profile wiring — done. `friends:read` landed with profile-client 0.6.0; the remaining scopes are blocked upstream and belong to Phase 4.
- ~~Real NimiqMiniApps catalog integration (replace/augment manifest fallback)~~ — connected-app state still outstanding, folded into Phase 4
- ~~Real `AppLauncher` navigation (NimBomber) + return-state restoration end to end~~

## Phase 2 — Social & Payments — **done**

**Done when:** a user can interact with another player's public profile and send or request NIM without leaving the world.

- ~~Real `NimiqPaymentAdapter` — send NIM, success/failure states~~
- ~~Public profile inspection panel (another user's NimConnect profile)~~ — done. `ProfileSheet` opens from Nearby, the friends HUD, and the Social Club; `getProfile(address)` resolves any address through `getDisplayIdentity`.
- ~~A real request-NIM flow, replacing the clipboard `nimiq:` link~~ — done. Requests now build `nimiq:<your address>?amount=…` (the old link had no recipient and was unpayable) and go to the OS share sheet, clipboard as fallback. Neither the Mini App SDK nor the Hub exposes a request API, so there is nothing further to wire until one exists.
- ~~App launch history surfaced in UI~~ — done. `BrowserAppLauncher` keeps the last 8 launches in localStorage; the Arcade shows them as relaunch chips.
- ~~Real friends/contacts data~~ — done via profile-client 0.6.0 (`listFriends` behind a NimConnect session, connected from the Social Club). Friend requests (send/accept/decline/remove) and friend profile cards landed with the friends session and `ProfileSheet`.

Research before building: Nimiq Pay request-NIM flow, NimConnect public-field permissions.

## Phase 3 — Living Plaza — **done**

**Done when:** the plaza feels alive through real presence and recent activity, not just static NPCs/ghosts.

- ~~Extend the Go `apps/api` beyond auth — world config, manifests, presence, rate limiting~~ — done. `/world` serves the tip address, `/apps` serves the shared manifest JSON (catalog chain: public API → registry → bundled), IP token buckets guard the signature and RPC paths, and the presence socket now checks Origin instead of accepting any (a cross-site page could previously open an authenticated socket).
- ~~WebSocket presence channel + client `PresenceAdapter` wired to real data~~
- ~~Recently-active fallback + accurate status labels (Online / Playing X / Active Nm ago / NPC)~~ — done. The hub remembers departed players for 30 min and serves them in the join snapshot; they render as ghosts where they left off. Launching a Mini App publishes `activity`, so the ghost reads "Playing NimBomber".
- ~~Signed app events groundwork (trusted-write mechanism, no client-side award path)~~ — done. `POST /events` verifies an HMAC-SHA256 over the raw body against a per-app secret (`APP_KEYS`), with a 5-minute freshness window; the app id comes from the signing header, not the body. Reads are session-scoped to your own events. No secret ever reaches the browser, so a client cannot write. Storage is an in-memory ring — Phase 4 replaces it when events must survive a restart.

Research before building: Go backend service structure for this repo, WebSocket presence design, signed-event scheme, rate-limiting approach.

Depends on Phase 1 (real user identity to publish presence for).

## Phase 4 — Cross-App Platform

**Done when:** other apps' achievements, inventory, and activity are visible and trustworthy inside the plaza — NimWorld becomes shared ecosystem infrastructure, not just a Mini App.

- Shared achievements (real, signed-event-verified, replacing mock)
- Shared inventory (real, namespaced, app-local vs shared distinction enforced)
- ~~Activity feed (cross-app recent activity, public stats)~~ — done. Apps opt a line in with `"public": true` plus a short `text`; `GET /events/feed` serves the newest 25 to logged-in visitors and Town Hall renders them, each row opening that player's profile. Public stats wait for real app data to aggregate.
- Connected-app state from the catalog, and the NimConnect scopes beyond `profile:read` once they exist
- App manifest/capabilities/SDK expansion for onboarding a second real app beyond NimBomber

Research before building: shared achievement/inventory envelope validation against real app data, activity-feed aggregation, SDK surface expansion for third-party apps.

Depends on Phase 3 (needs backend + signed events for trusted writes).

## Phase 5 — Launch Candidate

**Done when:** NimWorld is production-deployable — performant, accessible, tested, documented, no placeholder developer panels.

- Performance pass (60fps target, lazy-load panels/assets, atlas sprites, overlay-active Phaser suspension)
- Accessibility pass (keyboard nav, contrast, no hover-dependent controls, safe-area support)
- Sound controls + remaining loading/error states
- E2E tests + developer docs (`adding-an-app.md` completed) + production deployment

Depends on Phases 1-4.

## Phase 6 — Living World (post-launch, not v1.0)

**Done when:** the plaza changes over time so returning users have a reason to come back.

- Seasonal/holiday plaza decoration system
- Events, tournament banners, featured-app posters
- Real Marketplace implementation (beyond MVP placeholder) + new districts

Depends on Phase 5 shipping.

---

## Constraints (apply to every phase)

- No duplicating NimConnect (identity/social) or NimiqMiniApps (catalog) functionality
- No private NimConnect financial data enters NimWorld
- No blockchain writes for routine plaza movement
- Client code never awards trusted achievements/inventory directly — signed server events only
