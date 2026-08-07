# Cross-App Connected + Achievements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire NimWorld to NimConnect’s live authorizations and achievements so Arcade shows Connected vs Played distinctly, and Fountain shows validated awards with app attribution.

**Architecture:** Bump `@nimconnect/profile-client` to 0.9.0. Establish a first-party NimConnect session (`createSession`) alongside the existing v3 `nimworld` scoped grant so `listAuthorizations()` works. Add `Achievement` envelope validation in `packages/app-manifest` and filter awards on the read path. Keep inventory mocked; do not invent per-app Disconnect for third-party audiences.

**Tech Stack:** Vue 3 + Pinia, Vitest, `@nimconnect/profile-client` 0.9.0, `@nimworld/app-manifest`, TypeScript

**Design:** `docs/plans/2026-08-07-cross-app-platform-design.md` (approved Phase 1 + 2)

---

### Task 1: Achievement envelope in `packages/app-manifest`

**Files:**
- Modify: `packages/app-manifest/src/types.ts`
- Modify: `packages/app-manifest/src/validate.ts`
- Modify: `packages/app-manifest/src/validate.test.ts`
- Modify: `packages/app-manifest/src/index.ts`
- Modify: `packages/app-manifest/src/schema.json` (add Achievement definition; skip AppStat — UI does not need it yet)

**Step 1: Write the failing tests**

Add to `packages/app-manifest/src/validate.test.ts`:

```ts
import { validateAchievement } from './validate'

const validAchievement = {
  schemaVersion: 1,
  appId: 'nimbomber',
  achievementId: 'first-blast',
  title: 'First Blast',
  description: 'Win your first match.',
  rarity: 'common',
}

describe('validateAchievement', () => {
  it('accepts a valid §9 achievement', () => {
    const result = validateAchievement(validAchievement)
    expect(result.ok).toBe(true)
  })

  it('rejects missing required fields', () => {
    expect(validateAchievement({ schemaVersion: 1, appId: 'x' }).ok).toBe(false)
  })

  it('rejects bad rarity', () => {
    const result = validateAchievement({ ...validAchievement, rarity: 'mythic' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some((e) => e.includes('rarity'))).toBe(true)
  })

  it('allows omitted rarity', () => {
    const { rarity: _, ...rest } = validAchievement
    expect(validateAchievement(rest).ok).toBe(true)
  })

  it('rejects empty rarity string', () => {
    expect(validateAchievement({ ...validAchievement, rarity: '' }).ok).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app-manifest && npx vitest run src/validate.test.ts`
Expected: FAIL — `validateAchievement` not exported / not defined

**Step 3: Minimal implementation**

In `types.ts` add (match `prompt.md` §9; `schemaVersion` mirrors manifests):

```ts
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  schemaVersion: number
  appId: string
  achievementId: string
  title: string
  description: string
  iconUrl?: string
  rarity?: AchievementRarity
  unlockedAt?: string
  progress?: { current: number; target: number }
}

export const ACHIEVEMENT_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
```

In `validate.ts` add `validateAchievement` / `assertAchievement` mirroring `validateAppManifest`:
- require non-empty `appId`, `achievementId`, `title`, `description`
- `appId` / `achievementId` match `^[a-z0-9-]+$` (same as manifest id)
- `schemaVersion` in `SUPPORTED_SCHEMA_VERSIONS`
- if `rarity` present, must be in `ACHIEVEMENT_RARITIES`
- if `progress` present, both `current` and `target` must be numbers
- if `unlockedAt` present, non-empty string

Export from `index.ts`. Add JSON Schema `$defs.Achievement` in `schema.json`.

**Step 4: Run tests**

Run: `cd packages/app-manifest && npx vitest run src/validate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/app-manifest/src
git commit -m "feat(app-manifest): add Achievement envelope validation"
```

---

### Task 2: Bump `@nimconnect/profile-client` to 0.9.0

**Files:**
- Modify: `apps/web/package.json`
- Modify: root `package-lock.json` (via npm)

**Step 1: Bump dependency**

```bash
cd /home/maestro/Documents/projects/NimWorld
npm install @nimconnect/profile-client@0.9.0 -w @nimworld/web
```

If 0.9.0 is not on the registry yet, link the local package:

```bash
npm install /home/maestro/Documents/projects/NimConnect/packages/profile-client -w @nimworld/web
```

**Step 2: Confirm exports**

```bash
node -e "import('@nimconnect/profile-client').then(m => console.log(Object.keys(m), m.createProfileClient))"
```

Expected: module loads; types include `listAuthorizations`, `listAchievements`, `createSession`.

**Step 3: Commit**

```bash
git add apps/web/package.json package-lock.json
git commit -m "chore(web): bump profile-client to 0.9.0 for authorizations and awards"
```

---

### Task 3: First-party session + `achievements:read` on friends grant

**Files:**
- Modify: `apps/web/src/adapters/nimconnect/friendsSession.ts`
- Modify: `apps/web/src/adapters/nimconnect/friendsSession.test.ts`
- Modify: `apps/web/src/adapters/nimconnect/ProfileClientNimConnectAdapter.ts`

