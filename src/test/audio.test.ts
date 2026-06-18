import { describe, it, expect } from 'vitest';
import {
  AudioDirector,
  NullAudioBackend,
  type AudioBackend,
  type Stem,
} from '../systems/AudioDirector';

/** Records the last gain set per stem so we can assert on the audible output. */
class RecordingBackend implements AudioBackend {
  gains: Partial<Record<Stem, number>> = {};
  ensureStem(): void {}
  setGain(_zone: string, stem: Stem, gain: number): void {
    this.gains[stem] = gain;
  }
  releaseZone(): void {}
}

describe('AudioDirector reactive stem mixing', () => {
  it('fades base in once a zone is set', () => {
    const d = new AudioDirector(new NullAudioBackend(), { fadeRatePerSec: 1 });
    d.setZone('ashchoir');
    expect(d.gainOf('base')).toBe(0);
    d.update(1000); // one full second at rate 1 → reach target
    expect(d.gainOf('base')).toBeCloseTo(1, 5);
  });

  it('crossfades melody → tension as tension rises', () => {
    const d = new AudioDirector(new NullAudioBackend(), { fadeRatePerSec: 100 });
    d.setZone('ashchoir');
    d.setTension(0);
    d.update(1000);
    expect(d.gainOf('melody')).toBeCloseTo(1, 1);
    expect(d.gainOf('tension')).toBeCloseTo(0, 1);

    d.setTension(1);
    d.update(1000);
    expect(d.gainOf('melody')).toBeCloseTo(0, 1);
    expect(d.gainOf('tension')).toBeCloseTo(1, 1);
  });

  it('clamps tension to 0..1', () => {
    const d = new AudioDirector(new NullAudioBackend(), { fadeRatePerSec: 100 });
    d.setZone('ashchoir');
    d.setTension(5);
    d.update(1000);
    expect(d.gainOf('tension')).toBeLessThanOrEqual(1);
  });

  it('does nothing before a zone is set', () => {
    const d = new AudioDirector(new NullAudioBackend());
    d.update(1000);
    expect(d.currentZone).toBeNull();
    expect(d.gainOf('base')).toBe(0);
  });

  it('silence (the unraveling eating sound) scales the audible output down', () => {
    const backend = new RecordingBackend();
    const d = new AudioDirector(backend, { fadeRatePerSec: 100 });
    d.setZone('ashchoir');
    d.update(1000); // base reaches full
    expect(backend.gains.base).toBeCloseTo(1, 5);

    d.setSilence(0.75);
    d.update(1000);
    expect(d.silenceLevel).toBe(0.75);
    expect(backend.gains.base).toBeCloseTo(0.25, 5); // 1 * (1 - 0.75)
    expect(d.gainOf('base')).toBeCloseTo(1, 5); // raw mix unchanged
  });
});
