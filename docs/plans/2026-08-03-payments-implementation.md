# Payments Tip Jar + Nearby HUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship hybrid Pay-SDK / Hub-checkout payments with a NimWorld tip jar, Nearby send HUD, and Marketplace tip/request using one shared PaymentSheet.

**Architecture:** `MiniAppSdkPaymentAdapter` routes `sendNim` to Mini App SDK inside Pay and Hub `checkout` on desktop; `requestNim` stays request-link + clipboard. Fountain / Nearby / Marketplace open a shared `PaymentSheet`. Mock ghost actors carry demo `address` fields for payable targets.

**Tech Stack:** Vue 3, Pinia, `@nimiq/mini-app-sdk`, `@nimiq/hub-api`, Vitest

**Design:** `docs/plans/2026-08-03-payments-design.md`

---

### Task 1: Tip address + NIM↔luna helpers

**Files:**
- Create: `apps/web/src/adapters/payment/paymentConfig.ts`
- Create: `apps/web/src/adapters/payment/paymentConfig.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { NIMWORLD_TIP_ADDRESS, nimToLuna, lunaToNim } from './paymentConfig'

describe('paymentConfig', () => {
  it('exposes the locked tip jar address', () => {
    expect(NIMWORLD_TIP_ADDRESS).toBe('NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C')
  })

  it('converts NIM to luna', () => {
    expect(nimToLuna(1)).toBe(100_000)
    expect(nimToLuna(5)).toBe(500_000)
  })

  it('converts luna to NIM', () => {
    expect(lunaToNim(100_000)).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @nimworld/web -- src/adapters/payment/paymentConfig.test.ts`  
Expected: FAIL (module missing)

**Step 3: Write minimal implementation**

```ts
export const NIMWORLD_TIP_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_NIMWORLD_TIP_ADDRESS?.trim()) ||
  'NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C'

export const LUNA_PER_NIM = 100_000

export function nimToLuna(nim: number): number {
  return Math.round(nim * LUNA_PER_NIM)
}

export function lunaToNim(luna: number): number {
  return luna / LUNA_PER_NIM
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -w @nimworld/web -- src/adapters/payment/paymentConfig.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/adapters/payment/paymentConfig.ts apps/web/src/adapters/payment/paymentConfig.test.ts
git commit -m "feat(web): add tip jar address and NIM/luna helpers"
```

---

### Task 2: Hybrid payment adapter (Pay SDK + Hub checkout)

**Files:**
- Modify: `apps/web/src/adapters/payment/NimiqPaymentAdapter.ts`
- Create: `apps/web/src/adapters/payment/NimiqPaymentAdapter.test.ts`

**Step 1: Write the failing tests**

Cover:
- Inside Pay (`window.nimiqPay` set): `sendNim` calls mocked SDK `sendBasicTransaction` with recipient + luna value.
- Outside Pay: `sendNim` calls mocked Hub `checkout` with `recipient` + `value` (luna); never calls SDK send.
- `requestNim` copies `nimiq:?amount=…` link.
- Tip jar constant imported when used by callers (adapter itself takes recipient arg).

Sketch:

```ts
it('sends via SDK inside Nimiq Pay', async () => { /* stub init + sendBasicTransaction */ })
it('sends via Hub checkout on desktop', async () => { /* stub HubApi.checkout */ })
it('copies a request link', async () => { /* stub clipboard */ })
```

**Step 2: Run tests to verify they fail**

Run: `npm test -w @nimworld/web -- src/adapters/payment/NimiqPaymentAdapter.test.ts`  
Expected: FAIL (Hub path / behaviors missing)

**Step 3: Implement adapter**

Update `MiniAppSdkPaymentAdapter`:
- Import `isNimiqPayHost` from `@/auth/session` and Hub URL pattern from session (`VITE_NIMIQ_HUB_URL` or `https://hub.nimiq.com`).
- On `initialize`: try SDK init with host-aware timeout (2.5s desktop / 10s Pay); keep fallback mock for request-only.
- `sendNim`:
  - If Pay host and SDK ready → existing SDK path.
  - Else → `new HubApi(HUB_URL).checkout({ appName: 'NimWorld', recipient, value: amountLuna, extraData: message bytes if present })`; map signed result / cancel to `PaymentResult`.
