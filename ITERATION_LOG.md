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

---

## 2026-06-18 — Cycle 2: M1 close-out + M2 combat core

**Built**

- **M1c:** camera deadzone (40×28) + round-pixels for crisp, non-jittery top-down framing. M1 closed.
- **M2 — combat core** (the milestone where it becomes a game):
  - Pure `systems/health.ts` (clamp/damage/heal, lethality) and `systems/enemyAI.ts` (idle → chase →
    **telegraph** → attack → recover state machine; the strike opens for exactly one frame when the
    wind-up completes). Both fully unit-tested.
  - `entities/Enemy.ts` bridges those to a data-driven Phaser sprite: chase/lunge motion, a bright
    "swell + flash" telegraph tell, a hurt flash, a damage-only HP pip, and death motes (fx.death_motes).
  - Player gained light/health, hit i-frames (with a blink), `takeDamage`/`restoreLight`, and an
    `aimVector` from facing. Melee = an arc hitbox ahead of the player (blade-of-light); cast = a
    travelling sung-light mote that damages the first enemy it meets. Camera shake/flash juice.
  - `ui/Hud.ts` light meter — reads as light filling/draining (never a red bar; asset spec §5).
  - Death returns to the last rest-point (reposition + refill, or reload the saved zone); rest-points
    now also restore light. Live enemies drive `AudioDirector.setTension`, so the tension stem swells
    in combat and fades after a clear.
  - Inputs: `J`/gamepad-X melee, `K`/gamepad-Y cast, folded into `InputManager`.

**Why**

Combat is Pillar 3. Keeping health + AI as pure modules means the telegraph timing and damage math are
test-backed and tunable without the engine. Telegraph-as-a-state makes "reward the read" real: you can
dash (i-frames) through a wind-up.

**Verified**

- `npm test` → 42 passing (added health 4, enemyAI 6; movement now 13).
- `npm run build` → strict tsc + Vite bundle clean. `npm run lint` → clean.

**Next** → M3: load a hand-authored **Tiled** zone (real geometry/collision) with transitions, more
rest-points, a proper lore-reveal panel, and an ability-gated secret. Then M4 Refrains.

---

## 2026-06-18 — Cycle 3: M3 zone & save (geometry, transitions, gating, lore panel)

**Built**

- **M3a — geometry:** `world/mapgen.ts` (pure) expands a compact MapSpec (border + wall rectangles)
  into a tile grid; `data/maps.ts` hand-authors each zone (ashchoir nave w/ pillars + chancel doorway,
  glass shards, drowned sunken walls); `world/ZoneMap.ts` builds a Phaser tilemap + wall collision from
  the grid (placeholder tileset). Player + enemies now collide with walls; bounds derive from the map.
- **M3b — transitions:** data-driven `exits` per zone; walking onto one autosaves and loads the target
  zone. Ashchoir ⇄ Glass Reliquary are now connected and traversable.
- **M3c — gating + lore:** data-driven `gates` (silence-voids) that physically block passage until the
  required Refrain is owned; gaining a Refrain (`give` in the dev console) opens the gate live and
  persists, revealing a secret lore object beyond it — the BOTW come-back-stronger loop in miniature.
  New `ui/DialoguePanel` shows lore as a quiet muted panel (Pillar 1) instead of a flash; collected
  lore + refrains persist to the save.
- Content-integrity tests: every exit→real zone, every gate→real Refrain, every lore object→real entry,
  every spawn/rest-point on ground.

**Why**

M3 turns the "rooms" into an actual connected, gated world (Pillar 4) with persistence (seed §3).
Keeping geometry/transitions/gates as data (not scene code) means new rooms are content edits; the
Tiled JSON swap later reuses the same `ZoneMap` loader.

**Verified**

- `npm test` → 51 passing (mapgen 6, +3 content-integrity). Build + lint clean. Boots HTTP 200.

