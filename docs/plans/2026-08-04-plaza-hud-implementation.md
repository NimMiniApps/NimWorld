# Plaza HUD (C5 + Preview Shells) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a cyber-pixel plaza HUD: restyled profile + preview NIM balance + wired bottom nav, plus desktop-only chat/friends/events preview shells.

**Architecture:** Evolve the existing Vue overlay HUD in `App.vue`. Extract a pure `bottomNav.ts` mapping helper (unit-tested). New presentational components under `apps/web/src/components/hud/`. Preview shells use hardcoded data and never touch the store. Desktop breakpoint `min-width: 900px` matches the existing joystick media query.

**Tech Stack:** Vue 3 + Pinia, existing `--nw-*` CSS tokens, Vitest

**Design authority:** @docs/plans/2026-08-04-plaza-hud-design.md

---

### Task 1: Bottom-nav mapping helper (TDD)

**Files:**
- Create: `apps/web/src/components/hud/bottomNav.ts`
- Create: `apps/web/src/components/hud/bottomNav.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import {
  BOTTOM_NAV_ITEMS,
  locationIdForNav,
  navIdsForLocation,
  type BottomNavId,
} from './bottomNav'

describe('bottomNav', () => {
  it('lists the six mockup tabs in order', () => {
    expect(BOTTOM_NAV_ITEMS.map((i) => i.id)).toEqual([
      'home',
      'apps',
      'inventory',
      'achievements',
      'friends',
      'wallet',
    ])
  })

  it('maps nav ids to plaza locations', () => {
    expect(locationIdForNav('home')).toBeNull()
    expect(locationIdForNav('apps')).toBe('arcade')
    expect(locationIdForNav('inventory')).toBe('fountain')
    expect(locationIdForNav('achievements')).toBe('fountain')
    expect(locationIdForNav('friends')).toBe('social-club')
    expect(locationIdForNav('wallet')).toBe('marketplace')
  })

  it('highlights home when no overlay is open', () => {
    expect(navIdsForLocation(null)).toEqual(['home'] satisfies BottomNavId[])
  })

  it('highlights both fountain tabs when fountain is open', () => {
    expect(navIdsForLocation('fountain').sort()).toEqual(['achievements', 'inventory'])
  })

  it('maps other locations to a single tab', () => {
    expect(navIdsForLocation('arcade')).toEqual(['apps'])
    expect(navIdsForLocation('social-club')).toEqual(['friends'])
    expect(navIdsForLocation('marketplace')).toEqual(['wallet'])
    expect(navIdsForLocation('arena')).toEqual([])
    expect(navIdsForLocation('town-hall')).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/web && npm test -- src/components/hud/bottomNav.test.ts
```

Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
export type BottomNavId =
  | 'home'
  | 'apps'
  | 'inventory'
  | 'achievements'
  | 'friends'
  | 'wallet'

export interface BottomNavItem {
  id: BottomNavId
  label: string
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'apps', label: 'Apps' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'friends', label: 'Friends' },
  { id: 'wallet', label: 'Wallet' },
]

const NAV_TO_LOCATION: Record<BottomNavId, string | null> = {
  home: null,
  apps: 'arcade',
  inventory: 'fountain',
  achievements: 'fountain',
  friends: 'social-club',
  wallet: 'marketplace',
}

export function locationIdForNav(id: BottomNavId): string | null {
  return NAV_TO_LOCATION[id]
}

export function navIdsForLocation(locationId: string | null): BottomNavId[] {
  if (!locationId) return ['home']
  return (Object.keys(NAV_TO_LOCATION) as BottomNavId[]).filter(
    (id) => NAV_TO_LOCATION[id] === locationId,
  )
}
```

**Step 4: Run tests — expect PASS**

```bash
cd apps/web && npm test -- src/components/hud/bottomNav.test.ts
```

**Step 5: Commit**

```bash
git add apps/web/src/components/hud/bottomNav.ts apps/web/src/components/hud/bottomNav.test.ts
git commit -m "$(cat <<'EOF'
feat(web): add bottom-nav location mapping helper

EOF
)"
```

---

### Task 2: Preview data module

**Files:**
- Create: `apps/web/src/components/hud/hudPreviewData.ts`

**Step 1: Add static preview payloads**

```ts
export const PREVIEW_NIM_BALANCE = '1,250.45'

export const PREVIEW_CHAT = {
  tabs: ['World', 'Friends', 'Nearby'] as const,
  messages: [
    { user: '@alice', text: 'Anyone up for NimBomber?' },
    { user: '@bob', text: 'Fountain looking good today' },
    { user: '@carol', text: 'Meet at the Arcade in 5' },
  ],
}

