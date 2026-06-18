# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**The Last Chorus** — a persistent 2D top-down action-adventure (Phaser 3 + TypeScript + Vite) where
"the world is a song." It is a **self-iterating project**: the seed brief (`thelastchorusseedprompt.md`)
is the operating manual. Read `ITERATION_LOG.md`, `TODO.md`, and `DESIGN.md` before starting a cycle —
they are the memory across sessions.

## Commands

```bash
npm run dev      # Vite dev server (HMR) — the iteration loop
npm test         # Vitest: pure logic specs + headless boot-contract smoke test
npm run build    # strict tsc --noEmit + Vite production bundle (the canonical "it boots" proof)
npm run lint     # ESLint + Prettier check
npm run format   # Prettier --write
```

**Before committing, all four must be green:** `npm test`, `npm run build`, `npm run lint`. The dev
server must boot cleanly — `main` must always `npm install && npm run dev` for a stranger.

## Architecture (see ARCHITECTURE.md for detail)

- **Data-driven.** Content (zones, enemies, refrains, lore) lives in `src/data/*` — never hardcode it
  in a scene. New content = a data edit, not engine code.
- **Pure logic is decoupled from Phaser.** `systems/movement.ts` (dash state machine) and
  `systems/AudioDirector.ts` (reactive stem mixing) are unit-tested with injected time/storage. Keep
  feel/audio/save logic testable; let Phaser be a thin shell in `scenes/` and `entities/`.
- **Placeholder-first assets.** `assets/manifest.ts` maps logical IDs → files; null `file` = a
  programmatic placeholder at final frame size. Swapping in real art must be a **manifest edit with
  zero gameplay-code changes**. Enforce this.
- **Versioned saves.** `core/SaveSystem.ts` — bump `SAVE_VERSION` and add migration when `SaveData`
  changes.

## The five pillars (every decision serves these)

1. Atmosphere over exposition (no text dumps — lore in the world).
2. The world is a song (audio is a first-class system).
3. Fast, expressive, magical combat (feel > realism; 60fps, tight latency).
4. Exploration & discovery first (ability-gated, not walls).
5. Melancholic-mythic tone (bittersweet, never heroic).

## Iteration protocol (every cycle)

1. Pull the highest-value item from `TODO.md` for the current milestone.
2. Implement it as a **vertical slice** (stay playable).
3. Run test + build + lint; reason through the play feel.
4. Update `ITERATION_LOG.md`, `TODO.md`, and any of `DESIGN.md` / `ARCHITECTURE.md` / `README.md`
   affected — in the **same commit**.
5. Commit (small, descriptive — not giant batches) and push.

## Conventions

- TypeScript strict; respect `noUncheckedIndexedAccess` (index access is `T | undefined`).
- Don't add dependencies without logging the justification in `ARCHITECTURE.md`.
- Keep `GAME_TITLE` and tunable constants in `core/config.ts`.
- Branch for this work: `claude/project-init-6u7x3k`. Commit often, push after each cycle.
