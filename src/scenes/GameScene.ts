/**
 * GameScene — the playable zone (M0: walk + dash, rest-points, lore, dev tools).
 *
 * Stays deliberately thin: it wires data (zones/enemies) to systems (movement,
 * audio, save) and entities (player). No content is hardcoded here — it all comes
 * from `/src/data`, so new zones/enemies need no scene changes (seed §5).
 */

import Phaser from 'phaser';
import { getZone, ZONES, STARTING_ZONE } from '../data/zones';
import { getLore } from '../data/lore';
import { getRefrain } from '../data/refrains';
import { ENEMIES } from '../data/enemies';
import { Player } from '../entities/Player';
import { InputManager } from '../core/Input';
import { AudioDirector, NullAudioBackend } from '../systems/AudioDirector';
import { DebugOverlay } from '../dev/DebugOverlay';
import { DevConsole, type DevCommandHost } from '../dev/DevConsole';
import { SaveSystem, defaultSave, type SaveData } from '../core/SaveSystem';
import { REST_POINT_KEY, LORE_KEY } from '../assets/placeholders';
import { GAME_TITLE } from '../core/config';

interface Interactable {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'rest' | 'lore';
  refId: string;
}

export class GameScene extends Phaser.Scene implements DevCommandHost {
  private zoneId = STARTING_ZONE;
  private player!: Player;
  // Named `controls` (not `input`) to avoid shadowing Phaser.Scene.input.
  private controls!: InputManager;
  private audio!: AudioDirector;
  private overlay!: DebugOverlay;
  private devConsole!: DevConsole;
  private saves!: SaveSystem;
  private interactables: Interactable[] = [];
  private enemies!: Phaser.GameObjects.Group;
  private godmode = false;
  private save!: SaveData;

  constructor() {
    super('Game');
  }

  init(data: { zoneId?: string }): void {
    this.zoneId = data.zoneId ?? STARTING_ZONE;
  }

  create(): void {
    const zone = getZone(this.zoneId);
    this.saves = new SaveSystem(window.localStorage);

    // Load existing save, or start fresh in the starting zone.
    this.save = this.saves.load() ?? defaultSave(this.zoneId, zone.defaultSpawn);
    // If the save points elsewhere but we were told a zone explicitly, honor the zone.
    const spawn = this.save.zoneId === this.zoneId ? this.save.spawn : zone.defaultSpawn;

    this.cameras.main.setBackgroundColor(zone.bgColor);
    this.physics.world.setBounds(0, 0, zone.bounds.width, zone.bounds.height);
    this.cameras.main.setBounds(0, 0, zone.bounds.width, zone.bounds.height);

    this.drawZoneFrame(zone.bounds.width, zone.bounds.height, zone.bgColor);

    // Player.
    this.player = new Player(this, spawn.x, spawn.y);
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);

    // Interactables: rest-points (save) + lore objects (Pillar 1).
    this.interactables = [];
    for (const rp of zone.restPoints) {
      const s = this.add.sprite(rp.x, rp.y, REST_POINT_KEY);
      this.interactables.push({ sprite: s, kind: 'rest', refId: rp.id });
    }
    // One lore object near the first rest point for M3 groundwork.
    const firstRest = zone.restPoints[0];
    if (firstRest) {
      const loreSprite = this.add.sprite(firstRest.x + 40, firstRest.y, LORE_KEY);
      this.interactables.push({ sprite: loreSprite, kind: 'lore', refId: 'ashchoir_pew' });
    }

    this.enemies = this.add.group();

    // Systems.
    this.controls = new InputManager(this);
    this.audio = new AudioDirector(new NullAudioBackend());
    this.audio.setZone(zone.ambientId);

    // Dev tooling.
    this.overlay = new DebugOverlay(this);
    this.devConsole = new DevConsole(this);

