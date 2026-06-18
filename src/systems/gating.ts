/**
 * Pure gate-passage logic (Pillar 4: exploration gated by abilities, not walls).
 *
 * Decoupled from Phaser so the BOTW-style "go-anywhere, come-back-stronger" rules
 * are unit-tested deterministically. The scene maps each placed gate to a `GateReq`
 * and asks this module, every overlap frame, whether the player may pass right now.
 *
 * Two kinds of barrier:
 *  - 'silence' — a silence-void: owning the required Refrain opens it permanently.
 *  - 'chasm'   — a fracture in the world you must *leap*: requires the Refrain AND
 *                an active dash to cross. This is the second grant type (light_dash),
 *                so the dash becomes a traversal key, not just a dodge.
 */

export type GateKind = 'silence' | 'chasm';

export interface GateReq {
  kind: GateKind;
  /** Refrain id required, or '' for an ungated barrier. */
  requiresRefrain: string;
}

export interface PassContext {
  /** Refrain ids the player currently owns. */
  refrains: string[];
  /** True only while the player is mid-dash (needed to leap a chasm). */
  isDashing: boolean;
}

/** Does the player own the Refrain a gate requires (or is it ungated)? */
export function ownsRequirement(gate: GateReq, refrains: string[]): boolean {
  return gate.requiresRefrain === '' || refrains.includes(gate.requiresRefrain);
}

/**
 * Can the player pass through this gate *right now*?
 * Silence-voids open the moment the Refrain is owned; chasms additionally demand
 * an active dash each time you cross (the leap).
 */
export function canPassGate(gate: GateReq, ctx: PassContext): boolean {
  if (!ownsRequirement(gate, ctx.refrains)) return false;
  if (gate.kind === 'chasm') return ctx.isDashing;
  return true;
}
