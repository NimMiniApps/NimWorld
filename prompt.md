Below is a **copy-paste master prompt** for your coding agent. Attach the generated plaza screenshot as the visual reference when you send it.

````markdown
# Build NimWorld — Interactive Social Plaza for Nimiq Mini Apps

You are a senior product engineer, game developer, and systems architect. Build the first production-quality MVP of **NimWorld**, a mobile-first interactive social plaza for the Nimiq Mini Apps ecosystem.

Before writing code, inspect the existing repository, its conventions, the existing NimConnect SDK, and any existing Nimiq Mini App integration. Reuse existing components and APIs where appropriate. Do not duplicate functionality already owned by NimConnect or NimiqMiniApps.

Make sensible engineering decisions independently. Only stop to ask questions when a missing detail would cause destructive work or a major architectural mismatch.

---

# 1. Product vision

NimWorld is a lightweight, game-like visual frontend for the Nimiq Mini Apps ecosystem.

It is not a traditional MMO and it is not a replacement for NimConnect or NimiqMiniApps.

The product split is:

## NimConnect

NimConnect is the shared user and social layer.

It owns:

- User handles
- Public profiles
- Avatars
- Contacts and friends
- Messaging
- Payment requests
- Split bills
- Invoices
- Savings buckets
- Connected apps
- Achievements
- Badges
- Shared inventory references
- App permissions

NimWorld must use the existing NimConnect SDK rather than recreating these systems.

## NimiqMiniApps

NimiqMiniApps is the catalog, store, and library layer.

It owns:

- App listings
- Categories
- Search and discovery
- Reviews and ratings
- Screenshots
- Developer ownership
- Featured apps
- Launch URLs
- Installed, connected, or favorited apps

NimWorld consumes its app metadata but does not replace the catalog.

## NimWorld

NimWorld is the interactive visual lobby.

It presents:

- The user's NimConnect identity
- Friends and recently active users
- App portals and buildings
- Achievements and profile progress
- Events, challenges, and leaderboards
- NIM gifting and social actions
- Visual access to Mini Apps

NimWorld must remain useful with only one active user. Real-time multiplayer presence is an enhancement, not the primary gameplay loop.

## Individual apps

Each app continues to own:

- Its gameplay
- Its game rules
- Its app-specific progression
- Its authoritative scores
- Its own items and currencies
- Its own matchmaking
- Its own backend state

NimWorld must not attempt to understand every game's internal systems.

---

# 2. Core user experience

A user launches NimWorld inside Nimiq Pay or in a normal browser.

The expected flow is:

1. Initialise the Nimiq Mini App environment.
2. Connect to NimConnect using the existing SDK.
3. Load the user's handle, avatar, profile, public achievements, and connected apps.
4. Spawn the player's avatar near the central NimConnect fountain.
5. Allow movement through the plaza using:
   - Touch joystick on mobile
   - Tap-to-move where practical
   - WASD and arrow keys on desktop
6. Let the user approach interactive buildings and characters.
7. Display an interaction prompt when the player is within range.
8. Open a native-looking Vue overlay rather than rendering large menus inside the game canvas.
9. Launch external Mini Apps from their portal.
10. Return the user to NimWorld without losing their plaza state where possible.

The plaza must not feel empty when few people are online.

Use:

- NPCs
- Recently active user “ghosts”
- Friends represented asynchronously
- Event announcements
- Leaderboard statues
- Open challenges
- Ambient animations
- Moving creatures or service characters

Do not make the experience dependent on simultaneous online players.

---

# 3. Visual direction

Use the supplied NimWorld screenshot as a mood board, not as an exact layout specification.

The desired visual style is:

- High-quality isometric or 2.5D pixel-inspired world
- Bright, polished, friendly, and modern
- Strong Nimiq purple, blue, cyan, gold, and green accents
- Central crystal fountain carrying the NimConnect identity
- Compact plaza surrounded by distinct buildings
- Clear paths, trees, water, bridges, lamps, banners, and animated details
- Readable on both mobile and desktop
- Game world remains the visual focus
- UI uses clean rounded panels consistent with NimConnect
- Avoid generic “crypto casino” visuals
- Avoid excessive blockchain terminology
- Avoid copying copyrighted game assets

