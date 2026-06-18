import { describe, it, expect } from 'vitest';
import { AudioDirector, NullAudioBackend } from '../systems/AudioDirector';

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
});
