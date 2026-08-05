import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sendBasicTransaction,
  sendBasicTransactionWithData,
  initMock,
  checkoutMock,
  HubApiMock,
} = vi.hoisted(() => ({
  sendBasicTransaction: vi.fn(),
  sendBasicTransactionWithData: vi.fn(),
  initMock: vi.fn(),
  checkoutMock: vi.fn(),
  HubApiMock: vi.fn(),
}))

vi.mock('@nimiq/mini-app-sdk', () => ({
  init: (...args: unknown[]) => initMock(...args),
}))

vi.mock('@nimiq/hub-api', () => ({
  default: HubApiMock,
}))

const ADDRESS = 'NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C'

// Only the resolved address is faked — isNimiqPayHost still reads window.nimiqPay.
const signedIn = vi.hoisted(() => ({ address: null as string | null }))
vi.mock('@/auth/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/auth/session')>()),
  getResolvedAddress: () => signedIn.address,
}))

describe('MiniAppSdkPaymentAdapter', () => {
  beforeEach(() => {
    vi.resetModules()
    initMock.mockReset()
    sendBasicTransaction.mockReset()
    sendBasicTransactionWithData.mockReset()
    checkoutMock.mockReset()
    HubApiMock.mockReset()
    HubApiMock.mockImplementation(() => ({ checkout: checkoutMock }))
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    vi.stubGlobal('window', {
      nimiqPay: undefined,
      location: { href: 'https://nimworld.local/' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends via SDK inside Nimiq Pay', async () => {
    vi.stubGlobal('window', {
      nimiqPay: { language: 'en' },
      location: { href: 'https://nimworld.local/' },
    })
    sendBasicTransaction.mockResolvedValue('tx-hash-pay')
    initMock.mockResolvedValue({
      sendBasicTransaction,
      sendBasicTransactionWithData,
    })

    const { MiniAppSdkPaymentAdapter } = await import('./NimiqPaymentAdapter')
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()

    await expect(
      adapter.sendNim('NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C', 100_000),
    ).resolves.toEqual({ ok: true, txHash: 'tx-hash-pay' })

    expect(sendBasicTransaction).toHaveBeenCalledWith({
      recipient: 'NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C',
      value: 100_000,
    })
    expect(checkoutMock).not.toHaveBeenCalled()
  })

  it('sends via Hub checkout on desktop', async () => {
    initMock.mockRejectedValue(new Error('no pay host'))
    checkoutMock.mockResolvedValue({ hash: 'tx-hash-hub', raw: new Uint8Array() })

    const { MiniAppSdkPaymentAdapter } = await import('./NimiqPaymentAdapter')
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()

    await expect(
      adapter.sendNim('NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C', 500_000, 'Thanks'),
    ).resolves.toEqual({ ok: true, txHash: 'tx-hash-hub' })

    expect(HubApiMock).toHaveBeenCalled()
    expect(checkoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: 'NimWorld',
        recipient: 'NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C',
        value: 500_000,
      }),
    )
    expect(sendBasicTransaction).not.toHaveBeenCalled()
  })

  it('copies a request link addressed to the signed-in account', async () => {
    initMock.mockRejectedValue(new Error('no pay host'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { MiniAppSdkPaymentAdapter } = await import('./NimiqPaymentAdapter')
    signedIn.address = ADDRESS
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()

    await expect(adapter.requestNim(100_000, 'NimWorld gift request')).resolves.toEqual({
      ok: true,
    })
    expect(writeText).toHaveBeenCalledWith(
      'nimiq:NQ577NBSGKF1R9B8CHF10P9267VG02FFAL5C?amount=1&message=NimWorld+gift+request',
    )
  })

  it('shares the request link when the host has a share sheet', async () => {
    initMock.mockRejectedValue(new Error('no pay host'))
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, clipboard: { writeText } })

    const { MiniAppSdkPaymentAdapter } = await import('./NimiqPaymentAdapter')
    signedIn.address = ADDRESS
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()

    await expect(adapter.requestNim(250_000)).resolves.toEqual({ ok: true })
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'nimiq:NQ577NBSGKF1R9B8CHF10P9267VG02FFAL5C?amount=2.5' }),
    )
    expect(writeText).not.toHaveBeenCalled()
  })

  it('refuses to build a request without an address to pay into', async () => {
    initMock.mockRejectedValue(new Error('no pay host'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { MiniAppSdkPaymentAdapter } = await import('./NimiqPaymentAdapter')
    signedIn.address = null
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()

    await expect(adapter.requestNim(100_000)).resolves.toMatchObject({ ok: false })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('exposes a preview NIM balance until a live wallet read exists', async () => {
    initMock.mockRejectedValue(new Error('no pay host'))
    const { MiniAppSdkPaymentAdapter, MOCK_NIM_BALANCE } = await import('./NimiqPaymentAdapter')
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()
    await expect(adapter.getBalanceNim()).resolves.toBe(MOCK_NIM_BALANCE)
  })
})
