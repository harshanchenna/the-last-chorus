# HANDOFF — The Last Chorus

A pick-up guide for continuing this project in your terminal Claude Code (or by hand). Written
2026-06-18 at the end of an autonomous build session that took the project from an empty repo through
**M0–M6 (both regions complete)**.

> **TL;DR:** `npm install && npm run dev`. Everything is committed and pushed to
> `claude/project-init-6u7x3k`. 67 tests green, build + lint clean. Read `AGENTS.md` for the operating
> rules, then pull the next item from `TODO.md`.

---

## 1. What this is

**The Last Chorus** — a persistent, hand-authored 2D top-down action-adventure (Phaser 3 + TypeScript +
Vite) where "the world is a song." Melancholic-mythic tone, fast light-and-blade combat, BOTW-style
ability gating, reactive stem-based audio. Not a roguelite — the world is authored, persistent, saved.

The full brief is the seed prompt (`thelastchorusseedprompt.md`) and asset contract (`ASSETS.md`). The
**operating manual is [`AGENTS.md`](./AGENTS.md)** — read it before changing anything; `CLAUDE.md`
points there too.

## 2. Current status (what's built)

Milestones **M0 → M6** are done; the game is playable end-to-end through two complete regions.

| Milestone                    | State | What landed                                                                                                                                                             |
| ---------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 Boot & loop               | ✅    | Vite+Phaser+TS strict, pixel-art 480×270, FPS/latency overlay, dev console, smoke test                                                                                  |
| M1 Game feel                 | ✅    | Accel/friction movement, dash + i-frames + light-trail, gamepad, audible reactive stems, camera deadzone                                                                |
| M2 Combat core               | ✅    | Melee + ranged light attacks, telegraphing enemy AI, health/light, death → rest-point respawn, light-meter HUD                                                          |
| M3 Zone & save               | ✅    | Tile geometry + collision, zone transitions, ability-gated silence-void, lore panel, content-integrity tests                                                            |
| M4 Refrains & gating         | ✅    | In-world Refrain pickup, save v2, HUD refrain slot, full BOTW loop with no dev commands                                                                                 |
| M5 Vertical slice (Ashchoir) | ✅    | Biome identity + "unraveling" overlay, **ash-eats-sound**, enemy gauntlet, lore trail, multi-phase **Choirmaster** boss                                                 |
| M6 Second region & choices   | ✅    | Relight-vs-rest choice (save v3), pause/journal menu, **real-asset loader pipeline**, dialogue system + wisp NPC, Glass Reliquary boss + altar (**The Reliquary Echo**) |

**Numbers:** 16 commits, ~30 source modules, 67 passing tests, 9 test files.

### The intended playthrough (try this first)

1. `npm run dev`, open the URL. You start in **Ashchoir** (warm, ashen).
2. Walk **down** from spawn — pick up the **Refrain of the Held Breath** (the glowing fragment).
3. The purple **silence-gate** in the chancel doorway (east) is now open. As you head east the music
   literally quiets ("ash eats sound").
4. Fight the **ashling swarm** + a **reliquary-warden** (heavy, slow telegraph), then the multi-phase
   mini-boss **The Choirmaster**. Watch the boss bar's phase name change as it weakens.
5. Step on the now-lit **altar** and press `E` → choose **[J] relight** or **[K] let rest** (persists).
6. Continue east through the **exit** into the **Glass Reliquary** (cold, memory). Talk to the **wisp**
   (press `E`), fight **The Reliquary Echo** (ranged), and find its altar.
7. `P` / `Esc` opens the **journal** (Refrains, lore, choices). `` ` `` opens the **dev console**
   (`help`, `goto <zone>`, `boss <id>`, `give <refrain>`, `godmode`, `teleport x y`).

## 3. Run / verify

Requires Node 22+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 67 tests (pure logic + boot-contract smoke)
npm run build    # strict tsc --noEmit + Vite bundle
npm run lint     # ESLint + Prettier check
npm run format   # Prettier --write
```

**Definition of done for any change (no exceptions):** `npm test && npm run build && npm run lint` all
green, and `npm run dev` boots cleanly. Never push a broken build.

## 4. Architecture in 60 seconds

The golden rule: **pure logic is decoupled from Phaser** so feel/audio/save/AI are unit-tested
deterministically; Phaser is a thin shell at the edges. **Content is data, not code** — new
zones/enemies/bosses/lore/NPCs are edits under `src/data/`, no engine change.

```
src/
  core/      config (GAME_TITLE + all tunables), types, game factory, Input, SaveSystem
  systems/   PURE + TESTED: movement, health, enemyAI, bossAI, AudioDirector (+ WebAudioBackend)
  entities/  Player, Enemy, Boss  (bridge pure logic ↔ Phaser sprites)
  world/     mapgen (pure tile grids), ZoneMap (Phaser tilemap), Unraveling (decay FX)
  data/      zones, maps, enemies, bosses, refrains, lore, npcs  ← THE CONTENT LAYER
  assets/    manifest (logical id → file), placeholders (programmatic), loader (real-file planning)
  ui/        Hud, BossBar, DialoguePanel, PauseMenu
  dev/       DebugOverlay (FPS/latency), DevConsole
  scenes/    BootScene (preload real assets + gen placeholders), GameScene (wires everything)
  test/      vitest specs + boot-contract smoke test
```

