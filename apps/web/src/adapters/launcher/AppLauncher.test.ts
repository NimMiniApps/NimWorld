import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BrowserAppLauncher, buildReturnUrl } from './AppLauncher'

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

describe('buildReturnUrl', () => {
  it('adds returnedFrom and strips leftover query', () => {
    expect(buildReturnUrl('https://nimworld.local/plaza?foo=1#x', 'nimbomber')).toBe(
      'https://nimworld.local/plaza?returnedFrom=nimbomber',
    )
  })
})

describe('BrowserAppLauncher', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memoryStorage())
    vi.stubGlobal('window', {
      open: vi.fn(() => null),
      location: {
        href: 'https://nimworld.local/',
        origin: 'https://nimworld.local',
        pathname: '/',
        assign: vi.fn(),
      },
      nimiqPay: undefined,
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
    expect(url.searchParams.get('returnUrl')).toBe(
      'https://nimworld.local/?returnedFrom=nimbomber',
    )
    expect(url.searchParams.get('challengeId')).toBe('daily-1')
    expect(url.searchParams.get('handle')).toBeNull()
    expect(url.searchParams.get('address')).toBeNull()
  })

  it('opens a new tab outside Nimiq Pay', async () => {
    const launcher = new BrowserAppLauncher()
    await launcher.launch({
      appId: 'nimbomber',
      launchUrl: 'https://nimbomber.nimiqminiapps.com/',
      returnUrl: 'https://nimworld.local/',
    })

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('source=nimworld'),
      '_blank',
      'noopener,noreferrer',
    )
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('assigns location inside Nimiq Pay', async () => {
    ;(window as Window & { nimiqPay?: object }).nimiqPay = {
      requestDeviceIdentifier: vi.fn(),
    }
    const launcher = new BrowserAppLauncher()
    await launcher.launch({
      appId: 'nimbomber',
      launchUrl: 'https://nimbomber.nimiqminiapps.com/',
      returnUrl: 'https://nimworld.local/',
    })

    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining('returnUrl='),
    )
    expect(window.open).not.toHaveBeenCalled()
    const assigned = String((window.location.assign as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])
    const url = new URL(assigned)
    expect(url.searchParams.get('returnUrl')).toContain('returnedFrom=nimbomber')
  })
})
