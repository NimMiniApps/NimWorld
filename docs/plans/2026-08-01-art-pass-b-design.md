# Art Pass B — NimWorld Art Bible & PixelLab brand kit

> **This pass is not about generating as many assets as possible. It is about defining a visual language that can scale across NimWorld, NimBomber, NimConnect and future Mini Apps.**

**Date:** 2026-08-01  
**Status:** Approved  
**Scope:** Visual language, hero landmarks, shared props, character kit. Architecture frozen. Ground tilesets and UI chrome deferred.

**Reference moodboard:** `assets/moodboard/nimconnect-plaza-moodboard.png`  
**Phase 3 baseline:** Runtime procedural plaza in `generatePlazaAtlas.ts` (readable landmarks; not yet brand-grade).

---

## Why NimWorld exists

NimWorld is the visual front door to the Nimiq Mini Apps ecosystem. It exists to make discovery, identity and social interaction feel playful and memorable rather than transactional. Every visual element should reinforce that this is one connected ecosystem powered by NimConnect.

---

## Approach (locked)

**Fountain-first Art Bible → Hero Landmark Kit → Shared Prop Kit → Character Kit.**  
Spend trial PixelLab generations on brand identity, not paving. Procedural ground remains until a later pass. No PixelLab UI buttons.

**The NimWorld Art Bible is the canonical visual reference for the Maestro Mini Apps ecosystem.** Future projects such as NimBomber, PlayNimiq, NimConnect visual assets, and new Mini Apps should follow these principles unless a project intentionally establishes its own distinct identity.

---

## 1. Goals & non-goals

### Goals

- Freeze a core visual language before production landmark spend
- Make Fountain + Arcade (especially cyan portal) instantly recognizable as NimWorld
- Ship reusable shared props and a coherent character family
- Leave documentation that future artists/contributors can follow without rediscovering intent

### Non-goals

- Full ground / path autotile kit
- PixelLab UI chrome
- Explorable new districts or map expansion
- New gameplay systems
- Product Bible (separate later doc)
- Perfect Stardew/Eastward parity in one trial (40 gens)

### Architectural guardrail

Phaser + Vue stay as-is. This pass changes art sources and docs. Procedural atlas remains fallback for anything not yet replaced (especially ground).

---

## 2. Philosophy

1. Answer **“What does NimWorld look like?”** before shipping production assets.
2. Brand cues over volume: cyan portal → Arcade; gold crystal fountain → NimWorld.
3. **Every generated asset should be reusable across multiple Mini Apps where appropriate.**
4. Architecture frozen; art sources change.
5. Buildings are screenshots; characters are what players remember — both are brand.
6. Marketplace is temporary — spend fewer iterations there.
7. Never delete rejected concepts; they feed future districts.

### Visual hierarchy

1. Fountain  
2. Arcade  
3. Arena  
4. Player  
5. NPCs  
6. Props  
7. Ground  

Prevents paving from outshining the Arcade.

### Brand Recognition Test

> If someone sees this asset by itself on X, Discord or GitHub, could they reasonably recognize it as belonging to NimWorld?

If no → regenerate.

### Emotional Test

> Does this asset create curiosity? Would a player naturally want to walk toward it?

### Asset Review Checklist (production-ready only if all yes)

- Readable at 100%
- Readable at 50%
- Works on mobile
- Fits the Art Bible
- Recognizable without text
- Consistent with the existing palette
- Makes me want to click or approach it

---

## 3. Credit budget (40 generations)

| Phase | Deliverable | Gens |
| --- | --- | ---: |
| A | **NimWorld Art Bible** — concepts + written rules | **8** |
| B | **Hero Landmark Kit** | **18** |
| C | **Shared Prop Kit** | **8** |
| D | **Character Kit** | **4** |
| Reserve | Re-rolls on brand misses | **2** |
| Ground / UI | Deferred | — |

### Phase A order (Fountain-first)

1. Hero Fountain concept (NimConnect identity)  
2. Plaza overview  
3. Arcade + cyan portal  
4. Materials sheet  
5. Character scale  
6. Lighting  
7. Style refinement  
8. Final style freeze  

**Freeze language:** Freeze the core visual language before Phase B. Minor refinement is allowed, but do not reinvent the style once landmark production begins.

**Day-one rule:** Spend the first generation day **only** on the Art Bible — no production assets until the visual language is frozen.

### Phase B — Hero Landmark Kit (18)

| Landmark | Gens | Notes |
| --- | ---: | --- |
| Fountain | 4 | Permanent identity |
| Arcade | 5 | Includes dedicated **portal FX** asset |
| Arena | 4 | Competition / NimBomber energy |
| Town Hall | 2 | Civic / Mini Apps |
| Social Club | 2 | Friends & messages |
| Marketplace | 1 | Temporary construction — minimal spend |

