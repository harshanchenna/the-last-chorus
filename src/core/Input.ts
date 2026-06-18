/**
 * Input — thin Phaser keyboard wrapper that produces a per-frame MoveInput
 * snapshot and tracks edge-triggered actions (dash, dev toggle, interact).
 *
 * Supports keyboard now; gamepad is a later add behind the same snapshot shape
 * (seed §4: keyboard + gamepad). Centralizing input keeps scenes clean and makes
 * rebinding a one-file change.
 */

import Phaser from 'phaser';
import type { MoveInput } from '../systems/movement';

export class InputManager {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private dashWasDown = false;
  private interactWasDown = false;
  private devWasDown = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Keyboard input unavailable');
    this.keys = {
      up: kb.addKey('W'),
      down: kb.addKey('S'),
      left: kb.addKey('A'),
      right: kb.addKey('D'),
      upArrow: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      downArrow: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      leftArrow: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      rightArrow: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      dash: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      interact: kb.addKey('E'),
      dev: kb.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK),
    };
  }

  /** Snapshot the current frame's movement input (dash is edge-triggered). */
  sample(): MoveInput {
    const down = (k: string) => this.keys[k]?.isDown ?? false;
    const dashDown = down('dash');
    const dashEdge = dashDown && !this.dashWasDown;
    this.dashWasDown = dashDown;

    return {
      up: down('up') || down('upArrow'),
      down: down('down') || down('downArrow'),
      left: down('left') || down('leftArrow'),
      right: down('right') || down('rightArrow'),
      dash: dashEdge,
    };
  }

  /** True only on the frame interact was pressed. */
  interactPressed(): boolean {
    const isDown = this.keys.interact?.isDown ?? false;
    const edge = isDown && !this.interactWasDown;
    this.interactWasDown = isDown;
    return edge;
  }

  /** True only on the frame the dev-console toggle was pressed. */
  devTogglePressed(): boolean {
    const isDown = this.keys.dev?.isDown ?? false;
    const edge = isDown && !this.devWasDown;
    this.devWasDown = isDown;
    return edge;
  }
}
