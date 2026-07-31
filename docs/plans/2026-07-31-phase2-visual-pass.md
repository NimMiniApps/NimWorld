# Phase 2 — Visual production pass

## Asset strategy

Runtime-generated **original pixel atlas** (`generatePlazaAtlas.ts`) with one shared night palette. Includes stone/grass/water tiles, trees, bushes, benches, lanterns, banners, bridges, building façades, fountain, and 4-direction character sheets (idle + walk). No third-party game art.

## Map composition

Compact 960×720 world. Organic lobed plaza (not radial diagram). Arcade largest at rear; Arena left; Marketplace right (awning); Social Club + Town Hall foreground; fountain/spawn center. Curved paths, perimeter water, vegetation clusters.

## Camera scaling

Phaser `Scale.RESIZE` fills the Vue shell. Camera uses **cover zoom** (`max(view/world)`) so the plaza fills the viewport without letterboxed empty bands. Follows player with deadzone; spawn frames fountain + nearby buildings.

## Procedural vs map data

Still procedural Phaser placement driven by `locations.ts` / `DECOR` (no Tiled yet). Collision footprints aligned to building textures.

## Screenshots

Captured under `docs/screenshots/` at 360×800, 390×844, 768×1024, 1440×900, 2560×1080.