**Effects:** Generate a dedicated Arcade Portal asset (cyan, magical, inviting, animatable) — not only a building facade. High screenshot share.

### Phase C — Shared Prop Kit (8)

Trees, bushes, benches, lamps, crates, banners, flower beds, signposts, statues, fountain decorations. Reused hundreds of times. No ground tiles.

### Phase D — Character Kit (4)

| Role | Notes |
| --- | --- |
| Player | Avatar base |
| Guide | Plaza greeter |
| Builder | Marketplace / world-growing symbol |
| Tournament Master | Arena energy |

**Ghost** = translucent Player sprite (no separate generation).

---

## 4. PixelLab workflow & Phaser integration

### Tools (preferred)

- Concepts / style: `create_image_pro` / `create_image_pixen` (scenes opaque; sprites transparent)
- Landmarks & props: `create_1_direction_object` or image tools with style refs from Phase A
- Characters: `create_character` (v3) with style lock from Character Bible
- View: **low top-down** unless Art Bible freezes otherwise

### Asset folders

```text
assets/art/
  concepts/
  landmarks/
  props/
  characters/
  effects/
  rejected/
```

### Naming convention

```text
{subject}_v{NN}_{status}.png

fountain_v01_concept.png
fountain_v02_candidate.png
fountain_v03_final.png
arcade_portal_v01.png
arcade_portal_v02_final.png
guide_idle_v01.png
guide_walk_v01.png
```

**Statuses:** `concept` · `candidate` · `approved` · `deprecated` · `rejected`

### Integration

- Phaser loads approved PNGs for landmarks / props / characters / effects that pass review
- `generatePlazaAtlas.ts` remains fallback (ground stays procedural this pass)
- No map size, location layout, or gameplay system changes

### Quality gates (every spend)

1. Matches Art Bible rules  
2. Brand Recognition Test  
3. World Bible: silhouette + screenshot role (Hero / Supporting / Background)  
4. Character Bible family match  
5. Emotional Test  

---

## 5. Documentation deliverables

| Doc | Path |
| --- | --- |
| Design principles (10) | `docs/art/design-principles.md` |
| Art Bible | `docs/art/nimworld-art-bible.md` |
| World Bible | `docs/art/world-bible.md` (+ per-landmark sections or `docs/art/landmarks/*.md`) |
| Character Bible | `docs/art/character-bible.md` |
| Future expansion | `docs/art/future-expansion.md` |
| Asset index | `assets/art/README.md` |

### Art Bible must include

- Why NimWorld exists  
- Ecosystem scope (Maestro Mini Apps)  
- Palette, materials, roof/stone/vegetation/window styles  
- Outline thickness, shadow style, character scale  
- Lighting, animation principles, camera framing  
- Visual hierarchy  
- Brand Recognition + Emotional tests + review checklist  
- Do / Don’t examples  
- UI integration note (direction only — no PixelLab UI spend)

### World Bible (per landmark)

Purpose · Mood · Color · Sounds · Lighting · Props · Animation · **Recognition test** (silhouette Y/N) · **Screenshot role** (Hero / Supporting / Background)

### Character Bible

Proportions · Eyes · Outlines · Idle pose · Walk cycle · Animation speed · Shadow style · Color restrictions · Roster

### Future expansion (ideas only)

Harbor, Developer District, Museum, Pet Park, Event Square, seasonal decorations (winter, Halloween), etc. Destination for rejected concepts.

### Design principles (quick reference)

1. Landmarks before detail.  
2. Curiosity before functionality.  
3. Buildings tell stories.  
4. Reuse before regenerate.  
5. Shared assets over app-specific assets.  
6. Motion should support atmosphere.  
7. Every asset must pass the Brand Recognition Test.  
8. Every asset must pass the Emotional Test.  
9. Build for mobile first.  
10. Favor timeless over trendy.  

---

## 6. Success criteria

- Art Bible frozen with 3–5 concept images and written rules before Phase B production  
- Fountain and Arcade portal pass Brand Recognition + Emotional tests  
- Hero landmarks readable without labels; silhouette test documented  
- Shared props reusable and indexed  
- Character kit reads as one family; Ghost works as translucent Player  
- Procedural ground still acceptable; no credit spent on paving/UI  
- Reserve used only for brand misses on Fountain / Arcade / Arena  

---

## 7. Relationship to other docs

| Doc | Role |
| --- | --- |
| Phase 3 atmosphere design | Runtime procedural baseline; Art Pass B replaces selected textures |
| Product Bible (future) | Product scope / vision — not this pass |
| This design | Visual brand + PixelLab spend plan |

---

## Approval

Sections 1–3 approved 2026-08-01 with refinements: Fountain-first Phase A, Hero Landmark Kit, Character Kit roster (Player/Guide/Builder/Tournament Master), World Bible naming, Art Bible ecosystem scope, naming convention, future-expansion + design-principles docs.
