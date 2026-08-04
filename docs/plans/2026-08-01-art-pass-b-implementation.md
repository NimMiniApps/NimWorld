# Art Pass B Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Freeze the NimWorld visual language via PixelLab, then replace hero landmarks, shared props, and a character kit with brand-grade assets — without spending credits on ground or UI.

**Architecture:** Keep Phaser + Vue + adapters. Add `assets/art/` as the source of truth for PixelLab PNGs. Introduce an optional texture override loader that registers approved files under existing keys (`building-arcade`, `fountain-base`, `char-player`, etc.) before or instead of procedural draws in `generatePlazaAtlas.ts`. Procedural atlas remains fallback (especially ground). No map expansion or new gameplay systems.

**Tech Stack:** PixelLab MCP, Phaser 3, Vue 3, TypeScript, Vitest, existing screenshot tooling (`puppeteer-core`).

**Design authority:** @docs/plans/2026-08-01-art-pass-b-design.md

**Hard gate:** Do not start Phase B (production landmarks) until Phase A Art Bible is frozen and written. Day one = Art Bible only.

---

### Task 1: Scaffold art docs + asset folders

**Files:**
- Create: `docs/art/design-principles.md`
- Create: `docs/art/nimworld-art-bible.md` (skeleton — fill after Phase A)
- Create: `docs/art/world-bible.md` (skeleton)
- Create: `docs/art/character-bible.md` (skeleton)
- Create: `docs/art/future-expansion.md`
- Create: `assets/art/README.md`
- Create dirs: `assets/art/{concepts,landmarks,props,characters,effects,rejected}/.gitkeep`

**Step 1:** Create folder tree and `assets/art/README.md` with naming convention + statuses:

```text
{subject}_v{NN}_{status}.png
Statuses: concept | candidate | approved | deprecated | rejected
```

**Step 2:** Write `docs/art/design-principles.md` with the ten principles from the design doc (verbatim).

**Step 3:** Write `docs/art/future-expansion.md` listing Harbor, Developer District, Museum, Pet Park, Event Square, seasonal themes — ideas only, no implementation.

**Step 4:** Scaffold Art Bible / World Bible / Character Bible with section headings only + “Status: Draft — freeze after Phase A”.

**Step 5:** Commit

```bash
git add docs/art assets/art
git commit -m "docs(art): scaffold Art Bible, World Bible, and asset folders"
```

---

### Task 2: Texture override loader (code before art)

**Files:**
- Create: `apps/web/src/game/assets/artManifest.ts`
- Create: `apps/web/src/game/assets/loadArtOverrides.ts`
- Create: `apps/web/src/game/assets/artManifest.test.ts`
- Modify: `apps/web/src/game/createGame.ts`
- Modify: `apps/web/src/game/assets/generatePlazaAtlas.ts`

**Step 1:** Write failing test for manifest → texture key mapping:

```ts
import { describe, expect, it } from 'vitest'
import { resolveArtOverride } from './artManifest'

describe('artManifest', () => {
  it('maps approved fountain to fountain-base key', () => {
    expect(resolveArtOverride('fountain-base')).toMatch(/fountain_.*_final\.png$/)
  })

  it('returns null when no approved override', () => {
    expect(resolveArtOverride('tile-grass')).toBeNull()
  })
})
```

**Step 2:** Run test — expect FAIL (module missing).

```bash
npm run test -w @nimworld/web -- artManifest
```

**Step 3:** Implement `artManifest.ts`:

```ts
/** Approved PixelLab overrides. Keys = Phaser texture keys. Paths relative to /assets/art/. */
export const ART_OVERRIDES: Record<string, string | null> = {
  'fountain-base': null,
  'fountain-crystal': null,
  'building-arcade': null,
  'building-arena': null,
  'building-townhall': null,
  'building-social': null,
  'building-construction': null,
  'fx-arcade-portal': null,
  // props / chars filled as approved
}

export function resolveArtOverride(key: string): string | null {
  return ART_OVERRIDES[key] ?? null
}
```

**Step 4:** Implement `loadArtOverrides(scene)` that for each non-null path loads the image and adds texture under the Phaser key **before** `generatePlazaAtlas` runs. Change `makeTex` to skip draw when `scene.textures.exists(key)`.

**Step 5:** Wire in `createGame.ts` Boot/preload: load overrides → then `generatePlazaAtlas(this)`.

