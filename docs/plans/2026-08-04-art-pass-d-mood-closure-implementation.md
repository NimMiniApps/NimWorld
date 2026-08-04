# Art Pass D — Mood Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the mood gap between the live plaza and the NimConnect Plaza mockup via an agent-driven loop; the owner only approves or rejects screenshots.

**Architecture:** Keep the stamp → Wang → derived-decor pipeline. Tune `BANDS` / placement first, add a review-only camera for hub screenshots, absorb Art Pass C4 (landmark scale + signboards) as D3, then cheap atmosphere. Each phase gates on owner `approve` / `reject: <sentence>` before the next starts.

**Tech Stack:** Phaser 3, TypeScript, Vitest, PixelLab (D3 art only), existing `decorPlacement.ts` / `PlazaScene.ts` / `artManifest.ts`

**Spec:** `docs/plans/2026-08-04-art-pass-d-mood-closure-design.md`

**Owner loop (every phase):** deliver 2–4 PNGs under `docs/screenshots/art-pass-d/` + a short note → wait for `approve` or `reject: …` → iterate same phase (cap 3 tries) → only then start the next phase.

---

## Task 1: Screenshot folder + review checklist stub

**Files:**
- Create: `docs/screenshots/art-pass-d/README.md`

**Step 1: Create the folder README**

```markdown
# Art Pass D screenshots

Owner gate for mood closure. Agents drop PNGs here per phase (`d1-*.png`, `d2-*.png`, …).

Reply `approve` or `reject: <one sentence>`.

Checklist (mood, not pixel-match):
1. Hub enclosed (foliage / water, not open field)
2. Paths + fountain readable at overview
3. Landmarks have weight + clear signs
4. Glow reads on portals, lamps, crystal
5. Mobile follow-cam still playable
```

**Step 2: Commit**

```bash
git add docs/screenshots/art-pass-d/README.md
git commit -m "docs: add Art Pass D screenshot gate folder"
```

---

## Task 2: D1 — denser outer bands (params only)

No new art. Raise foliage in the canal-adjacent grass where the mockup reads enclosed.

**Files:**
- Modify: `apps/web/src/game/world/decorPlacement.ts` (`BANDS` counts / ranges)
- Modify: `apps/web/src/game/world/decorPlacement.test.ts` (band density / grass invariants)
- Test: `apps/web/src/game/world/decorPlacement.test.ts`

**Step 1: Read current band expectations in the test**

Run: `npm test -w @nimworld/web -- src/game/world/decorPlacement.test.ts`
Expected: PASS (baseline).

**Step 2: Write / tighten a failing density assertion**

In `decorPlacement.test.ts`, assert that props with `canalT` in `[0.66, 0.93)` outnumber those in `[0.42, 0.66)` by a clear margin (e.g. outer ≥ 1.5× mid), and that total grass-standing decor count is above the current baseline (record current `DECOR.length` first, then require a higher floor after the tune — measure before changing).

Example shape:

```ts
it('puts more canopy/ground cover in the outer band than mid', () => {
  const outer = DECOR.filter((d) => {
    const t = canalT(d.x, d.y)
    return t >= 0.66 && t < 0.93
  }).length
  const mid = DECOR.filter((d) => {
    const t = canalT(d.x, d.y)
    return t >= 0.42 && t < 0.66
  }).length
  expect(outer).toBeGreaterThanOrEqual(Math.ceil(mid * 1.5))
})
```

If this already passes, raise the multiplier or add a minimum outer count based on measuring current output, then increase `BANDS` until the new floor fails, then implement.

**Step 3: Run test — fail or confirm need to raise floor**

Run: `npm test -w @nimworld/web -- src/game/world/decorPlacement.test.ts`
Expected: FAIL only after raising the floor above current behavior.

**Step 4: Tune `BANDS` in `decorPlacement.ts`**

Raise `count` on the `0.66–0.82` and `0.82–0.93` canopy and ground-cover bands (start ~+25–40% on outer canopy, ~+20% on outer ground). Do **not** add canopy inside `0.66` (avenue readability). Keep `SCATTER_SEED` unchanged so reviews are comparable after one deliberate retune.

Keep existing grass / landmark / spacing invariants green.

**Step 5: Run tests**

