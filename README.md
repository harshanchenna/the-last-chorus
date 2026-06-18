# The Last Chorus

A persistent, hand-authored 2D top-down action-adventure where **the world is a dying song**.
Lonely, sacred, decaying — _Hyper Light Drifter_ / _Death's Door_ energy, with fast light-and-blade
combat and reactive, stem-based audio. Not a roguelite: the world is authored, persistent, and saved.

> Status: **Playable MVP demo — complete.** A first run goes title → atmospheric prologue → in-world
> tutorial → two distinct regions (fast light-and-blade combat, telegraphing enemies + multi-phase
> mini-bosses, two Refrains gating exploration incl. a **dash-leap** across a fracture) →
> bittersweet relight/rest altar choices → an **ending that teases the bigger picture**. Plus reactive
> stem-based audio + tonal SFX, a pause/journal, fade transitions, and a versioned save. Everything is
> on programmatic placeholders **except a real player sprite** — proving the asset pipeline drops in
> real art with zero gameplay-code changes. The whole arc is validated by a visual playtest harness
> (`npm run playtest`). (Details below.)

## Quick start (under a minute)

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>). You'll land on the **title screen** —
choose **New Game** (or **Continue** if you have a save).

## Controls

| Action                 | Keys                                  | Gamepad            |
| ---------------------- | ------------------------------------- | ------------------ |
| Move (8-way)           | `WASD` or arrow keys                  | Left stick / d-pad |
| Dash / dodge           | `Space` (i-frames during dash)        | A                  |
| Blade of light (melee) | `J`                                   | X                  |
| Sung light (cast)      | `K`                                   | Y                  |
| Interact               | `E` (save at a rest-point, read lore) | B                  |
| Journal / pause        | `P` or `Esc`                          | Start              |
| Dev console            | `` ` `` (backtick) to toggle          | —                  |

> Status now: **M5 complete — the Ashchoir vertical slice.** A full playable region: distinct biome
> palette + a signature "unraveling" overlay, an **ash-eats-sound** mechanic that quiets the world as you
> push east, an environmental lore trail, an escalating gauntlet (ashling swarm → reliquary-warden heavy
> → the multi-phase mini-boss **The Choirmaster**: strike / radial chord / aimed volley). Pick up the
> **Refrain of the Held Breath** below spawn to open the silence-gate, cross the arena, and continue east
> into the Glass Reliquary. Plus everything before: tile collision, zone transitions, lore panel, light +
> Refrain HUD, melee/ranged light attacks, telegraphing enemies, death + rest-point respawn, dash i-frames.
>
> **M6 in progress** — two contrasting regions with mini-bosses + relight/rest altars, a pause/journal
> menu, and a **second Refrain (the _Refrain of the Leap_)**: grab it in the Glass Reliquary and **dash**
> across the shimmering fracture to reach a sealed memory-vault (a `chasm` gate — the dash is now a key).
>
> **Toward an MVP demo:** a **title screen**, an atmospheric **prologue**, and an in-world **tutorial**
> (one quiet hint per verb) now frame a first-time run as _intro → tutorial → demo_, with floating
> interact prompts for readability. Answer both gods' altars and the demo reaches a bittersweet
> **ending** that teases the bigger picture (the Drowned Hymn, the Chorus still failing).

### Dev console commands

Toggle with `` ` `` then type `help`. Available: `teleport <x> <y>`, `spawn <enemyId>`,
`boss <bossId>`, `defeat <spawnId>`, `give <refrainId>`, `godmode`, `reloadzone`, `zones`,
`goto <zoneId>`.

## Saving / loading

- Walk onto the **cyan rest-point** block and press `E` to save.
- Saves are written to `localStorage` and load automatically on boot.
- Switching zones (`goto` in the dev console) autosaves first.

## Scripts

| Command            | What it does                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `npm run dev`      | Vite dev server with HMR                                                                        |
| `npm run build`    | Strict typecheck (`tsc`) + production bundle                                                    |
| `npm test`         | Vitest logic specs + headless boot-contract smoke test                                          |
| `npm run playtest` | Drive the real game in a headless browser, screenshot + assert (see [`playtest/`](./playtest/)) |
| `npm run lint`     | ESLint + Prettier check                                                                         |
| `npm run format`   | Auto-format with Prettier                                                                       |

## Project docs

- [`brief/`](./brief/) — the founding documents: the original seed prompt & full asset production spec
- [`AGENTS.md`](./AGENTS.md) — operating manual for any coding agent (Claude Code, Codex, …)
- [`DESIGN.md`](./DESIGN.md) — world bible & design decisions
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the code is organized and why
- [`ASSETS.md`](./ASSETS.md) — drop-in-ready art/audio specs
- [`TODO.md`](./TODO.md) — prioritized backlog by milestone
- [`ITERATION_LOG.md`](./ITERATION_LOG.md) — what changed each cycle
