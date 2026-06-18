# The Last Chorus

A persistent, hand-authored 2D top-down action-adventure where **the world is a dying song**.
Lonely, sacred, decaying — _Hyper Light Drifter_ / _Death's Door_ energy, with fast light-and-blade
combat and reactive, stem-based audio. Not a roguelite: the world is authored, persistent, and saved.

> Status: **M0–M1 complete, M2 (combat) underway** — boots to a playable bounded room: walk + dash
> (acceleration model, light-trail, i-frames), audible reactive ambient audio, gamepad support, melee +
> ranged light attacks, telegraphing enemies, a light-meter HUD, death + rest-point respawn, rest-point
> save, a lore object, an FPS/latency overlay, and an in-game dev console. Everything renders on
> programmatic placeholders; real art/audio drop in via the asset manifest later.

## Quick start (under a minute)

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

## Controls

| Action                 | Keys                                  | Gamepad            |
| ---------------------- | ------------------------------------- | ------------------ |
| Move (8-way)           | `WASD` or arrow keys                  | Left stick / d-pad |
| Dash / dodge           | `Space` (i-frames during dash)        | A                  |
| Blade of light (melee) | `J`                                   | X                  |
| Sung light (cast)      | `K`                                   | Y                  |
| Interact               | `E` (save at a rest-point, read lore) | B                  |
| Dev console            | `` ` `` (backtick) to toggle          | —                  |

> Status now: **M2 (combat core) in progress** — light meter HUD, melee + ranged
> light attacks, ashling enemies that telegraph before they strike, damage/death,
> and rest-point respawn. Dash i-frames let you dodge through a telegraphed hit.

### Dev console commands

Toggle with `` ` `` then type `help`. Available: `teleport <x> <y>`, `spawn <enemyId>`,
`give <refrainId>`, `godmode`, `reloadzone`, `zones`, `goto <zoneId>`.

## Saving / loading

- Walk onto the **cyan rest-point** block and press `E` to save.
- Saves are written to `localStorage` and load automatically on boot.
- Switching zones (`goto` in the dev console) autosaves first.

## Scripts

| Command          | What it does                                           |
| ---------------- | ------------------------------------------------------ |
| `npm run dev`    | Vite dev server with HMR                               |
| `npm run build`  | Strict typecheck (`tsc`) + production bundle           |
| `npm test`       | Vitest logic specs + headless boot-contract smoke test |
| `npm run lint`   | ESLint + Prettier check                                |
| `npm run format` | Auto-format with Prettier                              |

## Project docs

- [`AGENTS.md`](./AGENTS.md) — operating manual for any coding agent (Claude Code, Codex, …)
- [`DESIGN.md`](./DESIGN.md) — world bible & design decisions
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the code is organized and why
- [`ASSETS.md`](./ASSETS.md) — drop-in-ready art/audio specs
- [`TODO.md`](./TODO.md) — prioritized backlog by milestone
- [`ITERATION_LOG.md`](./ITERATION_LOG.md) — what changed each cycle
