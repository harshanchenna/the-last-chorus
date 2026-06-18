/**
 * Visual playtest harness — launch the real game in a headless browser, drive it
 * with real keyboard input, read live state, and capture screenshots.
 *
 * This is how we validate *play feel and experience*, not just unit logic: the
 * boot-contract smoke test deliberately can't run WebGL (see ARCHITECTURE.md), so
 * this is the "it actually renders and plays" proof. Scenarios live alongside it
 * (e.g. `run.mjs`) and assert against `window.__lastChorus.state()` — the DEV-only
 * snapshot GameScene exposes (stripped from production builds).
 *
 * Requires the dev deps `playwright` + a Chromium binary (`npx playwright install
 * chromium`). Run a scenario with `npm run playtest`.
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';

const PORT = 5179; // off the default 5173 so a hand-run `npm run dev` can coexist
export const BASE_URL = `http://localhost:${PORT}`;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SHOTS_DIR = path.join(ROOT, 'playtest', 'shots');

/** Spawn the Vite dev server (DEV mode, so the debug hook exists) and wait for it. */
export async function startServer() {
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  let log = '';
  proc.stdout.on('data', (d) => (log += d));
  proc.stderr.on('data', (d) => (log += d));

  const ok = await waitFor(async () => {
    try {
      const r = await fetch(BASE_URL);
      return r.ok;
    } catch {
      return false;
    }
  }, 40000);
  if (!ok) {
    proc.kill('SIGKILL');
    throw new Error(`dev server did not come up on ${BASE_URL}\n${log}`);
  }
  return {
    proc,
    stop: () =>
      new Promise((res) => {
        proc.once('exit', res);
        proc.kill('SIGTERM');
        setTimeout(() => proc.kill('SIGKILL'), 2000);
      }),
  };
}

/** Launch Chromium and open the game; resolves once the scene has booted. */
export async function openGame({ headless = true } = {}) {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await waitTitle(page);
  // A real user gesture so audio/input are live and one render settles.
  await page.mouse.click(480, 270);
  await sleep(200);
  return { browser, page, errors };
}

/** Wait for the title screen (Boot → Title) to be ready. */
export async function waitTitle(page) {
  await page.waitForFunction(
    () => !!window.__lastChorusTitle && !!document.querySelector('canvas'),
    undefined,
    { timeout: 20000 },
  );
}

/** Wait for the DEV hook + a booted GameScene with a known zone. */
export async function waitBoot(page) {
  await page.waitForFunction(
    () => {
      try {
        return (
          !!window.__lastChorus &&
          !!document.querySelector('canvas') &&
          !!window.__lastChorus.state().zone
        );
      } catch {
        return false;
      }
    },
    undefined,
    { timeout: 20000 },
  );
}

/** From the title, start a fresh game (clears save) and wait for the GameScene. */
export async function newGame(page) {
  await page.evaluate(() => window.__lastChorusTitle.newGame());
  await waitBoot(page);
  await sleep(150);
}

/** From the title, continue the existing save and wait for the GameScene. */
export async function continueGame(page) {
  await page.evaluate(() => window.__lastChorusTitle.continueGame());
  await waitBoot(page);
  await sleep(150);
}

/** Wipe the persisted save and reboot to a clean title screen. */
export async function resetSave(page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await waitTitle(page);
  await page.mouse.click(480, 270);
  await sleep(200);
}

/** Hold one or more keys for `ms`, then release (movement is continuous). */
export async function hold(page, keys, ms) {
  const arr = Array.isArray(keys) ? keys : [keys];
  for (const k of arr) await page.keyboard.down(k);
  await sleep(ms);
  for (const k of arr) await page.keyboard.up(k);
  await sleep(40);
}

/**
 * Dash in a direction: hold the move key, then hold Space long enough for a frame
 * to sample the edge (Playwright's instant press() is faster than the 60fps poll).
 */
export async function dash(page, dirKey, ms = 360) {
  await page.keyboard.down(dirKey);
  await sleep(80);
  await page.keyboard.down('Space');
  await sleep(60);
  await page.keyboard.up('Space');
  await sleep(ms);
  await page.keyboard.up(dirKey);
  await sleep(60);
}

/**
 * Tap a single key once (edge actions: E interact, J melee, K cast, P pause).
 * Held for a frame so the edge is actually sampled (see dash()).
 */
export async function tap(page, key) {
  await page.keyboard.down(key);
  await sleep(70);
  await page.keyboard.up(key);
  await sleep(90);
}

/** Read the DEV state snapshot GameScene exposes. */
export function state(page) {
  return page.evaluate(() => window.__lastChorus.state());
}

/** Invoke a dev-command host method (teleport/give/goto/spawn/...) in-page. */
export async function host(page, method, ...args) {
  await page.evaluate(({ m, a }) => window.__lastChorus.host[m](...a), { m: method, a: args });
  await sleep(120);
}

/** goto a zone and wait for the scene to actually re-create in that zone. */
export async function gotoZone(page, zoneId) {
  await host(page, 'gotoZone', zoneId);
  await page.waitForFunction(
    (z) => window.__lastChorus && window.__lastChorus.state().zone === z,
    zoneId,
    { timeout: 10000 },
  );
  await sleep(200);
}

/** Wait for the demo's EndScene to be reached. */
export async function waitEnd(page) {
  await page.waitForFunction(() => !!window.__lastChorusEnd, undefined, { timeout: 15000 });
}

/** Plain delay (e.g. to let a camera fade settle before a screenshot). */
export const wait = (ms) => sleep(ms);

/** Capture a screenshot into playtest/shots/<name>.png. */
export async function shot(page, name) {
  await mkdir(SHOTS_DIR, { recursive: true });
  const file = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  return path.relative(ROOT, file);
}

export async function clearShots() {
  await rm(SHOTS_DIR, { recursive: true, force: true });
  await mkdir(SHOTS_DIR, { recursive: true });
}

async function waitFor(fn, timeoutMs, stepMs = 300) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await sleep(stepMs);
  }
  return false;
}
