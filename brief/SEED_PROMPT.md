# SEED PROMPT — `The Last Chorus`

> Drop this whole file into Claude Code at the root of an empty repo. It is both the
> project brief and your operating manual. Read all of it before writing any code.
> You are expected to build the project AND the harness that lets you keep improving it.

---

## 0. Meta-instructions (how you, the agent, should operate)

1. **You are building a self-iterating project.** Your first job is not "make a game" — it is to
   stand up a clean, data-driven architecture and a feedback loop so that every subsequent
   iteration is cheap. Scaffolding quality compounds. Invest here.
2. **Vertical slices, never horizontal layers.** Always get to a _playable_ state fast, then deepen.
   A janky-but-playable room beats a beautiful menu with nothing behind it.
3. **Placeholder-first for ALL art and audio** (see §8). Never block gameplay work on assets.
4. **Maintain living docs as you go** (see §6): `ITERATION_LOG.md`, `TODO.md`, `DESIGN.md`,
   `ARCHITECTURE.md`. Update them every iteration. They are your memory across sessions.
5. **After every change, prove it runs.** Keep a smoke test green. If you can't verify it,
   you haven't finished it.
6. When a design decision is ambiguous, make the choice that best serves the **Pillars (§1)**,
   record it in `DESIGN.md` with a one-line rationale, and move on. Don't stall for permission.
7. Keep the name configurable in one constant (`GAME_TITLE = "The Last Chorus"`) — it may change.
8. **Commit often and push to remote constantly.** Treat version control as a safety net, not an
   afterthought. Commit after _every_ working change (small, frequent, well-described commits — not
   giant batches), and `git push` to the remote after each commit or at minimum at the end of every
   iteration cycle. Never let unpushed work pile up; an unpushed iteration is a lost iteration if a
   session dies. If no remote is configured yet, set one up as a first action (see §10).
9. **Stay trivially human-playable at every step.** A person who has never seen the repo must be able
   to clone it and play within a minute, using very few, very clear instructions — ideally just
   `npm install && npm run dev`. Keep the `README.md` quick-start (setup + current controls + how to
   load a save) accurate in the _same commit_ as any change that affects it. `main` on the remote must
   always run cleanly. If a human can't get it running in under a minute, treat that as a bug.

---

## 1. Vision & Pillars

**Elevator pitch:** A persistent, hand-authored 2D top-down action-adventure — _Breath of the Wild's
exploration philosophy compressed into 2D_ — with Dead Cells–grade pixel-art fidelity, fast
light-and-blade magic combat, and a melancholic-mythic atmosphere where **music and mood are the
product**. Closest reference points: _Hyper Light Drifter_, _Death's Door_, _Tunic_.

**This is NOT a roguelite.** No permadeath, no procedural runs. The world is authored, persistent,
and saved. Death returns the player to the last rest-point.

**The five pillars** (every decision serves these):

1. **Atmosphere over exposition.** Lore lives in the environment, item descriptions, and silence —
   never in walls of text. Trust the player to read the world.
2. **The world is a song.** Music and reactive ambient audio are first-class systems, not polish.
   The fiction is literally built from sound (see §2); the audio engine must reflect that.
3. **Fast, expressive, magical combat.** Snappy dodge-driven action (Dead Cells energy) fused with
   light/sung-magic abilities. Responsive feel > realism. Target 60fps, tight input latency.
4. **Exploration & discovery first.** Go-anywhere, come-back-stronger gating via abilities, not walls.
   Reward curiosity. The world beyond combat matters as much as the fights.
5. **Melancholic-mythic tone.** Lonely, sacred, decaying. Dead/sleeping gods, ancient ruins, beauty
   in entropy. Restraint over spectacle.

---

## 2. World Bible (condensed — expand in `DESIGN.md`)

**Premise.** The gods sang the world into being — one endless **Chorus**. For a thousand years the
Chorus has been failing, god by god. Where a god's voice falls silent, the land it held together
comes **unraveled** — collapsing into ash, glass, and silence. The player is one of the last
**Lantern-bearers**, able to carry fragments of the divine song as **light**, crossing the
corpse-geography of the fallen pantheon to relight the sleeping gods — or let them finally rest.

**Why the title.** _The Last Chorus_ is both the gods' dying song and the player's final attempt to
hold it before silence. The name should echo through the fiction and the audio design — not just sit
on the title screen.

**Geography = dead gods.** Each major region is the body/domain of one fallen or sleeping god, with
its own biome, palette, motif, music key, and unraveling-state. Examples to flesh out (invent more):