`GameScene.ts` is the one big file (~700 lines) that orchestrates the playable loop. It's intentionally
"wiring only" — if you find yourself adding _content_ there, it probably belongs in `src/data/`.

Key design decisions are logged in `ARCHITECTURE.md` (e.g. why the smoke test doesn't boot WebGL).

## 5. How to do common tasks

- **Add an enemy:** add a def to `src/data/enemies.ts` (incl. `telegraphMs` + AI ranges) and a sprite
  entry to `src/assets/manifest.ts`; place it via a zone's `enemySpawns`. No scene code.
- **Add a boss:** add a def to `src/data/bosses.ts` (phases must descend by `healthAbove` and end at 0)
  - a manifest sprite; place via a zone's `bosses`; optionally add an `altar` with its `bossSpawnId`.
- **Add a zone:** add to `src/data/zones.ts` (+ a `MapSpec` in `src/data/maps.ts`); wire it via another
  zone's `exits`. A tinted tileset is auto-generated from `tilePalette`.
- **Add lore / an NPC:** entry in `src/data/lore.ts` / `src/data/npcs.ts`, then place via the zone's
  `loreObjects` / `npcs`.
- **Swap in a real art/audio file (the big promise):** drop the file in `public/assets/`, set the
  manifest entry's `file` from `null` to the path (sprite `frame` must match). `BootScene.preload()`
  loads it; no gameplay-code change. Procedure + naming in `ASSETS.md §"How to drop in a real asset"`;
  the planning logic is unit-tested in `src/test/loader.test.ts`. **Not yet exercised with a real
  binary** — shipping one file end-to-end is the top "prove it" item.
- **Change the save shape:** bump `SAVE_VERSION` in `core/config.ts` and add defaulting in
  `migrate()` (`core/SaveSystem.ts`); add a migration test. Currently at **v3**
  (`pickups`, `defeatedBosses`, `choices`).

## 6. Recommended next steps (from `TODO.md`)

1. **Ship one real asset file** end-to-end (e.g. a real `player` spritesheet) to visually prove the
   loader path — closes the last gap in the placeholder-first promise.
2. **Second Refrain (`light_dash`)** + a path gated on it, to extend the BOTW loop with a new grant
   type (the union already exists in `data/refrains.ts`).
3. **CI**: a GitHub Action running `test + build + lint` on push (there is none yet).
4. **Drowned Hymn** as the no-combat traversal/puzzle region (Pillar 4 — currently a stub zone).
5. **Bundle size**: the build is ~1.5 MB (all Phaser); add `manualChunks` / a slimmer Phaser build
   before any real ship.

## 7. Gotchas / things to know

- **Vitest can't boot Phaser.** Phaser's default-export interop breaks under Vitest and WebGL won't run
  in jsdom, so the smoke test asserts the boot _contract_ (constants + content integrity) and the real
  "it boots" proof is `npm run build` + `npm run dev`. Don't try to `new Phaser.Game()` in a test.
- **Keep tunable logic in `systems/`**, not in `GameScene`. If it affects feel/combat/audio/save and
  isn't tested, it's in the wrong place.
- **Content guards in `src/test/smoke.test.ts`** catch data wiring mistakes (exit→zone, gate→refrain,
  pickup-before-its-gate, boss phases ordered, altar→boss-exists, lore/enemy/npc refs). Add to these
  when you add a new cross-reference — they're cheap insurance.
- **Audio needs a user gesture** (browser autoplay): the `WebAudioToneBackend` resumes on first
  key/pointer. Silent until you press something — that's expected.
- The bundle-size warning on `npm run build` is just Phaser; it's not an error.

## 8. Git / branch state

- **Branch:** `claude/project-init-6u7x3k` (pushed, up to date). Per the project rules, keep working on
  this branch; don't push elsewhere without explicit permission. No PR has been opened.
- **Working tree:** clean at handoff (this doc is the only new file in its own commit).
- Commit style here: one milestone-slice per commit, descriptive body. Continue that cadence — small,
  frequent, pushed every cycle. (The session's commit trailer lines are session-specific; use your own.)

## 9. The five pillars (let these break ties)

1. Atmosphere over exposition (lore in the world, never text dumps).
2. The world is a song (audio is a first-class system — `AudioDirector`).
3. Fast, expressive, magical combat (feel > realism; telegraph-and-read).
4. Exploration & discovery first (ability-gated via Refrains, not walls).
5. Melancholic-mythic tone (bittersweet, never heroic).

## 10. Doc map

`AGENTS.md` (rules — read first) · `ITERATION_LOG.md` (full per-cycle history) · `TODO.md` (backlog by
milestone) · `DESIGN.md` (world bible, regions, bosses, decisions) · `ARCHITECTURE.md` (why the code is
shaped this way) · `ASSETS.md` (drop-in asset contract) · `README.md` (player-facing quick start).

Welcome back — the world is still singing. Pick up `TODO.md`, run the verify gate, and keep iterating.