**Step 6:** Run tests + `npm run build -w @nimworld/web` — pass with all overrides null (procedural unchanged).

**Step 7:** Commit

```bash
git commit -m "feat(game): optional PixelLab texture overrides with procedural fallback"
```

---

### Task 3: Phase A — Art Bible concepts (8 gens, day one)

**Files:**
- Create: `assets/art/concepts/*_v01_concept.png` (downloaded from PixelLab)
- Modify: `docs/art/nimworld-art-bible.md` (fill from results)
- Optional rejects → `assets/art/rejected/`

**Hard gate:** No landmark/prop/character production assets this task.

**Step 1:** Confirm PixelLab balance (`get_balance`). Expect enough for 8 gens. If subscription needed, stop and ask user.

**Step 2:** Generate in this exact order (style: low top-down, blue-hour, moodboard-aligned):

| # | Subject | Suggested tool | Save as |
| --- | --- | --- | --- |
| 1 | Hero Fountain (NimConnect identity) | `create_image_pro` | `concepts/fountain_v01_concept.png` |
| 2 | Plaza overview | `create_image_pro` | `concepts/plaza_v01_concept.png` |
| 3 | Arcade + cyan portal | `create_image_pro` | `concepts/arcade_portal_v01_concept.png` |
| 4 | Materials sheet (stone/roof/window/veg) | `create_image_pro` or pixen | `concepts/materials_v01_concept.png` |
| 5 | Character scale sheet | `create_image_pro` | `concepts/character_scale_v01_concept.png` |
| 6 | Lighting study | `create_image_pro` | `concepts/lighting_v01_concept.png` |
| 7 | Style refinement (fix weakest of 1–6) | `create_image_pro` / `edit_image` | `concepts/*_v02_concept.png` |
| 8 | Final style freeze frame | `create_image_pro` | `concepts/style_lock_v01_final.png` |

Use moodboard as style reference when tools accept `style_image_url` / reference images. Prefer URLs over large base64.

**Step 3:** For each concept, run Brand Recognition + Emotional tests. Move fails to `rejected/` (never delete).

**Step 4:** Freeze and write Art Bible sections from concepts:

- Why NimWorld exists (from design)
- Ecosystem scope paragraph
- Palette (hex from concepts)
- Materials: roof, stone, vegetation, window
- Outline thickness, shadow style, character scale
- Lighting + animation principles + camera
- Visual hierarchy
- Brand / Emotional / checklist
- Do / Don’t with concept thumbnails referenced by path

**Step 5:** Commit docs + concepts only

```bash
git add docs/art assets/art/concepts assets/art/rejected
git commit -m "docs(art): freeze NimWorld Art Bible from Phase A concepts"
```

**Step 6:** STOP. Do not proceed to Task 4 until a human confirms: “visual language frozen.”

---

### Task 4: Phase B — Hero Landmark Kit (18 gens)

**Files:**
- Create: `assets/art/landmarks/*.png`, `assets/art/effects/arcade_portal_*.png`
- Modify: `docs/art/world-bible.md`
- Modify: `apps/web/src/game/assets/artManifest.ts` (point approved finals)

**Budget:**

| Asset | Gens | Screenshot role |
| --- | ---: | --- |
| Fountain (+ crystal if split) | 4 | Hero |
| Arcade facade | part of 5 | Hero |
| Arcade portal FX | part of 5 | Hero |
| Arena | 4 | Hero |
| Town Hall | 2 | Supporting |
| Social Club | 2 | Supporting |
| Marketplace construction | 1 | Background |

**Step 1:** Generate Fountain candidates with Phase A style lock as reference. Transparent sprite preferred. Save `landmarks/fountain_vNN_candidate.png`. Run silhouette + Brand + Emotional + checklist. Promote one to `_final`.

**Step 2:** Arcade facade + **dedicated portal FX** in `effects/`. Portal must be recognizable alone (cyan / magical / inviting). Promote finals.

**Step 3:** Arena → Town Hall → Social → Marketplace (1 gen — accept “good enough temporary”).

**Step 4:** Fill World Bible per landmark: Purpose, Mood, Color, Sounds, Lighting, Props, Animation, Recognition test Y/N, Screenshot role.