**Try it:** `give first_refrain` in the dev console (`` ` ``), walk through the now-open chancel gate to
the candle, then continue east to cross into the Glass Reliquary.

**Next** → M4: an in-world Refrain pickup entity + equip slot/HUD icon, and a second gate using a
different grant. Then M5 (full Ashchoir vertical slice: mini-boss, biome identity).

---

## 2026-06-18 — Cycle 4: M4 Refrains & gating

**Built**

- In-world **Refrain pickup**: a bobbing light-fragment placed (data-driven, per zone) on the near side
  of the silence-gate it opens. Walking into it grants the Refrain with a mote-burst + flash
  (fx.refrain_pickup), opens the gate live, and **persists** so it never respawns.
- Save format **v1 → v2**: added `pickups: string[]` with a tested migration (old saves load and
  upgrade; collected pickups + refrains survive death).
- HUD **Refrain slot**: a small framed icon + equipped name/count above the light meter
  (asset spec ui.refrain_slot).
- This closes the loop end-to-end **without dev commands**: from a fresh save you can find the Refrain,
  watch the chancel silence-void open, claim the secret candle, and cross east into the Glass Reliquary.
- Tests: save migration v1→v2; a soft-lock guard asserting every gate-opening pickup sits on the
  reachable side of its gate.

**Why**

M4's point is the BOTW "come back stronger" loop as a _played_ experience, not a dev toggle. Versioning
the save now (with a real migration) keeps the day-one promise that the format can grow safely.

**Verified**

- `npm test` → 53 passing. Build + lint clean. Boots HTTP 200.

**Next** → M5: the Ashchoir vertical slice — biome identity (tileset tint + an "unraveling/ash eats
sound" overlay), 2–3 enemy types, a multi-phase mini-boss, reactive audio + lore trail end-to-end. The
proof-of-concept that sells the game.

---

## 2026-06-18 — Cycle 5: M5a/b — biome identity + the Choirmaster mini-boss

**Built**

- **M5a — biome identity:** each zone declares a tile palette + an unraveling type; BootScene generates
  one tinted tileset per region (warm char / cold glass / teal tide). `world/Unraveling.ts` adds the
  signature decay overlay as a camera-fixed particle drift (embers rising, glints sifting, tidal drift).
- **M5b — the mini-boss:** pure `systems/bossAI.ts` — a multi-phase state machine. Phases are chosen by
  health fraction and change telegraph timing, move speed, and which attack patterns are available;
  pattern choice cycles deterministically (testable). `data/bosses.ts` defines **The Choirmaster**
  (260 HP, phases Adagio→Crescendo→Finale). `entities/Boss.ts` resolves it to a 64×64 sprite with a
  phase-scaled telegraph tell + big death-mote burst. The scene resolves the three patterns: **strike**
  (melee), **radial** (a 12-shot chord ring), **volley** (3 aimed sung-light notes); enemy projectiles
  now exist and damage the player. New `ui/BossBar` shows boss light + current phase. A boss fight
  pins audio tension to full. Placed in Ashchoir's eastern hall beyond the silence-gate; also
  summonable via the dev console `boss <id>` command.
- Tests: bossAI phase selection + telegraph→pattern cycling + single-frame damage window; content guard
  that placed bosses reference real defs with correctly-ordered phases.

**Why**

The mini-boss is the part of M5 that "sells the game" (seed M5). Multi-phase telegraphs are the depth
ceiling of Pillar 3 — keeping the phase machine pure means the escalation curve is tuned with tests, not
playtests alone.

**Verified**

- `npm test` → 58 passing (bossAI 5 + content guard). Build + lint clean. Boots HTTP 200.

**Try it:** `give first_refrain`, cross the gate east, and fight the Choirmaster — or `boss
miniboss_choirmaster` to summon it anywhere. Watch the phase name on the boss bar change as it weakens.

**Next** → finish M5: a second/third enemy type live in Ashchoir, an environmental lore trail framing
the arena, and the "ash eats sound" audio-dampening showcase. Then M6 (second region, dialogue,
relight-vs-rest choice, real-asset swap).

---

## 2026-06-18 — Cycle 6: M5c — completing the Ashchoir slice

**Built**

- **"Ash eats sound"** (Pillar 2 showcase): `AudioDirector.setSilence(0..1)` scales every stem's
  audible output down (raw mix preserved). The scene ramps silence up as the player pushes east into
  Ashchoir's unraveling, so the dying god's held note is nearly swallowed by the time you reach the
  arena — the world literally goes quiet. Unit-tested with a recording backend.
- **Enemy variety + gauntlet:** enemy placement is now data-driven (`enemySpawns` per zone). Ashchoir
  has an ashling swarm by the nave and a heavier `reliquary_warden` sentinel guarding the gated arena
  (two genuinely different combat reads: fast swarm vs slow heavy telegraph). The Drowned Hymn is left
  enemy-free as the traversal/atmosphere zone (Pillar 4). Full roster is now manifest-ready (placeholders
  for tideborn + warden).
- **Lore trail** east toward the arena (burnt hymnal → choir stalls → the secret candle), so the region
  tells its story environmentally (Pillar 1).
- Content guard: every placed enemy references a real def.

**Why**

This closes M5 — the Ashchoir vertical slice now has biome identity, escalating combat (swarm → heavy →
multi-phase boss), an environmental narrative, and the signature audio mechanic. It's the proof-of-concept
that sells the whole game (seed M5).

**Verified**

- `npm test` → 60 passing. Build + lint clean. Boots HTTP 200.

**Next** → M6: develop the Glass Reliquary as a contrasting region, a dialogue system + rare wisp, and
the bittersweet relight-vs-rest choice (Pillar 5); begin the real-asset swap to prove the manifest
pipeline end-to-end.

---

## 2026-06-18 — Cycle 7: M6a — the relight-vs-rest choice (Pillar 5)

**Built**

- The thematic heart of the game: after the Choirmaster falls, a **god's altar** wakes at the dais.
  Standing on it and interacting offers a real moral weight — **[J] relight** the god or **[K] let it
  rest** — never good/evil (Pillar 5). Either way the flavor is bittersweet; the choice persists and the
  altar afterward shows the epitaph of what you chose.
- **Save v3:** added `defeatedBosses` (bosses stay dead; the world is persistent) and `choices`
  (altarId → 'relight' | 'rest'), with a tested v1→v3 forward migration.
- Boss-defeat detection in the scene records the kill + wakes the matching altar (soft pulsing light to
  draw the player in). A small camera effect differentiates the two endings (a warm flash vs a kind
  fade to deeper quiet).
- Content guard: every altar waits on a boss that actually exists in its zone.

**Why**

Pillar 5 — "Relight vs let rest should feel like a real moral weight, never a good/evil meter." This is
the emotional core the whole fiction builds toward, so it ships as a complete, persistent, in-world
choice rather than a menu.

**Verified**

- `npm test` → 62 passing (save v3 migration + altar content guard added). Build + lint clean. Boots
  HTTP 200.

**Try it:** beat the Choirmaster (or `boss miniboss_choirmaster`, then defeat it), step onto the
altar that lights up, and press `E` — then choose with `J` / `K`.

**Next** → continue M6: a dialogue system + a rare wisp NPC, a pause/inventory menu (collected lore +
Refrains + your choices), and the first real-asset swap through the manifest.

---

## 2026-06-18 — Cycle 8: M6b — pause/journal menu

**Built**

- `ui/PauseMenu` — a quiet journal overlay (P / Esc, or gamepad Start) that surfaces what the player has
  gathered: Refrains (with their lore descriptions), lore fragments collected, and the choices made at
  the gods' altars. Reading it is part of the atmosphere (Pillar 1), so it stays sparse and reverent.
- Opening it freezes the game (player + enemies + bosses halt); the debug overlay keeps updating so FPS
  is still visible. `pausePressed()` added to InputManager (keyboard + gamepad Start).

**Why**

The world accumulates meaning — Refrains, lore, irreversible choices — and the player needs a calm place
to see it without leaving the world. It also makes the persistent save legible in-game.

**Verified**

- `npm test` → 62 passing. Build + lint clean. Boots HTTP 200.

**Next** → flesh out the Glass Reliquary as a contrasting second region (cold/memory, low-swarm) with
its own foes + altar, a rare wisp NPC + dialogue, and the first real-asset swap through the manifest.

---

## 2026-06-18 — Cycle 9: M6c — real-asset loader pipeline (de-risking seed §8)

**Built**

- Closed the gap in the placeholder-first promise: until now nothing actually _loaded_ a real file, so
  "drop a file + one-line manifest edit = zero gameplay-code changes" was unverified. Added
  `assets/loader.ts` (pure) that plans the load list from the manifest — sprites/audio with a non-null
  `file` — and wired `BootScene.preload()` to load them via Phaser. Entries still `null` fall back to
  programmatic placeholders (that path already existed).
- Layered ambient beds: one base path in the manifest, the loader derives the three stem files by
  suffix (`..._base/_melody/_tension`) and registers them as `<id>.<stem>` keys; `one_shot` tracks load
  as a single file. Matches the asset-spec naming contract.
- Documented the exact 3-step swap procedure in `ASSETS.md`.

**Why**

The whole project rests on the placeholder-first pipeline (seed §8, "critical"). Making the real-load
path real + unit-tested means an artist/audio drop-in genuinely needs no code change — the core
architectural promise is now verified, not aspirational.

**Verified**

- `npm test` → 66 passing (loader 4 added: skips placeholders, derives stem files, one-shots, and a
  guard that the shipped manifest is still all-placeholder). Build + lint clean. Boots HTTP 200.

**Next** → the Glass Reliquary as a contrasting region (own foes + altar), a rare wisp NPC + dialogue,
then ship one actual asset file end-to-end to close the loop visually.

---

## 2026-06-18 — Cycle 10: M6d — dialogue system + a rare wisp NPC

**Built**

- A **multi-line dialogue system**: `startDialogue(title, lines)` shows lines one at a time and Interact
  advances (then closes). Lore and altar epitaphs now route through it too, so all in-world text shares
  one path.
- `data/npcs.ts` + a placed **wisp** in the Glass Reliquary — a rare, quiet figure (asset spec §3.3)
  that shimmers faintly and speaks four bittersweet fragments about being a forgotten verse (Pillar 1:
  atmosphere, never exposition). NPC sprite added to the manifest (placeholder-ready).
- Content guard: every placed NPC references a real def.

**Why**

M6's dialogue system + the first NPC give the world a voice without breaking the "no exposition dumps"
rule — short fragments, advanced at the player's pace, from a figure who is itself a piece of the
unraveling.

**Verified**

- `npm test` → 67 passing (NPC content guard added). Build + lint clean. Boots HTTP 200.

**Try it:** `goto glass_reliquary` (or cross east through Ashchoir) and press `E` by the pale wisp near
the western wall.

**Next** → give the Glass Reliquary its own boss + altar (a god of memory) to make it a full second
region, then ship one real asset file end-to-end.

---

## 2026-06-18 — Cycle 11: M6e — the Glass Reliquary as a full second region

**Built**

- **The Reliquary Echo** — the Glass Reliquary's mini-boss (a god of memory's last reflection), added as
  pure data + a manifest sprite. Deliberately contrasts the Choirmaster: ranged-heavy, keeps its
  distance, phases **Recollection → Distortion → Shatter** trading telegraph length for volley density.
  Reuses the entire generic boss system — a new boss is a data edit, no engine change.
- A **god-of-memory altar** in the Glass Reliquary with its own bittersweet relight-vs-rest choice, so
  the second region has the same emotional climax as the first (Pillar 5). The boss-defeat message is
  now generic (uses the boss's name) rather than Choirmaster-specific.
- The existing content guards (ordered boss phases; altar→boss-exists) automatically validate the new
  region's data.

**Why**

This makes the Glass Reliquary a complete contrasting second region (seed M6) rather than a connecting
corridor — proving the architecture scales: an entire region climax (boss + multi-phase telegraphs +
altar + choice) came from data + one manifest line.

**Verified**

- `npm test` → 67 passing. Build + lint clean. Boots HTTP 200.

**Next** → ship one real asset file end-to-end (prove the loader path visually), add a second Refrain
(`light_dash`) + a path gated on it, and add CI.

---

## 2026-06-18 — Cycle 12: project hand-off tidy + the second Refrain (light_dash)

**Built**

- **Docs/onboarding:** removed the temporary `HANDOFF.md`, and captured the founding documents under a
  new [`brief/`](./brief/) folder — the original `SEED_PROMPT.md` and full `ASSET_SPEC.md` (the
  dangling `thelastchorusseedprompt.md` reference never existed in-repo). `AGENTS.md`, `ASSETS.md`,
  `README.md`, and `CLAUDE.md` now point there, so a new agent/human gets the full intent in one place.
- **Second Refrain — `light_dash` (the BOTW loop extended with a new grant type):**
  - New pure, tested `systems/gating.ts` (`canPassGate` / `ownsRequirement`). Gates now have a **kind**:
    `silence` (own the Refrain → opens permanently, as before) or **`chasm`** — a fracture you must
    _dash across_ each time. The dash becomes a traversal key, not just a dodge (Pillar 3 × 4).
  - The **Glass Reliquary** now seals a memory-vault (`glass_vault` lore) in its top-right corner behind
    a `chasm` gate; the **Refrain of the Leap** pickup sits on the near side. Pure data + map geometry —
    no scene content. `Player.isDashing` exposes the dash window the collider reads each overlap frame.
  - The gate's look is data-driven by kind (silence = passable ghost when owned; chasm = a faint,
    leapable shimmer when owned, an impassable void otherwise).

**Why**

`light_dash` was the highest-value M6 gameplay item: it proves the Refrain system generalizes to a
_second, mechanically distinct_ grant (not just another key-to-a-door), deepening Pillar 4. Keeping the
pass/own rules in a pure module means the new traversal mechanic is test-backed, and the chasm is one
data edit per region from here on.

**Verified**

- `npm test` → 73 passing (gating 6 added; soft-lock + gate-needs-real-Refrain guards cover the new
  placement automatically). Build + lint clean.

**Try it:** `goto glass_reliquary`, grab the **Refrain of the Leap** (upper-right), then **dash**
(Space) east through the shimmering fracture into the sealed vault. Walking into it bounces you back —
you have to leap.

**Next** → ship one real asset file end-to-end (now visually verifiable via the playtest harness), CI,
and Glass-native enemy variety.

---

## 2026-06-18 — Cycle 13: visual playtest harness (validate real rendering & feel)

**Built**

- **`playtest/` — a Playwright harness that plays the real game.** `npm run playtest` boots the actual
  build in headless Chromium, drives it with real keyboard input (`hold`/`dash`/`tap`), reads live
  state, and screenshots each beat into `playtest/shots/` — then asserts. This closes the one gap unit
  tests can't reach: _does it render and play?_ (Vitest can't boot WebGL — see ARCHITECTURE.md.)
- **The observability seam:** `GameScene.debugState()` returns a plain-data snapshot (zone, player pos,
  light, refrains, gates+kind+open, dialogue/pause flags…), exposed on `window.__lastChorus` together
  with the scene's `DevCommandHost` — **only under `import.meta.env.DEV`**, so production ships none of
  it. The harness both drives (`host(...)` → teleport/give/goto/spawn) and asserts (`state(page)`).
- **Default scenario (`run.mjs`):** a guided tour that is also a regression check — Ashchoir spawn →
  pick up the first Refrain by walking → spawn+melee → Glass Reliquary → the fracture **blocks a walk**
  → gain `light_dash` → **dash across** → read the vault lore → open the journal. 13/13 checks green,
  and the screenshots confirm biome identity (warm ash vs cold glass) and the chasm reading correctly
  (solid void → dim shimmer once owned).

**Why**

The user asked to be able to _actually play/test the game with visuals_ for holistic iteration. Pure
specs prove logic; they can't catch a black screen, an unreadable placeholder, or a gate you can't
physically cross. A scriptable browser harness makes the play experience itself observable and
assertable — every future cycle can now be validated end-to-end, visually.

**Verified**

- `npm run playtest` → 13/13 checks pass; 8 screenshots captured. `npm test` → 73 passing.
  Build + lint clean (eslint override added for the Node+browser `playtest/*.mjs` globals).

**Try it:** `npm run playtest -- --head` to watch it play; shots land in `playtest/shots/`.

**Next** → ship one real asset file end-to-end (now visually verifiable), CI running test+build+lint
(and optionally a headless playtest), and Glass-native enemy variety.

---

## 2026-06-18 — Cycle 14: title screen (MVP demo — the front door)

**Built**

- **`TitleScene`** — a quiet main menu: the title, the tagline _"the world is a dying song"_, drifting
  light-motes, and **New Game / Continue** (Continue appears only when a save exists), plus a controls
  hint. Boot flow is now **Boot → Title → Game**. New Game clears the save and starts in Ashchoir;
  Continue resumes in the saved zone. Keyboard-navigated (↑/↓, Enter/Space/E); kept sparse (Pillar 5).
- Playtest harness updated for the menu: `waitTitle` / `newGame` / `continueGame`, and the default
  scenario now boots to the title, screenshots it, and starts a new game before the tour.

**Why**

First step of the MVP-demo goal: a demo needs a real front door and a New/Continue entry point. Framing
the whole thing as _intro-to-the-world + tutorial + teaser_ starts here at the title.

**Verified**

- `npm run playtest` → 14/14 (added the title-boot check); the screenshot shows the menu rendering.
  `npm test` → 73 passing. Build + lint clean.

**Next** → fold in the intro/atmosphere + in-world tutorial, then the demo ending that teases the
bigger picture.

---

## 2026-06-18 — Cycle 15: intro prologue + in-world tutorial + interact prompts

**Built**

- **Atmospheric prologue** on New Game (3 short lines via the dialogue system): the failing Chorus, the
  unraveling, and your role as a Lantern-bearer. No exposition dump (Pillar 1) — it hands straight off
  to play. Only fires on a fresh New Game in the starting zone (`intro` flag from the title).
- **In-world tutorial** (`updateTutorial`): one quiet hint per core verb, each advanced by _doing_ it —
  move → dash → gather the Refrain → cross east, plus an opportunistic combat hint when an enemy nears.
  Uses a new `ui/Prompts.HintLine` (a sparse top line).
- **Interact prompt** (`ui/Prompts.InteractPrompt`): a floating "E" glyph above whatever you can
  interact with right now (rest-points, lore, NPCs, awake altars) — general readability + teaches the
  verb. Priority-ordered to match `handleInteract`.
- `debugState()` now reports `intro` + `tutStep` so the harness can assert the flow.

**Why**

The MVP demo is framed as _intro-to-the-world + tutorial + teaser_. This cycle delivers the first two:
a first-timer learns the verbs in-world and gets the mood up front, without a manual or a text wall.

**Verified**

- `npm run playtest` → 16/16 (added prologue + tutorial-handoff checks); screenshots confirm the
  prologue panel and the "Move — WASD" hint with the floating E prompt above a lore object.
  `npm test` → 73 passing. Build + lint clean.

**Next** → the demo ending: resolve the arc and tease the bigger picture (the Drowned Hymn, the Chorus
still failing), then audio SFX + transition polish.