- _The Glass Reliquary_ — a god of memory; turned to fields of singing glass.
- _Ashchoir_ — a god of fire/grief; smoldering cathedral-forest, embers that hum.
- _The Drowned Hymn_ — a god of tides; flooded ruins where the water still keeps time.

**Player fiction.** Light is both weapon and key. The player gathers **Refrains** (ability/upgrade
fragments) that gate exploration BOTW-style (e.g. a Refrain that lets you cross silence-voids).

**Tone rule.** Endings and choices are bittersweet, not heroic. "Relight" vs "let rest" should feel
like a real moral weight, never a good/evil meter.

---

## 3. Core Gameplay Spec (v1 targets)

- **Camera/perspective:** top-down (slight 3/4 tilt acceptable for readability).
- **Movement:** 8-direction, snappy, with a dash/dodge (i-frames). Feel is sacred — tune this first.
- **Combat:** a light melee (blade of light), a ranged/spell light attack, a dodge, and a slot for
  equippable **Refrains** (abilities). Lock-on optional. Enemies telegraph; player rewarded for reads.
- **Exploration:** interconnected hand-authored rooms/zones (Tiled maps), ability-gated secrets,
  rest-points (save + restore), discoverable lore objects.
- **Progression:** persistent. Refrains + light-capacity + optional cosmetic/relic finds. No XP grind.
- **Save system:** explicit save at rest-points + autosave on zone transition. Serialized to a single
  save object (design it versioned from day one).
- **No combat is also gameplay:** at least one full zone should be traversal/puzzle/atmosphere with
  minimal fighting, to honor Pillar 4.

---

## 4. Tech Stack & Project Setup

- **Engine:** **Phaser 3** (latest stable 3.x).
- **Language:** **TypeScript** (strict mode).
- **Bundler/dev server:** **Vite** (hot module reload — your iteration speed depends on this).
- **Maps:** **Tiled**, exported as JSON, loaded via Phaser's tilemap API.
- **Audio:** Phaser audio or **Howler.js** behind your own `AudioDirector` abstraction (§ pillar 2).
- **Lint/format:** ESLint + Prettier. **Test:** Vitest for logic; a headless smoke test for boot.
- **Target:** desktop browser first (keyboard + gamepad). Mouse optional. Mobile is a non-goal for v1.

Initialize: `npm create vite@latest` (vanilla-ts), add Phaser, set up `tsconfig` strict, a `dev`
script, a `test` script, and a `build` script. Pixel-perfect rendering: disable texture smoothing
(`pixelArt: true` in the Phaser config), integer-scale the canvas.

Write a `README.md` immediately with a dead-simple quick-start (clone → `npm install` → `npm run dev`
→ open the URL) plus the current controls. Keep it to a handful of lines anyone can follow, and update
it whenever setup or controls change.

---

## 5. Architecture Requirements (the self-iteration harness)

Build the game **data-driven** so content can be added/tuned without touching engine code. This is
what makes the project cheap to iterate on later.

- **Data over code.** Entities, enemies, items, Refrains, dialogue, lore entries, and zone metadata
  live in typed data files (`/src/data/*.ts` or JSON with schemas), not hardcoded in scenes.
- **Module structure (suggested):**
  ```
  /src
    /core        # game loop, scene manager, save system, input, config, GAME_TITLE
    /systems     # combat, movement, audio (AudioDirector), camera, interaction, gating
    /entities    # player, enemy base + data-driven definitions
    /world       # zone/tilemap loading, transitions, rest-points
    /data        # enemies, refrains, items, lore, zones, dialogue (the content layer)
    /assets      # see §8 — manifest + placeholders + (later) real art/audio
    /ui          # hud, menus, dialogue renderer
    /dev         # dev console, debug overlays, level inspector, fps/latency readout
    /test        # vitest specs + smoke test
  ```
- **`AudioDirector`** (Pillar 2): supports layered/stem-based ambient tracks that mix reactively to
  zone, tension, and player state. Even with placeholder loops, the _system_ must be real now.
- **Dev tooling:** in-game dev console (toggle key) for teleport, spawn, give-Refrain, godmode,
  reload-zone, and a visible FPS/input-latency readout. You will use this to test yourself.
- **Determinism where possible** so smoke tests are stable.

---

## 6. Self-Iteration Protocol (do this every cycle)

Maintain these files at the repo root and update them each iteration:

