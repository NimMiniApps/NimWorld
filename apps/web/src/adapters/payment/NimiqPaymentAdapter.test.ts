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

  it('copies a request link', async () => {
    initMock.mockRejectedValue(new Error('no pay host'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { MiniAppSdkPaymentAdapter } = await import('./NimiqPaymentAdapter')
    const adapter = new MiniAppSdkPaymentAdapter()
    await adapter.initialize()

    await expect(adapter.requestNim(100_000, 'NimWorld gift request')).resolves.toEqual({
      ok: true,
    })
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^nimiq:\?amount=1/))
  })
})
