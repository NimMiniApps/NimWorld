# Roadmap: NimWorld

## Overview

Foundation, the base plaza, all six MVP locations, and two full art passes are already shipped (see `.planning/PROJECT.md` Current State). What remains is turning a good-looking mock-data demo into a real, launchable ecosystem product — in an order that produces a compelling, demoable milestone as early as possible rather than front-loading invisible backend work. Phases are sequenced: get the real platform loop working first (Phase 1), then make the world socially useful (Phase 2), then make it feel alive (Phase 3), then turn it into shared ecosystem infrastructure (Phase 4), then harden for production (Phase 5). Phase 6 is explicitly post-launch content and is not part of the v1.0 execution path.

## Domain Expertise

None.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Platform Integration** - Real NimConnect + real Mini App launch loop, end to end
- [ ] **Phase 2: Social & Payments** - Send/request NIM and inspect other players without leaving the world
- [ ] **Phase 3: Living Plaza** - Backend-backed real presence and recent activity
- [ ] **Phase 4: Cross-App Platform** - Shared achievements/inventory/activity become ecosystem infrastructure
- [ ] **Phase 5: Launch Candidate** - Production-hardening and ship readiness
- [ ] **Phase 6: Living World** (post-launch, not v1.0) - Seasonal/live content that brings people back

## Phase Details

### Phase 1: Platform Integration
**Goal**: A user can open NimWorld inside Nimiq Pay, authenticate with real NimConnect, walk the plaza, inspect real profile data, and launch NimBomber (or another Mini App) before returning seamlessly to the plaza.
**Depends on**: Nothing (builds on already-shipped plaza/adapters)
**Research**: Likely (external APIs, first real integration)
**Research topics**: Nimiq Mini App SDK initialization/wallet-context lifecycle, Mini App launch/navigation mechanism, current NimiqMiniApps catalog API shape (vs. the manifest-fallback already implemented)
**Plans**: TBD

Plans:
- [ ] 01-01: Real Nimiq Mini App environment initialization
- [ ] 01-02: Real NimConnect profile + permission scopes wiring (replace remaining mock-profile paths)
- [ ] 01-03: Real NimiqMiniApps catalog integration (replace/augment manifest fallback) + connected-app state
- [ ] 01-04: Real AppLauncher navigation (NimBomber) + return-state restoration end to end

### Phase 2: Social & Payments
**Goal**: A user can interact with another player's public profile and send or request NIM without leaving the world.
**Depends on**: Phase 1 (real NimConnect identity/session foundation)
**Research**: Likely (payment API, external service)
**Research topics**: Nimiq Pay send/request NIM flow, NimConnect friends/contacts real endpoints and public-field permissions
**Plans**: TBD

Plans:
- [ ] 02-01: Real NimiqPaymentAdapter — send NIM, request NIM, success/failure states
- [ ] 02-02: Real friends/contacts data (replace mock adapter) + friend profile cards
- [ ] 02-03: Public profile inspection panel (another user's NimConnect profile)
- [ ] 02-04: Payment requests + app launch history surfaced in UI

### Phase 3: Living Plaza
**Goal**: The plaza feels alive through real presence and recent activity, not just static NPCs/ghosts.
**Depends on**: Phase 1 (real user identity to publish presence for)
**Research**: Likely (new backend, architectural decision)
**Research topics**: Go backend service structure for this repo, WebSocket presence channel design, signed-event scheme for trusted writes, rate-limiting approach
**Plans**: TBD

Plans:
- [ ] 03-01: Go backend foundation (`apps/api`) — world config, manifests, presence, rate limiting
- [ ] 03-02: WebSocket presence channel + client PresenceAdapter wired to real data
- [ ] 03-03: Recently-active fallback + accurate status labels (Online / Playing X / Active Nm ago / NPC)
- [ ] 03-04: Signed app events groundwork (trusted-write mechanism, no client-side award path)

### Phase 4: Cross-App Platform
**Goal**: NimWorld stops being just a Mini App and becomes shared ecosystem infrastructure — other apps' achievements, inventory, and activity are visible and trustworthy inside the plaza.
**Depends on**: Phase 3 (needs backend + signed events for trusted writes)
**Research**: Likely (schema/architectural decisions)
**Research topics**: Shared achievement/inventory envelope validation against real app data, activity-feed aggregation approach, SDK surface expansion for third-party apps
**Plans**: TBD

Plans:
- [ ] 04-01: Shared achievements (real, signed-event-verified, replacing mock)
- [ ] 04-02: Shared inventory (real, namespaced, app-local vs shared distinction enforced)
- [ ] 04-03: Activity feed (cross-app recent activity, public stats)
- [ ] 04-04: App manifest/capabilities/SDK expansion for onboarding a second real app beyond NimBomber

### Phase 5: Launch Candidate
**Goal**: NimWorld is production-deployable: performant, accessible, tested, documented, and free of placeholder developer panels.
**Depends on**: Phases 1-4
**Research**: Unlikely (internal hardening work)
**Plans**: TBD

Plans:
- [ ] 05-01: Performance pass (60fps target, lazy-load panels/assets, atlas sprites, overlay-active Phaser suspension)
- [ ] 05-02: Accessibility pass (keyboard nav, contrast, no hover-dependent controls, safe-area support)
- [ ] 05-03: Sound controls + remaining loading/error states
- [ ] 05-04: E2E tests + developer docs (`adding-an-app.md` completed) + production deployment

### Phase 6: Living World (post-launch)
**Goal**: The plaza changes over time so returning users have a reason to come back.
**Depends on**: Phase 5 (v1.0 shipped)
**Research**: Unlikely (content/config work on top of shipped systems)
**Plans**: TBD

Plans:
- [ ] 06-01: Seasonal/holiday plaza decoration system
- [ ] 06-02: Events, tournament banners, featured-app posters
- [ ] 06-03: Marketplace real implementation (beyond MVP placeholder) + new districts

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → (6, post-launch)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Integration | 0/4 | Not started | - |
| 2. Social & Payments | 0/4 | Not started | - |
| 3. Living Plaza | 0/4 | Not started | - |
| 4. Cross-App Platform | 0/4 | Not started | - |
| 5. Launch Candidate | 0/4 | Not started | - |
| 6. Living World (post-launch) | 0/3 | Not started | - |
