/**
 * Enemy AI — a pure, testable state machine. Combat reads depend on the
 * telegraph (asset spec §3.2), so it's a first-class state: enemies wind up
 * (telegraph) before the attack lands, rewarding the player for reads (Pillar 3).
 *
 * Engine-free: it takes the distance to the player + dt and returns a decision.
 * The Enemy entity translates that decision into Phaser movement/hitboxes.
 */

export type AIState = 'idle' | 'chase' | 'telegraph' | 'attack' | 'recover';

export interface AIConfig {
  /** Start chasing within this distance (px). */
  aggroRange: number;
  /** Begin the telegraph once within this distance (px). */
  attackRange: number;
  /** Wind-up duration before the strike — the player's read window (ms). */
  telegraphMs: number;
  /** How long the strike is active (ms). */
  attackMs: number;
  /** Cooldown after a strike before chasing again (ms). */
  recoverMs: number;
}

export interface AIMemory {
  state: AIState;
  /** ms elapsed in the current timed state. */
  timer: number;
}

export interface AIDecision {
  state: AIState;
  /** Desired motion this frame. */
  move: 'toward' | 'none' | 'lunge';
  /** True only on the frame the strike becomes active (open the damage window). */
  attackActive: boolean;
  /** True while winding up — entities use this to flash the telegraph tell. */
  telegraphing: boolean;
}

export function createAIMemory(): AIMemory {
  return { state: 'idle', timer: 0 };
}

export function stepAI(
  mem: AIMemory,
  cfg: AIConfig,
  input: { distance: number },
  dtMs: number,
): AIDecision {
  const { distance } = input;
  let attackActive = false;

  switch (mem.state) {
    case 'idle':
      if (distance <= cfg.aggroRange) enter(mem, 'chase');
      break;

    case 'chase':
      if (distance <= cfg.attackRange) enter(mem, 'telegraph');
      else if (distance > cfg.aggroRange * 1.4) enter(mem, 'idle'); // lost the player
      break;

    case 'telegraph':
      mem.timer += dtMs;
      if (mem.timer >= cfg.telegraphMs) {
        enter(mem, 'attack');
        attackActive = true; // the strike lands the instant the wind-up completes
      }
      break;

    case 'attack':
      mem.timer += dtMs;
      if (mem.timer >= cfg.attackMs) enter(mem, 'recover');
      break;

    case 'recover':
      mem.timer += dtMs;
      if (mem.timer >= cfg.recoverMs) enter(mem, distance <= cfg.aggroRange ? 'chase' : 'idle');
      break;
  }

  return {
    state: mem.state,
    move: motionFor(mem.state),
    attackActive,
    telegraphing: mem.state === 'telegraph',
  };
}

function enter(mem: AIMemory, state: AIState): void {
  mem.state = state;
  mem.timer = 0;
}

function motionFor(state: AIState): 'toward' | 'none' | 'lunge' {
  switch (state) {
    case 'chase':
      return 'toward';
    case 'attack':
      return 'lunge';
    default:
      return 'none'; // idle / telegraph (planted, winding up) / recover
  }
}
