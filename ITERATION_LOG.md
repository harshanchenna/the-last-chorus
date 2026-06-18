# Iteration Log

Append-only. Per cycle: what was built, why, what was verified, what's next (seed §6).

---

## 2026-06-18 — Cycle 0: M0 boot & loop

**Built**

- Scaffolded Vite + Phaser 3 + TypeScript (strict) with pixel-art config and the 480×270 internal
  render resolution from the asset spec. ESLint + Prettier + Vitest wired.
- Stood up the data-driven module structure from seed §5: `core / systems / entities / world / data /
assets / ui / dev / scenes / test`.
- **M0 playable slice:** `BootScene` generates manifest-driven placeholder textures, `GameScene` loads
  the starting zone (Ashchoir), spawns the player, and runs the loop. You can walk (8-dir) and dash
  (with i-frames), save at a cyan rest-point with `E`, and read a lore object.
- **Self-iteration harness:**
  - Pure, testable `systems/movement.ts` (dash state machine + i-frames) — feel is sacred, so it's
    unit-tested with injected time.
  - `AudioDirector` reactive stem system (base/melody/tension) behind an `AudioBackend` interface
    (`NullAudioBackend` now) — Pillar 2 is a real system from day one.
  - Versioned `SaveSystem` with injected storage + `migrate()` seam.
  - `DebugOverlay` (FPS + real input-latency) and a DOM `DevConsole`
    (`teleport/spawn/give/godmode/reloadzone/zones/goto`).
- Living docs: README, DESIGN (expanded world bible — three regions with one-paragraph environmental
  lore each), ARCHITECTURE, ASSETS, TODO, plus CLAUDE.md for future sessions.

**Why**

Per the seed: scaffolding quality compounds. The first job is a clean data-driven architecture + a
feedback loop, not "a game." Movement/audio/save logic is deliberately decoupled from Phaser so the
things that matter most are deterministically testable.

**Verified**

- `npm test` → 30 passing (movement 11, save 6, audio 4, smoke 9).
- `npm run build` → strict `tsc` clean + Vite production bundle succeeds.
- `npm run lint` → ESLint + Prettier clean.
- `npm run dev` → boots, serves `index.html` and `main.ts` with HTTP 200.

**Decisions**

- Smoke test asserts the boot _contract_ (render constants + content integrity) rather than booting
  WebGL under jsdom (flaky, Phaser default-export interop breaks in Vitest). Canonical "it boots" proof
  is `npm run build` + `npm run dev`. Logged in ARCHITECTURE.md.

**Next** → M1 game feel: tune movement/dash until it feels _good_, add a WebAudio tone backend so
placeholder stems are audible, gamepad support, and a combat dummy to hit. See TODO.md.

---

## 2026-06-18 — Cycle 1: M1 game feel (movement, audio, gamepad) + agent docs

**Built**

- **M1a — feel:** replaced instant velocity with an acceleration/friction momentum model in the pure
  `systems/movement.ts` (accelerate toward target, snappier friction stop; dash still pops instantly
  and its momentum bleeds off through cooldown). Added fading dash afterimage ghosts (light-trail).
- **M1b — audio + input:** `WebAudioToneBackend` synthesizes each ambient stem as an oscillator
  (per-zone root pitch for identity; base/melody/tension = sine/triangle/saw), so the reactive
  base→melody→tension crossfade is now _audible_; resumes AudioContext on first gesture. `InputManager`
  now folds a gamepad (left stick + d-pad, A=dash, B=interact) into the same `MoveInput` snapshot;
  gamepad enabled in the Phaser config.
- **Agent docs:** added `AGENTS.md` as the canonical, tool-agnostic operating manual (Claude Code +
  Codex + others) and slimmed `CLAUDE.md` to point at it, so any agent picks up the same rules.

**Why**

Feel is the sacred M1 foundation (seed M1) — over-invest here. Keeping the momentum model in the pure
module means it stays test-backed while we tune. Pillar 2 wants audio to be a _hearable_ system, not
just state. A single `AGENTS.md` avoids two agent docs drifting apart.

**Verified**

- `npm test` → 32 passing (movement specs updated for the accel model).
- `npm run build` → strict tsc + Vite bundle clean. `npm run lint` → clean.

**Next** → finish M1: camera deadzone/lookahead tuning + a placeholder combat dummy to hit, then begin
M2 (combat core: melee + ranged light attack, enemy telegraph AI, damage/death/respawn).
