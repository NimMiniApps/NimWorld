# Phase 3 Atmosphere Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the compact plaza from “map editor” into a memorable early-evening social hub with distinct landmarks, living atmosphere, a construction Marketplace, and story-framed future world landmarks — without new gameplay systems.

**Architecture:** Keep Phaser world + Vue overlays + adapters. All art stays in the runtime atlas (`generatePlazaAtlas.ts`). Layout/props stay data-driven in `locations.ts`. Scene gains atmosphere FX only (lights, particles, ambient loops, NPC facing). No new `WorldBridge` events or adapter APIs beyond mock NPC data.

**Tech Stack:** Vue 3, Phaser 3, TypeScript, Pinia (unchanged), Vitest for existing tests.

**Design authority:** @docs/plans/2026-08-01-phase3-atmosphere-design.md

---

### Task 1: Color language + shared draw primitives

**Files:**
- Modify: `apps/web/src/game/assets/palette.ts`
- Modify: `apps/web/src/game/assets/generatePlazaAtlas.ts`

**Step 1:** Extend `palette.ts` with named landmark accents if missing:

```ts
arenaRed: 0xff5a4a,
arenaOrange: 0xff8a3d,
arcadeCyan: 0x3de7ff,
townBlue: 0x4aa8ff,
socialPurple: 0xa78bfa,
constructYellow: 0xf5c542,
constructGreen: 0x6bcf6b,
fountainGold: 0xf5a623,
```

**Step 2:** In `generatePlazaAtlas.ts`, add helpers used by all landmarks: `drawShadowEllipse`, `drawWindowGlow`, `drawTorch`, `drawSignBoard(textWidth)`, `drawScaffoldSegment`. Keep existing `outlineRect` / `makeTex`.

**Step 3:** Commit

```bash
git add apps/web/src/game/assets/palette.ts apps/web/src/game/assets/generatePlazaAtlas.ts
git commit -m "feat(game): landmark color language and shared draw helpers"
```

---

### Task 2: Per-landmark building textures

**Files:**
- Modify: `apps/web/src/game/assets/generatePlazaAtlas.ts`

**Step 1:** Replace generic `drawBuilding` usages with dedicated functions and texture keys:

| Key | Function | Notes |
| --- | --- | --- |
| `building-arcade` | `drawArcade` | Largest; cyan portal; marquee strip; posters; machines in windows; trophy niche; stairs |
| `building-arena` | `drawArena` | Battlements; tower; red glow door; bomb rack + cannon props baked or separate; leaderboard board; tournament banner |
| `building-townhall` | `drawTownHall` | Columns; steps; Mini App Bulletin board; cupola; blue windows |
| `building-social` | `drawSocialClub` | Awning; mailbox; message board; warm purple lanterns; seating hint |
| `building-market` → `building-construction` | `drawConstructionSite` | Scaffolding, tarp, crane arm, fence, “Construction / Opening Soon” board |

**Step 2:** Remove or stop calling the old shared `drawBuilding` for landmarks (helpers may remain if still useful).

**Step 3:** Register all textures in `generatePlazaAtlas()`. Bump canvas sizes so silhouettes differ (Arcade tallest/widest, Arena tower taller than Social, Construction lower/wider).

**Step 4:** Run `npm run build -w @nimworld/web` — must succeed.

**Step 5:** Commit

```bash
git commit -m "feat(game): unique landmark silhouettes and construction site"
```

---

### Task 3: Fountain as NimConnect icon + micro-landmark props

**Files:**
- Modify: `apps/web/src/game/assets/generatePlazaAtlas.ts`
- Modify: `apps/web/src/game/world/locations.ts`

**Step 1:** Upgrade `drawFountain` / crystal textures: clearer gold+cyan basin, stronger crystal gem, water ring layers suitable for animation.

**Step 2:** Add prop textures: `prop-firepit`, `prop-coffee`, `prop-statue`, `prop-joystick`, `prop-crates`, `prop-bulletin` (if not baked into Town Hall), plus future-landmark props: `prop-harbor-bridge-closed`, `prop-mountain-gate`, `prop-tunnel`, `prop-fence`.

**Step 3:** Place micro-landmarks in `DECOR` near matching buildings.

**Step 4:** Commit

```bash
git commit -m "feat(game): iconic fountain and micro-landmark props"
```

---

### Task 4: Ground composition + future world landmarks data

**Files:**
- Modify: `apps/web/src/game/world/locations.ts`
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (`paintEnvironment`)

**Step 1:** Update Marketplace location:

```ts
{
  id: 'marketplace',
  label: 'Marketplace',
  interactionLabel: 'View Construction',
  texture: 'building-construction',
  subtitle: 'Opening Soon',
  accent: 0xf5c542,
  // keep x/y near east rim; collide sized to scaffolding
}
```

**Step 2:** Add `FUTURE_LANDMARKS` export (non-interactive, collision blockers + world text):

