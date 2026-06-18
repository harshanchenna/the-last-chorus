import { describe, it, expect } from 'vitest';
import { canPassGate, ownsRequirement, type GateReq } from '../systems/gating';

const silence: GateReq = { kind: 'silence', requiresRefrain: 'first_refrain' };
const chasm: GateReq = { kind: 'chasm', requiresRefrain: 'light_dash' };

describe('ownsRequirement', () => {
  it('is true only when the required Refrain is owned', () => {
    expect(ownsRequirement(silence, [])).toBe(false);
    expect(ownsRequirement(silence, ['first_refrain'])).toBe(true);
  });

  it('treats an empty requirement as ungated', () => {
    expect(ownsRequirement({ kind: 'silence', requiresRefrain: '' }, [])).toBe(true);
  });
});

describe('canPassGate — silence-void', () => {
  it('blocks without the Refrain, regardless of dashing', () => {
    expect(canPassGate(silence, { refrains: [], isDashing: false })).toBe(false);
    expect(canPassGate(silence, { refrains: [], isDashing: true })).toBe(false);
  });

  it('opens permanently once the Refrain is owned (dash irrelevant)', () => {
    expect(canPassGate(silence, { refrains: ['first_refrain'], isDashing: false })).toBe(true);
    expect(canPassGate(silence, { refrains: ['first_refrain'], isDashing: true })).toBe(true);
  });
});

describe('canPassGate — chasm (light_dash leap)', () => {
  it('never passes without the Refrain', () => {
    expect(canPassGate(chasm, { refrains: [], isDashing: true })).toBe(false);
  });

  it('with the Refrain, passes ONLY while dashing (must leap it)', () => {
    expect(canPassGate(chasm, { refrains: ['light_dash'], isDashing: false })).toBe(false);
    expect(canPassGate(chasm, { refrains: ['light_dash'], isDashing: true })).toBe(true);
  });
});
