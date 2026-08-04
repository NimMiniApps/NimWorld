# Art Pass D — Mood Closure Design

**Date:** 2026-08-04
**Status:** Approved
**Reference:** NimConnect Plaza mockup (dense hub, canal enclosure, layered foliage, landmark weight, portal/lamp/crystal glow)
**Builds on:** `docs/plans/2026-08-03-art-pass-c-design.md` (C1–C3 done; C4 absorbed here as D3)
**Supersedes nothing.** Art Passes A–C remain style and layout authority.

---

## Problem

Live plaza screenshots and the mockup sit in the same pixel-art family, but they do not feel like the same place. The gap is composition and framing — open grass, follow-cam close-ups, landmark weight, atmosphere — not a missing map editor. The owner is not a level designer; agents must drive iteration and ship screenshots for approve/reject only.

## Goal

Close the mood gap until the owner says the live plaza feels like the mockup from screenshots, without them painting maps or choosing tools.

**Success:**

- Side-by-side shots (mockup crop vs live) read as the same place: enclosed, dense foliage, clear hub, readable landmarks
- Play cam stays follow-cam (mobile-first); a review/overview zoom exists only for capture and QA
- Owner never edits coordinates — only `approve` / `reject: <one sentence>`

## Decisions

| Question | Decision |
| --- | --- |
| Approach | Agent-driven mood closure with screenshot gates (not Tiled / LDtk / Phaser Editor) |
| Mockup fidelity | Mood target — density, enclosure, landmark weight, glow — not a 1:1 rebuild |
| Camera | Keep scrolling follow-cam for play; add review/overview framing for screenshots only |
| Mockup HUD chrome (chat, XP, events, challenge boards) | Out of scope — product, not art (same as Art Pass C) |
| Location IDs / names | Keep existing six; no Profile / Post Office / Developer District rename |
| C4 (landmark scale + signboards) | Absorbed as phase D3 |
| Terrain system | Stamp + Wang pipeline stays; D1 may tune params only, no layout rewrite |

## Hard no

- No chat / XP / events / Hall of Fame / challenge-board mock UI
- No renaming locations to mockup labels
- No Tiled / LDtk / Phaser Editor migration
- No fixed single-screen camera as play mode

## Architecture (unchanged pipeline)

```
locations.ts        → landmark coords, WORLD, VIEW_FRAME
plazaTerrainMap.ts  → buildPlazaTerrainGrid()  (params only in D1)
terrainResolver.ts  → Wang layers
decorPlacement.ts   → seeded terrain-aware scatter (primary D1 lever)
PlazaScene.ts       → render, collision, review zoom (D2), atmosphere (D4)
artManifest.ts      → texture overrides (D3 art wiring)
```

Agents change code and assets; owner reviews PNGs.

## Phases

Each phase ends with screenshots under `docs/screenshots/art-pass-d/` and an owner gate. Do not start the next phase until the current one is approved (or the try-cap escalates).

### D1 — Density & enclosure

Tune existing scatter, wall, and foliage (counts, band distances, spacing). Commission new art only if a clear hole remains after param passes. No terrain rewrite.

**Look for:** less empty grass between landmark ring and canal; enclosure reads at overview.

### D2 — Review framing

Add capture/QA overview zoom (or screenshot helper) so the whole hub reads in one frame like the mockup. Play cam remains follow-cam + cover-zoom.

**Look for:** hub + spokes + canal readable in one review shot without breaking mobile play.

### D3 — Landmark polish (absorbs C4)

Scale-up and in-world signboards so Arcade, Arena, Social Club, Town Hall, Marketplace, and Fountain match mockup weight. Reuse before regenerate (`docs/art/design-principles.md` #4).

**Look for:** each landmark has silhouette weight and a clear sign at overview and close-up.

### D4 — Atmosphere

Cheap wins first: portal, lamp, and crystal read; optional dusk tint. Skip heavy shaders unless D1–D3 still feel flat after approval.

**Look for:** night/dusk glow on portals, lamps, crystal; plaza feels lit, not flat.

## Owner review loop

**Per phase, agents deliver:**

- 2–4 PNGs in `docs/screenshots/art-pass-d/` (hub overview + landmark close-ups)
- Short note: what changed and what to look at

**Owner reply:**

- `approve` — advance to next phase
- `reject: <one sentence>` — e.g. “still too much empty grass near canal”

Agents iterate the same phase until approve. Cap ~3 tries, then escalate with concrete options (more art vs param-only vs accept and move on).

## “Good enough” checklist (mood, not pixel-match)

1. Hub reads enclosed (foliage / wall / water, not an open field)
2. Paths + fountain readable at overview zoom
3. Each landmark has weight and a clear sign
4. Night/dusk glow reads on portals, lamps, crystal
5. Still playable on mobile follow-cam (not a museum diorama)

## Out of scope

- Mock product UI surfaces listed above
- New districts or location renames
- Map-editor adoption
- Replacing the stamp / Wang / derived-decor architecture

## Relationship to Art Pass C

C1–C3 remain the terrain and density foundation. This pass does not re-litigate C’s layout (radial hub, canal, six IDs, mobile HUD). It closes the remaining mood gap with an explicit screenshot approval process and folds unfinished C4 into D3.
