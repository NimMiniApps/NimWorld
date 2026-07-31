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
}

export interface PresenceAdapter {
  initialize(): Promise<void>
  getActors(): Promise<PlazaActor[]>
}

export class LocalPresenceAdapter implements PresenceAdapter {
  async initialize(): Promise<void> {
    // Presence WebSocket intentionally omitted.
  }

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
      {
        id: 'ghost-luna',
        label: '@luna',
        kind: 'ghost',
        statusLabel: 'Active 12 min ago',
        position: { x: 540, y: 250 },
        color: 0xffd166,
      },
      {
        id: 'ghost-pixel',
        label: '@pixel',
        kind: 'ghost',
        statusLabel: 'Recently visited',
        position: { x: 620, y: 500 },
        color: 0xff8fab,
      },
      {
        id: 'ghost-nova',
        label: '@nova',
        kind: 'ghost',
        statusLabel: 'Friend · Playing NimBomber',
        position: { x: 300, y: 450 },
        color: 0x7cf5c8,
      },
    ]
  }
}
