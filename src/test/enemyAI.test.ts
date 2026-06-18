import { describe, it, expect } from 'vitest';
import { createAIMemory, stepAI, type AIConfig } from '../systems/enemyAI';

const CFG: AIConfig = {
  aggroRange: 100,
  attackRange: 20,
  telegraphMs: 300,
  attackMs: 150,
  recoverMs: 400,
};

describe('enemy AI state machine', () => {
  it('stays idle until the player enters aggro range', () => {
    const m = createAIMemory();
    expect(stepAI(m, CFG, { distance: 200 }, 16).state).toBe('idle');
    expect(stepAI(m, CFG, { distance: 80 }, 16).state).toBe('chase');
  });

  it('chases toward the player when out of attack range', () => {
    const m = createAIMemory();
    stepAI(m, CFG, { distance: 80 }, 16); // -> chase
    const d = stepAI(m, CFG, { distance: 60 }, 16);
    expect(d.state).toBe('chase');
    expect(d.move).toBe('toward');
  });

  it('telegraphs (winds up, planted) before striking', () => {
    const m = createAIMemory();
    stepAI(m, CFG, { distance: 80 }, 16); // chase
    const t = stepAI(m, CFG, { distance: 10 }, 16); // enter telegraph
    expect(t.state).toBe('telegraph');
    expect(t.telegraphing).toBe(true);
    expect(t.move).toBe('none'); // planted during the read window
    expect(t.attackActive).toBe(false);
  });

  it('opens the damage window exactly once when the wind-up completes', () => {
    const m = createAIMemory();
    stepAI(m, CFG, { distance: 80 }, 16); // chase
    stepAI(m, CFG, { distance: 10 }, 16); // telegraph
    // Not yet — still winding up.
    const mid = stepAI(m, CFG, { distance: 10 }, CFG.telegraphMs - 50);
    expect(mid.attackActive).toBe(false);
    // Completes the wind-up: strike lands this frame only.
    const strike = stepAI(m, CFG, { distance: 10 }, 100);
    expect(strike.state).toBe('attack');
    expect(strike.attackActive).toBe(true);
    expect(strike.move).toBe('lunge');
    const after = stepAI(m, CFG, { distance: 10 }, 16);
    expect(after.attackActive).toBe(false); // not retriggered while attacking
  });

  it('recovers after attacking, then re-engages', () => {
    const m = createAIMemory();
    stepAI(m, CFG, { distance: 80 }, 16); // chase
    stepAI(m, CFG, { distance: 10 }, 16); // telegraph
    stepAI(m, CFG, { distance: 10 }, CFG.telegraphMs); // -> attack
    stepAI(m, CFG, { distance: 10 }, CFG.attackMs); // -> recover
    expect(m.state).toBe('recover');
    const back = stepAI(m, CFG, { distance: 10 }, CFG.recoverMs);
    expect(back.state).toBe('chase'); // still in aggro range
  });

  it('gives up the chase when the player flees far enough', () => {
    const m = createAIMemory();
    stepAI(m, CFG, { distance: 80 }, 16); // chase
    const lost = stepAI(m, CFG, { distance: CFG.aggroRange * 1.5 }, 16);
    expect(lost.state).toBe('idle');
  });
});
