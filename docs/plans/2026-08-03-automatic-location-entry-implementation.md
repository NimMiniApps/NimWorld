# Automatic Location Entry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open every fixed plaza location once when the player enters its proximity zone, without requiring Enter, Space, or a prompt tap.

**Architecture:** Keep the decision in Phaser's proximity flow. A small pure helper identifies a new fixed-location entry from the previous active target; `PlazaScene` uses that result to emit the existing `OPEN_LOCATION` event after publishing the interaction target. The existing active-target state is the re-entry latch, so closing in place does not immediately reopen the overlay.

**Tech Stack:** TypeScript, Phaser 3, Vue 3, Vitest

---

### Task 1: Specify the location-entry latch

**Files:**
- Create: `apps/web/src/game/world/locationEntry.ts`
- Create: `apps/web/src/game/world/locationEntry.test.ts`

**Step 1: Write the failing tests**

Create `apps/web/src/game/world/locationEntry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getLocationToAutoOpen } from './locationEntry'

describe('getLocationToAutoOpen', () => {
  it('opens a fixed location when entering its zone', () => {
    expect(getLocationToAutoOpen(null, 'town-hall')).toBe('town-hall')
  })

  it('does not reopen while the same location remains active', () => {
    expect(getLocationToAutoOpen('town-hall', 'town-hall')).toBeNull()
  })

  it('opens a location again after exit resets the active target', () => {
    expect(getLocationToAutoOpen(null, 'town-hall')).toBe('town-hall')
  })

  it('opens the newly entered location when targets change', () => {
    expect(getLocationToAutoOpen('arcade', 'arena')).toBe('arena')
  })

  it('does not auto-open for a ghost-only proximity target', () => {
    expect(getLocationToAutoOpen('ghost:Luna', null)).toBeNull()
  })
})
```

**Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -w @nimworld/web -- src/game/world/locationEntry.test.ts
```

Expected: FAIL because `./locationEntry` does not exist.

**Step 3: Implement the minimal helper**

Create `apps/web/src/game/world/locationEntry.ts`:

```ts
export function getLocationToAutoOpen(
  activeTargetId: string | null,
  nearestLocationId: string | null,
): string | null {
  if (!nearestLocationId || nearestLocationId === activeTargetId) return null
  return nearestLocationId
}
```

This helper deliberately receives only fixed-location IDs as its second argument. Ghost proximity is represented by `null`, so it cannot trigger automatic entry.

**Step 4: Run the focused test and verify GREEN**

Run:

```bash
npm run test -w @nimworld/web -- src/game/world/locationEntry.test.ts
```

Expected: 5 tests PASS with no warnings.

**Step 5: Commit the tested helper**

```bash
git add apps/web/src/game/world/locationEntry.ts apps/web/src/game/world/locationEntry.test.ts
git commit -m "test(web): specify automatic location entry latch"
```

### Task 2: Open fixed locations on the proximity-entry edge

**Files:**
- Modify: `apps/web/src/game/scenes/PlazaScene.ts:668-720`

**Step 1: Import the tested helper**

Near the existing world imports in `PlazaScene.ts`, add:

```ts
import { getLocationToAutoOpen } from '@/game/world/locationEntry'
```

**Step 2: Calculate the entry before mutating the active-target latch**

Immediately before the existing `nextId` calculation in `updateProximity`, add:

```ts
const locationToOpen = getLocationToAutoOpen(this.activeLocationId, nearest?.id ?? null)
```

The calculation must happen before assigning `this.activeLocationId = nextId`; otherwise every valid entry will look like an unchanged target.

**Step 3: Emit the existing open event for fixed locations only**

In the `if (nearest)` branch, keep `INTERACTION_AVAILABLE` first, then add:

```ts
if (locationToOpen) {
  this.bridge.emitWorld({ type: 'OPEN_LOCATION', locationId: locationToOpen })
}
```

Do not add this emission to the ghost branch. Do not clear the active target when Vue closes an overlay: retaining it is what prevents immediate reopening while the player remains in range.

**Step 4: Run the focused and bridge tests**

Run:

```bash
npm run test -w @nimworld/web -- src/game/world/locationEntry.test.ts src/game/bridge/WorldBridge.test.ts
```

Expected: all focused tests PASS.

**Step 5: Commit the scene integration**

```bash
git add apps/web/src/game/scenes/PlazaScene.ts
git commit -m "feat(web): open plaza locations on approach"
```

### Task 3: Update in-app interaction guidance

**Files:**
- Modify: `apps/web/src/App.vue:80-97`

**Step 1: Replace the fixed-location interaction instruction**

Change the footer hint from:

```vue
<p class="hint" :class="{ faded: !showMoveHint }">Enter / tap prompt to interact</p>
```

to:

```vue
<p class="hint" :class="{ faded: !showMoveHint }">Walk up to a landmark to enter</p>
```

Keep `InteractionPrompt` and its keyboard/tap command intact because moving ghost/player targets still use manual interaction and manual reopening remains harmless.

**Step 2: Run the web build**

Run:

```bash
npm run build -w @nimworld/web
```

Expected: `vue-tsc -b` and `vite build` both succeed.

**Step 3: Commit the guidance change**

```bash
git add apps/web/src/App.vue
git commit -m "copy(web): explain automatic landmark entry"
```

### Task 4: Verify the complete behavior

**Files:**
- Verify: `apps/web/src/game/world/locationEntry.test.ts`
- Verify: `apps/web/src/game/scenes/PlazaScene.ts`
- Verify: `apps/web/src/App.vue`

**Step 1: Run the full repository test gate**

Run:

```bash
npm test
```

Expected: app-manifest and web Vitest suites PASS.

**Step 2: Run the full repository build gate**

Run:

```bash
npm run build
```

Expected: app-manifest TypeScript build, web `vue-tsc`, and Vite production build succeed.

**Step 3: Review the scoped diff and existing worktree changes**

Run:

```bash
git status --short
git diff HEAD~3 -- apps/web/src/game/world/locationEntry.ts apps/web/src/game/world/locationEntry.test.ts apps/web/src/game/scenes/PlazaScene.ts apps/web/src/App.vue
```

Expected: the feature diff contains only the entry helper/tests, the proximity emission, and the guidance copy. Existing unrelated modified and untracked files remain preserved.

**Step 4: Manually verify in the browser**

Start the app with its normal local API/web workflow and confirm:

1. Approach each of the Fountain, Arcade, Arena, Marketplace, Social Club, and Town Hall; each overlay opens without keyboard or prompt input.
2. Close an overlay without moving; it stays closed.
3. Walk outside the location radius and return; the overlay opens again.
4. Approach a ghost; no overlay opens automatically and the manual prompt remains available.
5. Repeat approach and close-in-place using the mobile joystick viewport.

**Step 5: Record verification evidence**

If manual verification requires no code changes, do not create an empty commit. Report the exact test/build results and any browser limitation in the handoff.
