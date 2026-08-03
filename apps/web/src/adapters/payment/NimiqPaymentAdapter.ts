import { isNimiqPayHost } from '@/auth/session'

export type PaymentResult =
  | { ok: true; txHash?: string }
  | { ok: false; reason: string }

export interface NimiqPaymentAdapter {
  initialize(): Promise<void>
  isAvailable(): boolean
  sendNim(recipient: string, amountLuna: number, message?: string): Promise<PaymentResult>
  requestNim(amountLuna: number, message?: string): Promise<PaymentResult>
}

const HUB_URL = import.meta.env.VITE_NIMIQ_HUB_URL?.trim() || 'https://hub.nimiq.com'
const SDK_TIMEOUT_DESKTOP_MS = 2_500
const SDK_TIMEOUT_PAY_MS = 10_000
const MESSAGE_MAX_CHARS = 64

export class MockNimiqPaymentAdapter implements NimiqPaymentAdapter {
  private ready = false

  async initialize(): Promise<void> {
    this.ready = true
  }

  isAvailable(): boolean {
    return this.ready
  }

  async sendNim(
    _recipient: string,
    _amountLuna: number,
    _message?: string,
  ): Promise<PaymentResult> {
    return {
      ok: false,
      reason: 'Mock payment adapter — open Nimiq Pay or use Hub checkout to send NIM for real.',
    }
  }

  async requestNim(amountLuna: number, message?: string): Promise<PaymentResult> {
    const nim = amountLuna / 100_000
    const params = new URLSearchParams({
      amount: String(nim),
    })
    if (message) params.set('message', truncateMessage(message))
    const link = `nimiq:?${params.toString()}`
    try {
      await navigator.clipboard.writeText(link)
      return { ok: true }
    } catch {
      return { ok: false, reason: `Could not copy request link: ${link}` }
    }
  }
}

function truncateMessage(message: string): string {
  return message.length <= MESSAGE_MAX_CHARS ? message : message.slice(0, MESSAGE_MAX_CHARS)
}

function paymentErrorReason(result: unknown): string {
  if (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as { error?: { message?: string } }).error?.message === 'string'
  ) {
    return (result as { error: { message: string } }).error.message
  }
  return 'Payment rejected'
}

function encodeExtraData(message: string): Uint8Array {
  return new TextEncoder().encode(truncateMessage(message))
}

export class MiniAppSdkPaymentAdapter implements NimiqPaymentAdapter {
  private nimiq: Awaited<ReturnType<typeof import('@nimiq/mini-app-sdk').init>> | null = null
  private readonly fallback: NimiqPaymentAdapter = new MockNimiqPaymentAdapter()

  async initialize(): Promise<void> {
    const timeout = isNimiqPayHost() ? SDK_TIMEOUT_PAY_MS : SDK_TIMEOUT_DESKTOP_MS
    try {
      const { init } = await import('@nimiq/mini-app-sdk')
      this.nimiq = await init({ timeout })
    } catch {
      this.nimiq = null
    }
    await this.fallback.initialize()
  }

  isAvailable(): boolean {
    return Boolean(this.nimiq) || this.fallback.isAvailable() || !isNimiqPayHost()
  }

  async sendNim(recipient: string, amountLuna: number, message?: string): Promise<PaymentResult> {
    const note = message ? truncateMessage(message) : undefined

    if (isNimiqPayHost()) {
      if (!this.nimiq) {
        return {
          ok: false,
          reason: 'Nimiq Pay wallet is not available. Unlock your wallet and retry.',
        }
      }
      return this.sendViaSdk(recipient, amountLuna, note)
    }

    return this.sendViaHub(recipient, amountLuna, note)
  }

  async requestNim(amountLuna: number, message?: string): Promise<PaymentResult> {
    return this.fallback.requestNim(amountLuna, message)
  }

  private async sendViaSdk(
    recipient: string,
    amountLuna: number,
    message?: string,
  ): Promise<PaymentResult> {
    if (!this.nimiq) {
      return { ok: false, reason: 'Nimiq Pay wallet is not available.' }
    }
    try {
      const tx = message
        ? await this.nimiq.sendBasicTransactionWithData({
            recipient,
            value: amountLuna,
            data: message,
          })
        : await this.nimiq.sendBasicTransaction({
            recipient,
            value: amountLuna,
          })

      if (typeof tx !== 'string') {
        return { ok: false, reason: paymentErrorReason(tx) }
      }
      return { ok: true, txHash: tx }
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : 'Payment failed' }
    }
  }

  private async sendViaHub(
    recipient: string,
    amountLuna: number,
    message?: string,
  ): Promise<PaymentResult> {
    try {
      const { default: HubApi } = await import('@nimiq/hub-api')
      const hub = new HubApi(HUB_URL)
      const result = await hub.checkout({
        appName: 'NimWorld',
        recipient,
        value: amountLuna,
        ...(message ? { extraData: encodeExtraData(message) } : {}),
      })

      if (result && typeof result === 'object' && 'hash' in result && typeof result.hash === 'string') {
        return { ok: true, txHash: result.hash }
      }
      // Hub may return SimpleResult for some checkout modes.
      if (result && typeof result === 'object' && 'success' in result) {
        return (result as { success: boolean }).success
          ? { ok: true }
          : { ok: false, reason: 'Checkout was not completed' }
      }
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'Hub checkout failed',
      }
    }
  }
}
