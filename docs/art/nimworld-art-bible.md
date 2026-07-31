# NimWorld Art Bible

**Status:** Environment visual language **FROZEN** (2026-08-01 human review) — visual identity v1.0  
**Phase A spend:** 8 / 8 generations (PixelLab trial; pixen/pixflux @ 1 gen each)  
**North star:** `assets/art/concepts/plaza_v01_concept.png`  
**Style lock:** `assets/art/concepts/style_lock_v01_final.png`  
**Moodboard:** `assets/moodboard/nimconnect-plaza-moodboard.png`

---

## VISUAL LANGUAGE LOCKED

```text
VISUAL LANGUAGE LOCKED

✓ Cozy fantasy
✓ Subtle magitech
✓ Cyan portal
✓ Gold crystal
✓ Warm windows
✓ Thick outlines
✓ Painterly pixel rendering

Avoid

✗ Dark gothic
✗ High fantasy
✗ Sci-fi
✗ Neon cyberpunk
✗ Flat RPG Maker look
```

Characters locked to **V4** — see `docs/art/character-bible.md` (`characters_v04_citizen_refine.png`).

---

## Freeze decision

Environment style is frozen. Do **not** regenerate plazas or fountain concepts for style discovery.

| Asset | Score | Decision |
| --- | ---: | --- |
| Plaza overview | 9.5 | **North star** — composition & mood authority |
| Style lock | 9.5 | Art Bible style reference |
| Fountain | 9.5 | Identity lock; Phase B crystal **+10–15% larger** for mobile |
| Lighting | 9.0 | Keep; push lantern pools to **full warm** in production |
| Arcade portal | 9.0 | Keep; Phase B FX: particles, thicker glow, slow pulse, optional floating runes |
| Materials | 8.5 | Keep; **add doors** to materials / prop kit |
| Characters | 7.5 | **Not frozen** — too generic fantasy RPG; revisit before Phase D |

Remaining effort priority (post V4 character lock + landmark kit v1):

1. **Arcade wow pass** — must rival Arena; Fountain + Arcade = the two screenshot icons  
2. Character **animations** (idle/walk/wave/hammer/…) — not more style sheets  
3. NPC variants (Courier first, then Gardener/Merchant/Builder variants)  
4. Reusable props + animated effects (portal overlay, lantern flicker)  
5. Path layout polish (less hard “X”; curve + widen into little plazas) — code/layout, not PixelLab ground  
6. Hub marketing frame only after finals feel settled  

**Do not:** reopen character style; add giant swords / dragons / castles everywhere.

---

## Why NimWorld exists

NimWorld is the visual front door to the Nimiq Mini Apps ecosystem. It exists to make discovery, identity and social interaction feel playful and memorable rather than transactional. Every visual element should reinforce that this is one connected ecosystem powered by NimConnect.

## Ecosystem scope

The NimWorld Art Bible is the canonical visual reference for the Maestro Mini Apps ecosystem. Future projects such as NimBomber, PlayNimiq, NimConnect visual assets, and new Mini Apps should follow these principles unless a project intentionally establishes its own distinct identity.

## Aesthetic thesis

**Cozy fantasy × subtle magical technology** — not a pure medieval RPG village, and not “crypto neon.”

| Lean into | Avoid |
| --- | --- |
| Gold crystal technology (NimConnect) | Generic thatch / wooden tavern clichés |
| Cyan holographic / energy portals | Every building looking medieval |
| Soft blue roofs, warm windows, painterly pixels | Empty plazas, cold sterile sci-fi |
| Clean civic Town Hall | Ornate castle clutter |
| Marketplace = canvas + scaffolding | Over-finished shop façades this pass |

Think: *I'd actually click this* — cozy enough to linger, magical enough to walk toward Arcade.

## Asset taxonomy (internal)

Prefer this language over a single “Hero Landmark Kit” bucket:

### Icon Assets — define NimWorld

Fountain · Portal · Crystal · Lantern · Window · Roof · (Doors)

### Environment Assets — repeated everywhere

Trees · Flowers · Benches · Barrels/crates · Stone ring / path accents

### Landmark Assets — buildings

Arcade · Arena · Town Hall · Social Club · Marketplace (temporary)

### Character Assets

Player · Guide · Builder · Tournament Master · (Ghost = translucent Player)

---

## Palette

Derived from Phase A concepts (plaza north star, style lock, fountain, arcade portal).

| Role | Hex | Notes |
| --- | --- | --- |
| Night sky / deep shadow | `#0a0f24` → `#101040` | Blue-hour base |
| Cool stone | `#304060` → `#405070` | Plaza masonry |
| Roof blue | `#203060` → `#2a4068` | Soft blue scalloped tiles |
| Vegetation | `#002010` → `#104010` | Dense evening greens |
| Fountain water / portal cool | `#307080` → `#3de7ff` | Magical cyan family |
| Arcade portal core | `#50f0f0` → `#58c4ff` | Instant Arcade cue |
| Gold crystal / lantern | `#f5a623` → `#f0f000` | NimWorld / NimConnect identity |
| Warm lantern pool | `#ffc66d` → `#ffe0a0` | Push to **100% warm** in production |
| Outline | `#0c1020` / near-black | Thick but clean |
| Stone highlight | `#5a6890` / warm brass `#b0a080` | Rim & filigree |

