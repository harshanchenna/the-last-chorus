# TODO — prioritized backlog by milestone

Pull the highest-value item that advances the **current** milestone each cycle (seed §6/§7). Don't
advance a milestone until the previous one is genuinely playable and docs are current.

## ✅ M0 — Boot & loop _(done)_

- [x] Vite + Phaser + TS (strict) scaffolding, pixel-art config, 480×270 internal res
- [x] Bootable scene; player placeholder moves (8-dir) + dash with i-frames
- [x] FPS / input-latency overlay
- [x] Dev console toggle (`teleport`, `spawn`, `give`, `godmode`, `reloadzone`, `zones`, `goto`)
- [x] Data-driven layer (zones/enemies/refrains/lore), asset manifest + placeholders
- [x] Versioned SaveSystem; rest-point save + autosave-on-zone-transition; one lore object
- [x] AudioDirector reactive stem system (NullBackend) wired to zone/tension
- [x] Green smoke test + unit specs (movement/audio/save); build + lint clean

## ✅ M1 — Game feel _(done)_

- [x] Acceleration/friction momentum model (replaced instant velocity); tuned `MOVEMENT`
- [x] Dash light-trail (fading afterimage ghosts) + i-frames
- [x] Gamepad support behind the existing `MoveInput` snapshot (stick/d-pad + buttons)
- [x] WebAudio tone backend so placeholder stems are audible (gesture-resumed)
- [x] Camera deadzone + round-pixels for crisp top-down framing
- [ ] _Deferred:_ further hand-tuning of feel constants once real sprites land (needs visual feedback)

## ▶ M2 — Combat core _(current)_

- [x] Light melee (blade-of-light arc) + ranged sung-light projectile
- [x] Health/light-capacity + damage + death → rest-point respawn (+ camera shake/flash juice)
- [x] `ashling` enemy with idle/chase/**telegraph**/attack/recover AI (pure, tested)
- [x] Real combat state drives `AudioDirector.setTension` (live enemies raise tension)
- [x] HUD: light meter (reads as light, not a red bar)
- [ ] Enemy `walk`/`hurt`/`death` anim hooks once sprite sheets exist (placeholder flashes for now)
- [ ] Knockback on hit (player + enemy) for extra impact
- [ ] Lock-on (optional) + tune attack reach/cooldowns for feel
- [ ] More of the roster wired in (`reliquary_warden`, `tideborn`) for variety tests

## ✅ M3 — Zone & save _(done)_

- [x] Data-driven tile geometry + wall collision (`world/mapgen` + `world/ZoneMap`); Tiled JSON drops
      into the same loader later
- [x] Walk-on zone transitions with autosave (ashchoir ⇄ glass_reliquary)
- [x] Ability-gated secret: a silence-void gate needing `first_refrain`, opening a path to a secret
      lore object (proves the gating loop)
- [x] Proper lore reveal panel (`ui/DialoguePanel`) + collected-lore persisted to save
- [x] Content-integrity tests: exits→zones, gates→refrains, lore objects→entries, spawns on ground

## ✅ M4 — Refrains & gating _(done)_

- [x] In-world Refrain pickup entity (bobbing fragment) with pickup FX (motes + flash); collected
      pickups persist (save v2) and never respawn
- [x] Refrain equip slot + count on the HUD (`ui.refrain_slot`)
- [x] Full BOTW loop proven in-game: find the Refrain → its silence-gate opens → reach the secret +
      the east passage to Glass Reliquary
- [x] Save format versioned v1→v2 with a tested migration (adds `pickups`)
- [ ] _Deferred:_ a second gate using a different grant (`light_dash` across a gap) — wants M5 geometry
- [ ] _Deferred:_ pause/inventory menu listing collected lore + Refrains

## ✅ M5 — Vertical slice: Ashchoir _(done)_

- [x] Biome identity: per-region tileset palette + an "unraveling" overlay (ash rises / glass sifts /
      tide drifts)
- [x] A mini-boss (`miniboss_choirmaster`) with multi-phase telegraphs (Adagio→Crescendo→Finale) and
      three attack patterns (strike / radial chord / aimed volley); boss HP+phase bar; enemy projectiles
- [x] Two distinct enemy types live in the zone (ashling swarm + reliquary_warden heavy) via a
      data-driven `enemySpawns` gauntlet; full roster is manifest-ready
- [x] Environmental lore trail east toward the gated boss arena (pew → choir stalls → secret candle)
- [x] "Ash eats sound": `AudioDirector.setSilence` scales every stem down as you push east into the
      unraveling — the world literally goes quiet (Pillar 2 showcase), tested
- [ ] _Polish deferred:_ an ashchoir-native heavy (reliquary_warden is a placeholder stand-in); footstep
      SFX to dampen alongside the music

## ▶ M6 — Second region & choices _(current)_

- [x] The relight-vs-rest choice at a god's altar — bittersweet, no good/evil meter (Pillar 5);
      persists via save v3 (`defeatedBosses` + `choices`)
- [x] Pause/inventory journal (collected lore + Refrains + choices made); freezes the game (P / Esc)
- [x] Real-asset pipeline: `BootScene.preload()` loads any manifest entry with a non-null `file`
      (`assets/loader.ts`); placeholder→real swap is a one-line manifest edit, unit-tested
- [x] Dialogue system (multi-line, Interact-to-advance) + a rare wisp NPC in the Glass Reliquary
- [x] Glass Reliquary is now a full second region: its own ranged mini-boss (**The Reliquary Echo**) +
      a god-of-memory altar with its own relight-vs-rest choice
- [ ] Ship one actual real asset file (sprite/audio) end-to-end to close the loop visually
- [x] A second Refrain (`light_dash`) + a path gated on it — `chasm` gate kind (pure `systems/gating`):
      a fracture in the Glass Reliquary you must **dash** across, walling off the `glass_vault` memory
- [ ] Glass-native enemy variety; the Drowned Hymn as the no-combat traversal/puzzle region (Pillar 4)
- [x] **Visual playtest harness** (`playtest/`, Playwright): boots the real game headless, drives it
      with real input, screenshots + asserts live state. Validates rendering & feel (`npm run playtest`)
- [ ] CI: GitHub Action running `test + build + lint` on push (+ optionally a headless `playtest`)
- [ ] Bundle size: `manualChunks` / slimmer Phaser build before any ship

## M5 — Vertical slice (Ashchoir)

- [ ] Full region: biome identity (tileset + unraveling overlay), 2–3 enemies, a mini-boss
- [ ] Reactive audio in situ, environmental lore, an entrance + an exit

## M6+

- [ ] Second region (contrasting tone) · dialogue system · relight-vs-rest choice · real-asset swap

## Tech debt / watch

- [ ] Bundle is ~1.5MB (all Phaser) — consider `manualChunks` / a slimmer Phaser build before ship
- [ ] No CI yet — add a GitHub Action running `test + build + lint` on push
