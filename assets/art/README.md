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
| `landmarks/` | Landmark Assets (buildings + fountain production) |
| `props/` | Environment Assets (trees, benches, flowers, doors, …) |
| `characters/` | Character Assets |
| `effects/` | Animated Icon FX (portal, crystal pulse helpers) |
| `rejected/` | Failed reviews — never delete |

## Taxonomy (prefer over “Hero Landmark Kit”)

| Bucket | Examples |
| --- | --- |
| **Icon Assets** | Fountain, Portal, Crystal, Lantern, Window, Roof, Doors |
| **Environment Assets** | Trees, Flowers, Benches, Barrels/crates, stone ring accents |
| **Landmark Assets** | Arcade, Arena, Town Hall, Social Club, Marketplace |
| **Character Assets** | Player, Guide, Builder, Tournament Master |

Environment style **frozen** — see `docs/art/nimworld-art-bible.md`.

## Credit log

| Phase | Planned | Actual | Notes |
| --- | ---: | ---: | --- |
| A Art Bible | 8 | 8 | pixen×7 + pixflux×1 (Pro skipped: 20–40 gens/call) |
| B Hero Landmarks | 18 | | Blocked until “visual language frozen” |
| C Props | 8 | | |
| D Characters | 4 | | |
| Reserve | 2 | | |
| **Total** | **40** | 8 | Trial remaining after A: 32 |

## Phase A concepts

| File | Status | Notes |
| --- | --- | --- |
| `concepts/fountain_v01_concept.png` | concept | Brand pass |
| `concepts/plaza_v01_concept.png` | concept | Brand pass |
| `concepts/arcade_portal_v01_concept.png` | concept | Brand pass |
| `concepts/materials_v01_concept.png` | concept | Support |
| `concepts/character_scale_v01_concept.png` | concept | Family pass |
| `concepts/lighting_v02_concept.png` | concept | Refined; crystal still soft |
| `concepts/style_lock_v01_final.png` | final | Style freeze frame |
| `rejected/lighting_v01_blue_crystal_rejected.png` | rejected | Blue crystal brand fail |

## Manifest (file → Phaser key → status → phase)

_No production overrides yet (Phase B+)._
