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

> Status now: **M5 complete — the Ashchoir vertical slice.** A full playable region: distinct biome
> palette + a signature "unraveling" overlay, an **ash-eats-sound** mechanic that quiets the world as you
> push east, an environmental lore trail, an escalating gauntlet (ashling swarm → reliquary-warden heavy
> → the multi-phase mini-boss **The Choirmaster**: strike / radial chord / aimed volley). Pick up the
> **Refrain of the Held Breath** below spawn to open the silence-gate, cross the arena, and continue east
> into the Glass Reliquary. Plus everything before: tile collision, zone transitions, lore panel, light +
> Refrain HUD, melee/ranged light attacks, telegraphing enemies, death + rest-point respawn, dash i-frames.

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
