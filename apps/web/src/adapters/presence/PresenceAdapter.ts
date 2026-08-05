import type { PresenceKind, WorldPosition } from '@/domain/types'

export interface PlazaActor {
  id: string
  label: string
  kind: PresenceKind
  statusLabel: string
  position: WorldPosition
  color: number
  /** Optional ambient path for environmental storytelling. */
  waypoints?: WorldPosition[]
  /** Character sheet hint: a–e maps to role colors. */
  sheet?: 'a' | 'b' | 'c' | 'd' | 'e'
  /** Demo/public Nimiq address when this actor can receive NIM. */
  address?: string
}

export function isPayableActor(actor: { address?: string }): boolean {
  return Boolean(actor.address?.trim())
}

export interface PresenceAdapter {
  initialize(): Promise<void>
  getActors(): Promise<PlazaActor[]>
  publishPosition(position: WorldPosition): void
  /** Announce the Mini App the player is in; `null` clears it. */
  publishActivity(app: string | null): void
  /** Roster changes (join / leave / snapshot). Not fired on every move. */
  onActorsChanged(listener: (actors: PlazaActor[]) => void): () => void
  /** Lightweight peer position updates for smooth avatar lerp. */
  onPeerMoved(listener: (id: string, position: WorldPosition) => void): () => void
  dispose(): void
}

export class LocalPresenceAdapter implements PresenceAdapter {
  async initialize(): Promise<void> {
    // Local NPCs/ghosts only — no live peers.
  }

  publishPosition(_position: WorldPosition): void {}

  publishActivity(_app: string | null): void {}

  onActorsChanged(_listener: (actors: PlazaActor[]) => void): () => void {
    return () => {}
  }

  onPeerMoved(_listener: (id: string, position: WorldPosition) => void): () => void {
    return () => {}
  }

  dispose(): void {}

  async getActors(): Promise<PlazaActor[]> {
    return [
      {
        id: 'npc-guide',
        label: 'Guide',
        kind: 'npc',
        statusLabel: 'Near the fountain',
        position: { x: 520, y: 430 },
        color: 0xb48cff,
        sheet: 'a',
      },
      {
        id: 'npc-gardener',
        label: 'Gardener',
        kind: 'npc',
        statusLabel: 'Tending flowers',
        position: { x: 400, y: 290 },
        color: 0x4fd1a5,
        sheet: 'b',
      },
      {
        id: 'npc-courier',
        label: 'Courier',
        kind: 'npc',
        statusLabel: 'On a delivery',
        position: { x: 360, y: 500 },
        color: 0x58c4ff,
        sheet: 'c',
        waypoints: [
          { x: 280, y: 520 },
          { x: 480, y: 480 },
          { x: 700, y: 520 },
          { x: 480, y: 480 },
        ],
      },
      {
        id: 'npc-tournament',
        label: 'Tournament Master',
        kind: 'npc',
        statusLabel: 'Arena host',
        position: { x: 250, y: 310 },
        color: 0xff8a3d,
        sheet: 'd',
      },
      {
        id: 'npc-builder',
        label: 'Builder',
        kind: 'npc',
        statusLabel: 'On site',
        position: { x: 740, y: 290 },
        color: 0xf5c542,
        sheet: 'e',
      },
    ]
    // The @luna/@pixel/@nova ghosts lived here with invented "NQ11 LUNA DEMO…"
    // addresses, so the HUD offered a Send button that would pay nobody.
    // Real absent players belong to Phase 3 presence, not to a fixture.
  }
}