- Truncate message (~64 chars) before sending.
- Keep `requestNim` clipboard path; initialize fallback if needed.
- Remove silent “mock send failure as product UX” for desktop once Hub path exists; Hub cancel still returns `{ ok: false, reason }`.

**Step 4: Run tests to verify they pass**

Run: `npm test -w @nimworld/web -- src/adapters/payment/NimiqPaymentAdapter.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/adapters/payment/NimiqPaymentAdapter.ts apps/web/src/adapters/payment/NimiqPaymentAdapter.test.ts
git commit -m "feat(web): hybrid Pay SDK and Hub checkout for sendNim"
```

---

### Task 3: Payable addresses on mock presence

**Files:**
- Modify: `apps/web/src/adapters/presence/PresenceAdapter.ts`
- Create: `apps/web/src/adapters/presence/PresenceAdapter.test.ts` (or extend if one exists)

**Step 1: Write the failing test**

```ts
it('marks ghost actors as payable with addresses and NPCs without', async () => {
  const actors = await new LocalPresenceAdapter().getActors()
  const ghosts = actors.filter((a) => a.kind === 'ghost')
  const npcs = actors.filter((a) => a.kind === 'npc')
  expect(ghosts.every((g) => typeof g.address === 'string' && g.address.startsWith('NQ'))).toBe(true)
  expect(npcs.every((n) => !n.address)).toBe(true)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -w @nimworld/web -- src/adapters/presence/PresenceAdapter.test.ts`  
Expected: FAIL (`address` missing)

**Step 3: Implement**

