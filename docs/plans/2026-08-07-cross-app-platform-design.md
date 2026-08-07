# Cross-App Platform Design — NimWorld side

Date: 2026-08-07
Status: approved — implement Phase 1 + Phase 2 (Approach 1)
Updated: 2026-08-08

Scope: **what NimWorld builds and consumes.** The services it consumes are
designed in their own repos:

- `NimConnect/docs/plans/2026-08-07-ecosystem-awards-and-app-registry-design.md`
  — authorizations list, awards, scopes, item trading on the escrow machinery
  (phases 1–3 implemented upstream)
- `NimiqMiniApps/docs/plans/2026-08-07-app-registry-for-nimconnect-design.md`
  — app identity, declared scopes, verification (implemented)

## What the spec fixes

- §2 — NimConnect owns achievements, badges and shared inventory references;
  NimWorld "must use the existing NimConnect SDK rather than recreating these".
- §6 — the backend's job is signed app events and *achievement verification*,
  not achievement storage.
- §9 — envelopes are specified field by field; "client code must not be able to
  award trusted achievements or inventory directly".
- §19 — NimWorld should connect the ecosystem "without becoming the source of
  truth for everything".

So NimWorld **reads and displays**. It holds no award secrets, stores no awards,
and never becomes a second identity store. If we find ourselves adding durable
achievement tables here, the design has drifted.

## Two classes of event — do not confuse them

| | Plaza activity | Awards |
|---|---|---|
| Keys | NimWorld `APP_KEYS` | NimConnect app keys |
| Verified by | NimWorld | NimConnect |
| Durable | no — 500-slot ring | yes |
| Grants anything | never — cosmetic | yes |

The `/events` feed shipped in Phase 3 is the left column and stays exactly as
built. Awards are the right column and never touch our backend.

## Three facts, three owners, never blurred in the UI

| Fact | Source | Means |
|---|---|---|
| **Connected** | NimConnect authorization | user granted this app scopes; revocable |
| Installed / favourited | Catalog library | user curation — does not exist yet |
| **Played** | NimWorld launch history | we saw you open it, on this device |

## Locked decisions (2026-08-08)

- **Approach 1 — adapter-first, minimal UI.** No connection-manager panel, no
  inventing revoke-by-audience against NimConnect.
- **Bump** `@nimconnect/profile-client` to `0.9.0` (ships `listAuthorizations`,
  `listAchievements`, mirrored app identity on grants).
- **First-party session required for Connected.** `GET /api/authorizations`
  needs `X-NimConnect-Session` (`createSession`), not only the v3 `nimworld`
  friends grant. Wire a first-party session alongside the existing friends auth
  flow.
- **Identity from the grant first.** Use `displayName` / `iconUrl` / `verified`
  on each authorization; catalog is fallback only.
- **Disconnect honesty.** profile-client `revokeAuthorization()` only clears the
  *current* Bearer grant. Do **not** fake per-app Disconnect for third-party
  audiences. Revoke remains available for NimWorld's own grant/session if we
  already expose that path.
- **Inventory and trading stay deferred** (Phases 3–4 below).

## Phase 1 — Connected apps

- `NimConnectAdapter.listAuthorizedApps()` behind the first-party session
- Arcade shows **Connected** distinctly from **Played** — do not merge the
  badges; they mean different things
- Match grant `audience` to Arcade apps by slug/id
- No NimWorld backend work

## Phase 2 — Achievements

1. **Envelope** — transcribe §9's `Achievement` (and `AppStat` where the UI
   needs it) into `packages/app-manifest` beside the manifest schema: TS types,
   JSON Schema, `validateAchievement()`, tests. Align with NimConnect's award
   shape (`appId`, `achievementId`, `title`, `description`, `rarity`,
   `visibility`, `grantedAt`, optional `progress`).
2. **Read-path validation** — an award that fails validation never reaches the
   UI, whatever NimConnect returned.
3. **Adapter** — `getAchievements()` keeps its signature; call
   `listAchievements(address)`; include `achievements:read` on the NimWorld
   grant so private awards can show for the signed-in player. Mock adapter
   remains for tests/offline.
4. **UI** — Fountain: empty states, drop the mock label when live, explicit
   "awarded by \<app\>" attribution (resolve name from grant / `getApp` /
   catalog — never invent).

Expect an empty shelf until an app actually posts awards — the position the
activity feed is in today. Build it anyway; it is the prerequisite.

## Phase 3 — Inventory

Deferred deliberately: it is the only part carrying an economy.

The `InventoryItem` envelope is **not written yet**. Writing a schema for
something we are not building is a migration waiting to happen. When it lands
it needs `instanceId` and `owner` from the start — two players trade *that*
golden bomb, not "a" golden bomb — and `portability: app-local` must refuse a
transfer rather than merely label it. The mock in `domain/types.ts` stays as it
is until then.

## Phase 4 — Trading

NimWorld displays and *initiates*; NimConnect settles. It already runs a handle
marketplace with pooled escrow, watchers and an append-only ledger
(`NimConnect/docs/escrow-architecture.md`), and item trading should reuse that
choreography rather than invent a second one. The design lives there.

NimWorld's part is Marketplace UI: offers, the item shown both ways, verified
identity of the counterparty. Trade screens are the highest-value phishing
surface in this product — we already had to fix app-supplied text rendering as
a player's own words in the activity feed, and the stakes are higher here.

## Constraints that still bind

- No client-side award path, ever. The browser holds no app key.
- No private NimConnect financial data enters NimWorld.
- No blockchain writes for routine plaza movement. A trade is not routine
  movement; a plaza step is.

## Testing

- `packages/app-manifest`: envelope validation, including §9's fields and the
  rejection cases (bad rarity, missing required fields).
- `apps/web`: adapters render real and mock data identically; Connected and
  Played never collapse into one badge; malformed awards never render.
