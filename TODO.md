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

## ▶ M4 — Refrains & gating _(current)_

- [ ] In-world Refrain pickup entity (currently only via dev `give`) + pickup FX/jingle
- [ ] Refrain equip slot + HUD icon (`ui.refrain_slot` / `ui.refrain_icons`)
- [ ] A second gated path that uses a different Refrain grant (e.g. `light_dash` across a gap)
- [ ] Collected-lore / Refrain menu (pause screen)

## M5 — Vertical slice (Ashchoir)

- [ ] Full region: biome identity (tileset + unraveling overlay), 2–3 enemies, a mini-boss
- [ ] Reactive audio in situ, environmental lore, an entrance + an exit

## M6+

- [ ] Second region (contrasting tone) · dialogue system · relight-vs-rest choice · real-asset swap

## Tech debt / watch

- [ ] Bundle is ~1.5MB (all Phaser) — consider `manualChunks` / a slimmer Phaser build before ship
- [ ] No CI yet — add a GitHub Action running `test + build + lint` on push