The interface should feel like a combination of:

- A social game lobby
- A Mini App launcher
- A portable profile
- An interactive ecosystem map

The initial world should be compact and polished rather than large and empty.

---

# 4. MVP plaza locations

Implement one central plaza with these locations.

## Central NimConnect Fountain

Purpose:

- Spawn point
- Identity anchor
- Open the user's NimConnect profile
- Show handle, avatar, level, featured badge, and NIM gifting shortcut

Interaction panel:

- View profile
- Edit profile through NimConnect
- View achievements
- View inventory
- Open contacts
- Send or request NIM

NimWorld must not directly edit private NimConnect data.

## NimBomber Arena

This demonstrates how a game portal works.

When the player approaches the Arena, show an overlay similar to:

### NimBomber Arena

- Daily challenge status
- Weekly tournament status
- User's NimBomber statistics
- Public achievements
- Friends who recently played
- Current or recent activity
- Open challenges
- Launch button
- Leaderboard button
- Challenge friend button

For the MVP, unavailable values may use clearly labelled mock data behind an adapter. Do not hardcode mock values directly into UI components.

The primary button launches NimBomber.

Pass generic context such as:

- Source app: NimWorld
- Return URL
- NimConnect session or reconnect hint
- Optional challenge identifier
- Optional referral source

Do not pass private profile data through URL parameters.

When the player returns to NimWorld, restore their previous plaza position when possible.

## Arcade

The Arcade is the scalable portal for games.

It initially contains:

- PlayNimiq
- NimBomber
- Any other configured game manifests

The Arcade interface should support:

- Search
- Recently played
- Friend activity
- New releases
- Daily challenges
- Launch buttons
- Connected app indicators

Do not create one permanent plaza building for every game. The Arcade should handle growth.

## Town Hall

Town Hall connects to the NimiqMiniApps catalog.

Show:

- Featured Mini Apps
- New releases
- Upcoming ecosystem events
- Recently updated apps
- Apps using NimConnect
- Open in NimiqMiniApps

## Social Club

Use NimConnect data for:

- Friends
- Contacts
- Recently active users
- Pending challenges
- Messages or payment-request indicators
- Profile inspection

Only request the minimum required SDK permissions.

## Marketplace

For the MVP this may be a polished “coming later” location, but its architecture should anticipate:

- Handles
- Cosmetics
- Collectibles
- App-specific items
- Trading permissions

Do not implement unrestricted item trading in the MVP.

---

# 5. NimBomber Arena interaction flow

Implement this flow end to end:

1. User walks toward the Arena.
2. A small “Enter Arena” prompt appears.
3. User activates the prompt.
4. Movement pauses.
5. A Vue overlay opens.
6. The overlay loads NimBomber's manifest and user-facing integration data.
7. The overlay shows:
   - NimBomber branding
   - Daily challenge
   - User statistics
   - Friends or recent players
   - Leaderboard summary
   - Play button
8. Pressing Play launches NimBomber.
9. NimBomber authenticates independently with NimConnect.
10. NimWorld does not transmit private account information.
11. On return, the user appears outside the Arena.
12. New public achievements or inventory changes are refreshed.
13. A lightweight celebration appears when new progress is detected.

The first version may launch NimBomber in the same browser context or through the supported Mini App navigation mechanism. Encapsulate navigation in an `AppLauncher` interface so it can be changed later.

---

# 6. Technical direction

Use the existing project stack when one already exists.

Preferred stack where a new implementation is required:

## Frontend

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Tailwind CSS for overlays and application UI
- Phaser 3 for the interactive world
- Tiled for map creation and collision metadata

Architecture:

- Phaser owns world rendering, movement, collisions, animations, and proximity detection.
- Vue owns menus, profile panels, dialogs, app cards, permissions, settings, and responsive UI.
- Use an event bridge between Phaser and Vue.
- Do not render complex application menus directly in Phaser.
- Do not place Vue state directly inside Phaser game objects.

