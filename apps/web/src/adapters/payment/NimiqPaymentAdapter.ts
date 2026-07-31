export type PaymentResult =
  | { ok: true; txHash?: string }
  | { ok: false; reason: string }

export interface NimiqPaymentAdapter {
  initialize(): Promise<void>
  isAvailable(): boolean
  sendNim(recipient: string, amountLuna: number, message?: string): Promise<PaymentResult>
  requestNim(amountLuna: number, message?: string): Promise<PaymentResult>
}

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
      reason: 'Mock payment adapter — open Nimiq Pay or NimConnect to send NIM for real.',
    }
  }

  async requestNim(amountLuna: number, message?: string): Promise<PaymentResult> {
    const nim = amountLuna / 100_000
    const params = new URLSearchParams({
      amount: String(nim),
    })
    if (message) params.set('message', message)
    const link = `nimiq:?${params.toString()}`
    try {
      await navigator.clipboard.writeText(link)
      return { ok: true }
    } catch {
      return { ok: false, reason: `Could not copy request link: ${link}` }
    }
  }
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

export class MiniAppSdkPaymentAdapter implements NimiqPaymentAdapter {
  private nimiq: Awaited<ReturnType<typeof import('@nimiq/mini-app-sdk').init>> | null = null
  private readonly fallback: NimiqPaymentAdapter = new MockNimiqPaymentAdapter()

  async initialize(): Promise<void> {
    try {
      const { init } = await import('@nimiq/mini-app-sdk')
      this.nimiq = await init()
    } catch {
      await this.fallback.initialize()
      this.nimiq = null
    }
  }

  isAvailable(): boolean {
    return Boolean(this.nimiq) || this.fallback.isAvailable()
  }

  async sendNim(recipient: string, amountLuna: number, message?: string): Promise<PaymentResult> {
    if (!this.nimiq) {
      return this.fallback.sendNim(recipient, amountLuna, message)
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

  async requestNim(amountLuna: number, message?: string): Promise<PaymentResult> {
    return this.fallback.requestNim(amountLuna, message)
  }
}