Run: `npm test -w @nimworld/web -- src/game/world/decorPlacement.test.ts src/game/world/worldLayout.test.ts`
Expected: PASS

**Step 6: Capture D1 screenshots (manual / browser)**

With `npm run dev` + API as needed, capture:

- `docs/screenshots/art-pass-d/d1-hub-followcam.png` (default play cam at fountain)
- `docs/screenshots/art-pass-d/d1-canal-band.png` (player near outer grass)
- Optional: one landmark close-up showing treeline behind it

Note for owner: “D1 denser outer foliage only; no new art; play cam unchanged.”

**Step 7: STOP for owner gate**

Do not start Task 3 until owner replies `approve` or iterate this task on `reject: …` (max 3 tries).

**Step 8: Commit after approve (or after a rejected iteration that changed code)**

```bash
git add apps/web/src/game/world/decorPlacement.ts apps/web/src/game/world/decorPlacement.test.ts docs/screenshots/art-pass-d/
git commit -m "feat(web): densify outer plaza foliage for Art Pass D1"
```

---

## Task 3: D2 — review overview camera (play cam unchanged)

Play mode must keep cover-zoom so the player never sees the whole world. Review mode is for screenshots and QA only.

**Files:**
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (`fitCameraToPlaza`, optional review flag)
- Modify: `apps/web/src/game/world/locations.ts` (optional `REVIEW_FRAME` constant)
- Create or modify: small unit-testable helper if zoom math can be extracted — prefer testing pure math over Phaser scene
- Test: prefer `locations.ts` / new `cameraFit.ts` pure functions; do not require headless Phaser unless already patterned in repo

**Step 1: Add `REVIEW_FRAME` (world-sized content frame)**

In `locations.ts`:

```ts
/** Full-world frame for Art Pass D screenshot / QA overview only. Not used in play. */
export const REVIEW_FRAME = {
  width: WORLD.width,
  height: WORLD.height,
}
```

Keep `VIEW_FRAME` as-is for play.

**Step 2: Extract zoom math (TDD)**

Create `apps/web/src/game/world/cameraFit.ts`:

```ts
export function coverZoom(
  viewW: number,
  viewH: number,
  frameW: number,
  frameH: number,
  worldW: number,
  worldH: number,
  opts?: { mobileBoost?: number; min?: number; max?: number },
): number {
  const minCover = Math.max(viewW / worldW, viewH / worldH)
  const contentCover = Math.max(viewW / frameW, viewH / frameH)
  const boost = opts?.mobileBoost ?? 1
  const min = opts?.min ?? 1.15
  const max = opts?.max ?? 3.2
  const z = Math.max(minCover, contentCover) * boost
  return Math.min(max, Math.max(min, z))
}
```

Test: play frame yields higher zoom than review frame for the same viewport; review zoom is ≤ play zoom.

**Step 3: Wire PlazaScene**

- `fitCameraToPlaza` uses `VIEW_FRAME` + existing clamps (behavior unchanged).
- Add `setReviewOverview(on: boolean)` (or read `?reviewCam=1` / a `PlazaSceneData` flag) that:
  - stops follow or centers on `PLAZA_CENTER`
  - zooms with `REVIEW_FRAME` and a lower min clamp so the hub + canal fit
  - does not become the default boot path

Document in a one-line comment: review-only; play stays follow-cam.

**Step 4: Run tests**

Run: `npm test -w @nimworld/web -- src/game/world/`
Expected: PASS

**Step 5: Capture D2 screenshots**

- `d2-review-overview.png` (review cam on)
- `d2-play-cam.png` (default — prove play unchanged)

Note: “D2 review overview for mockup comparison; play cam unchanged.”

**Step 6: STOP for owner gate**

**Step 7: Commit after approve**

```bash
git add apps/web/src/game/world/locations.ts apps/web/src/game/world/cameraFit.ts apps/web/src/game/world/cameraFit.test.ts apps/web/src/game/scenes/PlazaScene.ts docs/screenshots/art-pass-d/
git commit -m "feat(web): add review overview camera for Art Pass D2"
```

---

## Task 4: D3 — landmark weight audit (reuse before regenerate)

Absorbs Art Pass C4. Prefer scaling / signboard props over regenerating whole buildings.

