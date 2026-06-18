# Visual playtest harness

Launch the **real game** in a headless browser, drive it with real keyboard input,
read live game state, and capture screenshots. This is how we validate _play feel and
experience_ — not just unit logic. (The Vitest smoke test deliberately can't boot WebGL;
see [`../ARCHITECTURE.md`](../ARCHITECTURE.md).)

## Run it

```bash
npm run playtest            # headless; writes screenshots + a pass/fail report
npm run playtest -- --head  # watch it play in a real browser window
```

Screenshots land in `playtest/shots/` (git-ignored). The process exits non-zero if any
assertion fails, so it can gate CI later.

## How it works

- `harness.mjs` — spawns the Vite **dev** server on port 5179, launches Playwright
  Chromium, and exposes helpers: `openGame`, `resetSave`, `hold`/`dash`/`tap` (real key
  events), `host(...)` (call a dev-console command in-page), `gotoZone`, `state(page)`,
  and `shot(page, name)`.
- `state(page)` reads `window.__lastChorus.state()` — a plain-data snapshot
  (`GameScene.debugState()`) exposed **only in DEV** (`import.meta.env.DEV`), so it's
  never in the production build. `host` calls `window.__lastChorus.host` (the scene's
  `DevCommandHost`) for teleport / give / goto / spawn.
- `run.mjs` — the default scenario: a guided tour (Ashchoir → combat → Glass Reliquary →
  the `light_dash` chasm leap → vault lore → journal) that screenshots each beat and
  asserts game state at each step.

## Add a scenario

Copy `run.mjs`, import the helpers you need, and wire a new `npm` script. Keep edge
actions (Space/E/J/K/P) going through `dash`/`tap` — they hold the key for a frame so the
60fps edge-trigger is actually sampled (an instant Playwright `press()` is too fast).

## Gotchas

- Needs a Chromium binary: `npx playwright install chromium` (one-time).
- Movement is continuous (hold a key); dash/interact are edge-triggered (use `dash`/`tap`).
- `gotoZone` restarts the scene; the harness waits for the new zone before continuing.
