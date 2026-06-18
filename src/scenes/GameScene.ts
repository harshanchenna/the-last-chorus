/**
 * GameScene — the playable zone (M2: combat — melee + cast, enemies with
 * telegraph AI, damage/death, rest-point respawn — on top of M0/M1 movement,
 * dash, save, lore, dev tools).
 *
 * Stays deliberately thin: it wires data (zones/enemies) to systems (movement,
 * audio, combat, save) and entities (player/enemy). No content is hardcoded —
 * it all comes from `/src/data`, so new zones/enemies need no scene changes.
 */

import Phaser from 'phaser';
import { getZone, ZONES, STARTING_ZONE } from '../data/zones';
import { getLore } from '../data/lore';
import { getRefrain } from '../data/refrains';
import { ENEMIES, getEnemy } from '../data/enemies';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { InputManager } from '../core/Input';
import { AudioDirector } from '../systems/AudioDirector';
import { WebAudioToneBackend } from '../systems/WebAudioBackend';
import { DebugOverlay } from '../dev/DebugOverlay';
import { DevConsole, type DevCommandHost } from '../dev/DevConsole';
import { SaveSystem, defaultSave, type SaveData } from '../core/SaveSystem';
import { Hud } from '../ui/Hud';
import { DialoguePanel } from '../ui/DialoguePanel';
import { ZoneMap } from '../world/ZoneMap';
import { Unraveling } from '../world/Unraveling';
import { buildTileGrid } from '../world/mapgen';
import { getMapSpec, TILE_SIZE } from '../data/maps';
import { tilesetKey } from '../assets/placeholders';
import { REST_POINT_KEY, LORE_KEY, GATE_KEY, EXIT_KEY, REFRAIN_KEY } from '../assets/placeholders';
import type { RefrainPickup } from '../data/zones';
import { GAME_TITLE, COMBAT } from '../core/config';

interface Interactable {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'rest' | 'lore';
  refId: string;
}

interface ZoneExitObj {
  sprite: Phaser.GameObjects.Sprite;
  toZone: string;
}

interface GateObj {
  sprite: Phaser.GameObjects.Sprite;
  body: Phaser.Physics.Arcade.StaticBody;
  requiresRefrain: string;
  open: boolean;
}

interface PickupObj {
  sprite: Phaser.GameObjects.Sprite;
  def: RefrainPickup;
}

interface Projectile {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
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
  private hud!: Hud;
  private dialogue!: DialoguePanel;
  private map!: ZoneMap;
  private interactables: Interactable[] = [];
  private exits: ZoneExitObj[] = [];
  private gates: GateObj[] = [];
  private pickups: PickupObj[] = [];
  private transitioning = false;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private meleeCooldown = 0;
  private castCooldown = 0;
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

    // Tile geometry + collision (data-driven; Tiled JSON drops in here later).
    this.map = new ZoneMap(
      this,
      buildTileGrid(getMapSpec(this.zoneId)),
      tilesetKey(this.zoneId),
      TILE_SIZE,
    );
    this.physics.world.setBounds(0, 0, this.map.widthPx, this.map.heightPx);
    this.cameras.main.setBounds(0, 0, this.map.widthPx, this.map.heightPx);

    // The signature unraveling overlay (ash/glass/tide) — region atmosphere.
    new Unraveling(this, zone.unraveling);

    // Player.
    this.player = new Player(this, spawn.x, spawn.y, this.save.lightCapacity);
    this.player.godmode = this.godmode;
    this.physics.add.collider(this.player.sprite, this.map.layer);
    // Smooth follow with a small deadzone so micro-movements don't jitter the
    // camera, and round to whole pixels to keep the art crisp (top-down readability).
    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setDeadzone(40, 28);
    cam.setRoundPixels(true);

    // Interactables: rest-points (save) + lore objects — all data-driven (Pillar 1).
    this.interactables = [];
    for (const rp of zone.restPoints) {
      const s = this.add.sprite(rp.x, rp.y, REST_POINT_KEY);
      this.interactables.push({ sprite: s, kind: 'rest', refId: rp.id });
    }
    for (const lo of zone.loreObjects) {
      const s = this.add.sprite(lo.x, lo.y, LORE_KEY);
      this.interactables.push({ sprite: s, kind: 'lore', refId: lo.loreId });
    }