**Files:**
- Modify: `apps/web/src/game/assets/artManifest.ts` (`ART_DISPLAY_SIZE`)
- Modify: `apps/web/src/game/world/locations.ts` (collide boxes if scale changes)
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (signboard placement if needed)
- Possibly create: `assets/art/props/sign_*_v01_*.png` via PixelLab only if scale-up alone is insufficient
- Tests: `artManifest.test.ts`, `plazaTerrainMap.test.ts` (pads derive from display size)

**Step 1: Measure vs mockup**

With D2 review shot side-by-side with the mockup, list which landmarks feel undersized (likely Marketplace / Social / Town Hall first). Prefer bumping `ART_DISPLAY_SIZE` 10–20% over new gens.

**Step 2: Adjust display sizes + collision**

Update `ART_DISPLAY_SIZE` and matching `collideW` / `collideH` on `LOCATIONS`. Landing pads re-derive from display size — run terrain tests.

**Step 3: Run tests**

Run: `npm test -w @nimworld/web -- src/game/assets/artManifest.test.ts src/game/world/plazaTerrainMap.test.ts src/game/world/locations.test.ts`
Expected: PASS

**Step 4: Signboards (only if owner/mockup still need them)**

If scaled buildings still lack readable labels:

- Reuse principle: small PixelLab sign props or text-in-world already used for future landmarks
- Wire keys in `artManifest.ts`, place relative to landmark positions in `PlazaScene` or fixed anchors in `decorPlacement` (compositional, not scatter)
- Do not invent mockup-only location names

**Step 5: Capture D3 screenshots**

- `d3-review-overview.png`
- Close-ups: Arcade, Arena, Social Club (and others if changed)

**Step 6: STOP for owner gate**

**Step 7: Commit after approve**

```bash
git add apps/web/src/game/assets/artManifest.ts apps/web/src/game/world/locations.ts apps/web/src/game/scenes/PlazaScene.ts assets/art/ docs/screenshots/art-pass-d/
git commit -m "feat(web): scale landmarks and signs for Art Pass D3"
```

---

## Task 5: D4 — atmosphere (cheap glow / dusk first)

**Files:**
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (existing lantern/portal/fountain glow alphas, optional dusk tint on camera or grass)

**Step 1: Inventory current glow**

Lantern circles, portal spill, fountain glow already exist in `PlazaScene`. Tune alpha / radius / pulse before adding systems.

**Step 2: Optional dusk read**

If still flat after glow tune: slight cool multiply tint on non-emissive layers or camera background — keep mobile cheap (no full light pipeline).

**Step 3: Capture D4 screenshots**

- `d4-review-overview.png`
- `d4-arcade-glow.png`
- `d4-fountain-glow.png`

**Step 4: STOP for owner gate**

**Step 5: Commit after approve**

```bash
git add apps/web/src/game/scenes/PlazaScene.ts docs/screenshots/art-pass-d/
git commit -m "feat(web): tune plaza glow and dusk read for Art Pass D4"
```

---

## Task 6: Close the pass

**Files:**
- Modify: `docs/plans/2026-08-04-art-pass-d-mood-closure-design.md` (status → Done)
- Modify: `docs/plans/2026-08-03-art-pass-c-design.md` (mark C4 absorbed/done via D3 if accurate)
- Optional: `docs/ROADMAP.md` art-pass note if it still says only two passes

**Step 1: Mark docs done; link final screenshot set**

**Step 2: Commit**

```bash
git add docs/plans/docs/screenshots/art-pass-d/ docs/ROADMAP.md
git commit -m "docs: close Art Pass D mood closure"
```

---

## Execution notes

- **Do not** introduce Tiled, LDtk, or Phaser Editor.
- **Do not** add chat / XP / events / Hall of Fame mock panels.
- **Do not** rename locations to Profile / Post Office / Developer District.
- Border wall kit was rejected in C3 (orientation); enclosure comes from treeline + canal unless a later oriented wall kit is explicitly approved.
- `prop-wall` paths in the manifest may still point at rejected files from C3 cleanup — fix wiring if D1/D3 hits missing textures; do not re-enable the curved wall without an oriented kit.
- PixelLab spend belongs in D3 (and only if scale-up fails). D1/D2/D4 should be zero or near-zero credits.