export const PREVIEW_FRIENDS = [
  { handle: '@alice', place: 'In Plaza', online: true },
  { handle: '@bob', place: 'In Arcade', online: true },
  { handle: '@dana', place: 'Offline', online: false },
]

export const PREVIEW_EVENTS = [
  { title: 'Bomber Tournament', time: '18:00 UTC' },
  { title: 'Plaza Meetup', time: '20:00 UTC' },
  { title: 'Dev Showcase', time: '22:30 UTC' },
]
```

**Step 2: Commit**

```bash
git add apps/web/src/components/hud/hudPreviewData.ts
git commit -m "$(cat <<'EOF'
feat(web): add HUD preview sample data

EOF
)"
```

---

### Task 3: Restyle ProfileChip + shared HUD chrome CSS

**Files:**
- Modify: `apps/web/src/components/hud/ProfileChip.vue`
- Modify: `apps/web/src/styles.css` (optional shared helpers: `.nw-hud-badge`, `.nw-icon-btn`)

**Step 1: Restyle ProfileChip**

Keep live `store.profile` data. Visual target:

- Square-ish avatar (slight radius, not full pill) to match mockup
- Handle as primary line; keep source line muted (or shorten)
- Stronger border using `--nw-cyan` / `--nw-panel-border`
- Optional pixel font on a tiny eyebrow if it stays readable at mobile size

Do **not** add XP bar or fake level.

**Step 2: Add small shared utilities in `styles.css` if reused by ≥2 components**

```css
.nw-hud-badge {
  display: inline-block;
  font-family: var(--nw-font-pixel);
  font-size: 0.45rem;
  letter-spacing: 0.04em;
  color: var(--nw-gold);
  border: 1px solid rgba(245, 166, 35, 0.45);
  border-radius: 6px;
  padding: 0.2rem 0.35rem;
}

.nw-icon-btn {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 12px;
  border: 1px solid var(--nw-panel-border);
  background: var(--nw-panel);
  color: var(--nw-muted);
  display: grid;
  place-items: center;
  cursor: not-allowed;
  opacity: 0.65;
}
```

**Step 3: Manual glance in `npm run dev` — profile still shows handle**

**Step 4: Commit**

```bash
git add apps/web/src/components/hud/ProfileChip.vue apps/web/src/styles.css
git commit -m "$(cat <<'EOF'
style(web): restyle ProfileChip for plaza HUD chrome

EOF
)"
```

---

### Task 4: BalanceChip + utility buttons

**Files:**
- Create: `apps/web/src/components/hud/BalanceChip.vue`
- Modify: `apps/web/src/App.vue` (top-right cluster)

**Step 1: Create BalanceChip**

```vue
<script setup lang="ts">
import { PREVIEW_NIM_BALANCE } from './hudPreviewData'
</script>

<template>
  <div class="balance-row">
    <div class="nw-panel balance" title="Preview balance — not a live wallet read">
      <span class="coin" aria-hidden="true">●</span>
      <span class="amount">{{ PREVIEW_NIM_BALANCE }} NIM</span>
      <span class="nw-hud-badge">Preview</span>
    </div>
    <button class="nw-icon-btn" type="button" disabled aria-label="Mail (coming soon)">✉</button>
    <button class="nw-icon-btn" type="button" disabled aria-label="Settings (coming soon)">⚙</button>
  </div>
</template>
```

Style as a gold-accent pill matching the mockup; keep compact for mobile.

**Step 2: Wire into `App.vue` header**

Restructure `.top` to three zones: profile | brand | balance row. Brand stays centered (absolute center or CSS grid `1fr auto 1fr`). Enable `pointer-events: auto` on the balance cluster.

**Step 3: Commit**

```bash
git add apps/web/src/components/hud/BalanceChip.vue apps/web/src/App.vue
git commit -m "$(cat <<'EOF'
feat(web): add preview NIM balance chip to plaza HUD

EOF
)"
```

---

### Task 5: BottomNav component

**Files:**
- Create: `apps/web/src/components/hud/BottomNav.vue`
- Modify: `apps/web/src/App.vue`

**Step 1: Implement BottomNav**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import { BOTTOM_NAV_ITEMS, locationIdForNav, navIdsForLocation, type BottomNavId } from './bottomNav'

const store = usePlazaStore()
const activeIds = computed(() => new Set(navIdsForLocation(store.openLocationId)))

function onSelect(id: BottomNavId) {
  const locationId = locationIdForNav(id)
  if (!locationId) {
    store.closeLocation()
    return
  }
  void store.openLocation(locationId)
}
</script>

<template>
  <nav class="nw-panel bottom-nav" aria-label="Plaza">
    <button
      v-for="item in BOTTOM_NAV_ITEMS"
      :key="item.id"
      type="button"
      class="nav-item"
      :class="{ active: activeIds.has(item.id) }"
      @click="onSelect(item.id)"
    >
      <span class="icon" aria-hidden="true">{{ item.label[0] }}</span>
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>
```