Suggested bridge events:

```ts
type WorldEvent =
  | { type: 'INTERACTION_AVAILABLE'; target: InteractionTarget }
  | { type: 'INTERACTION_CLEARED' }
  | { type: 'OPEN_LOCATION'; locationId: string }
  | { type: 'PLAYER_MOVED'; position: WorldPosition }
  | { type: 'PLAYER_READY' }
  | { type: 'RETURNED_FROM_APP'; appId: string };
````

## Backend

Prefer Go if a backend is required.

Backend responsibilities:

* World configuration
* App manifests
* Presence
* Recently active user snapshots
* Signed app events
* Achievement verification
* Rate limiting
* Optional real-time WebSocket channel
* Public plaza state

Do not make the backend responsible for rendering or gameplay physics.

## Storage

Use the existing database where possible.

Suggested logical entities:

* `world_locations`
* `app_manifests`
* `user_world_preferences`
* `user_last_positions`
* `presence_sessions`
* `recent_activity`
* `trusted_app_keys`
* `signed_app_events`

Do not copy private NimConnect financial data into NimWorld.

---

# 7. Integration architecture

Create explicit adapter boundaries.

## NimConnectAdapter

Responsibilities:

* Initialise SDK
* Retrieve current public profile
* Retrieve avatar and handle
* Retrieve allowed friends or contacts
* Retrieve public achievements
* Retrieve public inventory
* Request permissions
* Open NimConnect screens
* Subscribe to supported profile changes

Example interface:

```ts
interface NimConnectAdapter {
  initialize(): Promise<void>;
  getCurrentProfile(): Promise<PublicProfile | null>;
  getFriends(): Promise<PublicFriend[]>;
  getAchievements(appId?: string): Promise<Achievement[]>;
  getInventory(appId?: string): Promise<InventoryItem[]>;
  requestScopes(scopes: NimConnectScope[]): Promise<PermissionResult>;
  openProfile(handle?: string): Promise<void>;
  refresh(): Promise<void>;
}
```

Use the real existing SDK implementation when available and a development mock implementation when it is not.

## MiniAppCatalogAdapter

Responsibilities:

* Retrieve app metadata from NimiqMiniApps
* Load featured apps
* Load connected apps
* Resolve app launch URL
* Read app capabilities
* Read world presentation metadata

## NimiqPaymentAdapter

Responsibilities:

* Initialise Nimiq Mini App wallet context
* Send NIM
* Request NIM
* Open a supported Nimiq Pay payment flow
* Return clear success or failure states

Nimiq must be the only implemented chain for the MVP.

Architect the interface so another payment adapter could be added later, but do not implement other blockchains now.

## AppLauncher

Responsibilities:

* Validate launch URLs
* Add safe source and return context
* Launch Mini Apps
* Track recent app launch
* Restore NimWorld state where possible

## PresenceAdapter

Responsibilities:

* Publish local presence
* Subscribe to nearby or relevant users
* Fall back to recent-activity ghosts
* Never prevent the world from loading when real-time presence is unavailable

---

# 8. App manifest

Create a versioned app manifest schema that can be consumed by NimWorld, NimConnect, and NimiqMiniApps.

Example:

```json
{
  "schemaVersion": 1,
  "id": "nimbomber",
  "name": "NimBomber",
  "description": "Fast arcade battles powered by Nimiq.",
  "category": "game",
  "iconUrl": "/assets/apps/nimbomber.png",
  "launchUrl": "https://example.invalid",
  "capabilities": [
    "identity",
    "achievements",
    "stats",
    "leaderboards",
    "challenges"
  ],
  "nimconnect": {
    "minimumSdkVersion": "1.0.0",
    "requestedScopes": [
      "profile:read",
      "achievements:read",
      "friends:read"
    ]
  },
  "world": {
    "locationType": "arena",
    "district": "games",
    "interactionLabel": "Enter Arena",
    "featured": true,
    "statusProvider": "nimbomber"
  }
}
```

Create:

* TypeScript types
* JSON Schema
* Validation
* Mock manifests
* Graceful handling of unsupported manifest versions

App-specific fields should stay namespaced or opaque.

---

# 9. Achievements, stats, and inventory

Do not create one universal game progression model.

Use a shared envelope around app-owned data.

## Achievement

```ts
interface Achievement {
  appId: string;
  achievementId: string;
  title: string;
  description: string;
  iconUrl?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}
