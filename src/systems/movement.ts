/**
 * Pure movement math + dash state machine.
 *
 * This module has ZERO Phaser/DOM dependencies so movement feel — the most
 * important thing in the game (seed §3, M1) — can be unit-tested deterministically
 * with injected time. The scene layer just feeds it input + dt and reads velocity.
 */

import { MOVEMENT } from '../core/config';
import type { Vec2, Facing, Direction } from '../core/types';

export interface MoveInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  /** Edge-triggered: true only on the frame the dash button was pressed. */
  dash: boolean;
}

/** Convert raw directional input into a normalized direction vector (8-way). */
export function inputToVector(input: MoveInput): Vec2 {
  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;

  if (x === 0 && y === 0) return { x: 0, y: 0 };

  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

/** Pick a 4-direction facing (+mirror) from a movement vector. Keeps last facing when idle. */
export function vectorToFacing(v: Vec2, previous: Facing): Facing {
  if (v.x === 0 && v.y === 0) return previous;
  // Horizontal dominance reads better for top-down 3/4 sprites.
  if (Math.abs(v.x) >= Math.abs(v.y)) {
    return { dir: 'side', flipX: v.x < 0 };
  }
  const dir: Direction = v.y < 0 ? 'up' : 'down';
  return { dir, flipX: false };
}

export type DashPhase = 'ready' | 'dashing' | 'cooldown';

export interface MoverState {
  phase: DashPhase;
  /** ms remaining in the current dash. */
  dashTimer: number;
  /** ms remaining before another dash is allowed. */
  cooldownTimer: number;
  /** Unit vector the current dash is travelling along. */
  dashDir: Vec2;
  facing: Facing;
}

export function createMoverState(): MoverState {
  return {
    phase: 'ready',
    dashTimer: 0,
    cooldownTimer: 0,
    dashDir: { x: 0, y: 0 },
    facing: { dir: 'down', flipX: false },
  };
}

export interface MoveResult {
  /** Velocity in pixels/second to apply this frame. */
  velocity: Vec2;
  /** True while i-frames are active (dash dodge). */
  invulnerable: boolean;
  facing: Facing;
}

/**
 * Advance the mover one tick.
 * @param state mutated in place (cheap, called every frame)
 * @param input current input snapshot
 * @param dtMs delta time in milliseconds
 */
export function stepMover(state: MoverState, input: MoveInput, dtMs: number): MoveResult {
  const moveVec = inputToVector(input);
  state.facing = vectorToFacing(moveVec, state.facing);

  // Tick timers.
  if (state.phase === 'dashing') {
    state.dashTimer -= dtMs;
    if (state.dashTimer <= 0) {
      state.phase = 'cooldown';
      state.cooldownTimer = MOVEMENT.dashCooldownMs;
    }
  } else if (state.phase === 'cooldown') {
    state.cooldownTimer -= dtMs;
    if (state.cooldownTimer <= 0) {
      state.phase = 'ready';
    }
  }

  // Start a dash on edge-trigger if allowed. Dash in the input direction, or
  // current facing if standing still, so a stationary dodge still moves.
  if (input.dash && state.phase === 'ready') {
    const dir = moveVec.x === 0 && moveVec.y === 0 ? facingToVector(state.facing) : moveVec;
    state.phase = 'dashing';
    state.dashTimer = MOVEMENT.dashDurationMs;
    state.dashDir = dir;
  }

  if (state.phase === 'dashing') {
    const elapsed = MOVEMENT.dashDurationMs - state.dashTimer;
    return {
      velocity: {
        x: state.dashDir.x * MOVEMENT.dashSpeed,
        y: state.dashDir.y * MOVEMENT.dashSpeed,
      },
      invulnerable: elapsed <= MOVEMENT.dashIFramesMs,
      facing: state.facing,
    };
  }

  return {
    velocity: { x: moveVec.x * MOVEMENT.walkSpeed, y: moveVec.y * MOVEMENT.walkSpeed },
    invulnerable: false,
    facing: state.facing,
  };
}

/** Inverse of vectorToFacing: a unit vector pointing where the sprite faces. */
export function facingToVector(f: Facing): Vec2 {
  switch (f.dir) {
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
    case 'side':
      return { x: f.flipX ? -1 : 1, y: 0 };
  }
}
