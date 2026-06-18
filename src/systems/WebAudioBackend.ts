/**
 * WebAudioToneBackend — audible placeholder stems for the AudioDirector.
 *
 * Pillar 2 wants the reactive layered audio to be a real, *hearable* system even
 * before real music exists. This synthesizes each stem as a simple oscillator so
 * you can actually hear base→melody→tension crossfade as tension changes. Real
 * `.ogg` stems replace this by swapping the backend — the director is unchanged.
 *
 * Lazy + gesture-aware: browsers suspend AudioContext until a user gesture, so
 * `resume()` is called on first input.
 */

import type { AudioBackend, Stem, SfxName } from './AudioDirector';

/**
 * One-shot SFX recipes — kept tonal/musical (Pillar 2: SFX are part of the score,
 * not foley). Each is a short oscillator with a pitch slide + an amplitude envelope.
 */
interface SfxRecipe {
  wave: OscillatorType;
  from: number;
  to: number;
  dur: number;
  peak: number;
}

const SFX: Record<SfxName, SfxRecipe[]> = {
  blade: [{ wave: 'triangle', from: 560, to: 280, dur: 0.12, peak: 0.5 }],
  cast: [{ wave: 'sine', from: 540, to: 760, dur: 0.18, peak: 0.4 }],
  hit: [{ wave: 'square', from: 220, to: 120, dur: 0.09, peak: 0.45 }],
  hurt: [{ wave: 'sawtooth', from: 160, to: 90, dur: 0.18, peak: 0.5 }],
  dash: [{ wave: 'triangle', from: 300, to: 540, dur: 0.12, peak: 0.32 }],
  // A small rising two-note chime — gathering a piece of the song should reward.
  pickup: [
    { wave: 'sine', from: 660, to: 660, dur: 0.14, peak: 0.4 },
    { wave: 'sine', from: 990, to: 990, dur: 0.22, peak: 0.4 },
  ],
  // A warm, settling low note for resting/saving.
  rest: [{ wave: 'sine', from: 330, to: 247, dur: 0.45, peak: 0.45 }],
};

/** Base pitch per zone gives each dead god its own tonal identity (asset spec §6.1). */
const ZONE_ROOT_HZ: Record<string, number> = {
  ashchoir: 98, // low, grieving (G2)
  glass_reliquary: 174, // high, brittle (F3)
  drowned_hymn: 73, // deep, muffled (D2)
};

function freqFor(zoneId: string, stem: Stem): number {
  const root = ZONE_ROOT_HZ[zoneId] ?? 110;
  switch (stem) {
    case 'base':
      return root; // the held note
    case 'melody':
      return root * 1.5; // a fifth above — consonant, calm
    case 'tension':
      return root * 2.06; // ~octave but sharp — unease
  }
}

function waveFor(stem: Stem): OscillatorType {
  return stem === 'tension' ? 'sawtooth' : stem === 'melody' ? 'triangle' : 'sine';
}

interface StemNodes {
  osc: OscillatorNode;
  gain: GainNode;
}

export class WebAudioToneBackend implements AudioBackend {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly nodes = new Map<string, StemNodes>();

  private ensureCtx(): boolean {
    if (this.ctx) return true;
    const Ctor =
      (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
    if (!Ctor) return false;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.1; // keep synthesized placeholders gentle
    this.master.connect(this.ctx.destination);
    return true;
  }

  /** Call from a user-gesture handler so the browser permits audio. */
  resume(): void {
    if (!this.ensureCtx()) return;
    void this.ctx?.resume();
  }

  ensureStem(zoneId: string, stem: Stem): void {
    if (!this.ensureCtx() || !this.ctx || !this.master) return;
    const key = `${zoneId}:${stem}`;
    if (this.nodes.has(key)) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.type = waveFor(stem);
    osc.frequency.value = freqFor(zoneId, stem);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    this.nodes.set(key, { osc, gain });
  }

  setGain(zoneId: string, stem: Stem, gain: number): void {
    const n = this.nodes.get(`${zoneId}:${stem}`);
    if (n && this.ctx) n.gain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.03);
  }

  playSfx(name: SfxName, volume: number): void {
    if (volume <= 0.01 || !this.ensureCtx() || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    let when = ctx.currentTime;
    for (const r of SFX[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = r.wave;
      osc.frequency.setValueAtTime(r.from, when);
      osc.frequency.linearRampToValueAtTime(r.to, when + r.dur);
      // Quick attack, smooth decay so it reads as a note, not a click.
      const peak = r.peak * volume;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(peak, when + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + r.dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(when);
      osc.stop(when + r.dur + 0.02);
      when += r.dur * 0.55; // slight overlap for multi-note recipes (the chime)
    }
  }

  releaseZone(zoneId: string): void {
    for (const [key, n] of this.nodes) {
      if (!key.startsWith(`${zoneId}:`)) continue;
      try {
        n.osc.stop();
      } catch {
        /* already stopped */
      }
      n.osc.disconnect();
      n.gain.disconnect();
      this.nodes.delete(key);
    }
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