**Context:** `listAuthorizations()` requires `X-NimConnect-Session` from `createSession`. Friends/awards private reads use the v3 Bearer grant. Persist both. Two signatures on first connect is acceptable (honest; no fake single-sig merge).

**Step 1: Failing tests in `friendsSession.test.ts`**

- Stored grant missing `achievements:read` is treated as stale (force re-auth)
- `ensureNimConnectAccess(client)` calls `createSession` then `createAuthorization` with scopes including `achievements:read`
- Restores both `sessionToken` and `authorization` into a fresh client options object

**Step 2: Run — expect FAIL**

Run: `cd apps/web && npx vitest run src/adapters/nimconnect/friendsSession.test.ts`

**Step 3: Implement**

In `friendsSession.ts`:

```ts
export const NIMCONNECT_SCOPES = [
  'friends:read',
  'friends:write',
  'achievements:read',
] as const

const SESSION_KEY = 'nimconnect:session' // alongside GRANT_KEY
```

- Persist `{ token, expiresAt }` for first-party session in the same IDB store
- `storedAuthorization()` returns null if grant lacks `achievements:read` (so reconnect upgrades scopes)
- Export `ensureNimConnectAccess(client, signMessage)` that:
  1. Restores session token onto client via `createProfileClient({ sessionToken, authorization, audience })` pattern used by adapter
  2. If no session: `client.createSession({ address, signMessage })` + persist
  3. If no grant (or stale scopes): `client.createAuthorization({ address, scopes: [...NIMCONNECT_SCOPES], signMessage })` + persist
- Keep `createFriendsAuthorization` as a thin wrapper calling `ensureNimConnectAccess` for back-compat, or replace call sites

Update `ProfileClientNimConnectAdapter.connectFriends()` to rebuild the client with **both** `sessionToken` and `authorization` from storage after ensure.

**Step 4: Tests pass**

Run: `cd apps/web && npx vitest run src/adapters/nimconnect/friendsSession.test.ts src/adapters/nimconnect/friends.test.ts`

**Step 5: Commit**

```bash
git commit -m "feat(nimconnect): first-party session and achievements:read on grant"
```

---

### Task 4: `listAuthorizedApps` on the adapter

**Files:**
- Modify: `apps/web/src/domain/types.ts` (add `AuthorizedApp` if useful)
- Modify: `apps/web/src/adapters/nimconnect/types.ts`
- Modify: `apps/web/src/adapters/nimconnect/ProfileClientNimConnectAdapter.ts`
- Modify: `apps/web/src/adapters/nimconnect/MockNimConnectAdapter.ts`
- Create: `apps/web/src/adapters/nimconnect/authorizations.test.ts`

**Step 1: Failing tests**

```ts
it('returns [] without a first-party session', async () => { ... })
it('maps listAuthorizations audiences to AuthorizedApp', async () => {
  // client.listAuthorizations → [{ audience, displayName, iconUrl, verified, scopes, ... }]
  // adapter.listAuthorizedApps() → same fields, audience as id/slug key
})
it('returns [] when listAuthorizations throws', async () => { ... })
```

**Step 2: Run — expect FAIL** (`listAuthorizedApps` missing)

**Step 3: Implement**

```ts
// types.ts (adapter)
listAuthorizedApps(): Promise<AuthorizedApp[]>

export interface AuthorizedApp {
  audience: string
  displayName: string
  iconUrl?: string
  verified: boolean
  scopes: string[]
  grantedAt: number
  expiresAt: number
}
```

`ProfileClientNimConnectAdapter.listAuthorizedApps()`:
- if `!this.client.getSessionToken()` for first-party — prefer checking session specifically; profile-client’s `getSessionToken()` currently returns authorization token OR session. Use a dedicated `hasFirstPartySession()` by tracking restored `sessionToken`, or call `listAuthorizations` and catch "session required".
- map results; on error return `[]`

Mock adapter: return 1–2 fixed authorized apps (e.g. `nimbomber`) so Arcade UI can be exercised in mock mode, **or** return `[]` and only test via unit mocks — prefer returning mock Connected data so Story/manual mock isn’t empty.

**Step 4: Tests pass + commit**

```bash
git commit -m "feat(nimconnect): listAuthorizedApps from live grants"
```

---

### Task 5: Plaza store + Arcade Connected vs Played

**Files:**
- Modify: `apps/web/src/stores/plazaStore.ts`
- Modify: `apps/web/src/components/locations/ArcadeOverlay.vue`
- Create: `apps/web/src/components/locations/ArcadeOverlay.test.ts` (or store test if overlay hard to mount)
- Modify: `docs/ROADMAP.md` — mark connected-app state unblocked / done for Arcade badges

**Step 1: Failing test**

Test helper that drives badge logic (extract pure functions if needed):

```ts
// e.g. apps/web/src/components/locations/arcadeBadges.ts
export function isConnected(app: { id: string; slug: string }, audiences: Set<string>): boolean {
  return audiences.has(app.slug) || audiences.has(app.id)
}
```

Tests: Connected and Played independent; both can be true; neither merges labels.

**Step 2: Store**