```ts
export const FUTURE_LANDMARKS = [
  { id: 'harbor', x, y, texture: 'prop-harbor-bridge-closed', title: 'Harbor', lines: ['Closed for repairs', 'Expected reopening soon'] },
  { id: 'mountain', x, y, texture: 'prop-mountain-gate', title: 'Mountain Trail', lines: ['Unsafe', 'Access restricted'] },
  { id: 'tunnel', x, y, texture: 'prop-tunnel', title: 'Old Tunnel', lines: ['Sealed', 'District planned'] },
]
```

Place Harbor south/edge water, Mountain north, Tunnel west/east rim, Market fences linking construction toward east.

**Step 3:** Rewrite `paintEnvironment` to:
- Grass base
- Stone **path ribbons** (not one solid square) from spawn→fountain→each entrance
- Decorative paving ring around fountain only
- Water only at rim / under bridges
- Scatter flower/bush variation so no 5–8 identical tiles in a row without a break

**Step 4:** Ensure fountain partially visible from major paths; buildings frame plaza (nudge coords if needed; do not expand `WORLD`).

**Step 5:** Commit

```bash
git commit -m "feat(game): path-based ground and future world landmarks"
```

---

### Task 5: Atmosphere in PlazaScene (lights, fountain FX, ambient life)

**Files:**
- Modify: `apps/web/src/game/scenes/PlazaScene.ts`
- Optional create: `apps/web/src/game/audio/AmbientAudio.ts` (comment reserved cue names only)

**Step 1:** Early-evening base: background `#0b1228` / slight blue cast; soft dark overlay optional at low alpha if readable.

**Step 2:** Lantern light pools: for each `prop-lantern`, add low-alpha radial/ellipse `Graphics` or soft texture at depth below labels.

**Step 3:** Fountain update loop: crystal bob + slow rotate; particle emitter (sparse); water tile alpha pulse. Keep subtle.

**Step 4:** Ambient loops: 2–4 butterflies, 1–2 birds (tiny sprite or graphics), leaf sway on trees (scale/angle tween), lantern flicker (alpha), Arena chimney smoke puffs, Arcade portal sparkles. Cap simultaneous motion — alive, not busy.

**Step 5:** Document reserved audio cue names in `AmbientAudio.ts` comments; do not play sounds.

**Step 6:** Commit

```bash
git commit -m "feat(game): blue-hour lighting and subtle ambient life"
```

---

### Task 6: NPC roles, placement, face player

**Files:**
- Modify: `apps/web/src/adapters/presence/PresenceAdapter.ts`
- Modify: `apps/web/src/game/entities/CharacterSprite.ts` (if needed for tint/facing)
- Modify: `apps/web/src/game/scenes/PlazaScene.ts`
- Modify: `apps/web/src/game/assets/generatePlazaAtlas.ts` (optional role tint variants)

**Step 1:** Mock actors:

| id | label | placement |
| --- | --- | --- |
| npc-guide | Guide | Near SPAWN_POINT |
| npc-gardener | Gardener | Flower beds |
| npc-courier | Courier | Path Town Hall ↔ Social (ambient walk) |
| npc-tournament | Tournament Master | Outside Arena |
| npc-builder | Builder | Marketplace construction |
| ghosts | keep 2–3 | existing |

**Step 2:** Courier (and optionally others): `ambientStep` along waypoints. When player within ~80px, set facing toward player for ~1s then resume.

**Step 3:** No dialog, no new bridge events.

**Step 4:** Commit

```bash
git commit -m "feat(game): environmental NPC roles and glance-at-player"
```

---

### Task 7: Marketplace overlay copy + revisit-hook world slots

**Files:**
- Modify: `apps/web/src/components/locations/MarketplaceOverlay.vue`
- Modify: atlas / scene for static posters/banners/bulletin (already drawn in Tasks 2–3)

**Step 1:** Overlay tone:

```text
Construction
Opening Soon
```

Short body: marketplace will host handles/cosmetics later; world site shows progress.

**Step 2:** Verify physical slots exist in-world: Arena banner, Arcade poster, Town Hall bulletin, construction progress — static but intentional.

**Step 3:** Commit

```bash
git commit -m "feat(web): marketplace construction overlay copy"
```

---

### Task 8: Verify + screenshots

**Files:**
- Update: `docs/screenshots/*`
- Optional: `README.md` Phase 3 note (one short paragraph)

**Step 1:** `npm test` — all green  
**Step 2:** `npm run build` — success  
**Step 3:** Capture mobile + desktop screenshots (same sizes as Phase 2)  
**Step 4:** Manual 10-second landmark check: Fountain, Arcade, Arena, Town Hall identifiable without labels  
**Step 5:** Commit screenshots

```bash
git commit -m "docs: Phase 3 atmosphere screenshots"
```

---

## Out-of-scope reminders (do not implement)

- Dialog / quests / inventory / achievements / multiplayer / app mechanics  
- Explorable districts  
- Live daily rotation  
- Audio playback  

If tempted: leave a `// future hook:` comment and move on.
