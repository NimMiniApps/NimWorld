import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const initMock = vi.fn()
vi.mock('@nimiq/mini-app-sdk', () => ({ init: initMock }))

const signMessageMock = vi.fn()
vi.mock('@nimiq/hub-api', () => ({
  default: vi.fn().mockImplementation(() => ({ signMessage: signMessageMock })),
}))

describe('resolveSession', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), btoa: (s: string) => Buffer.from(s, 'binary').toString('base64') })
    initMock.mockReset()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports embedded when mini-app-sdk initializes', async () => {
    initMock.mockResolvedValue({})
    const { resolveSession } = await import('./session')
    await expect(resolveSession()).resolves.toEqual({ mode: 'embedded' })
  })

  it('reports anonymous when not embedded and no session cookie', async () => {
    initMock.mockRejectedValue(new Error('no host'))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { resolveSession } = await import('./session')
    await expect(resolveSession()).resolves.toEqual({ mode: 'anonymous' })
  })

  it('reports authenticated when a valid session cookie already exists', async () => {
    initMock.mockRejectedValue(new Error('no host'))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ address: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000' }) }),
    )
    const { resolveSession, getResolvedAddress } = await import('./session')
    await expect(resolveSession()).resolves.toEqual({
      mode: 'authenticated',
      address: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000',
    })
    expect(getResolvedAddress()).toBe('NQ07 0000 0000 0000 0000 0000 0000 0000 0000')
  })
})

describe('loginWithHub', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { btoa: (s: string) => Buffer.from(s, 'binary').toString('base64') })
    signMessageMock.mockReset()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('walks challenge -> Hub sign -> verify and returns the address', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nonce: 'abc', token: 'tok' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ address: 'NQ01 TEST' }) })
    vi.stubGlobal('fetch', fetchMock)
    signMessageMock.mockResolvedValue({
      signer: 'NQ01 TEST',
      signerPublicKey: new Uint8Array([1, 2, 3]),
      signature: new Uint8Array([4, 5, 6]),
    })

    const HubApi = (await import('@nimiq/hub-api')).default as unknown as ReturnType<typeof vi.fn>
    HubApi.mockClear()

    const { loginWithHub } = await import('./session')
    await expect(loginWithHub()).resolves.toBe('NQ01 TEST')

    expect(HubApi).toHaveBeenCalledWith('https://hub.nimiq.com')
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/auth-api/auth/challenge', { method: 'POST' })
    const verifyCall = fetchMock.mock.calls[1]
    expect(verifyCall[0]).toBe('/auth-api/auth/verify')
    const verifyBody = JSON.parse(verifyCall[1].body)
    expect(verifyBody).toMatchObject({ token: 'tok', nonce: 'abc', signer: 'NQ01 TEST' })
  })

  it('throws when the challenge request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { loginWithHub } = await import('./session')
    await expect(loginWithHub()).rejects.toThrow('Could not start login')
  })
})
