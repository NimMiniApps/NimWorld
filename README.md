# NimWorld

Mobile-first interactive social plaza for the Nimiq Mini Apps ecosystem.

NimWorld is a visual lobby:

- **NimConnect** owns identity and social data
- **NimiqMiniApps** owns the catalog
- **NimWorld** presents a walkable plaza and Vue overlays
- Each Mini App keeps its own gameplay and authoritative state

## Quick start

```bash
npm install
npm run dev:api
```

Then start the web app in a second terminal:

```bash
npm run dev
```

Open the local URL printed by Vite. The login API uses port `8091` by default;
override its proxy target with `NIMWORLD_AUTH_API_TARGET` if needed.

Live presence: after Hub login, open a second browser profile/tab on the same origin —
you should see each other as walking avatars. If the API is down, NPCs/ghosts still load.

- Desktop: `WASD` / arrow keys to move, `Enter` / `Space` to interact, `Esc` to close overlays
- Mobile: virtual joystick + tap the interaction prompt

```bash
npm test
npm run build
```

## What's included

- Phaser plaza with fountain, Arena, Arcade, Town Hall, Social Club, and Marketplace construction site
- Phase 3 atmosphere pass: unique landmark silhouettes, path-based ground, iconic fountain, blue-hour lighting, ambient life, future world landmarks
- Phase 2 foundation: cohesive pixel atlas, cover-zoom camera, animated characters, Y depth sorting
- Vue overlays for each location (unchanged adapter boundaries)
- Event bridge between Phaser and Vue
- App manifest package (types, JSON Schema, validation, mocks)
- `@nimconnect/profile-client` for public profile lookup when an address is available
- Clearly labelled mock adapters for friends, achievements, inventory, and arena stats
- NimiqMiniApps catalog adapter (Vite proxy + local manifest fallback)
- `AppLauncher` that opens Mini Apps with safe `source` / `returnUrl` context

Responsive captures: [`docs/screenshots/`](./docs/screenshots/)

## Mood board

Visual direction lives at [`assets/moodboard/nimconnect-plaza-moodboard.png`](./assets/moodboard/nimconnect-plaza-moodboard.png). Treat it as atmosphere and landmark intent, not a pixel-perfect layout.

## Architecture notes

See [`docs/plans/2026-07-31-nimworld-plaza-design.md`](./docs/plans/2026-07-31-nimworld-plaza-design.md) and [`docs/architecture.md`](./docs/architecture.md).

### Adding an app portal

1. Add a valid manifest under `packages/app-manifest` (or load one remotely later)
2. Point Arcade / world presentation at the manifest `world` metadata
3. Do not hardcode app-specific UI into Phaser scenes

Details: [`docs/adding-an-app.md`](./docs/adding-an-app.md)

## Important constraint

`@nimconnect/profile-client` currently supports public handle/profile lookup only. Friends, achievements, inventory, and permission APIs are mocked behind typed adapters until NimConnect exposes them.
