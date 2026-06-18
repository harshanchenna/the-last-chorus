/**
 * GameScene — the playable zone. Wires the whole game together: tile geometry,
 * movement/dash, combat (melee + cast, telegraphing enemies, a multi-phase
 * boss), zone transitions, ability-gates, Refrain pickups, lore, save, reactive
 * audio, and dev tools.
 *
 * Stays deliberately thin: it wires data (`/src/data`) to systems (movement,
 * audio, combat AI, save) and entities (player/enemy/boss). No content is
 * hardcoded here — new zones/enemies/bosses are data edits, no scene changes.
 */

import Phaser from 'phaser';
import { getZone, ZONES, STARTING_ZONE } from '../data/zones';
import { getLore } from '../data/lore';
import { getRefrain } from '../data/refrains';
import { ENEMIES, getEnemy } from '../data/enemies';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { getBoss, BOSSES } from '../data/bosses';
import { InputManager } from '../core/Input';
import { AudioDirector } from '../systems/AudioDirector';
import { WebAudioToneBackend } from '../systems/WebAudioBackend';
import { DebugOverlay } from '../dev/DebugOverlay';
import { DevConsole, type DevCommandHost } from '../dev/DevConsole';
import { SaveSystem, defaultSave, type SaveData } from '../core/SaveSystem';
import { Hud } from '../ui/Hud';
import { BossBar } from '../ui/BossBar';
import { DialoguePanel } from '../ui/DialoguePanel';
import { ZoneMap } from '../world/ZoneMap';
import { Unraveling } from '../world/Unraveling';
import { buildTileGrid } from '../world/mapgen';
import { getMapSpec, TILE_SIZE } from '../data/maps';
import {
  tilesetKey,
  REST_POINT_KEY,
  LORE_KEY,
  GATE_KEY,
  EXIT_KEY,
  REFRAIN_KEY,
  ALTAR_KEY,
} from '../assets/placeholders';
import type { RefrainPickup, Altar } from '../data/zones';
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
  /** Damage dealt to the player (enemy projectiles only). */
  damage?: number;
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
  private bossBar!: BossBar;
  private dialogue!: DialoguePanel;
  private map!: ZoneMap;
  private interactables: Interactable[] = [];
  private exits: ZoneExitObj[] = [];
  private gates: GateObj[] = [];
  private pickups: PickupObj[] = [];
  private transitioning = false;
  private enemies: Enemy[] = [];
  private bosses: Boss[] = [];
  private bossSpawnId = new Map<Boss, string>();
  private projectiles: Projectile[] = [];
  private enemyProjectiles: Projectile[] = [];
  private meleeCooldown = 0;
  private castCooldown = 0;
  private godmode = false;
  private altar: Altar | null = null;
  private altarSprite: Phaser.GameObjects.Sprite | null = null;
  /** Set while the player is standing at an altar deciding relight vs rest. */
  private pendingAltar: Altar | null = null;
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
    this.bosses = [];
    this.bossSpawnId.clear();
    this.projectiles = [];
    this.enemyProjectiles = [];
    // A boss already beaten in a prior visit stays dead (persistent world).
    for (const es of zone.enemySpawns) this.addEnemy(es.enemyId, es.x, es.y);
    for (const bs of zone.bosses) {
      if (this.save.defeatedBosses.includes(bs.id)) continue;
      this.addBoss(bs.bossId, bs.x, bs.y, bs.id);
    }

    // The god's altar (relight-vs-rest). Dim until the region's boss has fallen.
    this.altar = zone.altar ?? null;
    this.pendingAltar = null;
    this.altarSprite = null;
    if (this.altar) {
      this.altarSprite = this.add.sprite(this.altar.x, this.altar.y, ALTAR_KEY).setDepth(20);
      this.altarSprite.setAlpha(this.isAltarAwake() ? 1 : 0.3);
    }

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
    this.bossBar = new BossBar(this);
    this.dialogue = new DialoguePanel(this);
    this.overlay = new DebugOverlay(this);
    this.devConsole = new DevConsole(this);

    this.title();
  }

  private addEnemy(enemyId: string, x: number, y: number): void {
    const enemy = new Enemy(this, getEnemy(enemyId), x, y);
    this.physics.add.collider(enemy.sprite, this.map.layer);
    this.enemies.push(enemy);
  }

  private addBoss(bossId: string, x: number, y: number, spawnId?: string): void {
    const boss = new Boss(this, getBoss(bossId), x, y);
    this.physics.add.collider(boss.sprite, this.map.layer);
    this.bosses.push(boss);
    if (spawnId) this.bossSpawnId.set(boss, spawnId);
  }

  /** True once every boss this altar waits on has been defeated. */
  private isAltarAwake(): boolean {
    if (!this.altar) return false;
    return this.save.defeatedBosses.includes(this.altar.bossSpawnId);
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
    if (this.pendingAltar) {
      // While deciding at the altar, the player stands still and chooses.
      this.player.sprite.setVelocity(0, 0);
      this.handleAltarChoice();
    } else if (!consoleOpen) {
      this.player.update(this.controls, delta);
      if (this.controls.interactPressed()) this.handleInteract();
      this.handleAttacks(delta);
      this.checkPickups();
      this.checkExits();
    } else {
      this.player.sprite.setVelocity(0, 0);
    }

    this.updateEnemies(delta, consoleOpen);
    this.updateBosses(delta, consoleOpen);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);

    if (this.player.isDead) this.respawn();

    this.audio.setSilence(this.computeSilence());
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
      `bosses ${this.bosses.length}`,
      `invuln ${this.player.isInvulnerable ? 'ON' : 'off'}`,
      `tension ${this.audio.gainOf('tension').toFixed(1)}`,
      `silence ${this.audio.silenceLevel.toFixed(2)}`,
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
    for (const b of this.bosses) {
      if (b.isDead) continue;
      const d = Phaser.Math.Distance.Between(cx, cy, b.sprite.x, b.sprite.y);
      if (d <= COMBAT.melee.radius + b.def.frame.w / 2) b.takeHit(COMBAT.melee.damage);
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
      if (proj.life <= 0) continue;
      for (const b of this.bosses) {
        if (b.isDead) continue;
        const d = Phaser.Math.Distance.Between(
          proj.sprite.x,
          proj.sprite.y,
          b.sprite.x,
          b.sprite.y,
        );
        if (d <= b.def.frame.w / 2 + 3) {
          b.takeHit(COMBAT.cast.damage);
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

  private updateBosses(dtMs: number, frozen: boolean): void {
    const playerPos = this.player.position;
    let engaged: Boss | null = null;
    for (const b of this.bosses) {
      if (b.isDead) continue;
      if (frozen) {
        b.sprite.setVelocity(0, 0);
        continue;
      }
      const decision = b.update(dtMs, playerPos);
      if (decision.attackActive) this.resolveBossAttack(b, decision.pattern);
      // The boss the player is fighting drives the boss bar.
      const d = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, b.sprite.x, b.sprite.y);
      if (d <= b.def.ai.aggroRange) engaged = b;
    }
    if (engaged) this.bossBar.show(engaged.def.name, engaged.healthFraction, engaged.phaseName);
    else this.bossBar.hide();

    // Record newly-defeated bosses (persisted), and wake the altar if it's theirs.
    for (const b of this.bosses) {
      if (!b.isDead) continue;
      const id = this.bossSpawnId.get(b);
      if (id && !this.save.defeatedBosses.includes(id)) {
        this.save.defeatedBosses.push(id);
        this.saves.save(this.save);
        this.onBossDefeated(id);
      }
    }
    this.bosses = this.bosses.filter((b) => !b.isDead);
  }

  private onBossDefeated(spawnId: string): void {
    this.flash('The Choirmaster falls silent.');
    if (this.altar && this.altar.bossSpawnId === spawnId && this.altarSprite) {
      // The altar wakes — a soft light to draw the player to the choice.
      this.altarSprite.setAlpha(1);
      this.tweens.add({
        targets: this.altarSprite,
        alpha: 0.6,
        yoyo: true,
        repeat: -1,
        duration: 900,
        ease: 'Sine.inOut',
      });
    }
  }

  /** Turn a boss attack pattern into real damage/projectiles (multi-phase combat). */
  private resolveBossAttack(boss: Boss, pattern: 'strike' | 'radial' | 'volley'): void {
    const bx = boss.sprite.x;
    const by = boss.sprite.y;
    const p = this.player.position;
    if (pattern === 'strike') {
      const d = Phaser.Math.Distance.Between(p.x, p.y, bx, by);
      if (d <= boss.def.frame.w / 2 + 22) this.player.takeDamage(boss.def.damage);
      this.cameras.main.shake(120, 0.004);
    } else if (pattern === 'radial') {
      // A chord burst: a ring of sung-light outward.
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        this.spawnEnemyProjectile(
          bx,
          by,
          Math.cos(a) * 150,
          Math.sin(a) * 150,
          boss.def.projectileDamage,
        );
      }
    } else {
      // Volley: three aimed notes with a slight spread.
      const base = Math.atan2(p.y - by, p.x - bx);
      for (const off of [-0.18, 0, 0.18]) {
        const a = base + off;
        this.spawnEnemyProjectile(
          bx,
          by,
          Math.cos(a) * 200,
          Math.sin(a) * 200,
          boss.def.projectileDamage,
        );
      }
    }
  }

  private spawnEnemyProjectile(x: number, y: number, vx: number, vy: number, damage: number): void {
    const sprite = this.add.circle(x, y, 3, 0xff7a3c, 1).setDepth(40);
    this.enemyProjectiles.push({ sprite, vx, vy, life: 2400, damage });
  }

  private updateEnemyProjectiles(dtMs: number): void {
    const dt = dtMs / 1000;
    const p = this.player.position;
    for (const proj of this.enemyProjectiles) {
      proj.life -= dtMs;
      proj.sprite.x += proj.vx * dt;
      proj.sprite.y += proj.vy * dt;
      if (Phaser.Math.Distance.Between(proj.sprite.x, proj.sprite.y, p.x, p.y) <= 11) {
        this.player.takeDamage(proj.damage ?? 0);
        proj.life = 0;
      }
    }
    this.enemyProjectiles = this.enemyProjectiles.filter((proj) => {
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

  /** 0..1 combat tension from live enemies/bosses — drives the audio crossfade. */
  private combatTension(): number {
    if (this.bosses.some((b) => !b.isDead)) return 1; // boss fight = full tension
    return this.enemies.some((e) => !e.isDead) ? 0.85 : 0;
  }

  /**
   * "Ash eats sound" (DESIGN: Ashchoir) — the deeper east you go into the
   * unraveling, the quieter the world gets, until even the god's held note is
   * nearly swallowed. Only the ash region does this (Pillar 2 showcase).
   */
  private computeSilence(): number {
    if (getZone(this.zoneId).unraveling !== 'ash') return 0;
    const start = this.map.widthPx * 0.62; // the chancel screen onward
    const t = (this.player.position.x - start) / (this.map.widthPx - start);
    return Phaser.Math.Clamp(t, 0, 1) * 0.8;
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
    // Clear the room so you don't immediately die again. A boss, however, is the
    // region's standing threat — reloading the zone resets it to full.
    for (const e of this.enemies) e.destroy();
    this.enemies = [];
    for (const proj of this.enemyProjectiles) proj.sprite.destroy();
    this.enemyProjectiles = [];
    this.bossBar.hide();
  }

  private handleInteract(): void {
    // The same key dismisses an open lore panel.
    if (this.dialogue.isOpen) {
      this.dialogue.hide();
      return;
    }
    // The god's altar takes priority when you're standing on it.
    if (this.altar && this.altarSprite) {
      const p = this.player.position;
      if (Phaser.Math.Distance.Between(p.x, p.y, this.altar.x, this.altar.y) <= 22) {
        this.interactAltar();
        return;
      }
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

  /** Approach the altar: show the prior choice, a locked message, or the prompt. */
  private interactAltar(): void {
    const altar = this.altar!;
    const prior = this.save.choices[altar.id];
    if (prior) {
      this.dialogue.show(
        prior === 'relight' ? 'Relit' : 'At Rest',
        prior === 'relight' ? altar.relightText : altar.restText,
      );
      return;
    }
    if (!this.isAltarAwake()) {
      this.flash('The altar is cold. Something still sings beyond the screen.');
      return;
    }
    // Offer the choice. Resolved in handleAltarChoice() via J / K.
    this.pendingAltar = altar;
    this.dialogue.show(
      `The altar of ${altar.godName}`,
      'Relight the god, or let it rest?   [ J ] relight     [ K ] let rest',
    );
  }

  /** While the altar prompt is open, J relights and K lets the god rest (Pillar 5). */
  private handleAltarChoice(): void {
    if (!this.pendingAltar) return;
    let choice: 'relight' | 'rest' | null = null;
    if (this.controls.meleePressed()) choice = 'relight';
    else if (this.controls.castPressed()) choice = 'rest';
    if (!choice) return;

    const altar = this.pendingAltar;
    this.pendingAltar = null;
    this.save.choices[altar.id] = choice;
    this.saves.save(this.save);
    this.dialogue.hide();
    this.applyChoiceEffect(choice);
    this.dialogue.show(
      choice === 'relight' ? 'Relit' : 'At Rest',
      choice === 'relight' ? altar.relightText : altar.restText,
    );
  }

  /** A small, bittersweet world change either way — never good/evil (Pillar 5). */
  private applyChoiceEffect(choice: 'relight' | 'rest'): void {
    if (choice === 'relight') {
      // The god's light briefly returns — warmth, then it fades.
      this.cameras.main.flash(600, 255, 242, 196);
    } else {
      // The song ends; the region settles into a deeper, kinder quiet.
      this.cameras.main.fade(500, 5, 6, 10, false);
      this.time.delayedCall(520, () => this.cameras.main.fadeIn(600, 5, 6, 10));
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

  spawnBoss(bossId: string): void {
    if (!BOSSES[bossId]) throw new Error(`unknown boss ${bossId}`);
    const p = this.player.position;
    this.addBoss(bossId, p.x + 120, p.y);
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
