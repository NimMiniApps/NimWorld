# Phase 3 — Atmosphere & world-building design

> **NimWorld is not an MMO and not a replacement for NimConnect or NimiqMiniApps. It is the living front door of the ecosystem—a compact, welcoming social plaza that makes every Mini App feel connected through one shared identity. Players should immediately feel curiosity, recognize important landmarks, and naturally discover the ecosystem by walking through it rather than browsing a traditional menu.**

**Date:** 2026-08-01  
**Status:** Approved  
**Scope:** Art direction, atmosphere, and world-building only. Architecture frozen.

**NimWorld should feel like the front door to the Nimiq Mini Apps ecosystem, not a menu disguised as a game. Every visual decision should encourage curiosity, discovery and a sense of place before functionality.**

---

## Approach

**A + future world landmarks (locked).** Deepen the existing compact plaza with personality, life, and rim teases that the world will grow. No explorable districts. No hand-painted tilesets yet (too early — design will still evolve). Preserve Phaser + Vue architecture exactly.

---

## 1. Goals & non-goals

### Success look

A first-time visitor should immediately understand that this is the social hub of the Nimiq Mini Apps ecosystem and want to explore it.

### Design principle — purpose before labels

**Every building should communicate its purpose before the player reads its label.** The silhouette, lighting, colors, props and animation should immediately suggest what the building is for.

### Handcrafted feel

**The plaza should feel handcrafted rather than procedurally generated. Every corner should appear intentionally designed, even if many assets are generated at runtime.**

### Landmark visibility

**The fountain should remain partially visible from almost every major path. Buildings should frame the plaza rather than block orientation.** Every major building should be visible from at least one other major location. The player should almost never feel lost.

### Camera composition

At no point should the player see the entire world at once. The camera should encourage exploration while always maintaining orientation through visible landmarks. (Keep cover-zoom on `VIEW_FRAME`; retune composition so the plaza feels larger than its footprint without expanding playable bounds.)

### In scope

- Unique building silhouettes with personality (Arena, Arcade, Town Hall, Social Club)
- Better ground composition (paths, grass, flowers, trees, water, props)
- Animated NimConnect fountain as the visual centerpiece / product icon
- Lighting, shadows, and ambient animations
- Better NPC sprites with distinct roles via placement (no dialog)
- Marketplace → construction site (“Construction / Opening Soon”)
- Future world landmarks at the rim (non-playable, story-framed)
- Micro-landmarks near each major building
- Visual revisit-hook *slots* (static rich content this pass)
- Same world size (960×720 playable footprint)

### Out of scope

- Explorable new districts or larger map
- Dialog trees / NPC click interactions beyond existing location proximity
- Commissioned / hand-painted external art
- Inventory UI redesign
- Achievement progression system
- Multiplayer gameplay
- App-specific game mechanics
- Live daily content rotation (slots only)
- Audio playback content (hooks reserved only)

### Architectural guardrail

**Do not introduce new gameplay systems while implementing this pass. If a visual improvement suggests a future gameplay feature, leave a documented hook rather than implementing the feature.**

---

## 2. Art system & building personality

### Asset pipeline

Stay on runtime procedural textures in `generatePlazaAtlas.ts`. Replace the shared `drawBuilding` skin with **one draw function per landmark**. Shared helpers only for primitives (outline, glow, torch flame frames). Original art only — no third-party tilesets.

### Color language

| Building    | Accent                        |
| ----------- | ----------------------------- |
| Arena       | Red / Orange                  |
| Arcade      | Cyan                          |
| Town Hall   | Blue                          |
| Social Club | Purple                        |
| Marketplace | Green / Yellow (construction) |
| Fountain    | Gold + Cyan                   |

Distinct color language per landmark must remain readable in the atlas so navigation works subconsciously.

### Building briefs

| Landmark | Story (readable without labels) |
| --- | --- |
| **Arcade** | **The visual centerpiece after the fountain.** Largest building in the plaza with a glowing cyan portal, animated marquee, game banners, trophy display, arcade machines visible through windows, and subtle particle effects. It should immediately communicate “this is where games live.” |
| **Arena** | Combat mass: stone battlements, corner tower, torch sconces, **bomb rack, cannon, leaderboard board, tournament banner**, red door glow, chimney smoke. |
| **Town Hall** | Civic columns + stepped plinth, flagpoles, **Mini App Bulletin** beside the door, cool blue window glow, cupola/clock peak. |
| **Social Club** | Social hub energy (Discord / friends / clubhouse)—not a generic café. Outside: benches, picnic table, mailbox, message board, NPCs talking / someone sitting. Warm purple lanterns. |
| **Marketplace** | Active construction—not a finished shop. Scaffolding, tarps, crane silhouette, fence perimeter, crates/tools, board reading **Construction / Opening Soon**. Interaction opens the existing coming-later overlay. |

### Ground composition

Break the solid pave into: grass pads → stone path ribbons → flower beds → tree clusters → water rim + bridge → plaza stones around fountain. Paths should naturally lead spawn → fountain → each entrance.

**Avoid large uninterrupted areas of identical tiles. Every 5–8 tiles introduce variation through vegetation, props, elevation, lighting, borders or decorative paving.**

### Micro-landmarks

