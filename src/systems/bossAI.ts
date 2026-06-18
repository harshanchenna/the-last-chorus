/**
 * Boss AI — a pure, testable multi-phase state machine (asset spec §3.2:
 * "multi-phase telegraphs"). Like the basic enemy AI but the boss escalates as
 * its health falls: phases change telegraph timing, movement, and which attack
 * patterns it can use. Pattern choice is deterministic (cycled), so fights are
 * stable to unit-test.
 *
 * The machine only *decides*; the Boss entity/scene resolves a pattern into
 * actual hitboxes/projectiles (strike = melee, radial = ring burst, volley = aimed).
 */

export type BossState = 'idle' | 'chase' | 'telegraph' | 'attack' | 'recover';
export type AttackPattern = 'strike' | 'radial' | 'volley';

export interface BossPhase {
  name: string;
  /** Active while health fraction is strictly greater than this threshold. */
  healthAbove: number;
  telegraphMs: number;
  recoverMs: number;
  moveSpeed: number;
  /** Patterns available this phase, cycled in order. */
  patterns: AttackPattern[];
}

export interface BossConfig {
  aggroRange: number;
  attackMs: number;
  /** Phases ordered from highest healthAbove to lowest (last should be 0). */
  phases: BossPhase[];
}

export interface BossMemory {
  state: BossState;
  timer: number;
  patternIndex: number;
  pattern: AttackPattern;
  phaseName: string;
}

export interface BossDecision {
  state: BossState;
  move: 'toward' | 'none';
  moveSpeed: number;
  attackActive: boolean;
  pattern: AttackPattern;
  telegraphing: boolean;
  phaseName: string;
}

export function createBossMemory(): BossMemory {
  return { state: 'idle', timer: 0, patternIndex: 0, pattern: 'strike', phaseName: '' };
}

/** The active phase for a given health fraction (0..1). */
export function phaseFor(cfg: BossConfig, healthFraction: number): BossPhase {
  for (const phase of cfg.phases) {
    if (healthFraction > phase.healthAbove) return phase;
  }
  // Fallback: the last (lowest) phase.
  return cfg.phases[cfg.phases.length - 1]!;
}

export function stepBoss(
  mem: BossMemory,
  cfg: BossConfig,
  input: { distance: number; healthFraction: number },
  dtMs: number,
): BossDecision {
  const phase = phaseFor(cfg, input.healthFraction);
  mem.phaseName = phase.name;
  let attackActive = false;

  switch (mem.state) {
    case 'idle':
      if (input.distance <= cfg.aggroRange) enter(mem, 'chase');
      break;

    case 'chase':
      // A boss is relentless: once close enough it commits to a telegraph.
      if (input.distance <= cfg.aggroRange) {
        // Pick the next pattern for this phase as we begin winding up.
        mem.pattern = phase.patterns[mem.patternIndex % phase.patterns.length]!;
        mem.patternIndex++;
        enter(mem, 'telegraph');
      }
      break;

    case 'telegraph':
      mem.timer += dtMs;
      if (mem.timer >= phase.telegraphMs) {
        enter(mem, 'attack');
        attackActive = true;
      }
      break;

    case 'attack':
      mem.timer += dtMs;
      if (mem.timer >= cfg.attackMs) enter(mem, 'recover');
      break;

    case 'recover':
      mem.timer += dtMs;
      if (mem.timer >= phase.recoverMs) {
        enter(mem, input.distance <= cfg.aggroRange ? 'chase' : 'idle');
      }
      break;
  }

  return {
    state: mem.state,
    // Boss closes distance while chasing; it plants to telegraph/attack/recover.
    move: mem.state === 'chase' ? 'toward' : 'none',
    moveSpeed: phase.moveSpeed,
    attackActive,
    pattern: mem.pattern,
    telegraphing: mem.state === 'telegraph',
    phaseName: phase.name,
  };
}

function enter(mem: BossMemory, state: BossState): void {
  mem.state = state;
  mem.timer = 0;
}
