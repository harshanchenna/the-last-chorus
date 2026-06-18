import { describe, it, expect } from 'vitest';
import {
  inputToVector,
  vectorToFacing,
  stepMover,
  createMoverState,
  facingToVector,
  type MoveInput,
} from '../systems/movement';
import { MOVEMENT } from '../core/config';

const NONE: MoveInput = { up: false, down: false, left: false, right: false, dash: false };

describe('inputToVector', () => {
  it('returns zero when no keys are held', () => {
    expect(inputToVector(NONE)).toEqual({ x: 0, y: 0 });
  });

  it('normalizes diagonal movement to unit length', () => {
    const v = inputToVector({ ...NONE, up: true, right: true });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 5);
    expect(v.x).toBeGreaterThan(0);
    expect(v.y).toBeLessThan(0);
  });

  it('cancels opposing inputs', () => {
    expect(inputToVector({ ...NONE, left: true, right: true })).toEqual({ x: 0, y: 0 });
  });
});

describe('vectorToFacing', () => {
  const prev = { dir: 'down' as const, flipX: false };
  it('keeps previous facing when idle', () => {
    expect(vectorToFacing({ x: 0, y: 0 }, prev)).toEqual(prev);
  });
  it('mirrors side facing when moving left', () => {
    expect(vectorToFacing({ x: -1, y: 0 }, prev)).toEqual({ dir: 'side', flipX: true });
  });
  it('faces up when moving up', () => {
    expect(vectorToFacing({ x: 0, y: -1 }, prev)).toEqual({ dir: 'up', flipX: false });
  });
});

describe('facingToVector round-trips', () => {
  it('up', () => expect(facingToVector({ dir: 'up', flipX: false })).toEqual({ x: 0, y: -1 }));
  it('side-left', () =>
    expect(facingToVector({ dir: 'side', flipX: true })).toEqual({ x: -1, y: 0 }));
});

describe('stepMover dash state machine', () => {
  it('walks at walkSpeed', () => {
    const s = createMoverState();
    const r = stepMover(s, { ...NONE, right: true }, 16);
    expect(r.velocity.x).toBeCloseTo(MOVEMENT.walkSpeed, 5);
    expect(r.invulnerable).toBe(false);
  });

  it('dashes faster and grants i-frames, then cools down', () => {
    const s = createMoverState();
    // Trigger dash moving right.
    const start = stepMover(s, { ...NONE, right: true, dash: true }, 16);
    expect(s.phase).toBe('dashing');
    expect(start.velocity.x).toBeCloseTo(MOVEMENT.dashSpeed, 5);
    expect(start.invulnerable).toBe(true);

    // Run past the i-frame window but still dashing.
    stepMover(s, { ...NONE, right: true }, MOVEMENT.dashIFramesMs + 1);
    expect(s.phase === 'dashing' || s.phase === 'cooldown').toBe(true);

    // Run past the full dash → cooldown.
    stepMover(s, { ...NONE, right: true }, MOVEMENT.dashDurationMs);
    expect(s.phase).toBe('cooldown');

    // Cannot dash again during cooldown.
    const blocked = stepMover(s, { ...NONE, right: true, dash: true }, 16);
    expect(s.phase).toBe('cooldown');
    expect(blocked.velocity.x).toBeCloseTo(MOVEMENT.walkSpeed, 5);
  });

  it('dashes in facing direction when standing still', () => {
    const s = createMoverState();
    s.facing = { dir: 'up', flipX: false };
    const r = stepMover(s, { ...NONE, dash: true }, 16);
    expect(r.velocity.y).toBeCloseTo(-MOVEMENT.dashSpeed, 5);
  });
});
