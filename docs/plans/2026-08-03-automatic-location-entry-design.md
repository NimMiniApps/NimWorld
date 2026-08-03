# Automatic location entry design

## Goal

Make fixed plaza destinations open naturally when the player approaches them. Entering the proximity zone for the Fountain, Arcade, Arena, Marketplace, Social Club, or Town Hall opens its existing screen without requiring Enter, Space, or a prompt tap.

## Behavior

- Crossing into a fixed location's proximity zone opens that location immediately.
- The world continues to pause while a location screen is open.
- Closing a screen while still inside its zone does not reopen it.
- Leaving the zone resets the entry latch; approaching again opens the screen again.
- Moving from one location zone into another opens the newly entered location.
- Ghost and player interactions remain manual. Moving social targets should not interrupt movement by opening a screen automatically.
- Desktop and mobile guidance no longer instructs players to press Enter, Space, or tap a prompt for fixed locations.

## Architecture

Keep automatic entry in the Phaser world layer. `PlazaScene` already owns proximity detection and tracks the active nearby target. When the nearest target changes from outside a fixed location to inside one, the scene emits the existing `OPEN_LOCATION` event once.

The existing active-target transition acts as the latch. Closing the Vue overlay resumes the scene but does not change the active target, so the screen remains closed. Once the player leaves the proximity zone, the active target clears; a later approach creates a new transition and opens the location again.

Vue continues to own the location overlays and movement pause/resume flow. No new bridge event or store state is needed.

## Alternatives considered

1. **Open on the Phaser proximity-entry edge (chosen).** Keeps navigation behavior in the world layer and reuses the existing target transition as a latch.
2. **Watch interaction state in Vue.** Smaller-looking change, but makes the UI infer world behavior and requires special filtering for ghosts.
3. **Open after a dwell delay.** Reduces accidental entry, but adds latency, timers, and cancellation behavior without a demonstrated need.

## Testing

Automated tests should verify:

- a fixed location opens once when its zone is entered;
- remaining in the same zone does not emit another open;
- leaving and re-entering opens it again;
- changing from one fixed location to another opens the new location;
- ghost proximity exposes the manual interaction without auto-opening a location.

Run the focused web tests, then the full web test and build gates. Manually verify approach, close-in-place, exit/re-entry, and mobile movement behavior if a browser is available.
