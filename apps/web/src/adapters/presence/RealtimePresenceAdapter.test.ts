import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocalPresenceAdapter } from './PresenceAdapter'
import { RealtimePresenceAdapter, presenceStatusLabel } from './RealtimePresenceAdapter'

class FakeSocket {
  static instances: FakeSocket[] = []
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  readyState = 0
  sent: unknown[] = []

  constructor(public url: string) {
    FakeSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(JSON.parse(data))
  }

  close() {
    this.readyState = 3
    this.onclose?.(new Event('close') as CloseEvent)
  }

  open() {
    this.readyState = 1
    this.onopen?.(new Event('open'))
  }

  push(msg: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(msg) }))
  }
}

describe('RealtimePresenceAdapter', () => {
  afterEach(() => {
    FakeSocket.instances = []
    vi.unstubAllGlobals()
  })

  it('falls back to local actors when WebSocket fails to connect', async () => {
    vi.stubGlobal(
      'WebSocket',
      class {
        constructor() {
          queueMicrotask(() => {
            ;(this as unknown as FakeSocket).onerror?.(new Event('error'))
            ;(this as unknown as FakeSocket).onclose?.(new Event('close') as CloseEvent)
          })
        }
        send() {}
        close() {}
        onopen = null
        onmessage = null
        onclose = null
        onerror = null
        readyState = 3
      },
    )

    const local = new LocalPresenceAdapter()
    const adapter = new RealtimePresenceAdapter({
      local,
      wsUrl: 'ws://test/presence',
      label: '@you',
    })
    await adapter.initialize()
    const actors = await adapter.getActors()
    expect(actors.every((a) => a.kind === 'npc' || a.kind === 'ghost')).toBe(true)
    expect(actors.some((a) => a.kind === 'online')).toBe(false)
  })

  it('merges live peers into actor list and notifies listeners', async () => {
    vi.stubGlobal('WebSocket', FakeSocket)

    const local = new LocalPresenceAdapter()
    const adapter = new RealtimePresenceAdapter({
      local,
      wsUrl: 'ws://test/presence',
      label: '@you',
    })

    const changes: number[] = []
    adapter.onActorsChanged((actors) => changes.push(actors.filter((a) => a.kind === 'online').length))

    const init = adapter.initialize()
    await vi.waitFor(() => expect(FakeSocket.instances[0]).toBeTruthy())
    const socket = FakeSocket.instances[0]!
    socket.open()
    socket.push({ type: 'snapshot', peers: [] })
    await init

    socket.push({
      type: 'snapshot',
      peers: [{ id: 'NQ01', label: '@alice', x: 10, y: 20 }],
    })

    const actors = await adapter.getActors()
    const online = actors.filter((a) => a.kind === 'online')
    expect(online).toHaveLength(1)
    expect(online[0]).toMatchObject({
      id: 'NQ01',
      label: '@alice',
      kind: 'online',
      position: { x: 10, y: 20 },
    })
    expect(actors.some((a) => a.kind === 'npc')).toBe(true)
    expect(changes[changes.length - 1]).toBe(1)

    expect(socket.sent[0]).toMatchObject({ type: 'join', label: '@you' })
  })

  it('throttles publishPosition to about 20Hz and coalesces trailing moves', async () => {
    vi.stubGlobal('WebSocket', FakeSocket)
    vi.useFakeTimers()

    const adapter = new RealtimePresenceAdapter({
      local: new LocalPresenceAdapter(),
      wsUrl: 'ws://test/presence',
      label: '@you',
    })
    const init = adapter.initialize()
    await vi.waitFor(() => expect(FakeSocket.instances[0]).toBeTruthy())
    FakeSocket.instances[0]!.open()
    FakeSocket.instances[0]!.push({ type: 'snapshot', peers: [] })
    await init
    const socket = FakeSocket.instances[0]!
    socket.sent = []

    adapter.publishPosition({ x: 1, y: 1 })
    adapter.publishPosition({ x: 2, y: 2 })
    adapter.publishPosition({ x: 3, y: 3 })
    expect(socket.sent.filter((m) => (m as { type: string }).type === 'move')).toHaveLength(1)

    vi.advanceTimersByTime(50)
    expect(socket.sent.filter((m) => (m as { type: string }).type === 'move')).toHaveLength(2)
    expect(socket.sent[socket.sent.length - 1]).toMatchObject({ type: 'move', x: 3, y: 3 })

    vi.useRealTimers()
  })

  it('routes peer_move to onPeerMoved without roster churn', async () => {
    vi.stubGlobal('WebSocket', FakeSocket)

    const adapter = new RealtimePresenceAdapter({
      local: new LocalPresenceAdapter(),
      wsUrl: 'ws://test/presence',
      label: '@you',
    })
    const roster: number[] = []
    const moves: Array<{ id: string; x: number; y: number }> = []
    adapter.onActorsChanged((actors) => roster.push(actors.filter((a) => a.kind === 'online').length))
    adapter.onPeerMoved((id, position) => moves.push({ id, x: position.x, y: position.y }))

    const init = adapter.initialize()
    await vi.waitFor(() => expect(FakeSocket.instances[0]).toBeTruthy())
    FakeSocket.instances[0]!.open()
    FakeSocket.instances[0]!.push({
      type: 'snapshot',
      peers: [{ id: 'NQ01', label: '@alice', x: 10, y: 20 }],
    })
    await init
    const rosterAfterJoin = roster.length

    FakeSocket.instances[0]!.push({ type: 'peer_move', id: 'NQ01', x: 40, y: 50 })
    expect(moves).toEqual([{ id: 'NQ01', x: 40, y: 50 }])
    expect(roster.length).toBe(rosterAfterJoin)
  })

  it('waits for snapshot before initialize resolves and late roster listeners get current peers', async () => {
    vi.stubGlobal('WebSocket', FakeSocket)

    const adapter = new RealtimePresenceAdapter({
      local: new LocalPresenceAdapter(),
      wsUrl: 'ws://test/presence',
      label: '@you',
    })

    const init = adapter.initialize()
    await vi.waitFor(() => expect(FakeSocket.instances[0]).toBeTruthy())
    FakeSocket.instances[0]!.open()

    let initDone = false
    void init.then(() => {
      initDone = true
    })
    await Promise.resolve()
    expect(initDone).toBe(false)

    FakeSocket.instances[0]!.push({
      type: 'snapshot',
      peers: [{ id: 'NQ01', label: '@alice', x: 10, y: 20 }],
    })
    await init
    expect(initDone).toBe(true)

    const seen: number[] = []
    adapter.onActorsChanged((actors) => seen.push(actors.filter((a) => a.kind === 'online').length))
    await vi.waitFor(() => expect(seen[0]).toBe(1))
  })

  it('keeps departed players as recently-active ghosts and labels their status', async () => {
    vi.stubGlobal('WebSocket', FakeSocket)

    const adapter = new RealtimePresenceAdapter({
      local: new LocalPresenceAdapter(),
      wsUrl: 'ws://test/presence',
      label: '@you',
    })
    const init = adapter.initialize()
    await vi.waitFor(() => expect(FakeSocket.instances[0]).toBeTruthy())
    const socket = FakeSocket.instances[0]!
    socket.open()
    socket.push({
      type: 'snapshot',
      peers: [{ id: 'NQ01', label: '@alice', x: 10, y: 20 }],
      recent: [{ id: 'NQ02', label: '@bob', x: 30, y: 40, seenAgoMs: 5 * 60_000 }],
    })
    await init

    const remoteOf = async (id: string) => (await adapter.getActors()).find((a) => a.id === id)

    expect(await remoteOf('NQ02')).toMatchObject({
      kind: 'ghost',
      label: '@bob',
      statusLabel: 'Active 5m ago',
      position: { x: 30, y: 40 },
      address: 'NQ02',
    })

    // Alice announces a game, then leaves for it — the ghost keeps the app.
    socket.push({ type: 'peer_activity', id: 'NQ01', app: 'NimBomber' })
    expect(await remoteOf('NQ01')).toMatchObject({
      kind: 'online',
      statusLabel: 'Playing NimBomber',
    })

    socket.push({ type: 'peer_leave', id: 'NQ01', app: 'NimBomber' })
    expect(await remoteOf('NQ01')).toMatchObject({
      kind: 'ghost',
      statusLabel: 'Playing NimBomber',
    })

    // Bob walks back in: online again, no leftover ghost.
    socket.push({ type: 'peer_join', id: 'NQ02', label: '@bob', x: 30, y: 40 })
    const actors = await adapter.getActors()
    expect(actors.filter((a) => a.id === 'NQ02')).toHaveLength(1)
    expect(await remoteOf('NQ02')).toMatchObject({ kind: 'online', statusLabel: 'Online' })

    adapter.publishActivity('NimBomber')
    expect(socket.sent[socket.sent.length - 1]).toMatchObject({
      type: 'activity',
      app: 'NimBomber',
    })
    adapter.dispose()
  })
})

describe('presenceStatusLabel', () => {
  it('names the four plaza states', () => {
    expect(presenceStatusLabel(undefined)).toBe('Online')
    expect(presenceStatusLabel('NimBomber')).toBe('Playing NimBomber')
    expect(presenceStatusLabel(undefined, 20_000)).toBe('Active just now')
    expect(presenceStatusLabel(undefined, 7 * 60_000)).toBe('Active 7m ago')
    expect(presenceStatusLabel(undefined, 3 * 3_600_000)).toBe('Active 3h ago')
    expect(presenceStatusLabel(undefined, 40 * 3_600_000)).toBe('Active recently')
  })
})
