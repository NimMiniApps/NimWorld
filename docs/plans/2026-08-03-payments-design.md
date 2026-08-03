# Payments slice — tip jar, Nearby HUD, hybrid Pay/Hub

Date: 2026-08-03  
Status: approved design

## Goal

Ship a demoable payments loop without friends/presence backend work:

1. Fountain = NimWorld tip jar  
2. Nearby HUD = pick a mock presence actor and send NIM  
3. Marketplace = light tip + request surface  
4. Same UI on desktop and in Nimiq Pay; adapter chooses the payment path  

## Locked decisions

| Decision | Choice |
|----------|--------|
| Approach | Shared `PaymentSheet` + three thin entry points |
| Tip jar | `NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C` (optional `VITE_NIMWORLD_TIP_ADDRESS` override) |
| Pay host | Mini App SDK `sendBasicTransaction` / `WithData` |
| Desktop | Hub `checkout` popup to the same recipient |
| Request NIM | Request-link + clipboard (no SDK request API) |
| Nearby targets | Mock presence list; Send only when actor has `address` |
| NPCs | Non-payable (status only) |

## Architecture

```
Fountain / Nearby HUD / Marketplace
        │
        ▼
   PaymentSheet (tip | send | request)
        │
        ▼
 MiniAppSdkPaymentAdapter
   ├─ isNimiqPayHost? → SDK send
   ├─ else → Hub checkout
   └─ requestNim → nimiq:? link + clipboard
```

### Adapter

- Keep `NimiqPaymentAdapter` interface: `initialize`, `isAvailable`, `sendNim`, `requestNim`.
- Reuse Pay SDK init with host-aware timeouts (same idea as session).
- `sendNim(recipient, amountLuna, message?)`:
  - Pay → SDK basic tx (with optional data/message)
  - Desktop → `HubApi.checkout({ appName, recipient, value, extraData? })`
- `requestNim` remains clipboard request-link; works everywhere.
- Return `{ ok: true, txHash? }` or `{ ok: false, reason }` — never silent mock success for send.

### Presence

- Extend `PlazaActor` with optional `address?: string`.
- Assign demo `NQ…` addresses to ghost actors only.
- Nearby HUD lists actors from `presence.getActors()`; Send gated on `address`.

### UI

- Shared `PaymentSheet`: mode, recipient label, amount presets (1 / 5 / 10 NIM) + custom, optional short message, busy/success/error.
- Fountain: Tip NimWorld + Request NIM.
- Nearby HUD: plaza chrome list; open send sheet for payable actors.
- Marketplace: Tip + Request; construction copy secondary.

## Validation & errors

- Amount > 0; soft max ~10 000 NIM.
- Message truncated (~64 chars).
- Toast on success/failure; disable double-submit.
- Hub popup cancel / SDK reject → show `reason`.

## Out of scope

- Real friends / WebSocket presence  
- Marketplace trading / inventory  
- Balance display, fee UI, confirmation polling  
- Walking-up-to-actor interaction for send (list HUD is enough for this slice)

## Success criteria

- Desktop: Hub checkout tips tip jar and can pay a ghost address.  
- Pay: SDK tip/send works without Hub popup.  
- Fountain request copies a `nimiq:?` link.  
- Nearby Send hidden for NPCs without addresses.  
- Unit tests cover path selection, tip default address, luna conversion, Send gating.
