/**
 * PhaserAudioBackend — plays the REAL loaded ambient stems (when present) through
 * Phaser's sound system, while delegating one-shot SFX to the synthesized
 * `WebAudioToneBackend`. This is what makes the generated `.mp3` beds actually
 * audible: BootScene loads `zone.<id>.ambient.<stem>` keys, and the AudioDirector's
 * reactive mix sets each stem's volume here.
 *
 * Zones whose manifest audio is still a placeholder (no loaded key) simply stay
 * silent for the ambient bed — no synth fallback, so the soundscape is either the
 * real thing or quiet (never the old buzz). SFX always use the gentle synth.
 */

import Phaser from 'phaser';
import type { AudioBackend, Stem, SfxName } from './AudioDirector';
import { WebAudioToneBackend } from './WebAudioBackend';

export class PhaserAudioBackend implements AudioBackend {
  private readonly scene: Phaser.Scene;
  private readonly synth = new WebAudioToneBackend(); // SFX only
  private readonly sounds = new Map<string, Phaser.Sound.WebAudioSound>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Resume audio after a user gesture (browsers gate autoplay). */
  resume(): void {
    this.synth.resume();
    const mgr = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
    if (mgr.locked) void mgr.unlock();
    if (mgr.context && mgr.context.state === 'suspended') void mgr.context.resume();
  }

  private key(zoneId: string, stem: Stem): string {
    return `zone.${zoneId}.ambient.${stem}`;
  }

  ensureStem(zoneId: string, stem: Stem): void {
    const key = this.key(zoneId, stem);
    if (this.sounds.has(key)) return;
    if (!this.scene.cache.audio.exists(key)) return; // placeholder zone → stays silent
    const sound = this.scene.sound.add(key, {
      loop: true,
      volume: 0,
    }) as Phaser.Sound.WebAudioSound;
    sound.play();
    this.sounds.set(key, sound);
  }

  setGain(zoneId: string, stem: Stem, gain: number): void {
    this.sounds.get(this.key(zoneId, stem))?.setVolume(gain);
  }

  playSfx(name: SfxName, volume: number): void {
    this.synth.playSfx(name, volume);
  }

  releaseZone(zoneId: string): void {
    for (const [key, sound] of this.sounds) {
      if (!key.startsWith(`zone.${zoneId}.ambient.`)) continue;
      sound.stop();
      sound.destroy();
      this.sounds.delete(key);
    }
  }
}
