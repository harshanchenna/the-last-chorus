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
