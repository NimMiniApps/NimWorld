# NimWorld Character Bible

**Status:** Character visual language **LOCKED** (2026-08-01) — V4  
**Canonical ref:** `assets/art/concepts/characters_v04_citizen_refine.png`  
**Environment authority:** Art Bible frozen; characters match outline / lighting / palette.

---

## Lock decision

| Sheet | Score | Decision |
| --- | ---: | --- |
| `character_scale_v01_concept.png` | 7.0 | Rejected — RPG / MMO heroes |
| `characters_v02_citizen_lineup.png` | 8.8 | Strong runner-up — hoodie/scarf/builder |
| `characters_v03_proportion_study.png` | 6.5 | Rejected — children’s-book / farming vibes |
| **`characters_v04_citizen_refine.png`** | **9.4** | **LOCKED** — expressive, modern citizens |

Stop iterating overall character style. Next character spend = production sheets + **animations**, not new style fishing.

---

## Aesthetic

**NimWorld citizens** in a cozy magitech social hub — not RPG adventurers.

| Lean into | Avoid |
| --- | --- |
| Hoodies, jackets, scarves | Cloaks, robes |
| Light utility gear | Fantasy armor, pauldrons |
| Expressive modern faces | Stoic MMO hero faces |
| Soft magitech badges | Giant swords, dragons |
| Same-town family | Distinct D&D classes |

Inspiration: Stardew × MapleStory × CrossCode readability, with **subtle magitech** accents only.

---

## Proportions

V4 family: modern chibi — large expressive heads, readable eyes, stubby but not babyish legs, thick clean outlines, painterly pixels. Shared height/mass across roster.

## Eyes

Large, friendly, expressive. Soft cheek color OK (V4 blush).

## Outlines

Match environment: thick but clean single-color dark outline.

## Clothing rules

| Instead of | Use |
| --- | --- |
| Cloak | Hoodie or jacket |
| Robes | Jacket / tracksuit / soft layers |
| Fantasy armor | Light utility gear (belts, pouches, hardhat) |

## Color language (building reinforcement)

| Role | Color | Echoes |
| --- | --- | --- |
| Guide | Cyan | Arcade / portal family |
| Builder | Yellow | Construction / growth |
| Tournament Master | Red / orange | Arena |
| Town Hall staff (future) | Blue | Town Hall civic |
| Player | Cyan + gold badge | Fountain / NimConnect |

Shared small **gold hex/badge** accents OK as magitech family cue (V4).

## Roster

### Locked direction (V4)

- **Player** — cyan hoodie, gold badge, NimConnect citizen  
- **Guide** — approachable greeter (jacket/scarf, not rogue cloak)  
- **Builder** — yellow hardhat, utility gear — **expansion mascot** energy (“Builder Bob” candidate)  
- **Tournament Master** — mentor/sport energy (not mage) — orange/red accents  

### Production sheets (V4, in-game)

| Role | Phaser key | Sheet | PixelLab id |
| --- | --- | --- | --- |
| Player | `char-player` | `characters/player_sheet_v01.png` | `2bad176b-7b7d-4b76-aca5-da23a4e4330f` |
| Guide | `char-npc-a` | `characters/guide_sheet_v01.png` | `5dd5f83e-b4da-46c8-a529-17e43f5effb4` |
| Courier | `char-npc-c` | `characters/courier_sheet_v01.png` | `aae9c367-f4bb-448a-9f18-ea4966414b9e` |
| Tournament Master | `char-npc-d` | `characters/tournament_master_sheet_v01.png` | `70bb13ca-33d1-444e-af07-43fd62479806` |
| Builder | `char-npc-e` | `characters/builder_sheet_v01.png` | `123beb71-e7d2-4647-bea7-5275d754cf9c` |

Sheet layout: 4×4 @ **48×48** (192×192 PNG). Rows = south, west, east, north. Cols = idle, walk0, walk1, walk2.  
Gardener (`char-npc-b`) still procedural until a V4 gardener sheet exists.

### Add next (variants, not style search)

- Gardener, Merchant (later)  
- Builder variations at construction sites  
- Role anims: wave, hammer, etc. (idle + walk shipped first)

### Ghost

Translucent Player — no separate generation.

## Idle pose

Relaxed, approachable, social. Wave-ready for Guide. Current sheets use rotation idle; breathing-idle optional later.

## Walk cycle

Phaser sheet: 4 dirs × (idle + 3 walk frames) @ **48×48** V4 (procedural fallback remains 32×48).

## Priority animations (before more style gens)

Idle · Walk · Wave · Hammer (Builder) · Water flowers · Read notice board · Sit  

Tiny loops > new outfits.

## Animation speed

Short atmospheric loops — alive, not twitchy.

## Shadow style

Soft elliptical contact shadow (Art Bible).

## Gate

Do not reopen character style. Production sheets and animations must match **V4**. Reject anything that reads as high fantasy RPG again.
