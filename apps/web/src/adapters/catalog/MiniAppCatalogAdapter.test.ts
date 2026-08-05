import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpMiniAppCatalogAdapter } from './MiniAppCatalogAdapter'

afterEach(() => {
  vi.unstubAllGlobals()
})

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
const fail = { ok: false, status: 503, json: async () => ({}) }

describe('HttpMiniAppCatalogAdapter source chain', () => {
  it('prefers the public catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok([{ id: '1', slug: 'nimbomber', name: 'NimBomber', category: 'game', featured: true }]),
      ),
    )

    const adapter = new HttpMiniAppCatalogAdapter()
    await adapter.initialize()

    expect(adapter.getSource()).toBe('live')
  })

  it('falls back to the NimWorld registry when the catalog is down', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/auth-api/apps')
        ? ok({
            apps: [
              {
                id: 'newapp',
                name: 'New App',
                category: 'game',
                launchUrl: 'https://new.local',
                world: { featured: true },
              },
            ],
          })
        : fail,
    )
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new HttpMiniAppCatalogAdapter()
    await adapter.initialize()

    expect(adapter.getSource()).toBe('world')
    // An app only the server knows about still reaches the plaza.
    await expect(adapter.resolveLaunchUrl('newapp')).resolves.toBe('https://new.local')
  })

  it('falls back to bundled manifests when both are unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail))

    const adapter = new HttpMiniAppCatalogAdapter()
    await adapter.initialize()

    expect(adapter.getSource()).toBe('fallback')
    await expect(adapter.resolveLaunchUrl('nimbomber')).resolves.toContain('nimbomber')
  })

  it('does not accept an empty registry as an answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url.includes('/auth-api/apps') ? ok({ apps: [] }) : fail)),
    )

    const adapter = new HttpMiniAppCatalogAdapter()
    await adapter.initialize()

    expect(adapter.getSource()).toBe('fallback')
  })
})
