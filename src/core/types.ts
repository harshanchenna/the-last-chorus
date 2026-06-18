/** Shared structural types used across systems. Engine-agnostic. */

export interface Vec2 {
  x: number;
  y: number;
}

export type Direction = 'down' | 'up' | 'side';

/** A normalized 4-direction facing plus whether the sprite should be mirrored. */
export interface Facing {
  dir: Direction;
  flipX: boolean;
}
