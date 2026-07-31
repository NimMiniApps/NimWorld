import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BrowserAppLauncher } from './AppLauncher'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    key: (index: number) => [...map.keys()][index] ?? null,
  }
}

describe('BrowserAppLauncher', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memoryStorage())
    vi.stubGlobal('window', {
      open: vi.fn(() => null),
      location: { href: 'https://nimworld.local/' },
    })
  })

  it('adds safe public launch context and never private fields', async () => {
    const launcher = new BrowserAppLauncher()

    await launcher.launch({
      appId: 'nimbomber',
      launchUrl: 'https://nimbomber.nimiqminiapps.com/',
      returnUrl: 'https://nimworld.local/',
      challengeId: 'daily-1',
    })

    const open = window.open as ReturnType<typeof vi.fn>
    expect(open).toHaveBeenCalled()
    const url = new URL(String(open.mock.calls[0]?.[0]))
    expect(url.searchParams.get('source')).toBe('nimworld')
    expect(url.searchParams.get('returnUrl')).toBe('https://nimworld.local/')
    expect(url.searchParams.get('challengeId')).toBe('daily-1')
    expect(url.searchParams.get('handle')).toBeNull()
    expect(url.searchParams.get('address')).toBeNull()
  })
})
