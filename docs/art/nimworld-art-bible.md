# NimWorld Art Bible

**Status:** Draft complete — awaiting human confirmation (“visual language frozen”) before Phase B  
**Phase A spend:** 8 / 8 generations (PixelLab trial; pixen/pixflux @ 1 gen each)  
**Style lock:** `assets/art/concepts/style_lock_v01_final.png`  
**Moodboard:** `assets/moodboard/nimconnect-plaza-moodboard.png`

---

## Why NimWorld exists

NimWorld is the visual front door to the Nimiq Mini Apps ecosystem. It exists to make discovery, identity and social interaction feel playful and memorable rather than transactional. Every visual element should reinforce that this is one connected ecosystem powered by NimConnect.

## Ecosystem scope

The NimWorld Art Bible is the canonical visual reference for the Maestro Mini Apps ecosystem. Future projects such as NimBomber, PlayNimiq, NimConnect visual assets, and new Mini Apps should follow these principles unless a project intentionally establishes its own distinct identity.

## Palette

Derived from Phase A concepts (especially style lock, fountain, arcade portal). Prefer these brand anchors over one-off hues.

| Role | Hex | Notes |
| --- | --- | --- |
| Night sky / deep shadow | `#0a0f24` → `#101040` | Blue-hour base |
| Cool stone | `#304060` → `#405070` | Plaza masonry |
| Roof blue | `#203060` → `#2a4068` | Scalloped tiles |
| Vegetation | `#002010` → `#104010` | Dense evening greens |
| Fountain water / portal cool | `#307080` → `#3de7ff` | Magical cyan family |
| Arcade portal core | `#50f0f0` → `#58c4ff` | Instant Arcade cue |
| Gold crystal / lantern | `#f5a623` → `#f0f000` | NimWorld / NimConnect identity |
| Warm lantern pool | `#ffc66d` → `#ffe0a0` | Soft ground pools |
| Outline | `#0c1020` / near-black | Single-color dark outline |
| Stone highlight | `#5a6890` / warm brass `#b0a080` | Rim & filigree |

**Brand locks (non-negotiable):**

1. Fountain crystal = **gold / warm yellow** (never blue as the hero crystal).  
2. Arcade portal = **bright cyan**, readable alone.  
3. Blue-hour evening — cool stone + warm lantern contrast.

## Materials

### Roof

Blue-grey scalloped shingles with dark overlaps (`materials_v01_concept.png`). Occasional weathered wood shingles as secondary. Keep roofs readable at 50% scale.

### Stone

Cool grey-blue block masonry with dark mortar and subtle weathering. Brass / warm filigree allowed on Fountain rim only — elsewhere keep stone cool so gold/cyan accents pop.

### Vegetation

Rounded dark-green bushes, conical/cypress accents, small pink/gold flower pops. Vegetation frames landmarks; it must not outshine Fountain or Arcade.

### Window

Warm gold interior glow by default; cyan-lit slits only on Arcade. Dark muntins; arched civic windows vs small Arcade vents.

## Outline thickness

Single-color dark outline, ~1–2 px at concept resolution. Characters and landmarks need a clear silhouette edge against night stone and sky. Avoid lineless soft edges for production landmarks.

## Shadow style

Soft elliptical contact shadows under characters/props. Landmark cast shadows lean cool (indigo/blue), lantern pools warm. Prefer readable pools over multi-layer soft blur.

## Character scale

Reference: `assets/art/concepts/character_scale_v01_concept.png`

- Chibi / big-head family (~2–3 heads tall in concept art).  
- Large readable eyes, thick shared outline, upper-left lighting.  
- Signature colors: Player cyan+gold, Guide teal, Builder yellow hardhat, Tournament Master orange.  
- **Gap for Phase D:** Phase A sheet is closer to front/3/4 view than pure low top-down Phaser sheets (32×48). Production may ship south-facing idles first if PixelLab sheets cannot match the walk grid in 4 gens — document in Character Bible when generating.

## Lighting

Blue-hour key: cool ambient sky + warm lantern pools + **gold crystal** hero light + **cyan portal spill**.  
Do not invert brand lights (no blue hero crystal, no orange Arcade portal).  
Study path: `lighting_v01` rejected (blue crystal) → `lighting_v02_concept.png` atmosphere keep → final lock in `style_lock_v01_final.png`.

## Animation principles

