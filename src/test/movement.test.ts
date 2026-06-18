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

// Run the mover for `ms` total in fixed 16ms sub-steps with a held input.
function simulate(s: ReturnType<typeof createMoverState>, input: MoveInput, ms: number) {
  let last = { velocity: { x: 0, y: 0 }, invulnerable: false, facing: s.facing };
  let firstFrame = true;
  for (let t = 0; t < ms; t += 16) {
    // Edge-triggered actions only fire on the first sub-step.
    const frameInput = firstFrame ? input : { ...input, dash: false };
    last = stepMover(s, frameInput, 16);
    firstFrame = false;
  }
  return last;
}

describe('stepMover acceleration model', () => {
  it('accelerates toward walkSpeed but never overshoots it', () => {
    const s = createMoverState();
    const oneFrame = stepMover(s, { ...NONE, right: true }, 16);
    // After a single 16ms frame it is moving but not yet at top speed.
    expect(oneFrame.velocity.x).toBeGreaterThan(0);
    expect(oneFrame.velocity.x).toBeLessThan(MOVEMENT.walkSpeed);

    // Held long enough, it caps exactly at walkSpeed.
    const settled = simulate(s, { ...NONE, right: true }, 500);
    expect(settled.velocity.x).toBeCloseTo(MOVEMENT.walkSpeed, 5);
    expect(settled.invulnerable).toBe(false);
  });

  it('decelerates to rest via friction when input is released', () => {
    const s = createMoverState();
    simulate(s, { ...NONE, right: true }, 500); // get up to speed
    const stopped = simulate(s, NONE, 500); // release
    expect(stopped.velocity.x).toBeCloseTo(0, 5);
  });

  it('normalizes diagonal speed (no faster on the diagonal)', () => {
    const s = createMoverState();
    const r = simulate(s, { ...NONE, right: true, down: true }, 500);
    expect(Math.hypot(r.velocity.x, r.velocity.y)).toBeCloseTo(MOVEMENT.walkSpeed, 4);
  });
});

describe('stepMover dash state machine', () => {
  it('dashes faster and grants i-frames, then cools down', () => {
    const s = createMoverState();
    // Trigger dash moving right — dash pops to full speed instantly.
    const start = stepMover(s, { ...NONE, right: true, dash: true }, 16);
    expect(s.phase).toBe('dashing');
    expect(start.velocity.x).toBeCloseTo(MOVEMENT.dashSpeed, 5);
    expect(start.invulnerable).toBe(true);

    // Run past the full dash → cooldown.
    simulate(s, { ...NONE, right: true }, MOVEMENT.dashDurationMs + 32);
    expect(s.phase).toBe('cooldown');

    // Cannot dash again during cooldown: a dash press does NOT pop to dashSpeed.
    const blocked = stepMover(s, { ...NONE, right: true, dash: true }, 16);
    expect(s.phase).toBe('cooldown');
    expect(blocked.velocity.x).toBeLessThan(MOVEMENT.dashSpeed);
  });

  it('dashes in facing direction when standing still', () => {
    const s = createMoverState();
    s.facing = { dir: 'up', flipX: false };
    const r = stepMover(s, { ...NONE, dash: true }, 16);
    expect(r.velocity.y).toBeCloseTo(-MOVEMENT.dashSpeed, 5);
  });
});
