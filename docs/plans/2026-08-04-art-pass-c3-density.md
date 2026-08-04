# Art Pass C3 — Foliage and Density Implementation Plan

**Goal:** Make the plaza read as an enclosed, layered world by re-authoring prop placement against the radial layout and adding a foliage and border-wall kit.

**Spec:** `docs/plans/2026-08-03-art-pass-c-design.md` (phase C3)

**Tech Stack:** PixelLab `create_map_object`, TypeScript, Phaser 3, Vitest.

## Global Constraints

- **Reuse before regenerate** (design principle #4). `prop-tree`, `prop-bush`, `prop-bench`, `prop-lantern` and `prop-crates` are approved finals and stay. C3 adds variety around them rather than replacing them.
- Every asset is style-matched by passing a **crop of the live plaza** as `background_image`, which is how the object inherits the frozen environment style instead of drifting from it.
- The Brand Recognition and Emotional tests (`docs/art/design-principles.md` #7, #8) plus the `assets/art/README.md` QA gate — true RGBA, transparent outside the subject, spot-checked at plaza scale — gate every PNG before it is wired.
- **No layout changes.** `buildPlazaTerrainGrid()`, collision and the terrain QA are C1's and stay untouched. C3 only adds props and, in Task 5, grass-only trails.

---

## Why placement is derived rather than authored

`DECOR` in `locations.ts` is currently a blanket 1.2× rescale of a composition authored against the old 960×720 cross-shaped plaza, kept alive by a filter that drops whatever landed in the canal. Its own comment defers re-authoring to C3.

Hand-authoring ~50 fresh pixel coordinates against the radial layout would be wrong for the same reason the old ones went stale: the layout has already moved twice since they were written (the C1 rewrite, then hub radius 4 → 6), and each move silently relocated every prop relative to the paving. Landing pads hit exactly this problem and were fixed by deriving them from the sprite.

So placement becomes a **deterministic, terrain-aware scatter**: candidate positions are generated from a seeded PRNG, and a candidate survives only if its base cell is grass and it clears the landmarks and the avenues. Re-tuning the hub or the canal re-scatters the props correctly, and a test can assert the invariant that no prop stands on stone or in the water.

Determinism matters for two reasons: the composition must be reviewable and stable across reloads, and the tests must be able to assert against it.

## Where the density has to go

Measured against the current grid, stone is 23% of the world and 39% of dry land — the paving is not too large in absolute terms. But within the camera's view frame at the hub it is 41% stone to 52% grass, and the plaza still reads as one slab.

The cause is that each Wang layer paints a transition tile beyond its own cells, so close to the hub the six avenues' expanded edges fuse and the grass wedges between them close up. The wedges only open out toward the canal.

Two consequences for this pass:

1. Foliage density should **ramp with distance from the center**. There is no room near the hub, and forcing props in there would crowd the avenues.
2. The band between the landmark ring and the canal is the largest uninterrupted grass in the world and is currently empty. It is where the enclosure has to come from.

---

## Task 1: Derived placement, existing props only

No credits. Lands the mechanism so the composition can be reviewed before any art is commissioned, exactly as C1 landed the ground plan in placeholder colors.

**Files:**
- Create: `apps/web/src/game/world/decorPlacement.ts`
- Create: `apps/web/src/game/world/decorPlacement.test.ts`
- Modify: `apps/web/src/game/world/locations.ts` (`DECOR` becomes the generated composition; delete `DECOR_960`, `DECOR_SCALE`, `CANAL_INNER_RADIUS`)

- [x] Seeded PRNG (small xorshift; no dependency) so the scatter is identical every run.
- [x] `isGrassAt(x, y)` against `buildPlazaTerrainGrid()`, plus clearance checks against `LOCATIONS`, `FUTURE_LANDMARKS` and the avenue bands.
- [x] Ring-banded scatter: per band, a target count and a minimum spacing, with density ramping outward. Rejection-sample with a bounded attempt count so it always terminates.
- [x] Keep the hand-placed set for things that are compositional rather than scattered — benches and lanterns along the avenues, banners at landmarks — but anchor their coordinates to `PLAZA_CENTER` and the landmark positions instead of absolute pixels.
- [x] Tests: every prop's base cell is grass; none is inside a landmark's collision box; spacing minimum holds; the outer band gets more props than the inner; the composition is byte-identical across two builds.

## Task 2: Generate the foliage kit

**Files:**
- Create: `assets/art/props/{conifer,broadleaf,flowerbed,hedge}_v01_*.png`
- Modify: `assets/art/README.md` (manifest rows + credit log)

- [x] Generate at `view: "low top-down"` with the frozen outline/shading settings.
- [x] QA each against the gate before promoting to `_final`. Rejects go to `rejected/`, never deleted.
- [x] Delivered 8 rather than 4: conifer, broadleaf, blossom tree, shrub, fern, boulder, flower bed, hedge. 11 generations.

**Correction — style matching was not used.** The plan called for a plaza crop as
`background_image`. The existing approved props were generated in basic mode with
art-bible language in the description, and that recipe was followed instead:
inpainting returns the object composited against the supplied background, and a
baked background is exactly what the QA gate rejects and what killed
`arcade_v02`. All 11 passed the true-alpha check with fully transparent corners.

**Correction — `view` is `low top-down`, not `high`.** The art bible specifies
low top-down / low-isometric 3/4 to match the plaza north star.

## Task 3: Generate the border wall kit

**Files:**
- Create: `assets/art/props/wall_{straight,corner,pillar}_v01_*.png`
- Modify: `assets/art/README.md`

- [x] Two pieces: a straight run and a lantern pillar. 3 generations.
- [ ] A corner piece was **not** generated. The wall follows an ellipse, so every
      segment sits at a slightly different angle and there is no discrete corner
      to turn; a dedicated corner tile would have nowhere to go.

**No bridge.** The design doc's batch table lists one, but its own passability section dropped bridges when the canal moved outside the landmark band — no avenue crosses the water, so a bridge would span nothing. Generating one would be a prop looking for a purpose.

## Task 4: Wire the kit and the wall

**Files:**
- Modify: `apps/web/src/game/assets/artManifest.ts` (`ART_OVERRIDES` + `ART_DISPLAY_SIZE`)
- Modify: `apps/web/src/game/world/decorPlacement.ts` (new keys enter the scatter tables)
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (wall collision; sway tween for the new trees)

- [x] Register the new keys and display sizes; `artManifest.test.ts` already validates the manifest.
- [x] ~~Wall segments follow the canal bank as a ring of props~~ — **cut on review.** See Task 8.
- [x] Give the new trees the existing sway tween so foliage motion stays consistent.

## Task 8: Review pass — what the first build got wrong

Four defects, all visible in the 1440×900 capture and none caught by the tests
as they stood.

- [x] **The border wall is cut.** The kit is one straight-on sprite, and a
  straight-on sprite cannot follow a curved bank: it faces the camera whichever
  way the shore runs, so the east and west banks read as stones dropped side-on
  and the corners never turn. This was worth a real attempt first — the run was
  originally sampled by angle, which on an ellipse bunches segments 31px apart
  at the ends and leaves 380px holes along the flat sides, and re-stepping it by
  arc length closed every seam. It still looked wrong, because the problem was
  never the placement. Enclosing the plaza needs an oriented kit (four runs plus
  inner and outer corners, chosen from the bank's local direction, the way the
  terrain layers already pick Wang tiles). Assets moved to
  `assets/art/rejected/border_wall_v01/`. The treeline carries the boundary
  meanwhile, which it does without needing to know which way it is facing.
- [x] **The procedural placeholders are gone.** Banners, fence, joystick, coffee
  stand, statue, firepit and picnic table were all drawn in
  `generatePlazaAtlas.ts` and never had art made for them. Beside the PixelLab
  sprites they read as flat coloured blocks. This costs design principle #3 —
  landmarks no longer have a micro-landmark saying what they are — but a bad
  prop states it worse than no prop. Only `prop-crates` survives, at the Arena,
  because it is the one with real art. Re-earning the others is an art task, not
  a placement one.
- [x] **Lanterns and benches moved to the paving.** Both were placed on grass:
  the lantern loop deliberately stepped perpendicular *off* the road, so civic
  lighting stood in whatever grass it found. Lighting reads as lighting when it
  lines a street. Inverted to walk out to the last paving cell — the kerb.
- [x] **Benches are placed against their fixed orientation.** The sprite is a
  front view with the seat toward the camera, so it only reads with its back to
  the north and cannot be set at an arbitrary bearing. They now sit on the
  fountain's east and west kerbs facing south, and the placement requires paving
  to continue south of the anchor so the seat does not overhang the kerb. Two
  benches placed rather than scattered seating: the honest number for one
  orientation is small.
- [x] **The old `prop-tree` is retired.** Its pale mint canopy sits far outside
  the `#002010`–`#104010` vegetation range the art bible specifies, and it read
  as a sprite from another game wherever it landed. `oak_v01` replaces it in the
  same silhouette, with `poplar_v01` and `willow_v01` added for silhouette
  variety — a slim vertical and a drooping mass against the existing rounded and
  conical ones.
- [x] **Scatter is clumped.** Sampling each prop independently against a minimum
  spacing produces blue noise: evenly spread, never touching, never grouped. The
  regularity is what reads as the same few sprites pasted across the map, not
  the sprite count. Thickets are seeded and members drawn around the seed,
  biased toward the seed's texture. Thicket seeds take textures in turn rather
  than at random, because random seeding starved whole textures — a band of six
  thickets could easily miss one of its four trees.

## Task 5: Garden trails — deferred

**Files:**
- Modify: `apps/web/src/game/world/plazaTerrainMap.ts`

- [ ] Lay short `TERRAIN_PATH` trails through the outer grass band, linking foliage clusters and the future-landmark teases.
- [ ] Trails must touch **grass only** — never stone. That is the whole reason `path_warm_wang_v01` was kept when the two-tone ground plan was withdrawn, and a trail that reaches the paving reintroduces the grass channel that killed it.
- [ ] Extend `plazaTerrainMap.test.ts`: no path cell is orthogonally adjacent to a stone cell.
- [ ] The existing reachability QA must stay green — trails are walkable, so they cannot strand anything.

Deferred deliberately: the foliage now fills the outer band, and trails should be
routed against where the clusters actually landed rather than laid speculatively
underneath them. It is a terrain change, independent of everything above.

## Task 6: Verify

- [x] `npm test` green (135 tests); `npx vue-tsc -b` clean.
- [x] Manual at 1440×900: the outer band carries a treeline, foliage groups into thickets with clearings between, lighting and seating line the paving, and no plant stands on paving or in the water.
- [ ] 360×800 not reviewed.
- [ ] `docs/screenshots/` not refreshed — the HUD is being rewritten in parallel, and capturing now would bake someone else's in-progress work into these screenshots.

## Task 7: Record the phase

- [x] Mark C3 done in `docs/plans/2026-08-03-art-pass-c-design.md`, including the dropped bridge.
- [x] Update the credit log in `assets/art/README.md` with planned vs actual.
- [ ] `docs/ROADMAP.md` shipped list still says "two art passes"; it needs the third once C closes (C4 and C5 remain).