- `authorizedApps` ref
- `loadAuthorizedApps()` called from `loadFriends` / after `connectFriends` / on plaza init when session exists
- expose `authorizedAudiences` computed Set

**Step 3: ArcadeOverlay**

- Replace the outdated comment about Connected not existing
- Show `<span class="connected">Connected</span>` and keep `<span class="played">Played</span>` as separate badges
- Distinct styles (Connected slightly stronger / gold or accent; Played stays muted border)

No Disconnect button for third-party apps.

**Step 4: Tests + commit**

```bash
git commit -m "feat(arcade): show Connected distinctly from Played"
```

---

### Task 6: Real `getAchievements` with read-path validation

**Files:**
- Modify: `apps/web/src/adapters/nimconnect/ProfileClientNimConnectAdapter.ts`
- Modify: `apps/web/src/domain/types.ts` (align with envelope; keep UI-friendly fields)
- Create: `apps/web/src/adapters/nimconnect/achievements.test.ts`
- Modify: `apps/web/src/adapters/nimconnect/types.ts` if needed (`achievementsSource?: 'live' | 'mock'`)

**Step 1: Failing tests**

- With address + successful `listAchievements`, returns mapped validated achievements
- Payload missing `title` is dropped (never reaches UI)
- Bad rarity dropped
- `grantedAt` (unix seconds) maps to `unlockedAt` ISO string
- Without address, returns `[]` (do not fall back to mock in the real adapter — mock adapter stays separate)
- Optional `appId` filter still works

**Step 2: Implement mapping**

```ts
async getAchievements(appId?: string): Promise<Achievement[]> {
  const address = this.address ?? this.fallbackAddress
  if (!address) return []
  try {
    const raw = await this.client.listAchievements(address)
    return raw
      .map(fromNimConnectAchievement)
      .filter((a): a is Achievement => a !== null)
      .filter((a) => !appId || a.appId === appId)
  } catch {
    return []
  }
}

function fromNimConnectAchievement(raw: {
  appId: string
  achievementId: string
  title: string
  description: string
  rarity: string
  grantedAt: number
  progress?: unknown
}): Achievement | null {
  const envelope = {
    schemaVersion: 1,
    appId: raw.appId,
    achievementId: raw.achievementId,
    title: raw.title,
    description: raw.description,
    ...(raw.rarity ? { rarity: raw.rarity } : {}),
    ...(raw.grantedAt ? { unlockedAt: new Date(raw.grantedAt * 1000).toISOString() } : {}),
    ...(isProgress(raw.progress) ? { progress: raw.progress } : {}),
  }
  const result = validateAchievement(envelope)
  if (!result.ok) return null
  // strip schemaVersion for domain type if domain omits it
  const { schemaVersion: _, ...domain } = result.manifest
  return domain
}
```

Update `requestScopes` note: `achievements:read` is supported when grant includes it; inventory still mocked.

**Step 3: Tests pass + commit**

```bash
git commit -m "feat(nimconnect): load achievements with read-path validation"
```

---

### Task 7: Fountain UI — attribution + live vs mock

**Files:**
- Modify: `apps/web/src/components/locations/FountainOverlay.vue`
- Modify: `apps/web/src/stores/plazaStore.ts` (`loadFountainExtras` may also return app name map / `achievementsLive: boolean`)
- Modify: `apps/web/src/adapters/nimconnect/ProfileClientNimConnectAdapter.ts` — helper to resolve app display name via `getApp(audience)` with in-memory cache; fallback to `audience` slug only if lookup fails (never invent a pretty name)

**Step 1: Behavior**

- Lead copy: stop saying achievements are always mock; say they come from NimConnect when signed in
- Section title: show `mock` badge only when using `MockNimConnectAdapter` / when store flag `achievementsLive === false`
- Each achievement row:

```html
<strong>{{ item.title }}</strong>
<span>{{ item.description }}</span>
<span class="by">awarded by {{ appName(item.appId) }}</span>
```

- Empty: "No achievements yet." (honest empty shelf)

**Step 2: Resolve names**

Prefer order: cached `getApp(appId).displayName` → authorized app `displayName` → catalog app name by slug → raw `appId`.

**Step 3: Manual sanity** — unit-test name resolver if extracted; commit

```bash
git commit -m "feat(fountain): show live achievements with awarded-by attribution"
```

---

### Task 8: ROADMAP + verification

**Files:**
- Modify: `docs/ROADMAP.md` (Phase 4 bullets for connected-app + achievements)

**Step 1: Update roadmap**

- Connected-app Arcade badges: done (grants via `listAuthorizations`; still no catalog favourites)
- Shared achievements: read path done; empty until apps post awards; inventory still mock

**Step 2: Full verification**

```bash
cd packages/app-manifest && npx vitest run
cd apps/web && npx vitest run
cd apps/web && npm run build
```

Expected: all green

**Step 3: Commit**

```bash
git commit -m "docs: mark Connected badges and achievement reads on the roadmap"
```

---

## Out of scope (do not implement)

- Inventory envelope / real inventory
- Trading / Marketplace
- Per-app Disconnect for third-party audiences
- NimWorld backend award tables
- AppStat envelope (no UI consumer yet)
