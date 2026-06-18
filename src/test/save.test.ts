import { describe, it, expect } from 'vitest';
import { SaveSystem, MemoryStore, defaultSave, migrate } from '../core/SaveSystem';
import { SAVE_VERSION } from '../core/config';

describe('SaveSystem', () => {
  it('round-trips a save', () => {
    const sys = new SaveSystem(new MemoryStore());
    expect(sys.has()).toBe(false);
    const data = defaultSave('ashchoir', { x: 10, y: 20 });
    data.refrains.push('first_refrain');
    sys.save(data);
    expect(sys.has()).toBe(true);

    const loaded = sys.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.zoneId).toBe('ashchoir');
    expect(loaded!.spawn).toEqual({ x: 10, y: 20 });
    expect(loaded!.refrains).toContain('first_refrain');
    expect(loaded!.version).toBe(SAVE_VERSION);
    expect(loaded!.savedAt).toBeGreaterThan(0);
  });

  it('returns null on corrupt data instead of throwing', () => {
    const store = new MemoryStore();
    store.setItem('the-last-chorus.save.v1', '{not json');
    const sys = new SaveSystem(store);
    expect(sys.load()).toBeNull();
  });

  it('clears a save', () => {
    const sys = new SaveSystem(new MemoryStore());
    sys.save(defaultSave('ashchoir', { x: 0, y: 0 }));
    sys.clear();
    expect(sys.has()).toBe(false);
  });
});

describe('migrate', () => {
  it('rejects non-objects and versionless blobs', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate(42)).toBeNull();
    expect(migrate({})).toBeNull();
  });

  it('refuses saves from a newer build', () => {
    expect(migrate({ version: SAVE_VERSION + 1 })).toBeNull();
  });

  it('fills defaults for a minimal current-version save', () => {
    const m = migrate({ version: SAVE_VERSION });
    expect(m).not.toBeNull();
    expect(m!.lightCapacity).toBe(100);
    expect(m!.refrains).toEqual([]);
  });

  it('migrates a v1 save forward, adding v2/v3 fields', () => {
    const v1 = {
      version: 1,
      zoneId: 'ashchoir',
      spawn: { x: 5, y: 6 },
      lightCapacity: 80,
      refrains: ['first_refrain'],
      lore: ['ashchoir_pew'],
      savedAt: 123,
    };
    const m = migrate(v1);
    expect(m).not.toBeNull();
    expect(m!.version).toBe(SAVE_VERSION);
    expect(m!.pickups).toEqual([]); // v2 field defaulted
    expect(m!.defeatedBosses).toEqual([]); // v3 field defaulted
    expect(m!.choices).toEqual({}); // v3 field defaulted
    expect(m!.refrains).toEqual(['first_refrain']); // preserved
  });

  it('preserves v3 choices + defeated bosses across save/load', () => {
    const sys = new SaveSystem(new MemoryStore());
    const data = defaultSave('ashchoir', { x: 0, y: 0 });
    data.defeatedBosses.push('ashchoir.choirmaster');
    data.choices['ashchoir.dais'] = 'rest';
    sys.save(data);
    const loaded = sys.load();
    expect(loaded!.defeatedBosses).toContain('ashchoir.choirmaster');
    expect(loaded!.choices['ashchoir.dais']).toBe('rest');
  });
});
