import { describe, it, expect } from 'vitest';
import { makeHealth, applyDamage, heal, fullHeal, fraction, isDead } from '../systems/health';

describe('health', () => {
  it('starts full', () => {
    const h = makeHealth(100);
    expect(h.current).toBe(100);
    expect(fraction(h)).toBe(1);
    expect(isDead(h)).toBe(false);
  });

  it('clamps damage at zero and reports lethality', () => {
    const h = makeHealth(20);
    expect(applyDamage(h, 8)).toEqual({ dead: false, dealt: 8 });
    expect(h.current).toBe(12);
    const killing = applyDamage(h, 999);
    expect(killing.dead).toBe(true);
    expect(killing.dealt).toBe(12); // only what remained
    expect(h.current).toBe(0);
    expect(isDead(h)).toBe(true);
  });

  it('ignores non-positive damage', () => {
    const h = makeHealth(10);
    expect(applyDamage(h, 0).dealt).toBe(0);
    expect(applyDamage(h, -5).dealt).toBe(0);
    expect(h.current).toBe(10);
  });

  it('heals up to max but never past it', () => {
    const h = makeHealth(50);
    applyDamage(h, 40);
    heal(h, 10);
    expect(h.current).toBe(20);
    heal(h, 999);
    expect(h.current).toBe(50);
    applyDamage(h, 25);
    fullHeal(h);
    expect(h.current).toBe(50);
  });
});
