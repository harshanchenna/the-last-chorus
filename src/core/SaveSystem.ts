/**
 * SaveSystem — explicit save at rest-points + autosave on zone transition (seed §3).
 *
 * Versioned from day one. The whole game state serializes to a single SaveData
 * object. Storage is injected (KeyValueStore) so logic is unit-testable without
 * a browser.
 */

import { SAVE_VERSION, SAVE_KEY } from './config';

/** The single persistent save object. Add fields with care + bump SAVE_VERSION. */
export interface SaveData {
  version: number;
  /** Zone the player will respawn / resume in. */
  zoneId: string;
  /** Last rest-point spawn position within that zone. */
  spawn: { x: number; y: number };
  /** Light-capacity (health) — reads as light, not a red bar (asset spec §5). */
  lightCapacity: number;
  /** Collected Refrain ids (ability/upgrade fragments). */
  refrains: string[];
  /** Discovered lore entry ids. */
  lore: string[];
  /** Collected in-world pickup ids (so they don't respawn). Added in v2. */
  pickups: string[];
  /** Defeated boss ids (so they stay dead and altars unlock). Added in v3. */
  defeatedBosses: string[];
  /** Altar choices: altarId → 'relight' | 'rest'. Bittersweet, persistent. Added in v3. */
  choices: Record<string, 'relight' | 'rest'>;
  /** Wall-clock ms when this was written. */
  savedAt: number;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory store for tests / headless. */
export class MemoryStore implements KeyValueStore {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

export function defaultSave(zoneId: string, spawn: { x: number; y: number }): SaveData {
  return {
    version: SAVE_VERSION,
    zoneId,
    spawn: { ...spawn },
    lightCapacity: 100,
    refrains: [],
    lore: [],
    pickups: [],
    defeatedBosses: [],
    choices: {},
    savedAt: 0,
  };
}

/**
 * Migrate older save shapes forward. Centralizing this keeps the rest of the
 * codebase free to assume the latest shape.
 */
export function migrate(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Partial<SaveData>;
  if (typeof data.version !== 'number') return null;

  if (data.version > SAVE_VERSION) return null; // from a newer build; refuse rather than corrupt.

  // v1 → v2 added `pickups`; v2 → v3 added `defeatedBosses` + `choices`. Each new
  // field is defaulted via `?? …`, so older saves load forward cleanly.
  return {
    version: SAVE_VERSION,
    zoneId: data.zoneId ?? 'ashchoir',
    spawn: data.spawn ?? { x: 0, y: 0 },
    lightCapacity: data.lightCapacity ?? 100,
    refrains: data.refrains ?? [],
    lore: data.lore ?? [],
    pickups: data.pickups ?? [],
    defeatedBosses: data.defeatedBosses ?? [],
    choices: data.choices ?? {},
    savedAt: data.savedAt ?? 0,
  };
}

export class SaveSystem {
  constructor(
    private readonly store: KeyValueStore,
    private readonly key: string = SAVE_KEY,
  ) {}

  has(): boolean {
    return this.store.getItem(this.key) !== null;
  }

  save(data: SaveData): void {
    const toWrite: SaveData = { ...data, version: SAVE_VERSION, savedAt: Date.now() };
    this.store.setItem(this.key, JSON.stringify(toWrite));
  }

  load(): SaveData | null {
    const raw = this.store.getItem(this.key);
    if (raw === null) return null;
    try {
      return migrate(JSON.parse(raw));
    } catch {
      return null; // corrupt save — treat as no save rather than crash.
    }
  }

  clear(): void {
    this.store.removeItem(this.key);
  }
}
