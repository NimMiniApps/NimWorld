# Boot Screen — Design

**Date:** 2026-08-02  
**Status:** Approved (approach A)

## Goal

Replace the static card boot UI so multi-second loads feel intentional, not stuck.

## Approach

Full-bleed atmospheric brand screen shared across:

1. Pre-Vue shell (`index.html`) — instant first paint  
2. Session resolve — “Connecting…”  
3. Plaza bootstrap — “Opening the plaza…”  
4. Phaser world ready — “Loading the world…”  
5. Login gate — same atmosphere + connect CTA  

## Feedback

- Hero NimWorld wordmark + tagline  
- Soft crystal accent + night sky motion  
- Indeterminate shimmer bar while busy  
- Tip after ~2.5s: “First visit can take a moment”  
- Boot stays up until `PLAYER_READY` (not only adapter bootstrap)  

## Out of scope

Exact asset progress %, new art assets, login flow changes beyond visual match.
