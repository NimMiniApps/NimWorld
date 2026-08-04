import type { WorldPosition } from '@/domain/types'
import {
  LocalPresenceAdapter,
  type PlazaActor,
  type PresenceAdapter,
} from '@/adapters/presence/PresenceAdapter'

/** ~20 Hz — dense enough for smooth remote avatars without flooding. */
const MOVE_MIN_INTERVAL_MS = 50
const SNAPSHOT_WAIT_MS = 1500
const PLAYER_COLORS = [0x58c4ff, 0x4fd1a5, 0xff8a3d, 0xf5c542, 0xb48cff]
const PLAYER_SHEETS = ['a', 'b', 'c', 'd', 'e'] as const

type PeerState = {
  id: string
  label: string
  x: number
  y: number
}

export type RealtimePresenceOptions = {
  local?: LocalPresenceAdapter
  wsUrl: string
  label: string
  /** Initial join position; defaults to plaza spawn-ish center. */
  spawn?: WorldPosition
}

export class RealtimePresenceAdapter implements PresenceAdapter {
  private readonly local: LocalPresenceAdapter
  private readonly wsUrl: string
  private readonly label: string
  private readonly spawn: WorldPosition
  private socket: WebSocket | null = null
  private peers = new Map<string, PeerState>()
  private localActors: PlazaActor[] = []
  private rosterListeners = new Set<(actors: PlazaActor[]) => void>()
  private moveListeners = new Set<(id: string, position: WorldPosition) => void>()
  private lastPublishAt = -MOVE_MIN_INTERVAL_MS
  private pendingPos: WorldPosition | null = null
  private publishTimer: ReturnType<typeof setTimeout> | null = null
  private snapshotWaiters: Array<() => void> = []
  private sawSnapshot = false

  constructor(options: RealtimePresenceOptions) {
    this.local = options.local ?? new LocalPresenceAdapter()
    this.wsUrl = options.wsUrl
    this.label = options.label
    this.spawn = options.spawn ?? { x: 480, y: 420 }
  }

  async initialize(): Promise<void> {
    this.localActors = await this.local.getActors()
    await this.connect()
  }

  async getActors(): Promise<PlazaActor[]> {
    return [...this.localActors, ...this.peerActors()]
  }

  publishPosition(position: WorldPosition): void {
    // readyState 1 === OPEN (avoid WebSocket.OPEN — stubs may omit static consts)
    if (!this.socket || this.socket.readyState !== 1) return
    const now = Date.now()
    const elapsed = now - this.lastPublishAt
    if (elapsed >= MOVE_MIN_INTERVAL_MS) {
      this.lastPublishAt = now
      this.pendingPos = null
      this.socket.send(JSON.stringify({ type: 'move', x: position.x, y: position.y }))
      return
    }
    // Coalesce trailing move so the last frame of a burst still ships.
    this.pendingPos = position
    if (this.publishTimer == null) {
      this.publishTimer = setTimeout(() => {
        this.publishTimer = null
        if (!this.pendingPos || !this.socket || this.socket.readyState !== 1) return
        const next = this.pendingPos
        this.pendingPos = null
        this.lastPublishAt = Date.now()
        this.socket.send(JSON.stringify({ type: 'move', x: next.x, y: next.y }))
      }, MOVE_MIN_INTERVAL_MS - elapsed)
    }
  }

  onActorsChanged(listener: (actors: PlazaActor[]) => void): () => void {
    this.rosterListeners.add(listener)
    // Catch up late subscribers (e.g. after Phaser boots).
    void this.getActors().then((actors) => listener(actors))
    return () => this.rosterListeners.delete(listener)
  }

  onPeerMoved(listener: (id: string, position: WorldPosition) => void): () => void {
    this.moveListeners.add(listener)
    return () => this.moveListeners.delete(listener)
  }

  /** Lookup for spawning a peer that moved before roster sync landed in Phaser. */
  getPeer(id: string): PlazaActor | null {
    const peer = this.peers.get(id)
    if (!peer) return null
    const index = [...this.peers.keys()].indexOf(id)
    return {
      id: peer.id,
      label: peer.label,
      kind: 'online',
      statusLabel: 'Online',
      position: { x: peer.x, y: peer.y },
      color: PLAYER_COLORS[index % PLAYER_COLORS.length]!,
      sheet: PLAYER_SHEETS[index % PLAYER_SHEETS.length],
      address: peer.id,
    }
  }

