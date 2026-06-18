/**
 * Global, engine-agnostic configuration constants.
 *
 * Keep ALL magic numbers that designers/iteration care about here or in `/src/data`.
 * Nothing in this file imports Phaser, so it is trivially unit-testable.
 */

/** The one place the game's name lives (seed §0.7). */
export const GAME_TITLE = 'The Last Chorus';

/** Internal render resolution — 16:9, integer-scales to 960×540 / 1920×1080 (asset spec §1). */
export const RENDER = {
  width: 480,
  height: 270,
  tileSize: 16,
} as const;

/** Player movement feel. Tuned in M1 — this is the sacred foundation (seed §3 / M1). */
export const MOVEMENT = {
  /** Walk speed in pixels/second. */
  walkSpeed: 96,
  /** Acceleration toward target velocity, px/s². High = snappy (Dead Cells energy). */
  accel: 1400,
  /** Deceleration when input is released, px/s². Higher than accel for crisp stops. */
  friction: 2000,
  /** Dash speed in pixels/second (M1 tuning target). */
  dashSpeed: 280,
  /** How long a dash lasts, in milliseconds. */
  dashDurationMs: 150,
  /** Cooldown before another dash can start, in milliseconds. */
  dashCooldownMs: 300,
  /** Invulnerability window during a dash, in milliseconds (i-frames). */
  dashIFramesMs: 130,
} as const;

/**
 * Save format version. Designed to be versioned from day one (seed §3).
 * Bump this whenever the SaveData shape changes and add a migration.
 */
export const SAVE_VERSION = 1;

/** localStorage key for the single persistent save object. */
export const SAVE_KEY = 'the-last-chorus.save.v1';

/** Default dev-console / debug toggle key. */
export const DEV_TOGGLE_KEY = 'BACKTICK'; // the ` key
