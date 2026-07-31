# NimWorld Art Assets

Source of truth for PixelLab PNGs used by Art Pass B. Approved files may be mirrored into `apps/web/public/assets/art/` for Phaser loading.

## Naming convention

```text
{subject}_v{NN}_{status}.png
```

**Statuses:** `concept` · `candidate` · `approved` · `deprecated` · `rejected`

Examples:

- `fountain_v01_concept.png`
- `fountain_v02_candidate.png`
- `fountain_v03_final.png` (production-ready; prefer `approved` / `final` in filename per promotion)
- `arcade_portal_v02_final.png`

## Folders

| Folder | Purpose |
| --- | --- |
| `concepts/` | Phase A Art Bible style studies |
| `landmarks/` | Hero buildings (Fountain, Arcade, Arena, …) |
| `props/` | Shared reusable props |
| `characters/` | Character kit sheets / sprites |
| `effects/` | Portal FX and similar |
| `rejected/` | Failed reviews — never delete |

## Credit log

| Phase | Planned | Actual | Notes |
| --- | ---: | ---: | --- |
| A Art Bible | 8 | | |
| B Hero Landmarks | 18 | | |
| C Props | 8 | | |
| D Characters | 4 | | |
| Reserve | 2 | | |
| **Total** | **40** | | |

## Manifest (file → Phaser key → status → phase)

_Filled as assets are approved._