    this.title();
  }

  /** A faint border so the bounded room is legible without a tileset yet. */
  private drawZoneFrame(w: number, h: number, bg: number): void {
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.IntegerToColor(bg).darken(20).color, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(2, 0x2a3540, 1);
    g.strokeRect(1, 1, w - 2, h - 2);
    g.setDepth(-100);
  }

  private title(): void {
    const zone = getZone(this.zoneId);
    this.add
      .text(8, 8, `${GAME_TITLE} — ${zone.name}`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#cfa84a',
      })
      .setScrollFactor(0)
      .setDepth(9000)
      .setAlpha(0.7);
  }

  override update(_time: number, delta: number): void {
    // Dev console toggle is always live.
    if (this.controls.devTogglePressed()) this.devConsole.toggle();

    const consoleOpen = this.devConsole.isOpen;
    if (!consoleOpen) {
      this.player.update(this.controls, delta);
      if (this.controls.interactPressed()) this.handleInteract();
    } else {
      this.player.sprite.setVelocity(0, 0);
    }

    this.audio.update(delta);

    // Tension placeholder: rises with nearby enemies (real combat hooks in M2).
    this.audio.setTension(this.enemies.getLength() > 0 ? 0.8 : 0);

    this.overlay.markInputConsumed(!consoleOpen);
    this.overlay.setExtraLines([
      `zone ${this.zoneId}`,
      `pos ${this.player.position.x.toFixed(0)},${this.player.position.y.toFixed(0)}`,
      `dash-iframes ${this.player.isInvulnerable ? 'ON' : 'off'}`,
      `audio base/mel/ten ${this.audio.gainOf('base').toFixed(1)}/${this.audio
        .gainOf('melody')
        .toFixed(1)}/${this.audio.gainOf('tension').toFixed(1)}`,
      `refrains ${this.save.refrains.length}`,
      `godmode ${this.godmode ? 'ON' : 'off'}`,
    ]);
    this.overlay.update(this.game);
  }

  private handleInteract(): void {
    const near = this.nearestInteractable(24);
    if (!near) return;
    if (near.kind === 'rest') {
      // Rest-point: explicit save (seed §3).
      this.save.zoneId = this.zoneId;
      this.save.spawn = { ...this.player.position };
      this.saves.save(this.save);
      this.flash('Saved at rest-point.');
    } else {
      const lore = getLore(near.refId);
      if (!this.save.lore.includes(lore.id)) this.save.lore.push(lore.id);
      this.flash(`${lore.title}: ${lore.text}`);
    }
  }

  private nearestInteractable(radius: number): Interactable | null {
    const p = this.player.position;
    let best: Interactable | null = null;
    let bestDist = radius;
    for (const it of this.interactables) {
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.sprite.x, it.sprite.y);
      if (d <= bestDist) {
        best = it;
        bestDist = d;
      }
    }
    return best;
  }

  private flash(msg: string): void {
    const t = this.add
      .text(this.scale.width / 2, this.scale.height - 24, msg, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e8f4ff',
        backgroundColor: '#000000aa',
        wordWrap: { width: this.scale.width - 40 },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(9000);
    this.time.delayedCall(2600, () => t.destroy());
  }

  // ---- DevCommandHost ----

  teleport(x: number, y: number): void {
    if (Number.isFinite(x) && Number.isFinite(y)) this.player.setPosition(x, y);
  }

  spawn(enemyId: string): void {
    const def = ENEMIES[enemyId];
    if (!def) throw new Error(`unknown enemy ${enemyId}`);
    const p = this.player.position;
    const s = this.add.sprite(p.x + 40, p.y, `enemy.${def.id}`);
    this.enemies.add(s);
  }

  giveRefrain(id: string): void {
    const r = getRefrain(id);
    if (!this.save.refrains.includes(r.id)) this.save.refrains.push(r.id);
  }

  toggleGodmode(): boolean {
    this.godmode = !this.godmode;
    return this.godmode;
  }

  reloadZone(): void {
    this.scene.restart({ zoneId: this.zoneId });
  }

  listZones(): string[] {
    return Object.keys(ZONES);
  }

  gotoZone(id: string): void {
    if (!ZONES[id]) throw new Error(`unknown zone ${id}`);
    // Autosave on zone transition (seed §3).
    this.save.zoneId = id;
    this.save.spawn = { ...getZone(id).defaultSpawn };
    this.saves.save(this.save);
    this.scene.restart({ zoneId: id });
  }
}
