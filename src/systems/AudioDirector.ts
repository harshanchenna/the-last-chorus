/**
 * AudioDirector — Pillar 2: "the world is a song."
 *
 * The fiction is literally built from sound, so reactive layered audio is a
 * first-class SYSTEM, not background polish. Each zone's ambient bed is three
 * stems that loop in sync (asset spec §6.1):
 *   - base    : always on (the dying god's held note)
 *   - melody  : fades in during calm exploration
 *   - tension : fades in during combat
 *
 * This class owns the *mixing logic* (target volumes + per-frame fades) and is
 * fully testable via the AudioBackend abstraction. A real WebAudio backend plays
 * sound in the browser; a Null backend is used in tests/headless boot.
 */

export type Stem = 'base' | 'melody' | 'tension';

/** Pluggable sound output. Keeps mixing logic decoupled from WebAudio/Phaser. */
export interface AudioBackend {
  /** Ensure a looping stem exists (idempotent). */
  ensureStem(zoneId: string, stem: Stem): void;
  /** Set a stem's current gain, 0..1. */
  setGain(zoneId: string, stem: Stem, gain: number): void;
  /** Stop and release everything for a zone. */
  releaseZone(zoneId: string): void;
}

/** A backend that does nothing — for tests and headless boot. */
export class NullAudioBackend implements AudioBackend {
  ensureStem(): void {}
  setGain(): void {}
  releaseZone(): void {}
}

interface StemState {
  current: number;
  target: number;
}

export interface AudioDirectorOptions {
  /** Volume change per second during fades (0..1). */
  fadeRatePerSec?: number;
}

export class AudioDirector {
  private readonly backend: AudioBackend;
  private readonly fadeRate: number;
  private zoneId: string | null = null;
  private tension = 0; // 0 = calm, 1 = full combat
  private silence = 0; // 0 = full sound, 1 = fully silenced (the unraveling eats sound)
  private readonly stems: Record<Stem, StemState> = {
    base: { current: 0, target: 0 },
    melody: { current: 0, target: 0 },
    tension: { current: 0, target: 0 },
  };

  constructor(backend: AudioBackend, options: AudioDirectorOptions = {}) {
    this.backend = backend;
    this.fadeRate = options.fadeRatePerSec ?? 1.5;
  }

  /** Enter a zone: spin up its stems and set their resting targets. */
  setZone(zoneId: string): void {
    if (this.zoneId === zoneId) return;
    if (this.zoneId) this.backend.releaseZone(this.zoneId);
    this.zoneId = zoneId;
    (['base', 'melody', 'tension'] as Stem[]).forEach((s) => {
      this.backend.ensureStem(zoneId, s);
      this.stems[s].current = 0;
    });
    this.recomputeTargets();
  }

  /** 0 = calm exploration, 1 = full combat. Drives the melody/tension crossfade. */
  setTension(t: number): void {
    this.tension = Math.max(0, Math.min(1, t));
    this.recomputeTargets();
  }

  /**
   * 0 = full sound, 1 = total silence. Where a god's voice has fallen the
   * unraveling *eats sound* (DESIGN: Ashchoir) — this scales every stem down so
   * the world literally goes quiet as you walk into the decay (Pillar 2).
   */
  setSilence(s: number): void {
    this.silence = Math.max(0, Math.min(1, s));
  }

  private recomputeTargets(): void {
    // Base is the dying god's held note: always on once in a zone.
    this.stems.base.target = this.zoneId ? 1 : 0;
    // Melody fades OUT as tension rises; tension layer fades IN.
    this.stems.melody.target = this.zoneId ? 1 - this.tension : 0;
    this.stems.tension.target = this.zoneId ? this.tension : 0;
  }

  /** Advance fades toward targets. Call once per frame with dt in milliseconds. */
  update(dtMs: number): void {
    if (!this.zoneId) return;
    const step = (this.fadeRate * dtMs) / 1000;
    const soundLevel = 1 - this.silence;
    (['base', 'melody', 'tension'] as Stem[]).forEach((s) => {
      const st = this.stems[s];
      if (st.current < st.target) st.current = Math.min(st.target, st.current + step);
      else if (st.current > st.target) st.current = Math.max(st.target, st.current - step);
      this.backend.setGain(this.zoneId!, s, st.current * soundLevel);
    });
  }

  /** Current mixed (pre-silence) gain for a stem — for the debug overlay + tests. */
  gainOf(stem: Stem): number {
    return this.stems[stem].current;
  }

  /** The silence the unraveling is currently imposing (0..1). */
  get silenceLevel(): number {
    return this.silence;
  }

  get currentZone(): string | null {
    return this.zoneId;
  }
}
