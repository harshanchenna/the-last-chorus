import { describe, it, expect } from 'vitest';
import { createBossMemory, stepBoss, phaseFor, type BossConfig } from '../systems/bossAI';

const CFG: BossConfig = {
  aggroRange: 200,
  attackMs: 200,
  phases: [
    {
      name: 'P1',
      healthAbove: 0.66,
      telegraphMs: 600,
      recoverMs: 500,
      moveSpeed: 30,
      patterns: ['strike', 'radial'],
    },
    {
      name: 'P2',
      healthAbove: 0.33,
      telegraphMs: 400,
      recoverMs: 400,
      moveSpeed: 50,
      patterns: ['volley'],
    },
    {
      name: 'P3',
      healthAbove: 0,
      telegraphMs: 300,
      recoverMs: 300,
      moveSpeed: 70,
      patterns: ['radial'],
    },
  ],
};

describe('phaseFor', () => {
  it('selects phases by health fraction', () => {
    expect(phaseFor(CFG, 1).name).toBe('P1');
    expect(phaseFor(CFG, 0.66).name).toBe('P2'); // boundary is exclusive
    expect(phaseFor(CFG, 0.5).name).toBe('P2');
    expect(phaseFor(CFG, 0.1).name).toBe('P3');
    expect(phaseFor(CFG, 0).name).toBe('P3');
  });
});

describe('stepBoss', () => {
  it('escalates: lower health → faster, more aggressive phase', () => {
    const m = createBossMemory();
    const calm = stepBoss(m, CFG, { distance: 300, healthFraction: 1 }, 16);
    expect(calm.phaseName).toBe('P1');
    expect(calm.moveSpeed).toBe(30);
    const m2 = createBossMemory();
    const frantic = stepBoss(m2, CFG, { distance: 300, healthFraction: 0.1 }, 16);
    expect(frantic.phaseName).toBe('P3');
    expect(frantic.moveSpeed).toBe(70);
  });

  it('telegraphs then strikes, cycling patterns within a phase', () => {
    const m = createBossMemory();
    const inRange = { distance: 50, healthFraction: 1 };
    stepBoss(m, CFG, inRange, 16); // idle -> chase
    stepBoss(m, CFG, inRange, 16); // chase -> telegraph, picks pattern[0] = 'strike'
    expect(m.state).toBe('telegraph');
    const strike = stepBoss(m, CFG, inRange, CFG.phases[0]!.telegraphMs);
    expect(strike.attackActive).toBe(true);
    expect(strike.pattern).toBe('strike');

    // Finish the attack + recover, then the next telegraph uses pattern[1] = 'radial'.
    stepBoss(m, CFG, inRange, CFG.attackMs); // attack -> recover
    stepBoss(m, CFG, inRange, CFG.phases[0]!.recoverMs); // recover -> chase
    stepBoss(m, CFG, inRange, 16); // chase -> telegraph (pattern cycles)
    const second = stepBoss(m, CFG, inRange, CFG.phases[0]!.telegraphMs);
    expect(second.attackActive).toBe(true);
    expect(second.pattern).toBe('radial');
  });

  it('only opens the damage window for a single frame', () => {
    const m = createBossMemory();
    const inRange = { distance: 50, healthFraction: 1 };
    stepBoss(m, CFG, inRange, 16);
    stepBoss(m, CFG, inRange, 16);
    const strike = stepBoss(m, CFG, inRange, CFG.phases[0]!.telegraphMs);
    expect(strike.attackActive).toBe(true);
    const after = stepBoss(m, CFG, inRange, 16);
    expect(after.attackActive).toBe(false);
  });
});
