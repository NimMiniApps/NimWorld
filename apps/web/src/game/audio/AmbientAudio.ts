/**
 * Environmental audio hooks. Sound stays disabled by default.
 * Call `setEnabled(true)` from settings when that UI exists.
 *
 * Reserved cue names (do not implement playback in Phase 3):
 * fountain · water · lantern · fire · bird · portal-hum · footsteps · construction-hammer · wind
 */
export class AmbientAudio {
  private enabled = false
  private ctx: AudioContext | null = null

  isEnabled() {
    return this.enabled
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (!on) this.stop()
  }

  /** Soft fountain-like bed — only when explicitly enabled. */
  async playFountainBed() {
    if (!this.enabled) return
    try {
      this.ctx ??= new AudioContext()
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 180
      gain.gain.value = 0.015
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.4)
    } catch {
      // Audio optional
    }
  }

  stop() {
    void this.ctx?.close()
    this.ctx = null
  }
}

export const ambientAudio = new AmbientAudio()