    // Zone exits (walk-on transitions) + ability-gated barriers (Pillar 4).
    this.exits = zone.exits.map((ex) => ({
      sprite: this.add.sprite(ex.x, ex.y, EXIT_KEY).setAlpha(0.8),
      toZone: ex.toZone,
    }));
    this.transitioning = false;
    this.gates = [];
    for (const g of zone.gates) {
      const sprite = this.add.sprite(g.x, g.y, GATE_KEY);
      this.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      const owned = this.save.refrains.includes(g.requiresRefrain);
      const gate: GateObj = { sprite, body, requiresRefrain: g.requiresRefrain, open: owned };
      this.applyGateState(gate);
      this.physics.add.collider(this.player.sprite, sprite, undefined, () => !gate.open);
      this.gates.push(gate);
    }

    // In-world Refrain pickups (skip any already collected — persisted in save).
    this.pickups = [];
    for (const pk of zone.refrainPickups) {
      if (this.save.pickups.includes(pk.id)) continue;
      const sprite = this.add.sprite(pk.x, pk.y, REFRAIN_KEY).setDepth(20);
      this.tweens.add({
        targets: sprite,
        y: pk.y - 3,
        yoyo: true,
        repeat: -1,
        duration: 750,
        ease: 'Sine.inOut',
      });
      this.pickups.push({ sprite, def: pk });
    }

    this.enemies = [];
    this.projectiles = [];
    this.spawnInitialEnemies(zone.defaultSpawn);

    // Systems.
    this.controls = new InputManager(this);
    // Audible synthesized placeholder stems; browsers gate audio behind a gesture.
    const audioBackend = new WebAudioToneBackend();
    this.input.keyboard?.once('keydown', () => audioBackend.resume());
    this.input.once('pointerdown', () => audioBackend.resume());
    this.audio = new AudioDirector(audioBackend);
    this.audio.setZone(zone.ambientId);

    // UI + dev tooling.
    this.hud = new Hud(this);
    this.dialogue = new DialoguePanel(this);
    this.overlay = new DebugOverlay(this);
    this.devConsole = new DevConsole(this);