**Brand locks (non-negotiable):**

1. Fountain crystal = **gold / warm yellow** (never blue as the hero crystal).  
2. Arcade portal = **bright cyan**, readable alone — should almost hypnotize.  
3. Blue-hour evening — cool stone + **full-warm** lantern contrast.  
4. Magitech accents on landmarks (holo signs, crystal tech, energy) over pure medieval.

## Materials

### Roof

Soft blue-grey scalloped shingles (`materials_v01_concept.png`, style lock). Readable at 50%.

### Stone

Cool grey-blue block masonry; brass/warm filigree OK on Fountain. Buildings frame the plaza — they do not dominate it (`plaza_v01_concept.png`).

### Vegetation

Ivy walls, rounded bushes, flower pops. Frame landmarks; never outshine Fountain / Arcade.

### Window

Warm gold interior glow by default; cyan-lit only on Arcade. Warm windows are a style pillar.

### Doors (gap)

Entrances are high-attention. Generate door variants in materials / props (civic clean, Arcade magitech, construction temporary). People always look at entrances.

## Outline thickness

Thick but clean single-color dark outline (~1–2 px at concept res). Painterly pixel detail inside; silhouette must read on mobile.

## Shadow style

Soft elliptical contact shadows. Landmark casts cool; lantern pools **fully warm**. Prefer readable pools over soft blur stacks.

## Character scale

**Locked:** `assets/art/concepts/characters_v04_citizen_refine.png` (9.4/10).  
Full rules in `docs/art/character-bible.md`. Hoodies/jackets over cloaks/robes; color-coded to landmarks; Courier still to add.

## Lighting

Authority: plaza + lighting studies + style lock.

- Cool ambient blue-hour  
- **100% warm** lantern pools  
- Gold crystal hero light  
- Cyan portal spill as destination cue  

## Animation principles

- Fountain: crystal pulse, gold sparkles, water ripples; crystal larger in production  
- Arcade portal: particles, thicker glow, slow pulse, optional floating runes  
- Lanterns: gentle flicker  
- Characters: short idle + walk; Ghost = translucent Player  

## Camera

Phaser plaza framing unchanged. Art gen: low top-down / low-isometric 3/4 matching plaza north star. No UI chrome in art frames.

## Visual hierarchy

1. Fountain  
2. Arcade (portal)  
3. Arena  
4. Player  
5. NPCs  
6. Props / environment  
7. Ground  

## Brand Recognition Test

> If someone sees this asset by itself on X, Discord or GitHub, could they reasonably recognize it as belonging to NimWorld?

Frozen environment anchors: Fountain (gold crystal) + Arcade portal (cyan) + plaza composition.

## Emotional Test

> Does this asset create curiosity? Would a player naturally want to walk toward it?

Plaza north star is the bar: *I'd actually click this.*

## Asset Review Checklist

Production-ready only if all yes:

- Readable at 100%  
- Readable at 50%  
- Works on mobile  
- Fits the Art Bible  
- Recognizable without text  
- Consistent with the existing palette  
- Makes me want to click or approach it  
- Feels cozy fantasy × magitech (not generic medieval)

## Do / Don’t

### Do

- Treat `plaza_v01_concept.png` as composition north star.  
- Treat `style_lock_v01_final.png` as materials / outline / lighting lock.  
- Keep Fountain + cyan portal as brand icons.  
- Inject subtle modernity / magitech on landmarks.  
- Generate doors; warm lanterns fully; portal FX that hypnotize.  
- Keep rejected art in `assets/art/rejected/`.

### Don’t

- Regenerate plaza / fountain for style fishing.  
- Default every building to medieval wood signs.  
- Ship the Phase A character sheet as final family.  
- Spend credits on ground tilesets or PixelLab UI this pass.  
- Let Marketplace soak iterations.  
- Delete rejected art.

## UI integration note

Vue / Nimiq UI stays outside PixelLab spend. Optional Phaser texture overrides; procedural atlas remains fallback (especially ground). Later UI theming may echo navy + cyan/gold — not generated here.

## Missing hero marketing frame

Still desired (not style discovery — marketing / hub identity):

**NimConnect Fountain Plaza** as one composition:

Fountain + stone ring + benches + flowers + lanterns + trees  

Use for screenshots / share cards. Generate when spending resumes (count against props/reserve or a dedicated 1-gen slot — do not reopen style search).

## Phase A concept index

| # | File | Role | Freeze |
| --- | --- | --- | --- |
| 1 | `concepts/fountain_v01_concept.png` | Hero Fountain | Frozen (crystal +10–15% in prod) |
| 2 | `concepts/plaza_v01_concept.png` | **North star** | Frozen |
| 3 | `concepts/arcade_portal_v01_concept.png` | Arcade portal | Frozen (FX push in B) |
| 4 | `concepts/materials_v01_concept.png` | Materials | Frozen (+ doors later) |
| 5 | `concepts/characters_v04_citizen_refine.png` | Character scale | **Locked (V4)** |
| 6 | `rejected/lighting_v01_blue_crystal_rejected.png` | Lighting fail | Rejected |
| 7 | `concepts/lighting_v02_concept.png` | Lighting refine | Frozen (warmer lamps in prod) |
| 8 | `concepts/style_lock_v01_final.png` | Style lock | Frozen |