Every landmark should be identifiable from its silhouette alone.

| Near | Micro-landmark |
| --- | --- |
| Arena | Fire pit |
| Social Club | Coffee stand |
| Town Hall | Civic statue |
| Arcade | Giant joystick sculpture |
| Marketplace construction | Crate stacks |

### Landmark framing

Keep the compact organic layout; re-tune positions/heights so façades frame the plaza. Prefer raising Arcade/Arena silhouettes over spreading the map.

---

## 3. Atmosphere, life & future world landmarks

### Fountain — logo in world form

**The fountain is the symbolic representation of NimConnect. It should be instantly recognizable and become the visual identity of NimWorld in screenshots and promotional material.**

Animated crystal (idle bob/rotate), flowing water layers, particle spray, soft gold+cyan glow, subtle idle pulse. Spawn beside it. Long-term: recognizable the way Stormwind’s fountain or Lumbridge Castle are.

### Lighting — early evening (blue hour)

The plaza should feel like early evening (blue hour), where architecture remains readable while artificial lighting provides warmth and contrast.

Soft elliptical light pools under lanterns; warmer window glow; Arcade portal and Arena door cast colored spill; contact shadows under characters/props.

### Ambient life

Butterflies / birds on short loops, leaf sway, lantern flicker, water shimmer, Arena chimney smoke, Arcade portal sparkles. Ambient actors keep simple walk/idle paths.

**Ambient motion should never distract from navigation or interaction. The goal is to make the plaza feel alive rather than busy.**

NPCs should occasionally turn toward the player (no AI — simple facing when nearby).

### Environmental storytelling via NPC placement

Distinct role sprites + labels only (no dialog):

- Guide near spawn / fountain
- Gardener at flower beds
- Courier looping Town Hall ↔ Social Club
- Tournament Master outside Arena
- Builder at Marketplace construction

### Future world landmarks

Non-playable rim teases with **in-world story language** (not “Future District” placeholders):

- Harbor bridge closed for repairs — “Harbor / Closed for repairs / Expected reopening soon”
- Mountain pass blocked by landslide — “Mountain Trail / Unsafe / Access restricted”
- Construction fences tying Marketplace site toward a future market district
- Tunnel / cave mouth with immersive destination copy (history, not unfinished map)

Playable area and collisions stay inside today’s plaza; these sit at the rim and block travel. Players should think “I wonder what’s going to open there next,” not “half the map is unfinished.”

### Revisit hooks (visual stubs this pass)

Every revisit hook should have a **physical representation in the world** rather than only existing inside overlays:

- Arena tournament banner
- Arcade featured-game poster
- Town Hall Mini App Bulletin
- Social Club “friends around” cue (visual only)
- Marketplace construction progress

**This pass:** ship the slots with rich static content. **Not this pass:** live rotation.

### Reserved audio hooks (do not implement playback)

Fountain · Water · Lantern · Fire · Bird · Portal hum · Footsteps · Construction hammer · Wind

---

## 4. Technical boundaries & acceptance

### Touched surfaces

- `apps/web/src/game/assets/generatePlazaAtlas.ts` — per-landmark draw fns, micro-landmarks, construction, future-landmark props, ambience frames; **distinct color language per landmark**
- `apps/web/src/game/world/locations.ts` — ground / DECOR / micro-landmarks / future landmarks / construction site / slight layout retunes
- `apps/web/src/game/scenes/PlazaScene.ts` — ground variation, light pools, ambient loops, NPC facing, fountain FX, smoke/sparkles; **no new bridge events or adapter APIs**
- `apps/web/src/adapters/presence/PresenceAdapter.ts` — mock NPC roles + placement
- `apps/web/src/components/locations/MarketplaceOverlay.vue` — Construction / Opening Soon tone
- Screenshots under `docs/screenshots/`

### Frozen

World size, Vue shell/HUD architecture, location overlay routing, adapters (except mock NPC data), payment/catalog/nimconnect behavior, audio playback.

**Do not introduce new gameplay systems while implementing this pass. If a visual improvement suggests a future gameplay feature, leave a documented hook rather than implementing the feature.**

### Acceptance criteria

1. Each building’s purpose is clear before reading its label (silhouette + color language).
2. Ground has path/grass/prop variation every ~5–8 tiles — no giant uniform pave.
3. Fountain is the unmistakable screenshot centerpiece / NimConnect symbol.
4. Marketplace reads as active construction, not a finished shop.
5. Future world landmarks use in-world story copy.
6. Ambient life + lighting feel early-evening / alive-not-busy.
7. Existing interactions, tests, and build remain green.
8. **A first-time user should be able to identify the Fountain, Arcade, Arena and Town Hall within 10 seconds without reading labels.**

---

## Future (not this phase)

After this visual pass lands, prefer a **NimWorld v1.0 Product Bible** over a feature-stuffed “Phase 4”: world lore (lightweight), app manifest standard, building lifecycle, how new apps appear, seasonal events, cross-app achievements, economy philosophy, SDK capability model, visual identity guidelines.

---

## Philosophy

**NimWorld should feel like the front door to the Nimiq Mini Apps ecosystem, not a menu disguised as a game. Every visual decision should encourage curiosity, discovery and a sense of place before functionality.**