```

## Stat

```ts
interface AppStat {
  appId: string;
  key: string;
  label: string;
  value: number | string;
  visibility: 'private' | 'friends' | 'public';
}
```

## Inventory item

```ts
interface InventoryItem {
  namespace: string;
  itemId: string;
  appId?: string;
  name: string;
  description?: string;
  iconUrl?: string;
  quantity: number;
  rarity?: string;
  portability: 'shared' | 'app-local';
  usableIn?: string[];
  tradable: boolean;
}
```

Examples:

* `nimbomber:golden-bomb`
* `playnimiq:snake-crown`
* `nimconnect:founder-frame`

NimWorld may display app-local items, but must clearly label where they are usable.

Client code must not be able to award trusted achievements or inventory directly.

Design trusted writes around signed app events or authenticated server-to-server calls.

---

# 10. Permissions and privacy

NimConnect includes contacts and financial features, so privacy boundaries are essential.

Use granular scopes such as:

* `profile:read`
* `friends:read`
* `achievements:read`
* `inventory:read`
* `messages:summary`
* `payments:request`

Never provide an app automatic access to:

* Private invoices
* Full payment history
* Private messages
* Contact details beyond granted public fields
* Savings buckets
* Split-bill history

Display understandable permission prompts.

An app should be usable with the minimum possible set of permissions.

---

# 11. Responsive controls

## Mobile

* Virtual joystick or touch movement area
* Large interaction button
* Bottom navigation or compact action tray
* Safe-area support
* No tiny text
* No hover-dependent controls
* Landscape and portrait support where practical

## Desktop

* WASD
* Arrow keys
* Enter or Space to interact
* Escape to close overlay
* Clickable locations
* Optional minimap

Do not let browser scrolling interfere with movement while the world has input focus.

---

# 12. Performance requirements

Target:

* Smooth movement on modern mid-range mobile devices
* Approximately 60 FPS during normal plaza activity
* Graceful degradation to fewer ambient animations
* Lazy-load location panels and large assets
* Atlas sprites where practical
* Avoid loading all app screenshots on startup
* Suspend Phaser updates while a full-screen overlay is active where appropriate
* Handle WebSocket failure without breaking the experience

Provide visible loading and error states.

---

# 13. Empty-world strategy

The world must feel alive with only one real user.

Implement at least:

* Three ambient NPCs
* Two recently active user ghosts
* One friend ghost when mock or real data permits
* Animated fountain
* Moving flags or lights
* Town Hall announcement board
* Arena challenge board
* One leaderboard statue or banner
* Periodic ambient movement

Ghost users must be visually distinguishable from live users.

Do not fake live presence. Label states accurately, for example:

* Online
* Playing NimBomber
* Active 12 minutes ago
* Recently visited
* NPC

---

# 14. MVP non-goals

Do not build these in the first version:

* Full MMO
* Large open world
* Voice or video calls
* Spatial conferencing
* User-created maps
* User housing
* Combat inside NimWorld
* Complex avatar creator
* Cross-chain support
* NFT marketplace
* Unrestricted item trading
* Global chat moderation system
* Complex party matchmaking
* Custom game engine
* Blockchain writes for routine movement
* On-chain storage of plaza position

Keep the first version small, polished, and demonstrable.

---

# 15. Suggested project structure

Adapt this to the existing repository instead of forcing it when incompatible.

```text
apps/
  web/
    src/
      game/
        scenes/
        entities/
        interactions/
        input/
        bridge/
      components/
        overlays/
        locations/
        profile/
        apps/
      stores/
      adapters/
      router/
      assets/
  api/
    cmd/
    internal/
      manifests/
      presence/
      events/
      world/
      security/