  dispose(): void {
    this.rosterListeners.clear()
    this.moveListeners.clear()
    if (this.publishTimer != null) {
      clearTimeout(this.publishTimer)
      this.publishTimer = null
    }
    for (const wake of this.snapshotWaiters) wake()
    this.snapshotWaiters = []
    this.socket?.close()
    this.socket = null
  }

  private connect(): Promise<void> {
    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        resolve()
      }

      try {
        const socket = new WebSocket(this.wsUrl)
        this.socket = socket

        socket.onopen = () => {
          this.sawSnapshot = false
          socket.send(
            JSON.stringify({
              type: 'join',
              label: this.label,
              x: this.spawn.x,
              y: this.spawn.y,
            }),
          )
          void this.waitForSnapshot().then(finish)
        }

        socket.onmessage = (ev) => {
          try {
            const msg = JSON.parse(String(ev.data)) as Record<string, unknown>
            this.handleMessage(msg)
          } catch {
            // ignore malformed
          }
        }

        socket.onerror = () => {
          finish()
        }

        socket.onclose = () => {
          if (this.peers.size > 0) {
            this.peers.clear()
            void this.emitRoster()
          }
          this.wakeSnapshotWaiters()
          finish()
        }
      } catch {
        finish()
      }
    })
  }

  private waitForSnapshot(): Promise<void> {
    if (this.sawSnapshot) return Promise.resolve()
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.snapshotWaiters = this.snapshotWaiters.filter((w) => w !== wake)
        resolve()
      }, SNAPSHOT_WAIT_MS)
      const wake = () => {
        clearTimeout(timer)
        resolve()
      }
      this.snapshotWaiters.push(wake)
    })
  }

  private wakeSnapshotWaiters() {
    const waiters = this.snapshotWaiters
    this.snapshotWaiters = []
    for (const wake of waiters) wake()
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case 'snapshot': {
        this.peers.clear()
        const peers = Array.isArray(msg.peers) ? msg.peers : []
        for (const raw of peers) {
          const peer = raw as PeerState
          if (peer?.id) this.peers.set(peer.id, peer)
        }
        this.sawSnapshot = true
        this.wakeSnapshotWaiters()
        void this.emitRoster()
        break
      }
      case 'peer_join': {
        const id = String(msg.id ?? '')
        if (!id) return
        this.peers.set(id, {
          id,
          label: String(msg.label ?? id),
          x: Number(msg.x) || 0,
          y: Number(msg.y) || 0,
        })
        void this.emitRoster()
        break
      }
      case 'peer_move': {
        const id = String(msg.id ?? '')
        const existing = this.peers.get(id)
        if (!existing) return
        existing.x = Number(msg.x) || existing.x
        existing.y = Number(msg.y) || existing.y
        const position = { x: existing.x, y: existing.y }
        for (const listener of this.moveListeners) listener(id, position)
        break
      }
      case 'peer_leave': {
        const id = String(msg.id ?? '')
        if (this.peers.delete(id)) void this.emitRoster()
        break
      }
    }
  }

  private peerActors(): PlazaActor[] {
    return [...this.peers.values()].map((peer, index) => ({
      id: peer.id,
      label: peer.label,
      kind: 'online' as const,
      statusLabel: 'Online',
      position: { x: peer.x, y: peer.y },
      color: PLAYER_COLORS[index % PLAYER_COLORS.length]!,
      sheet: PLAYER_SHEETS[index % PLAYER_SHEETS.length],
      address: peer.id,
    }))
  }

  private async emitRoster() {
    const actors = await this.getActors()
    for (const listener of this.rosterListeners) listener(actors)
  }
}

export function presenceWsUrl(base = '/auth-api'): string {
  const proto = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss' : 'ws'
  const host = typeof location !== 'undefined' ? location.host : 'localhost'
  return `${proto}://${host}${base}/presence`
}
