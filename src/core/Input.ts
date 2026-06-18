/**
 * Input — Phaser keyboard + gamepad wrapper that produces a per-frame MoveInput
 * snapshot and tracks edge-triggered actions (dash, dev toggle, interact).
 *
 * Keyboard and gamepad both feed the same snapshot shape (seed §4: keyboard +
 * gamepad), so gameplay code never branches on input device. Centralizing input
 * keeps scenes clean and makes rebinding a one-file change.
 */

import Phaser from 'phaser';
import type { MoveInput } from '../systems/movement';

/** Analog stick deadzone — below this, axis input is ignored. */
const STICK_DEADZONE = 0.35;

export class InputManager {
  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private dashWasDown = false;
  private interactWasDown = false;
  private devWasDown = false;
  private meleeWasDown = false;
  private castWasDown = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
      melee: kb.addKey('J'),
      cast: kb.addKey('K'),
      dev: kb.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK),
    };
  }

  /** The connected gamepad, if any. */
  private get pad(): Phaser.Input.Gamepad.Gamepad | undefined {
    return this.scene.input.gamepad?.getPad(0);
  }

  /** Snapshot the current frame's movement input (dash is edge-triggered). */
  sample(): MoveInput {
    const down = (k: string) => this.keys[k]?.isDown ?? false;

    // Gamepad: left stick + d-pad for movement, A (button 0) for dash.
    const pad = this.pad;
    const ax = pad ? (pad.axes[0]?.getValue() ?? 0) : 0;
    const ay = pad ? (pad.axes[1]?.getValue() ?? 0) : 0;
    const padDashDown = pad ? pad.A : false;

    const dashDown = down('dash') || padDashDown;
    const dashEdge = dashDown && !this.dashWasDown;
    this.dashWasDown = dashDown;

    return {
      up: down('up') || down('upArrow') || ay < -STICK_DEADZONE || (pad?.up ?? false),
      down: down('down') || down('downArrow') || ay > STICK_DEADZONE || (pad?.down ?? false),
      left: down('left') || down('leftArrow') || ax < -STICK_DEADZONE || (pad?.left ?? false),
      right: down('right') || down('rightArrow') || ax > STICK_DEADZONE || (pad?.right ?? false),
      dash: dashEdge,
    };
  }

  /** True only on the frame interact was pressed (keyboard E or gamepad B). */
  interactPressed(): boolean {
    const isDown = (this.keys.interact?.isDown ?? false) || (this.pad?.B ?? false);
    const edge = isDown && !this.interactWasDown;
    this.interactWasDown = isDown;
    return edge;
  }

  /** True only on the frame the melee (blade-of-light) was pressed (J or gamepad X). */
  meleePressed(): boolean {
    const isDown = (this.keys.melee?.isDown ?? false) || (this.pad?.X ?? false);
    const edge = isDown && !this.meleeWasDown;
    this.meleeWasDown = isDown;
    return edge;
  }

  /** True only on the frame the cast (sung-light) was pressed (K or gamepad Y). */
  castPressed(): boolean {
    const isDown = (this.keys.cast?.isDown ?? false) || (this.pad?.Y ?? false);
    const edge = isDown && !this.castWasDown;
    this.castWasDown = isDown;
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
