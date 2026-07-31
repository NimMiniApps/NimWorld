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
| A Art Bible | 8 | 8 | pixen×7 + pixflux×1 |
| Character direction | 2–3 | 3 | v02–v04 exploration (not locked) |
| Fountain production | — | 2 | candidate + larger-crystal final |
| Portal production | — | 2 | cabinet miss + pure portal final |
| Landmark kit | 18 | 6 | arcade, arena×2, townhall, social, market |
| C Props | 8 | | |
| D Characters | 4 | | |
| Reserve | 2 | | |
| **Total** | **40** | **21** | Trial remaining: 19 |

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

| File | Phaser key | Status | Phase |
| --- | --- | --- | --- |
| `landmarks/fountain_v02_final.png` | `fountain-base` | final | B |
| `landmarks/arcade_v01_final.png` | `building-arcade` | final | B |
| `landmarks/arena_v02_final.png` | `building-arena` | final | B |
| `landmarks/townhall_v01_final.png` | `building-townhall` | final | B |
| `landmarks/social_v01_final.png` | `building-social` | final | B |
| `landmarks/marketplace_v01_final.png` | `building-construction` | final | B |
| `effects/arcade_portal_v01_final.png` | `fx-arcade-portal` | final | B |
| `effects/arcade_portal_cabinet_v01_candidate.png` | — | candidate | B |
| `rejected/arena_v01_house_rejected.png` | — | rejected | B |
| `concepts/characters_v04_citizen_refine.png` | — | concept | dir |

Approved files are mirrored under `apps/web/public/assets/art/` for Phaser `load.image`.
