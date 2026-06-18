/**
 * WebAudioToneBackend — ethereal placeholder soundscape for the AudioDirector.
 *
 * Pillar 2 wants reactive layered audio to be a real, *hearable* system before
 * real music exists — but it must feel sacred and quiet, not like a buzzer. So
 * each stem is a soft pad (two detuned **sine** oscillators) routed through a
 * gentle low-pass + a generated reverb, with a slow breathing tremolo. The result
 * is an airy drone that swells and recedes. Real `.ogg` stems replace this by
 * swapping the backend — the director is unchanged.
 *
 * Lazy + gesture-aware: browsers suspend AudioContext until a user gesture, so
 * `resume()` is called on first input.
 */

import type { AudioBackend, Stem, SfxName } from './AudioDirector';

/** Base pitch per zone gives each dead god its own tonal identity (asset spec §6.1). */
const ZONE_ROOT_HZ: Record<string, number> = {
  ashchoir: 110, // low, grieving (A2)
  glass_reliquary: 196, // high, brittle (G3)
  drowned_hymn: 98, // deep, muffled (G2)
};

/** Soft, mostly-consonant intervals so the bed is a pad, not a dissonant buzz. */
function freqFor(zoneId: string, stem: Stem): number {
  const root = ZONE_ROOT_HZ[zoneId] ?? 110;
  switch (stem) {
    case 'base':
      return root; // the held note
    case 'melody':
      return root * 1.5; // a fifth above — calm, consonant
    case 'tension':
      return root * 1.2; // a minor third — a quiet unease, still warm
  }
}

interface SfxRecipe {
  wave: OscillatorType;
  from: number;
  to: number;
  dur: number;
  peak: number;
}

/** Tonal one-shots — short notes with a pitch slide + envelope (asset spec §6.2). */
const SFX: Record<SfxName, SfxRecipe[]> = {
  blade: [{ wave: 'triangle', from: 620, to: 320, dur: 0.12, peak: 0.32 }],
  cast: [{ wave: 'sine', from: 520, to: 880, dur: 0.2, peak: 0.28 }],
  hit: [{ wave: 'triangle', from: 260, to: 140, dur: 0.1, peak: 0.32 }],
  hurt: [{ wave: 'sine', from: 180, to: 96, dur: 0.2, peak: 0.34 }],
  dash: [{ wave: 'sine', from: 320, to: 560, dur: 0.14, peak: 0.22 }],
  pickup: [
    { wave: 'sine', from: 660, to: 660, dur: 0.16, peak: 0.3 },
    { wave: 'sine', from: 990, to: 990, dur: 0.26, peak: 0.3 },
  ],
  rest: [{ wave: 'sine', from: 392, to: 294, dur: 0.5, peak: 0.32 }],
};

interface StemNodes {
  oscs: OscillatorNode[];
  gain: GainNode; // director-controlled volume
  lfo: OscillatorNode;
}

export class WebAudioToneBackend implements AudioBackend {
  private ctx: AudioContext | null = null;
  private ambIn: GainNode | null = null; // ambient pads feed here (then low-pass + reverb)
  private sfxIn: GainNode | null = null; // SFX feed here (crisper, light reverb)
  private readonly nodes = new Map<string, StemNodes>();

  private ensureCtx(): boolean {
    if (this.ctx) return true;
    const Ctor =
      (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
    if (!Ctor) return false;
    const ctx = new Ctor();
    this.ctx = ctx;

    // Shared reverb (a generated, smoothly-decaying impulse) for ethereal space.
    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(ctx, 2.4, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    convolver.connect(wet);
    wet.connect(ctx.destination);

    // Ambient bus: pads → gentle low-pass → quiet dry, plus a reverb send.
    const ambIn = ctx.createGain();
    ambIn.gain.value = 1;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 760; // shave the harsh upper harmonics → airy, not buzzy
    const ambDry = ctx.createGain();
    ambDry.gain.value = 0.16; // keep the bed very gentle
    ambIn.connect(lp);
    lp.connect(ambDry);
    ambDry.connect(ctx.destination);
    ambIn.connect(convolver);
    this.ambIn = ambIn;

    // SFX bus: crisper (less filtering), still gentle, with a touch of the reverb.
    const sfxIn = ctx.createGain();
    sfxIn.gain.value = 0.5;
    sfxIn.connect(ctx.destination);
    sfxIn.connect(convolver);
    this.sfxIn = sfxIn;

    return true;
  }

  /** Call from a user-gesture handler so the browser permits audio. */
  resume(): void {
    if (!this.ensureCtx()) return;
    void this.ctx?.resume();
  }

  ensureStem(zoneId: string, stem: Stem): void {
    if (!this.ensureCtx() || !this.ctx || !this.ambIn) return;
    const key = `${zoneId}:${stem}`;
    if (this.nodes.has(key)) return;
    const ctx = this.ctx;
    const freq = freqFor(zoneId, stem);

    const gain = ctx.createGain();
    gain.gain.value = 0;

    // A slow tremolo so the pad "breathes" (the dying god's held note wavers).
    const tremolo = ctx.createGain();
    tremolo.gain.value = 0.85;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08 + Math.random() * 0.06; // ~0.08–0.14 Hz
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);

    // Two slightly detuned sine oscillators → a warm, chorused pad (no buzz).
    const oscs = [-6, 6].map((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(gain);
      return osc;
    });

    gain.connect(tremolo);
    tremolo.connect(this.ambIn);
    oscs.forEach((o) => o.start());
    lfo.start();

    this.nodes.set(key, { oscs, gain, lfo });
  }

  setGain(zoneId: string, stem: Stem, gain: number): void {
    const n = this.nodes.get(`${zoneId}:${stem}`);
    if (n && this.ctx) n.gain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.08);
  }

  playSfx(name: SfxName, volume: number): void {
    if (volume <= 0.01 || !this.ensureCtx() || !this.ctx || !this.sfxIn) return;
    const ctx = this.ctx;
    let when = ctx.currentTime;
    for (const r of SFX[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = r.wave;
      osc.frequency.setValueAtTime(r.from, when);
      osc.frequency.linearRampToValueAtTime(r.to, when + r.dur);
      const peak = r.peak * volume;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(peak, when + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + r.dur);
      osc.connect(gain);
      gain.connect(this.sfxIn);
      osc.start(when);
      osc.stop(when + r.dur + 0.03);
      when += r.dur * 0.55; // slight overlap for multi-note recipes (the chime)
    }
  }

  releaseZone(zoneId: string): void {
    for (const [key, n] of this.nodes) {
      if (!key.startsWith(`${zoneId}:`)) continue;
      for (const o of [...n.oscs, n.lfo]) {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
        o.disconnect();
      }
      n.gain.disconnect();
      this.nodes.delete(key);
    }
  }
}

/** A smooth exponentially-decaying noise impulse response for the convolver reverb. */
function makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