    this.title();
  }

  /** Seed a couple of foes a bit away from spawn so combat is reachable, not ambushing. */
  private spawnInitialEnemies(spawn: { x: number; y: number }): void {
    this.addEnemy('ashling', spawn.x + 140, spawn.y + 40);
    this.addEnemy('ashling', spawn.x + 200, spawn.y - 50);
  }

  private addEnemy(enemyId: string, x: number, y: number): void {
    const enemy = new Enemy(this, getEnemy(enemyId), x, y);
    this.physics.add.collider(enemy.sprite, this.map.layer);
    this.enemies.push(enemy);
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
      this.handleAttacks(delta);
      this.checkPickups();
      this.checkExits();
    } else {
      this.player.sprite.setVelocity(0, 0);
    }

    this.updateEnemies(delta, consoleOpen);
    this.updateProjectiles(delta);

    if (this.player.isDead) this.respawn();

    this.audio.update(delta);
    this.audio.setTension(this.combatTension());
    const equippedId = this.save.refrains[0];
    const equipped = equippedId ? getRefrain(equippedId).name : null;
    this.hud.update(this.player.lightFraction, this.save.refrains.length, equipped);

    this.overlay.markInputConsumed(!consoleOpen);
    this.overlay.setExtraLines([
      `zone ${this.zoneId}`,
      `light ${this.player.lightValue.toFixed(0)}`,
      `enemies ${this.enemies.length}`,
      `invuln ${this.player.isInvulnerable ? 'ON' : 'off'}`,
      `tension ${this.audio.gainOf('tension').toFixed(1)}`,
      `refrains ${this.save.refrains.length}`,
      `godmode ${this.godmode ? 'ON' : 'off'}`,
    ]);
    this.overlay.update(this.game);
  }

  // ---- Combat ----

  private handleAttacks(dtMs: number): void {
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dtMs);
    this.castCooldown = Math.max(0, this.castCooldown - dtMs);
    if (this.controls.meleePressed() && this.meleeCooldown <= 0) this.meleeSwing();
    if (this.controls.castPressed() && this.castCooldown <= 0) this.castShot();
  }

  /** Blade-of-light melee: a short-lived arc hitbox ahead of the player. */
  private meleeSwing(): void {
    this.meleeCooldown = COMBAT.melee.cooldownMs;
    const aim = this.player.aimVector;
    const p = this.player.position;
    const cx = p.x + aim.x * COMBAT.melee.reach;
    const cy = p.y + aim.y * COMBAT.melee.reach;

    // Resolve hits immediately (deterministic), then show the slash.
    for (const e of this.enemies) {
      if (e.isDead) continue;
      const d = Phaser.Math.Distance.Between(cx, cy, e.sprite.x, e.sprite.y);
      if (d <= COMBAT.melee.radius + e.def.frame.w / 2) e.takeHit(COMBAT.melee.damage);
    }

    const slash = this.add
      .arc(cx, cy, COMBAT.melee.radius, 0, 360, false, 0xfff2c4, 0.7)
      .setDepth(40);
    this.tweens.add({
      targets: slash,
      scale: 1.4,
      alpha: 0,
      duration: COMBAT.melee.activeMs + 60,
      onComplete: () => slash.destroy(),
    });
  }

  /** Sung-light cast: a travelling light mote that damages the first enemy it meets. */
  private castShot(): void {
    this.castCooldown = COMBAT.cast.cooldownMs;
    const aim = this.player.aimVector;
    const p = this.player.position;
    const sprite = this.add.circle(p.x, p.y, 3, 0x9ad8ff, 1).setDepth(40);
    this.projectiles.push({
      sprite,
      vx: aim.x * COMBAT.cast.speed,
      vy: aim.y * COMBAT.cast.speed,
      life: COMBAT.cast.lifeMs,
    });
  }

  private updateProjectiles(dtMs: number): void {
    const dt = dtMs / 1000;
    for (const proj of this.projectiles) {
      proj.life -= dtMs;
      proj.sprite.x += proj.vx * dt;
      proj.sprite.y += proj.vy * dt;
      for (const e of this.enemies) {
        if (e.isDead) continue;
        const d = Phaser.Math.Distance.Between(
          proj.sprite.x,
          proj.sprite.y,
          e.sprite.x,
          e.sprite.y,
        );
        if (d <= e.def.frame.w / 2 + 3) {
          e.takeHit(COMBAT.cast.damage);
          proj.life = 0;
          break;
        }
      }
    }
    // Cull expired / out-of-bounds projectiles.
    this.projectiles = this.projectiles.filter((proj) => {
      const out =
        proj.life <= 0 ||
        proj.sprite.x < 0 ||
        proj.sprite.y < 0 ||
        proj.sprite.x > this.physics.world.bounds.width ||
        proj.sprite.y > this.physics.world.bounds.height;
      if (out) proj.sprite.destroy();
      return !out;
    });
  }

  private updateEnemies(dtMs: number, frozen: boolean): void {
    const playerPos = this.player.position;
    for (const e of this.enemies) {
      if (e.isDead) continue;
      if (frozen) {
        e.sprite.setVelocity(0, 0);
        continue;
      }
      const decision = e.update(dtMs, playerPos);
      if (decision.attackActive) {
        const d = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, e.sprite.x, e.sprite.y);
        if (d <= e.def.attackRange + 14) this.player.takeDamage(e.def.damage);
      }
    }
    // Drop dead enemies from the list.
    this.enemies = this.enemies.filter((e) => !e.isDead);
  }

  /** 0..1 combat tension from the most-engaged enemy — drives the audio crossfade. */
  private combatTension(): number {
    let t = 0;
    for (const e of this.enemies) {
      if (e.isDead) continue;
      t = Math.max(t, 0.85); // any live enemy in the zone keeps the tension layer up
    }
    return t;
  }

  private respawn(): void {
    // Death returns the player to the last rest-point (seed §1). If that's another
    // zone, reload it; otherwise reposition + refill light here.
    if (this.save.zoneId !== this.zoneId) {
      this.scene.restart({ zoneId: this.save.zoneId });
      return;
    }
    this.player.restoreLight();
    this.player.setPosition(this.save.spawn.x, this.save.spawn.y);
    this.cameras.main.flash(300, 255, 242, 196);
    this.flash('The light gutters — you wake at the last rest.');
    // Clear the room so you don't immediately die again.
    for (const e of this.enemies) e.destroy();
    this.enemies = [];
  }

  private handleInteract(): void {
    // The same key dismisses an open lore panel.
    if (this.dialogue.isOpen) {
      this.dialogue.hide();
      return;
    }
    const near = this.nearestInteractable(24);
    if (!near) return;
    if (near.kind === 'rest') {
      // Rest-point: explicit save + refill light (seed §3).
      this.save.zoneId = this.zoneId;
      this.save.spawn = { ...this.player.position };
      this.save.lightCapacity = this.player.lightValue || this.save.lightCapacity;
      this.saves.save(this.save);
      this.player.restoreLight();
      this.flash('Saved at rest-point. Light restored.');
    } else {
      const lore = getLore(near.refId);
      if (!this.save.lore.includes(lore.id)) this.save.lore.push(lore.id);
      this.dialogue.show(lore.title, lore.text);
    }
  }

  /** Pick up a Refrain fragment on contact — grants the ability + opens gates. */
  private checkPickups(): void {
    if (this.pickups.length === 0) return;
    const p = this.player.position;
    for (const pk of this.pickups) {
      if (Phaser.Math.Distance.Between(p.x, p.y, pk.sprite.x, pk.sprite.y) <= 16) {
        this.collectPickup(pk);
      }
    }
    this.pickups = this.pickups.filter((pk) => pk.sprite.active);
  }

  private collectPickup(pk: PickupObj): void {
    if (!this.save.pickups.includes(pk.def.id)) this.save.pickups.push(pk.def.id);
    this.refrainPickupFx(pk.sprite.x, pk.sprite.y);
    pk.sprite.destroy();
    // Grants the Refrain, persists, opens any now-passable gates, and flashes.
    this.giveRefrain(pk.def.refrainId);
  }

  /** fx.refrain_pickup — a quiet burst of light motes rising from the fragment. */
  private refrainPickupFx(x: number, y: number): void {
    this.cameras.main.flash(180, 255, 242, 196);
    for (let i = 0; i < 8; i++) {
      const mote = this.add.rectangle(x, y, 2, 2, 0xfff2c4).setDepth(60);
      const angle = (Math.PI * 2 * i) / 8;
      this.tweens.add({
        targets: mote,
        x: x + Math.cos(angle) * 18,
        y: y + Math.sin(angle) * 18 - 6,
        alpha: 0,
        duration: 520,
        onComplete: () => mote.destroy(),
      });
    }
  }

  /** Walk-on zone transition (autosaves first). Guarded so it fires once. */
  private checkExits(): void {
    if (this.transitioning) return;
    const p = this.player.position;
    for (const ex of this.exits) {
      if (Phaser.Math.Distance.Between(p.x, p.y, ex.sprite.x, ex.sprite.y) <= 14) {
        this.transitioning = true;
        this.gotoZone(ex.toZone);
        return;
      }
    }
  }

  /** Open gates the player now qualifies for (called after gaining a Refrain). */
  private refreshGates(): void {
    for (const gate of this.gates) {
      if (!gate.open && this.save.refrains.includes(gate.requiresRefrain)) {
        gate.open = true;
        this.applyGateState(gate);
      }
    }
  }

  private applyGateState(gate: GateObj): void {
    // Open gates become passable ghosts; closed gates are solid silence-voids.
    gate.body.enable = !gate.open;
    gate.sprite.setAlpha(gate.open ? 0.18 : 1);
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
    if (!ENEMIES[enemyId]) throw new Error(`unknown enemy ${enemyId}`);
    const p = this.player.position;
    this.addEnemy(enemyId, p.x + 50, p.y);
  }

  giveRefrain(id: string): void {
    const r = getRefrain(id);
    if (!this.save.refrains.includes(r.id)) this.save.refrains.push(r.id);
    this.saves.save(this.save); // persist immediately so the unlock survives death
    this.refreshGates(); // a gained Refrain can open previously-blocked paths (BOTW loop)
    this.flash(`Refrain gained: ${r.name}`);
  }

  toggleGodmode(): boolean {
    this.godmode = !this.godmode;
    this.player.godmode = this.godmode;
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
