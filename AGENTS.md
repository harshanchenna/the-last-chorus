# AGENTS.md

Operating manual for **any** coding agent (Claude Code, Codex, Cursor, etc.) working in this repo.
This is the canonical guide; `CLAUDE.md` points here. Read this before making changes.

## Project

**The Last Chorus** — a persistent, hand-authored 2D top-down action-adventure (Phaser 3 + TypeScript +
Vite) where "the world is a song." Not a roguelite: the world is authored, persistent, and saved.

**New here? Read the founding documents in [`brief/`](./brief/) first** — they are the source of
truth for intent (section references like "seed §8" throughout the docs point there):

- [`brief/SEED_PROMPT.md`](./brief/SEED_PROMPT.md) — the full project brief & operating manual.
- [`brief/ASSET_SPEC.md`](./brief/ASSET_SPEC.md) — the full asset production spec (the in-repo,
  manifest-synced contract is [`ASSETS.md`](./ASSETS.md) at the root).

This is a **self-iterating project**. The first job is always a clean, data-driven architecture and a
tight feedback loop, not raw features. Always get to a _playable_ state, then deepen (vertical slices,
never horizontal layers).

## Setup & commands

Requires Node 22+ and npm.

```bash
npm install      # install deps
npm run dev      # Vite dev server with HMR  → http://localhost:5173
npm test         # Vitest: pure logic specs + headless boot-contract smoke test
npm run build    # strict `tsc --noEmit` + Vite production bundle
npm run lint     # ESLint + Prettier check
npm run format   # Prettier --write
```

**Definition of done for any change — all four must pass, no exceptions:**

```bash
npm test && npm run build && npm run lint
```

…and `npm run dev` must boot cleanly. `main` (and every commit) must let a stranger
`npm install && npm run dev` and play within a minute. Never push a broken build.

For the **visual playtest gate** (`npm run playtest`) you also need a Chromium binary:
`npx playwright install chromium`. The full list of external tool dependencies — core
toolchain, playtest, and the optional asset-generation tools (PixelLab, ElevenLabs) —
lives in **[`TOOLING.md`](./TOOLING.md)**. Keep it current as new tools are adopted.

## How the code is organized

```
src/
  core/      config (GAME_TITLE + tunables), types, game factory, Input, SaveSystem
  systems/   movement (pure), AudioDirector (pure) + WebAudioBackend
  entities/  Player (bridges pure mover ↔ Phaser sprite)
  world/     reserved: Tiled zone loading (M3)
  data/      zones, enemies, refrains, lore  ← the content layer
  assets/    manifest (logical id → file) + programmatic placeholders
  ui/        reserved: HUD/menus/dialogue (M2+)
  dev/       DebugOverlay (FPS/latency), DevConsole
  scenes/    BootScene (gen placeholders), GameScene (the playable slice)
  test/      Vitest specs + boot smoke test
```

See `ARCHITECTURE.md` for the full rationale.

## Core rules (do not violate)

1. **Data over code.** Content (zones, enemies, refrains, lore) lives in `src/data/*`. Never hardcode
   content in a scene. New content = a data edit, no engine change.
2. **Keep logic decoupled from Phaser.** Feel/audio/save logic lives in pure modules
   (`systems/movement.ts`, `systems/AudioDirector.ts`, `core/SaveSystem.ts`) tested with injected
   time/storage. Phaser is a thin shell at the edges (`scenes/`, `entities/`). Don't move tunable logic
   into a scene where it can't be tested.
3. **Placeholder-first assets.** `assets/manifest.ts` maps logical IDs → files; a null `file` means a
   programmatic placeholder at final frame size. Swapping in real art/audio must be a manifest edit
   with **zero gameplay-code changes**. Match the frame/anim/stem names in `ASSETS.md` exactly.
4. **Versioned saves.** Changing `SaveData` means bumping `SAVE_VERSION` and adding a `migrate()` step.
5. **Strict TypeScript.** `noUncheckedIndexedAccess` is on — indexed access is `T | undefined`; handle
   it. No `any` without cause.
6. **Serve the five pillars** (below) when a design call is ambiguous; record the decision in
   `DESIGN.md` with a one-line rationale and move on. Don't stall for permission.

## The five pillars

1. Atmosphere over exposition (lore in the world, never text dumps).
2. The world is a song (audio is a first-class system — see `AudioDirector`).
3. Fast, expressive, magical combat (feel > realism; 60fps, tight latency).
4. Exploration & discovery first (ability-gated via Refrains, not walls).
5. Melancholic-mythic tone (bittersweet, never heroic).

## Iteration protocol (every cycle)

1. Pull the highest-value item from `TODO.md` for the **current** milestone.
2. Implement it as a vertical slice (stay playable).
3. Run `npm test && npm run build && npm run lint`; reason through the play feel.
4. Update the living docs affected — in the **same commit**:
   `ITERATION_LOG.md` (always), `TODO.md`, and any of `DESIGN.md` / `ARCHITECTURE.md` / `README.md` /
   `ASSETS.md` touched.
5. Commit small and descriptive (not giant batches); push after the cycle. Don't leave work unpushed.

If the architecture starts fighting you, stop and refactor before piling on features — and log why in
`ARCHITECTURE.md`.

## Milestone status

Current: **Playable MVP demo complete** (M0–M6 done). Full arc: title → prologue → in-world tutorial →
two regions (combat, mini-bosses, the Refrain BOTW loop incl. the dash-leap) → relight/rest choices →
ending + teaser. Validate with `npm run playtest` (visual harness). Post-MVP work — real art/audio
drop-ins, Glass-native enemies, the Drowned Hymn, CI — is in `TODO.md`; history in `ITERATION_LOG.md`.

## Git conventions

- Work branch: `claude/project-init-6u7x3k`. Commit often; push after each cycle.
- One feature per commit, clear message describing what and why.
- Do not commit `node_modules/`, `dist/`, or other build artifacts (see `.gitignore`).

## Manual playtest checklist

`npm run dev`, then: move with WASD/arrows or a gamepad stick; dash with Space/A (watch for the
light-trail + i-frame readout in the top-left overlay); press `E` on the cyan block to save; press
`` ` `` to open the dev console and try `help`, `goto glass_reliquary`, `spawn ashling`. The audio
crossfade is audible after the first keypress.
