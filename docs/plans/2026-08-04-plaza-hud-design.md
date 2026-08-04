# Plaza HUD (C5 + Preview Shells) — Design

**Date:** 2026-08-04  
**Status:** Approved  
**Related:** Art Pass C phase C5 (`docs/plans/2026-08-03-art-pass-c-design.md`); mockup reference (nine-panel HUD rejected as product surface; reused as visual target for style + optional desktop preview chrome)

## Goal

Ship a basic cyber-pixel HUD in the mockup’s style: real mobile-first chrome (profile, NIM balance, bottom nav) plus desktop-only static preview panels (chat / friends / events) for visual parity. Preview panels must not look like live NimConnect features.

## Decisions

| Question | Decision |
| --- | --- |
| Scope vs Art Pass C | **Extend C5.** Real HUD trim + non-functional desktop shells. Not the full nine-panel product HUD. |
| Mobile shells | **Hidden** below ~900px. Phone shows lean HUD only. |
| Preview content | **Sample filler** with a clear **Preview** badge. |
| Architecture | **Evolve Vue HUD** (`App.vue` + new `components/hud/*`). No Phaser HUD, no full rewrite. |
| XP / levels / mail / settings / real social | **Out of scope.** No XP bar. Mail/settings buttons visible but disabled. |

## Layout

| Zone | Component | Visibility |
| --- | --- | --- |
| Top-left | Restyled `ProfileChip` (avatar + handle; live profile) | Always |
| Top-center | Brand title + tagline | Always |
| Top-right | `BalanceChip` + disabled mail/settings icon buttons | Always |
| Bottom-center | `BottomNav` | Always |
| Bottom-left | `ChatShell` (above joystick) | Desktop ≥900px |
| Right / upper | `FriendsShell` | Desktop ≥900px |
| Bottom-right | `EventsShell` | Desktop ≥900px |
| Existing | Joystick, NearbyPlayers, InteractionPrompt, move hint, toasts | Always (reposition to avoid collisions) |

## Components & behavior

### Wired (real)

- **ProfileChip** — restyle to mockup language (`nw-panel`, neon border, pixel labels where appropriate). Keep NimConnect / mock identity data.
- **BalanceChip** — show NIM amount. No payment adapter balance API exists today → use a labeled **Preview** amount for this pass (do not invent adapter surface). Tap does nothing.
- **BottomNav** — items: Home, Apps, Inventory, Achievements, Friends, Wallet.
  - Home → `closeLocation()`
  - Apps → `openLocation('arcade')`
  - Inventory / Achievements → `openLocation('fountain')`
  - Friends → `openLocation('social-club')`
  - Wallet → `openLocation('marketplace')`
  - Active state: `home` when no overlay; otherwise map from `openLocationId` where unambiguous (fountain covers both Inventory and Achievements — highlight both or the last selected nav id via local state).

### Preview-only (desktop)

- **ChatShell** — tabs World / Friends / Nearby; hardcoded messages; input disabled.
- **FriendsShell** — sample rows + status dots; “View All” disabled.
- **EventsShell** — sample timed events; “View All” disabled.
- Hardcoded data in component files (or a tiny `hudPreviewData.ts`). No store, adapters, or persistence.
- Each shell shows a **Preview** badge.

### Interaction / collision

- Chrome containers use `pointer-events: auto`; empty overlay regions stay `pointer-events: none` so the plaza stays clickable/walkable.
- Desktop: reposition `NearbyPlayers` so it does not sit under `FriendsShell`.
- Joystick remains bottom-left; chat sits above with gap.

## Visual language

Reuse existing tokens in `apps/web/src/styles.css` (`--nw-panel`, `--nw-cyan`, `--nw-gold`, `--nw-purple`, `--nw-font-pixel`). Dark panels, thin neon borders, active bottom-nav glow. No second design system. No new PixelLab assets required for C5.

## Out of scope

- Real chat, friends list, events, XP/level, mail, settings
- Phaser-anchored building labels / challenge boards (Art Pass C4)
- Payment adapter balance API
- Mock adapters for Roadmap Phase 3–4 social features beyond existing fountain mocks

## Verification

- Visual: mobile lean HUD; desktop shows three preview shells with badges.
- Bottom nav opens/closes the mapped location overlays.
- Preview shells never call store/adapters.
- Existing flows unchanged: joystick, nearby send, location overlays, payment sheet.
- Unit-test the bottom-nav → location mapping helper (no Vue component test harness in repo today).
