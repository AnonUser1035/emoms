// Tiny Web Audio cue generator for the EMOM timer. All methods are guarded and
// degrade to no-ops where audio is unavailable or blocked. The context must be
// created/resumed from a user gesture (the start tap) to satisfy autoplay
// policies — call unlock() there.

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext;
}

export class AudioCues {
  private ctx: AudioContext | null = null;

  /** Create/resume the audio context from within a user gesture. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  private tone(freq: number, durationMs: number, gain = 0.15): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const now = ctx.currentTime;
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      osc.connect(amp).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.02);
    } catch {
      // Ignore transient audio errors — the timer keeps running visually.
    }
  }

  /** Short low tick for the final 3-2-1 countdown of a segment. */
  countdown(): void {
    this.tone(660, 120);
  }

  /** Soft pacing tick at whole minutes inside a circuit segment — quieter
   *  and lower than everything else so it reads as a nudge, not an event. */
  tick(): void {
    this.tone(520, 90, 0.07);
  }

  /** Higher, longer tone marking the start of a new segment. */
  start(): void {
    this.tone(880, 260, 0.2);
  }

  /** Distinct end-of-workout flourish. */
  finish(): void {
    this.tone(988, 200, 0.2);
    window.setTimeout(() => this.tone(1319, 380, 0.2), 200);
  }
}