packages/
  world-schema/
  app-manifest/
  nimconnect-adapter/
  miniapp-catalog-adapter/

maps/
  plaza/
    plaza.tmx
    tilesets/
    objects/

docs/
  architecture.md
  app-manifest.md
  nimconnect-permissions.md
  adding-an-app.md
```

---

# 16. Implementation phases

Work in clear phases and keep the application runnable after every phase.

## Phase 0 — Repository assessment

Before implementation:

* Inspect existing project structure
* Inspect NimConnect SDK usage
* Inspect Nimiq Mini App integration
* Identify reusable components
* Write a concise architecture plan
* Identify assumptions and risks
* Do not modify unrelated code

## Phase 1 — Foundation

Implement:

* Vue and Phaser integration
* Game-to-UI event bridge
* Responsive layout
* Base plaza scene
* Player movement
* Collision
* Interaction zones
* Mock adapter interfaces
* Basic tests

## Phase 2 — Plaza experience

Implement:

* Central fountain
* Arena
* Arcade
* Town Hall
* Social Club
* Marketplace placeholder
* Ambient NPCs and ghosts
* Location overlays
* Mobile controls
* Desktop controls

## Phase 3 — Real integrations

Implement:

* Existing NimConnect SDK
* Nimiq Mini App environment
* NimiqMiniApps catalog adapter
* NimBomber manifest
* PlayNimiq manifest
* App launching
* Return-state restoration

## Phase 4 — Presence and activity

Implement:

* Optional WebSocket presence
* Recently active fallbacks
* Accurate status labels
* Friend activity
* Refresh after returning from an app

## Phase 5 — Polish

Implement:

* Animations
* Sound controls
* Loading states
* Error states
* Accessibility
* Performance optimisation
* End-to-end tests
* Developer documentation

---

# 17. Initial acceptance criteria

The MVP is complete when:

1. NimWorld runs as a Nimiq Mini App and in browser development mode.
2. A user can load a NimConnect identity or a clearly labelled mock identity.
3. The player can move through a polished plaza on mobile and desktop.
4. The player can interact with at least five locations.
5. The Arena displays NimBomber information through an adapter.
6. The Arena launches NimBomber through the `AppLauncher`.
7. Returning to NimWorld restores the previous location where supported.
8. The Arcade lists at least NimBomber and PlayNimiq from manifests.
9. Town Hall displays apps supplied by the catalog adapter.
10. Another user's public NimConnect profile can be viewed.
11. A NIM gift or payment-request flow is exposed through the supported Nimiq payment integration.
12. The world remains useful when WebSockets and real-time presence are unavailable.
13. No private NimConnect financial information is exposed.
14. New apps can be added by creating a valid manifest instead of editing world code.
15. The repository includes instructions for adding a new app portal.
16. Core adapters and manifest validation have automated tests.
17. The UI works at approximately 360×800 and 1440×900.
18. There are no obvious placeholder developer panels in the production interface.

---

# 18. First deliverable

Start by producing:

1. A brief architecture summary.
2. A dependency and integration inventory.
3. A proposed directory structure based on the actual repository.
4. The app-manifest TypeScript types and JSON Schema.
5. The Vue–Phaser event bridge.
6. A runnable plaza prototype with:

   * Player movement
   * Central fountain
   * Arena interaction
   * Arcade interaction
   * Mobile and desktop controls
   * Mock NimConnect profile
7. A README explaining how to run it.

Then continue to the next phase unless a genuine blocker is encountered.

Do not spend the first iteration building backend complexity. First prove the complete user experience using clean adapter boundaries and mock data, then replace mocks with real integrations.

---

# 19. Product principle

Always preserve this boundary:

* NimConnect is the account and social identity.
* NimiqMiniApps is the catalog and library.
* NimWorld is the visual interactive lobby.
* Each Mini App owns its own product logic.

NimWorld should make the ecosystem feel connected without becoming the source of truth for everything.

```

The most important instruction is the final one: **build the polished plaza experience first behind adapters**. Otherwise the agent may disappear into achievements, permissions, presence and backend schemas before there is anything fun to walk around in.
```