Use simple letter glyphs first (no new art). Active item: cyan border + soft glow (`box-shadow: 0 0 12px rgba(88, 196, 255, 0.35)`).

**Step 2: Place in `App.vue` footer**

Centered bottom; joystick stays left. On mobile, bottom nav should not cover the joystick — use a centered floating bar with horizontal padding, joystick absolute left. Hint text can move above nav or hide when faded.

Suggested footer structure:

```
footer.bottom
  VirtualJoystick (absolute left)
  BottomNav (centered)
  hint (optional, above nav or omit on narrow)
```

**Step 3: Smoke**

- Click Home with arcade open → closes overlay
- Click Apps → Arcade overlay
- Click Inventory → Fountain overlay; Inventory + Achievements both active

**Step 4: Commit**

```bash
git add apps/web/src/components/hud/BottomNav.vue apps/web/src/App.vue
git commit -m "$(cat <<'EOF'
feat(web): add plaza bottom nav wired to locations

EOF
)"
```

---

### Task 6: Desktop preview shells

**Files:**
- Create: `apps/web/src/components/hud/ChatShell.vue`
- Create: `apps/web/src/components/hud/FriendsShell.vue`
- Create: `apps/web/src/components/hud/EventsShell.vue`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/components/hud/NearbyPlayers.vue` (desktop position)

**Step 1: ChatShell**

- Tabs from `PREVIEW_CHAT.tabs` (World selected; other tabs visual-only / no-op)
- Messages list with colored `@user` + white text
- Disabled input + disabled send button
- `Preview` badge on header
- CSS: hide by default; `@media (min-width: 900px) { display: … }`
- Position: bottom-left, above joystick (`bottom: ~7.5rem`)

**Step 2: FriendsShell**

- Title “Friends online” + Preview badge
- Rows from `PREVIEW_FRIENDS` (avatar initial, handle, place, green/gray dot)
- Disabled “View All Friends”
- Position: top-right, below balance row; leave room so NearbyPlayers can sit under it or move left of it

**Step 3: EventsShell**

- Title “Today’s events” + Preview badge
- Gold bullets + `PREVIEW_EVENTS`
- Disabled “View All Events”
- Position: bottom-right above safe area

**Step 4: Collision fixes**

- `NearbyPlayers`: on `min-width: 900px`, move down (e.g. `top: 12rem`) or under friends shell so panels don’t stack.
- Ensure shell roots use `pointer-events: auto` but parent chrome wrappers keep empty space `pointer-events: none`.

**Step 5: Commit**

```bash
git add apps/web/src/components/hud/ChatShell.vue \
  apps/web/src/components/hud/FriendsShell.vue \
  apps/web/src/components/hud/EventsShell.vue \
  apps/web/src/components/hud/NearbyPlayers.vue \
  apps/web/src/App.vue
git commit -m "$(cat <<'EOF'
feat(web): add desktop HUD preview shells for chat, friends, events

EOF
)"
```

---

### Task 7: Verify + mark C5

**Files:**
- Modify: `docs/plans/2026-08-03-art-pass-c-design.md` (note C5 HUD trim shipped; note preview shells are an approved extension beyond strict C5)
- Optional: one-line mention in `docs/ROADMAP.md` only if HUD is already tracked there

**Step 1: Run tests + typecheck**

```bash
cd apps/web && npm test && npm run build
```

Expected: all green.

**Step 2: Manual checklist**

- [ ] Mobile width (~390px): no chat/friends/events; profile + balance + bottom nav + joystick visible; plaza walkable
- [ ] Desktop (≥900px): three preview shells with Preview badges; sample content; inputs/buttons disabled
- [ ] Bottom nav opens correct overlays; Home closes
- [ ] Nearby send + payment sheet still work
- [ ] No XP bar; mail/settings disabled

**Step 3: Commit docs touch if any**

```bash
git add docs/plans/2026-08-03-art-pass-c-design.md
git commit -m "$(cat <<'EOF'
docs: note plaza HUD C5 + preview shells in Art Pass C

EOF
)"
```

---

## Notes for the implementer

- Do **not** add store fields, adapters, or fake “live” APIs for chat/friends/events/balance.
- Prefer text/emoji icon placeholders over commissioning PixelLab UI icons in this pass.
- Keep pointer-events discipline so Phaser keeps receiving clicks outside panels.
- If `App.vue` gets too crowded, extract a thin `PlazaHud.vue` that owns the template/CSS zones — optional mid-pass cleanup, not required up front.
