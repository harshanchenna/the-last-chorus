/**
 * Default playtest scenario — a guided tour that doubles as a behaviour check.
 *
 * It boots the real game, plays through the core loop with real keyboard input,
 * screenshots each beat into `playtest/shots/`, and asserts game state at each
 * step (so it's both a visual review and a regression check). Exits non-zero on
 * any failed assertion — usable in CI later.
 *
 *   npm run playtest            # headless
 *   npm run playtest -- --head  # watch it play in a real window
 */

import {
  startServer,
  openGame,
  resetSave,
  newGame,
  state,
  host,
  gotoZone,
  hold,
  dash,
  tap,
  shot,
  clearShots,
} from './harness.mjs';

const headless = !process.argv.includes('--head');
const results = [];
function check(label, cond, detail = '') {
  results.push({ label, ok: !!cond, detail });
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? `  — ${detail}` : ''}`);
}

const server = await startServer();
let browser;
try {
  const game = await openGame({ headless });
  browser = game.browser;
  const { page } = game;
  await resetSave(page);
  await clearShots();

  // ---- 0. Title screen ----
  console.log('\n[0] Title screen');
  await shot(page, '00-title');
  const onTitle = await page.evaluate(() => !!window.__lastChorusTitle);
  check('boots to the title screen', onTitle);
  await newGame(page);

  // ---- 1. Intro prologue + tutorial hand-off ----
  console.log('\n[1] Intro — prologue → tutorial');
  let s = await state(page);
  await shot(page, '01-prologue');
  check('new game opens the prologue', s.dialogueOpen === true && s.intro === true);
  check('boots into Ashchoir', s.zone === 'ashchoir', s.zone);
  check('starts with no Refrains', s.refrains.length === 0);
  check('starts at full light', s.lightFraction === 1, `light ${s.light}`);
  // Advance the 3 prologue lines; it should hand off to the move tutorial hint.
  await tap(page, 'E');
  await tap(page, 'E');
  await tap(page, 'E');
  s = await state(page);
  await shot(page, '02-tutorial-move');
  check('prologue closes into the move hint', s.dialogueOpen === false && s.tutStep === 'move');

  // ---- 2. Pick up the first Refrain by walking onto it ----
  console.log('\n[2] Walk onto the Refrain of the Held Breath');
  await host(page, 'teleport', 260, 340);
  await hold(page, 'ArrowDown', 800);
  s = await state(page);
  await shot(page, '03-refrain-picked');
  check('picked up first_refrain', s.refrains.includes('first_refrain'), s.refrains.join(','));

  // ---- 3. Combat read: spawn an ashling and swing ----
  console.log('\n[3] Combat — spawn + blade-of-light');
  await host(page, 'teleport', 240, 200);
  await host(page, 'spawn', 'ashling');
  await hold(page, 'ArrowRight', 120);
  await tap(page, 'J');
  await shot(page, '04-ashchoir-combat');
  s = await state(page);
  check('an enemy is live for the combat read', s.enemies >= 1, `enemies ${s.enemies}`);

  // ---- 4. Glass Reliquary overview ----
  console.log('\n[4] Glass Reliquary — overview');
  await gotoZone(page, 'glass_reliquary');
  s = await state(page);
  await shot(page, '05-glass-overview');
  const fracture = s.gates.find((g) => g.kind === 'chasm');
  check('has a chasm (fracture) gate', !!fracture, JSON.stringify(s.gates));
  check('fracture starts closed (no light_dash)', fracture && fracture.open === false);

  // ---- 5. The fracture blocks a plain walk ----
  console.log('\n[5] Chasm blocks walking');
  await host(page, 'teleport', 700, 80);
  await hold(page, 'ArrowRight', 1000);
  s = await state(page);
  await shot(page, '06-chasm-blocked');
  check('walking does NOT cross the fracture', s.player.x < 752, `x=${s.player.x}`);

  // ---- 6. Gain the Refrain of the Leap, then dash across ----
  console.log('\n[6] Refrain of the Leap → dash across');
  await host(page, 'giveRefrain', 'light_dash');
  s = await state(page);
  check('fracture now reads as leapable', s.gates.find((g) => g.kind === 'chasm').open === true);
  await host(page, 'teleport', 735, 80);
  await dash(page, 'ArrowRight', 420);
  s = await state(page);
  await shot(page, '07-chasm-crossed');
  check('dash leaps the fracture into the vault', s.player.x > 768, `x=${s.player.x}`);

  // ---- 7. Read the vault lore beyond the fracture ----
  console.log('\n[7] The vault lore (Pillar 4 payoff)');
  await host(page, 'teleport', 860, 56);
  await tap(page, 'E');
  s = await state(page);
  await shot(page, '08-vault-lore');
  check('vault lore collected', s.lore.includes('glass_vault'), s.lore.join(','));
  check('dialogue panel is showing it', s.dialogueOpen === true);

  // ---- 8. Journal / pause menu ----
  console.log('\n[8] Journal (pause)');
  await tap(page, 'E'); // close the dialogue
  await tap(page, 'P');
  s = await state(page);
  await shot(page, '09-journal');
  check('journal freezes the game', s.paused === true);

  if (game.errors.length) {
    console.log('\n[page console/errors]');
    for (const e of game.errors.slice(0, 10)) console.log('   ' + e);
  }
} finally {
  if (browser) await browser.close();
  await server.stop();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
console.log('Screenshots → playtest/shots/');
process.exit(failed.length ? 1 : 0);
