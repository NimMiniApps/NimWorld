# Adding an app to NimWorld

New apps should arrive as manifests, not hardcoded Phaser buildings.

## 1. Create a manifest

```json
{
  "schemaVersion": 1,
  "id": "my-game",
  "name": "My Game",
  "description": "Short public description.",
  "category": "game",
  "iconUrl": "https://example.com/icon.png",
  "launchUrl": "https://example.com",
  "capabilities": ["identity", "stats"],
  "world": {
    "locationType": "arcade",
    "district": "games",
    "interactionLabel": "Play My Game",
    "featured": true
  }
}
```

Validate with `@nimworld/app-manifest`:

```ts
import { validateAppManifest } from '@nimworld/app-manifest'
```

## 2. Prefer the Arcade

Do not add a permanent plaza building for every game. Put most games in the Arcade list. Reserve dedicated buildings for signature destinations (e.g. NimBomber Arena).

## 3. Launch safely

Use `AppLauncher` so launch URLs only receive public context:

- `source=nimworld`
- `returnUrl`
- optional `challengeId` / `ref`

Never put private profile or financial data in query params.
