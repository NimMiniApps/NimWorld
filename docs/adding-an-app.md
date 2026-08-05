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

Drop the file in `packages/app-manifest/src/manifests/`. The API serves that
directory at `/apps`, and the client's catalog chain is public API → registry →
bundled, so a manifest works even when the NimiqMiniApps API is unreachable.

## 2. Prefer the Arcade

Do not add a permanent plaza building for every game. Put most games in the Arcade list. Reserve dedicated buildings for signature destinations (e.g. NimBomber Arena).

## 3. Launch safely

Use `AppLauncher` so launch URLs only receive public context:

- `source=nimworld`
- `returnUrl`
- optional `challengeId` / `ref`

Never put private profile or financial data in query params.

## 4. Report activity with signed events

The browser can never tell NimWorld that a player achieved something — it holds
no secret, so any such claim would be forgeable. Reports come from **your
server**, signed with a shared secret.

Ask a NimWorld operator to add your app to the API's `APP_KEYS`:

```
APP_KEYS=my-game:<a long random secret>,nimbomber:<another one>
```

Then `POST /events` with the signature in a header:

| Header | Value |
|--------|-------|
| `X-App-Id` | your app id, exactly as it appears in `APP_KEYS` |
| `X-App-Signature` | hex HMAC-SHA256 of the **raw request body**, keyed with your secret |

```json
{
  "address": "NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C",
  "type": "score.posted",
  "ts": 1785970439,
  "public": true,
  "text": "scored 4,200",
  "data": { "score": 4200 }
}
```

- `ts` is Unix seconds and must be within 5 minutes of the server's clock — a
  signature with no freshness bound is replayable forever.
- `address` identifies the player. The app id comes from the header, not the
  body, so one app cannot post as another.
- `data` is yours; NimWorld stores it and does not interpret it.

Sign the exact bytes you send, not a re-serialized copy of the object:

```js
import { createHmac } from 'node:crypto'

const body = JSON.stringify({ address, type: 'score.posted', ts: Math.floor(Date.now() / 1000), public: true, text: 'scored 4,200' })
const signature = createHmac('sha256', process.env.NIMWORLD_APP_SECRET).update(body).digest('hex')

await fetch('https://<api>/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-App-Id': 'my-game', 'X-App-Signature': signature },
  body,
})
```

`apps/api/cmd/signevent` does the same thing from the command line, which is the
quickest way to see a line land in the plaza:

```sh
cd apps/api
APP_KEYS=my-game:s3cret SESSION_SECRET=dev COOKIE_INSECURE=1 go run . &
go run ./cmd/signevent -app my-game -secret s3cret \
  -address "NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C" \
  -type score.posted -text "scored 4,200" -public
```

### What players see

Events are **private by default**: they go to `GET /events`, which only ever
returns the calling session's own events.

Setting `"public": true` puts one line in the Town Hall activity feed, which
every logged-in visitor reads — so it requires `text`, and `text` is the entire
public statement (max 120 chars). Write it as a sentence fragment that follows a
name: *"scored 4,200"*, *"won a 5-player match"*. Keep anything private out of
it; there is no way to unpublish a line once it is in the feed.