Motion supports atmosphere, not noise:

- Fountain: soft crystal pulse, upward gold sparkles, water ripples.  
- Arcade portal: looping cyan swirl / energy arcs (dedicated FX asset in Phase B).  
- Lanterns: gentle idle flicker.  
- Characters: short idle breathe + walk cycles; Ghost = translucent Player.

## Camera

Gameplay camera remains the existing Phaser plaza framing.  
Art generation view: **low top-down / low-isometric 3/4** (Phase A outputs skewed isometric; Phase B production sprites should prefer PixelLab `view: "low top-down"` and readable top-down silhouettes).  
No UI chrome inside art frames.

## Visual hierarchy

1. Fountain  
2. Arcade (portal)  
3. Arena  
4. Player  
5. NPCs  
6. Props  
7. Ground  

## Brand Recognition Test

> If someone sees this asset by itself on X, Discord or GitHub, could they reasonably recognize it as belonging to NimWorld?

Phase A results:

| Concept | Path | Pass? | Notes |
| --- | --- | --- | --- |
| Fountain | `concepts/fountain_v01_concept.png` | Yes | Gold crystal identity |
| Plaza | `concepts/plaza_v01_concept.png` | Yes | Fountain + cyan portal readable |
| Arcade portal | `concepts/arcade_portal_v01_concept.png` | Yes | Cyan alone is Arcade |
| Materials | `concepts/materials_v01_concept.png` | Yes | Support sheet |
| Character scale | `concepts/character_scale_v01_concept.png` | Yes | Family match |
| Lighting v01 | `rejected/lighting_v01_blue_crystal_rejected.png` | No | Blue crystal breaks brand |
| Lighting v02 | `concepts/lighting_v02_concept.png` | Partial | Atmosphere ok; crystal still weak |
| Style lock | `concepts/style_lock_v01_final.png` | Yes | Gold + cyan locked together |

## Emotional Test

> Does this asset create curiosity? Would a player naturally want to walk toward it?

Fountain, Arcade portal, plaza overview, and style lock: **Yes**. Rejected lighting v01: curiosity ok, brand fail.

## Asset Review Checklist

Production-ready only if all yes:

- Readable at 100%  
- Readable at 50%  
- Works on mobile  
- Fits the Art Bible  
- Recognizable without text  
- Consistent with the existing palette  
- Makes me want to click or approach it  

## Do / Don’t

### Do

- Lead with gold crystal Fountain and cyan Arcade portal (`style_lock_v01_final.png`, `fountain_v01_concept.png`, `arcade_portal_v01_concept.png`).  
- Keep blue-hour cool stone + warm lantern contrast.  
- Reuse materials language from `materials_v01_concept.png`.  
- Keep rejected concepts in `assets/art/rejected/` for future districts.  
- Prefer shared assets across Mini Apps.

### Don’t

- Spend Phase B gens reinventing style (minor refinement only after freeze).  
- Make the hero crystal blue/purple.  
- Spend credits on ground tilesets or PixelLab UI chrome this pass.  
- Let Marketplace soak iterations (temporary construction).  
- Delete rejected art.  
- Put UI panels, chat docks, or text labels into landmark art.

## UI integration note

Vue / Nimiq UI chrome stays outside PixelLab spend. Art Pass B only replaces selected Phaser textures via optional overrides; procedural atlas remains fallback (especially ground). Direction for later UI theming: dark navy panels, cyan/gold accents echoing Fountain + Arcade — not generated here.

## Phase A concept index

| # | File | Role |
| --- | --- | --- |
| 1 | `assets/art/concepts/fountain_v01_concept.png` | Hero Fountain identity |
| 2 | `assets/art/concepts/plaza_v01_concept.png` | Plaza overview |
| 3 | `assets/art/concepts/arcade_portal_v01_concept.png` | Arcade + cyan portal |
| 4 | `assets/art/concepts/materials_v01_concept.png` | Materials sheet |
| 5 | `assets/art/concepts/character_scale_v01_concept.png` | Character scale |
| 6→7 | `lighting_v01` rejected → `lighting_v02_concept.png` | Lighting refine |
| 8 | `assets/art/concepts/style_lock_v01_final.png` | **Style freeze frame** |

## Freeze gate

**Do not start Phase B landmark production until a human confirms: “visual language frozen.”**  
Minor refinement after freeze is allowed; reinventing the style is not.