- Add `address?: string` to `PlazaActor`.
- Assign distinct valid-format demo `NQ…` addresses to `ghost-luna`, `ghost-pixel`, `ghost-nova` (can be any well-formed spaced NQ strings; tip jar must remain the real one from Task 1).

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/adapters/presence/PresenceAdapter.ts apps/web/src/adapters/presence/PresenceAdapter.test.ts
git commit -m "feat(web): add demo addresses to payable ghost actors"
```

---

### Task 4: Shared PaymentSheet + store helpers

**Files:**
- Create: `apps/web/src/components/payments/PaymentSheet.vue`
- Modify: `apps/web/src/stores/plazaStore.ts`
- Modify: `apps/web/src/App.vue` (mount sheet + toast reuse)

**Step 1: Define store payment UI state**

Add to plaza store (or a tiny dedicated composable if cleaner — prefer store for overlay consistency):

```ts
type PaymentMode = 'tip' | 'send' | 'request'
paymentSheet: {
  open: boolean
  mode: PaymentMode
  recipient?: string
  recipientLabel?: string
} | null
```

Actions: `openPaymentSheet(...)`, `closePaymentSheet()`, `submitPayment(nim, message?)` calling `adapters.payment`, set `celebration` toast on result.

**Step 2: Build PaymentSheet UI**

- Modes: tip / send / request.
- Presets: 1 / 5 / 10 NIM + custom number input.
- Optional message (max ~64).
- Submit disabled while busy or invalid amount.
- Tip mode locks recipient to `NIMWORLD_TIP_ADDRESS`, label “NimWorld tip jar”.
- Request mode hides recipient; calls `requestNim`.

Reuse existing `.nw-btn` / panel styles; keep mobile-first; no new card clutter in plaza chrome beyond the sheet panel.

**Step 3: Wire into App.vue**

Render `<PaymentSheet />` alongside `LocationOverlay` when sheet open.

**Step 4: Manual smoke in `npm run dev -w @nimworld/web`**

Open tip sheet from console/store temporarily if Fountain not wired yet — or wire Fountain in same task if small.

**Step 5: Commit**

```bash
git add apps/web/src/components/payments/PaymentSheet.vue apps/web/src/stores/plazaStore.ts apps/web/src/App.vue
git commit -m "feat(web): add shared PaymentSheet for tip send and request"
```

---

### Task 5: Fountain tip jar + request

**Files:**
- Modify: `apps/web/src/components/locations/FountainOverlay.vue`

**Step 1: Replace local adapter instance**

Use plaza store adapters (do not `createAdapters()` again). Prefer store methods so payment uses the same adapter instance as bootstrap.

If store does not expose adapters, add `getAdapters()` or payment actions only on the store (preferred: store-owned payment actions from Task 4).

**Step 2: Wire buttons**

- “Tip NimWorld” → `openPaymentSheet({ mode: 'tip' })`
- “Request NIM” → `openPaymentSheet({ mode: 'request' })`
- Keep profile button as-is.

**Step 3: Commit**

```bash
git add apps/web/src/components/locations/FountainOverlay.vue
git commit -m "feat(web): wire Fountain tip jar and request to PaymentSheet"
```

---

### Task 6: Nearby players HUD

**Files:**
- Create: `apps/web/src/components/hud/NearbyPlayers.vue`
- Modify: `apps/web/src/App.vue`
- Modify: `apps/web/src/stores/plazaStore.ts` (cache `nearbyActors` from bootstrap or lazy load)

**Step 1: Load actors into store**

During `bootstrap` (or on first HUD mount): `nearbyActors = await adapters.presence.getActors()`.

**Step 2: NearbyPlayers UI**

- Compact list in plaza chrome (e.g. under header or side panel), collapsed by default on mobile (“Nearby”).
- Show label + statusLabel.
- If `actor.address`: “Send” opens `openPaymentSheet({ mode: 'send', recipient: address, recipientLabel: label })`.
- Else: no Send button.

**Step 3: Unit test helper (optional small pure fn)**

```ts
export function isPayableActor(actor: { address?: string }): boolean {
  return Boolean(actor.address?.trim())
}
```

**Step 4: Commit**

```bash
git add apps/web/src/components/hud/NearbyPlayers.vue apps/web/src/App.vue apps/web/src/stores/plazaStore.ts
git commit -m "feat(web): add Nearby players HUD with send for payable ghosts"
```

---

### Task 7: Marketplace light payments panel

**Files:**
- Modify: `apps/web/src/components/locations/MarketplaceOverlay.vue`

**Step 1: Add Tip + Request actions**

Keep construction copy; add primary actions:
- Tip NimWorld → tip sheet
- Request NIM → request sheet

**Step 2: Commit**

```bash
git add apps/web/src/components/locations/MarketplaceOverlay.vue
git commit -m "feat(web): add Marketplace tip and request payment actions"
```

---

### Task 8: Docs + verification

**Files:**
- Modify: `docs/architecture.md` (Integrations row for payments)
- Optionally note tip address in README only if env vars are already documented — otherwise skip README.

**Step 1: Update architecture Integrations**

Note: hybrid Pay SDK send + Hub checkout desktop; tip jar; Nearby payable ghosts.

**Step 2: Run full web tests + build**

```bash
npm test -w @nimworld/web
npm run build -w @nimworld/web
```

Expected: all green.

**Step 3: Manual checklist**

- Desktop Hub tip to tip jar  
- Desktop Hub send to a ghost address  
- Fountain request copies link  
- Nearby: Send on ghosts only  
- (If Pay available) SDK tip without Hub popup  

**Step 4: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: note hybrid payments and tip jar in architecture"
```

**Step 5: Deploy web (when user asks)**

Same local image → Swarm workers path as prior platform-loop deploy; web image only.

---

## Execution notes

- Prefer TDD for Tasks 1–3; UI tasks can smoke-test in browser.
- Do not invent real friend addresses; demo ghost NQs are fine.
- Do not block on Marketplace trading or presence WebSocket.
- Reuse celebration toast for payment success/failure messages.
