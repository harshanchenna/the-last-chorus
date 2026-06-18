# Architecture

The project is built **data-driven** so content can be added/tuned without touching engine code
(seed §5). Scaffolding quality compounds — this is the self-iteration harness.

## Tech stack

- **Phaser 3** (arcade physics) — rendering, input, scenes.
- **TypeScript**, strict mode (`tsconfig.json` turns on `noUncheckedIndexedAccess`, `noImplicitOverride`, etc.).
- **Vite** — dev server (HMR) + production bundler.
- **Vitest** (+ jsdom available) — logic specs and the headless boot-contract smoke test.
- **ESLint + Prettier** — lint/format.

Dependencies are intentionally minimal. New ones get logged here with justification.

## Layered design

The golden rule: **pure logic is decoupled from Phaser** so the things that matter most — game feel,
audio mixing, save integrity — are unit-tested deterministically. Phaser is a thin rendering/physics
shell at the edges.

```
src/
  core/        config, types, game factory, Input wrapper, SaveSystem
  systems/     movement (pure), AudioDirector (pure + backend abstraction)
  entities/    Player (bridges pure mover ↔ Phaser sprite)
  world/       (reserved for Tiled zone loading — M3)
  data/        zones, enemies, refrains, lore  ← the content layer
  assets/      manifest (logical id → file) + programmatic placeholders
  ui/          (reserved for HUD/menus/dialogue — M2+)
  dev/         DebugOverlay (FPS/latency), DevConsole
  scenes/      BootScene (gen placeholders), GameScene (the playable slice)
  test/        vitest specs + boot smoke test
```

### Why these boundaries

- **`systems/movement.ts` is pure.** `stepMover(state, input, dtMs)` takes injected time, so the
  dash state machine + i-frames are tested without a browser. Feel is sacred (seed M1); it must be
  testable.
- **`AudioDirector` owns mixing logic, not playback.** It talks to an `AudioBackend` interface
  (`NullAudioBackend` for tests/headless; a WebAudio backend lands next). This keeps Pillar 2's
  reactive stem system real and verifiable from day one even on placeholder audio.
- **`SaveSystem` takes an injected `KeyValueStore`** (`MemoryStore` in tests, `localStorage` in the
  browser) and is **versioned from day one** with a `migrate()` seam.
- **`assets/manifest.ts` is the only place asset IDs map to files.** Until a `file` is non-null, the
  engine builds a programmatic placeholder at the exact final frame size. Swapping real art = a
  manifest edit, **zero gameplay-code changes** (seed §8). This discipline is enforced from M0.
- **`data/*` is content, not code.** Scenes read zones/enemies/refrains/lore from here; nothing is
  hardcoded in a scene. New content needs no scene changes.

### Boot flow

`main.ts` → `createGameConfig()` (`core/game.ts`, pixel-art + 480×270 internal res) →
`BootScene` (generate placeholder textures) → `GameScene` (load zone, spawn player, wire systems +
dev tools).

## Testing strategy

`npm test` runs **pure** specs (movement, audio, save) + a **boot-contract** smoke test that asserts
the render contract and content-layer coherence. Booting WebGL under jsdom is flaky and proves little,
so the real boot proof is `npm run build` (full Vite/Phaser bundle) + `npm run dev`. CI-of-record =
`npm test && npm run build && npm run lint` all green.

## Decisions log

- **2026-06-18** — Phaser default-export interop is broken under Vitest; rather than shim WebGL in
  jsdom, the smoke test asserts pure boot-contract constants and content integrity, and the build step
  is the canonical "it boots" proof. Keeps tests fast and deterministic.
- **2026-06-18** — Movement implemented as a pure state machine (`MoverState`) rather than inside the
  Player/scene, specifically so M1 feel-tuning is test-backed.