- **`ITERATION_LOG.md`** — append-only. Per cycle: what you built, why, what you verified, what's next.
- **`TODO.md`** — prioritized backlog, grouped by milestone (§7). Pull from here each cycle.
- **`DESIGN.md`** — the living game-design doc; expand the World Bible, record design decisions.
- **`ARCHITECTURE.md`** — how the code is organized and why; update when structure changes.
- **`README.md`** — the human's front door: a one-minute quick-start (`npm install && npm run dev`),
  current controls, and how to load a save. Keep it accurate every cycle (see §0.9).

**Each iteration loop:**

1. Pick the highest-value item from `TODO.md` that advances the current milestone.
2. Implement it as a vertical slice.
3. Run lint + tests + smoke test; manually reason through the play feel.
4. Update the docs above (now five — including `README.md` whenever setup or controls changed).
5. **Commit with a clear, descriptive message, then `git push` to the remote.** Don't batch multiple
   features into one commit, and don't end a cycle with unpushed work. Repeat.

If you discover the architecture is fighting you, **stop and refactor** before piling on features —
and log why in `ARCHITECTURE.md`.

---

## 7. Milestone Roadmap (build in this order)

- **M0 — Boot & loop:** Vite + Phaser + TS running; empty zone; player rectangle moves; FPS overlay;
  smoke test green. _Playable = you can walk._
- **M1 — Game feel:** movement + dodge + camera tuned until it feels _good_. This is the foundation;
  over-invest here. Placeholder combat dummy to hit.
- **M2 — Combat core:** melee + ranged light attack + one enemy with telegraph/AI + damage/death +
  rest-point respawn.
- **M3 — Zone & save:** one hand-authored Tiled zone with transitions, rest-points, save/load,
  one lore object, one ability-gated secret.
- **M4 — Refrains & gating:** the ability/upgrade system; one Refrain that opens previously-blocked
  exploration. Prove the BOTW-style loop.
- **M5 — Vertical slice:** one _complete_ region (a dead god's domain) — biome identity, 2–3 enemy
  types, a mini-boss, reactive audio, environmental lore, an entrance and an exit. This is the
  proof-of-concept that sells the whole game.
- **M6+ —** Second region with contrasting tone; dialogue system; the relight-vs-rest choice;
  begin real-asset swap.

Don't advance a milestone until the previous one is genuinely playable and the docs are current.

---

## 8. Placeholder-First Asset Pipeline (critical)

- All art/audio is referenced through an **asset manifest** (`/src/assets/manifest.ts`) that maps
  logical IDs (`player.idle`, `enemy.ashling.walk`, `zone.ashchoir.ambient`) to files.
- Until real assets exist, generate **placeholders programmatically**: distinct flat-color shapes
  sized to final sprite dimensions, color-coded by type; simple tone/loop placeholders for audio.
- Swapping in real art/audio later = drop the file + update the manifest entry. **Zero gameplay-code
  changes.** Enforce this discipline from M0.
- Document required asset specs (dimensions, frame counts, anim names, audio stems) in
  `ASSETS.md` so a human artist or a sprite-generation tool can produce drop-in-ready files.

---

## 9. Constraints & Non-Goals (v1)

- **No** roguelite/procedural systems. **No** multiplayer. **No** monetization hooks. **No** mobile.
- **No** lore dumps or cutscene exposition — honor Pillar 1.
- Keep dependencies minimal and well-justified; log any new dependency in `ARCHITECTURE.md`.
- Don't gold-plate art before the game is fun. Feel and exploration first; beauty swaps in later.
- Never push a broken build to the remote. `main` must always `npm install && npm run dev` cleanly —
  a stranger should be able to clone any commit and play it.

---

## 10. First actions (do these now, in order)

1. **Initialize version control first.** `git init`, add a sensible `.gitignore` (node_modules, dist,
   build artifacts), make an initial commit, and configure a remote (`git remote add origin …`). If
   you can create the remote repo yourself (e.g. via the GitHub CLI `gh repo create`), do so; if not,
   stop and ask the user for a remote URL before proceeding. From here on, commit often and push after
   every cycle (see §0.8).
2. Create `ITERATION_LOG.md`, `TODO.md`, `DESIGN.md`, `ARCHITECTURE.md`, `ASSETS.md` with starter content.
3. Scaffold the Vite + Phaser + TypeScript project with strict mode, pixel-art config, and the
   module structure from §5.
4. Stand up M0: a bootable scene, a movable player placeholder, an FPS/latency overlay, a dev-console
   toggle, and a green smoke test.
5. Expand the World Bible in `DESIGN.md` (name the first three regions, write one paragraph of
   environmental lore each — no exposition dumps).
6. Log everything in `ITERATION_LOG.md`, commit, **push to remote**, then begin the §6 loop toward M1.

Begin.
