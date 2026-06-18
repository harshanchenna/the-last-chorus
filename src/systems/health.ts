/**
 * Health — a tiny pure module for "light" (the player) and enemy hit points.
 *
 * Kept engine-free and testable. Health reads as *light* for the player (asset
 * spec §5), but mechanically it's the same clamp-and-damage logic for everyone.
 */

export interface Health {
  current: number;
  max: number;
}

export function makeHealth(max: number): Health {
  return { current: max, max };
}

/** Apply damage; returns whether this hit was lethal. Mutates in place. */
export function applyDamage(h: Health, amount: number): { dead: boolean; dealt: number } {
  if (amount <= 0) return { dead: h.current <= 0, dealt: 0 };
  const before = h.current;
  h.current = Math.max(0, h.current - amount);
  return { dead: h.current <= 0, dealt: before - h.current };
}

/** Heal up to max. Mutates in place. */
export function heal(h: Health, amount: number): void {
  if (amount <= 0) return;
  h.current = Math.min(h.max, h.current + amount);
}

export function fullHeal(h: Health): void {
  h.current = h.max;
}

/** 0..1 fraction remaining — for the light meter HUD. */
export function fraction(h: Health): number {
  return h.max <= 0 ? 0 : h.current / h.max;
}

export function isDead(h: Health): boolean {
  return h.current <= 0;
}