**Step 5:** Update `ART_OVERRIDES` paths for approved landmark keys. Copy finals into `apps/web/public/assets/art/` **or** configure Vite static serve from `assets/art/` — pick one and document in `assets/art/README.md`. Prefer mirroring approved files into `apps/web/public/assets/art/` for simple Phaser `load.image`.

**Step 6:** Run app, screenshot, compare to moodboard intent (not pixel-match). Build green.

**Step 7:** Commit

```bash
git commit -m "feat(art): hero landmark kit with Art Bible style lock"
```

Use reserve (max 2) only if Fountain/Arcade/Arena fail Brand Recognition Test.

---

### Task 5: Phase C — Shared Prop Kit (8 gens)

**Files:**
- Create: `assets/art/props/*.png`
- Modify: `artManifest.ts` for keys: `prop-tree`, `prop-bush`, `prop-bench`, `prop-lantern`, `prop-crates`, banners, `prop-statue`, etc.
- Update: `assets/art/README.md` index

**Step 1:** Prioritize high-reuse props (tree, bush, bench, lantern, crates). Batch descriptions with Art Bible materials language.

**Step 2:** Review checklist each. Reject → `rejected/`.

**Step 3:** Wire approved overrides. Ground tiles stay procedural (`tile-grass`, `tile-path`, `tile-stone` remain null).

**Step 4:** Commit

```bash
git commit -m "feat(art): shared prop kit for multi-app reuse"
```

---

### Task 6: Phase D — Character Kit (4 gens)

**Files:**
- Create: `assets/art/characters/{player,guide,builder,tournament_master}_*.png`
- Modify: `docs/art/character-bible.md`
- Modify: character sheet keys / NPC mapping in `locations.ts` / `PlazaScene.ts` as needed
- Ghost: no gen — translucent Player

**Roster:** Player · Guide · Builder · Tournament Master

**Step 1:** Fill Character Bible (proportions, eyes, outline, idle/walk, speed, shadow, color restrictions) from Phase A scale sheet **before** spending gens.

**Step 2:** Generate with `create_character` mode `v3`, view `low top-down`, size matching current 32×48 frame grid **or** document a one-time sheet rebuild if PixelLab canvas differs. Prefer matching existing `registerCharacterAnims` layout (4 dirs × 4 frames @ 32×48).

If PixelLab sheets cannot match 32×48 grid in 4 gens, ship south-facing idle sprites first and keep procedural walk as fallback — document the gap in Character Bible.

**Step 3:** Map sheets: `char-player`, Guide → `char-npc-b` (or dedicated key), Builder → construction-adjacent NPC, Tournament Master → Arena-adjacent. Ghost continues as alpha Player / `char-ghost` override from player sheet.

**Step 4:** Family match review (same outline/eye/shadow rules). Commit

```bash
git commit -m "feat(art): shared character kit (player, guide, builder, tournament master)"
```

---

### Task 7: Screenshots + README polish

**Files:**
- Update: `docs/screenshots/*` via puppeteer-core (same approach as Phase 3)
- Update: `README.md` — point to Art Bible + note Art Pass B
- Update: `assets/art/README.md` — full manifest table (file → key → status → phase)

**Step 1:** Capture desktop + mobile screenshots after load wait.

**Step 2:** README links: design + Art Bible + World Bible.

**Step 3:** Commit

```bash
git commit -m "docs: Art Pass B screenshots and asset manifest"
```

---

### Task 8: Verification

**Step 1:** `npm run test -w @nimworld/web` — green
**Step 2:** `npm run build -w @nimworld/web` — green
**Step 3:** Manual checklist:

- [ ] Fountain recognizable alone
- [ ] Arcade portal recognizable alone
- [ ] Landmarks readable without labels
- [ ] Characters read as one family
- [ ] Ground still procedural (intentional)
- [ ] No PixelLab UI assets
- [ ] Rejected folder preserved
- [ ] Gen spend ≤ 40 (log actuals in `assets/art/README.md`)

---

## Credit log (fill during execution)

| Phase | Planned | Actual | Notes |
| --- | ---: | ---: | --- |
| A Art Bible | 8 | | |
| B Hero Landmarks | 18 | | |
| C Props | 8 | | |
| D Characters | 4 | | |
| Reserve | 2 | | |
| **Total** | **40** | | |

---

## Execution handoff

After Task 1–2 (scaffolding + loader), pause for PixelLab subscription if needed, then Task 3 only until style freeze is confirmed.
