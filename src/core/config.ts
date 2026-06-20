/**
 * Global, engine-agnostic configuration constants.
 *
 * Keep ALL magic numbers that designers/iteration care about here or in `/src/data`.
 * Nothing in this file imports Phaser, so it is trivially unit-testable.
 */

/** The one place the game's name lives (seed §0.7). */
export const GAME_TITLE = 'The Last Chorus';

/** Internal render resolution — full 16:9 1080p so glow/vignette/UI render crisply. */
export const RENDER = {
  width: 1920,
  height: 1080,
  tileSize: 16,
} as const;

/**
 * Logical UI coordinate space. The UI camera is origin-anchored and zoomed so this
 * 960×540 space fills the 1920×1080 canvas — i.e. UI is authored at 1× here and the
 * camera scales it up. Keeps every HUD/menu number stable across resolution changes.
 */
export const UI = {
  width: 960,
  height: 540,
  /** Zoom applied to the UI camera so UI.width fills RENDER.width. */
  scale: 2,
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

/** Player combat feel (asset spec §3.1 / seed §3). Tuned alongside movement. */
export const COMBAT = {
  /** Blade-of-light melee. */
  melee: {
    damage: 12,
    /** How far ahead of the player the arc reaches (px). */
    reach: 22,
    /** Half-size of the arc hitbox (px). */
    radius: 16,
    /** How long the hitbox is active (ms). */
    activeMs: 110,
    /** Minimum time between melee swings (ms). */
    cooldownMs: 300,
  },
  /** Sung-light ranged cast. */
  cast: {
    damage: 8,
    /** Projectile speed (px/s). */
    speed: 220,
    /** Projectile lifetime (ms). */
    lifeMs: 900,
    cooldownMs: 420,
  },
  /** Invulnerability after taking a hit (ms) so you aren't stun-locked. */
  playerHurtIFramesMs: 600,
} as const;

/**
 * Save format version. Designed to be versioned from day one (seed §3).
 * Bump this whenever the SaveData shape changes and add a migration.
 */
export const SAVE_VERSION = 3;

/** localStorage key for the single persistent save object. */
export const SAVE_KEY = 'the-last-chorus.save.v1';

/** Default dev-console / debug toggle key. */
export const DEV_TOGGLE_KEY = 'BACKTICK'; // the ` key
