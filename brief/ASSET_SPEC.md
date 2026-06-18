# THE LAST CHORUS — Asset Production Spec

> Hand-off sheet for a pixel artist, an AI sprite tool, or an AI music tool. Every asset here maps
> to a logical ID in the game's `manifest.ts`, so anything produced to spec drops straight in with no
> code changes. Format-only summary at the bottom. When in doubt, match the _frame dimensions_ and
> _animation names_ exactly — those are the contract.
>
> This is the **original, full production spec**. The live, in-repo asset contract kept in sync with
> [`src/assets/manifest.ts`](../src/assets/manifest.ts) is [`ASSETS.md`](../ASSETS.md) at the repo root.

---

## 0. Visual North Star

Lonely, sacred, decaying. Think _Hyper Light Drifter_ and _Death's Door_: low-resolution pixel art,
restrained palettes, heavy use of negative space and silhouette, light as the one source of color in
a desaturated world. Readability first — the player must parse threats at a glance on a busy screen.

---

## 1. Resolution & Scaling

- **Internal render resolution:** **480 × 270** (16:9). Integer-scales to 960×540 (2×) and 1920×1080 (4×).
- **Pixel grid:** all art authored at 1× on this grid. **No anti-aliasing, no sub-pixel detail.**
- **Tile size:** **16 × 16 px**.
- Everything below is in _source_ pixels at 1×.

---

## 2. Palette Discipline

- One **global core palette** (~24–32 colors): desaturated stone, ash, bone, deep shadow, plus a
  small set of "light" accent colors (the only saturated hues in the game).
- Each region gets a **mood sub-palette** layered on the core. Suggested anchors:
  - `glass_reliquary` — pale cyans, frost-white, memory-blue; brittle highlights.
  - `ashchoir` — ember orange, char-black, smoke-grey; warm but mournful.
  - `drowned_hymn` — teal, drowned-green, moonlit silver; everything slightly wet.
- "Light" (the player's power) reads as the **brightest, most saturated** element on screen in every
  region. Keep it consistent so players always recognize it.

---

## 3. Sprites

**Directional convention:** author **4 directions** — `down`, `up`, `side` (facing right; the engine
mirrors it for left). This halves the art. 8-direction is an optional later upgrade; not required for v1.

**Frame rate:** 8–12 fps for most cycles. Deliver as horizontal strips (one PNG per animation) **or**
a packed atlas + JSON — either works; strips are simplest.

### 3.1 Player — `player.*` (frame: **32 × 32**, character occupies ~20px)

| Animation ID          | Directions | Frames (suggested) | Notes                                 |
| --------------------- | ---------- | ------------------ | ------------------------------------- |
| `player.idle`         | 4          | 4–6 (breathing)    | Subtle; a faint light-flicker is nice |
| `player.walk`         | 4          | 6–8                | Run-walk, snappy                      |
| `player.dash`         | 4          | 3–4                | Fast, with a light-trail frame        |
| `player.attack_light` | 4          | 4–5                | Blade-of-light melee arc              |
| `player.attack_cast`  | 4          | 4–6                | Ranged/sung-light cast                |
| `player.hurt`         | 1 (flash)  | 2                  | Flat white-flash flame frames ok      |
| `player.death`        | 1          | 6–8                | Dissolve into motes of light          |
| `player.interact`     | down       | 3–4                | Kneel/touch at rest-points & lore     |

### 3.2 Enemies — `enemy.<name>.*` (frames vary; keep on the 16px grid)

Per enemy, deliver: `idle`, `walk`, `telegraph` (wind-up before attack — **important**, combat reads
depend on it), `attack`, `hurt`, `death`. Starter roster (invent more in `DESIGN.md`):

| Enemy ID                     | Frame size | Vibe                                       |
| ---------------------------- | ---------- | ------------------------------------------ |
| `enemy.ashling`              | 24 × 24    | Small ember-wisp; fast, swarms             |
| `enemy.reliquary_warden`     | 32 × 32    | Slow glass sentinel; heavy telegraph       |
| `enemy.tideborn`             | 32 × 32    | Drowned figure; lunges                     |
| `enemy.miniboss_choirmaster` | 64 × 64    | Region-1 mini-boss; multi-phase telegraphs |

### 3.3 NPCs / wisps — `npc.*` (frame: 32 × 32)

- `npc.idle` (4–6 frames). Rare, quiet figures. Keep them few and haunting.

### 3.4 FX — `fx.*` (sizes vary, transparent bg)

- `fx.light_slash`, `fx.cast_projectile`, `fx.impact`, `fx.dash_trail`, `fx.death_motes`,
  `fx.refrain_pickup`, `fx.rest_glow`. 4–8 frames each, additive-friendly (bright on transparent).

---

## 4. Tilesets — `tileset.<region>`

- **16 × 16** tiles, delivered as a tilesheet PNG **+ a Tiled `.tsx`/JSON** if possible.
- Per region provide: ground (3–4 variants), wall/edge set (with corners), accent props
  (rubble, ruined pillars, region-specific motifs), and an **"unraveling" overlay set** (ash/glass/
  silence creeping in — the signature visual of a dying god).
- Animated tiles welcome (water, embers, drifting motes) — 2–4 frames, note them in delivery.
- Decorative props as separate 16-grid sprites: `prop.<region>.<name>`.

---

## 5. UI / HUD — `ui.*`

- Minimal, diegetic, low-contrast until it matters. Deliver:
  - `ui.health` (light-capacity meter — reads as light filling/draining, not a red bar)
  - `ui.refrain_slot` (equipped-ability icon frame)
  - `ui.refrain_icons` (one per Refrain; 16×16 or 24×24)
  - `ui.dialogue_box` (9-slice panel, muted)
  - `ui.prompt` (small "interact" glyph)
  - Font: a readable pixel bitmap font (8px or 16px cap height); deliver as a bitmap font atlas + `.fnt`.

---

## 6. Audio — "the world is a song"

Audio is a **first-class system**, not background. Author for **reactive layer mixing**: the engine
fades stems in/out by zone and tension. **Format:** `.ogg` (web-first) primary, optional `.mp3`
fallback; loudness ~ **-16 LUFS** integrated; **seamless loop points** (zero-cross, no clicks).

### 6.1 Music / ambient beds — `zone.<region>.ambient`

Deliver each region's bed as **3 separate stems** that loop in sync (same length & tempo):

- `..._base` — drone/pad/foundation (always on; the dying god's held note).
- `..._melody` — sparse melodic layer (fades in during calm exploration).
- `..._tension` — percussive/dissonant layer (fades in during combat).

Suggested tonal anchors (cohesion across a "song" world):

- `glass_reliquary` — high, brittle, bell/glass timbres; slow; minor-key fragility.
- `ashchoir` — low choral drone + ember crackle; warm, grieving.
- `drowned_hymn` — muffled, reverb-drenched, tidal swells; rhythmic like breathing water.

Also: `music.title` (main theme — the melody that recurs, fragmented, in each region) and
`music.rest` (short, safe, warm loop for rest-points).

### 6.2 SFX — `sfx.*`

Player: `sfx.footstep_stone`, `sfx.footstep_glass`, `sfx.dash`, `sfx.blade_swing`, `sfx.blade_hit`,
`sfx.cast`, `sfx.cast_impact`, `sfx.hurt`, `sfx.death`.
World/UI: `sfx.refrain_pickup`, `sfx.rest_save`, `sfx.door_open`, `sfx.lore_reveal`,
`sfx.ui_move`, `sfx.ui_confirm`, `sfx.ui_back`.
Enemy (per enemy): `sfx.<enemy>.attack`, `sfx.<enemy>.hurt`, `sfx.<enemy>.death`.
Keep SFX tonal/musical where possible — they should feel like part of the score, not foley.

---

## 7. File Format & Naming Summary

- **Images:** PNG-24, transparent where noted, no anti-aliasing, authored at 1× on the 16px grid.
- **Sprites:** horizontal strip per animation (or atlas + JSON). Name files to the logical ID with
  direction suffix: `player_walk_down.png`, `enemy_ashling_telegraph.png`, `fx_light_slash.png`.
- **Tilesets:** tilesheet PNG + Tiled `.tsx`/JSON; `tileset_ashchoir.png`.
- **Audio:** `.ogg` (+ optional `.mp3`); stems share a basename: `zone_ashchoir_ambient_base.ogg`,
  `zone_ashchoir_ambient_melody.ogg`, `zone_ashchoir_ambient_tension.ogg`.
- **Delivery rule:** match the **frame dimensions** and **animation/stem names** above exactly. If a
  file follows the naming convention, it drops into `manifest.ts` with a one-line entry and no code
  change.

---

## 8. Priority Order (produce in this order to unblock the build)

1. `player.idle`, `player.walk`, `player.dash` — needed for M1 game-feel tuning.
2. `player.attack_light`, one enemy full set (`enemy.ashling.*`), core `fx.*` — for M2 combat.
3. `tileset.ashchoir` + props + `zone.ashchoir.ambient` stems — for the M5 vertical slice.
4. UI set, title/rest music, remaining SFX.
5. Everything else region-by-region as the world expands.

Until each of these exists, the game runs on programmatic placeholders — so art and audio can be
produced in parallel, on your schedule, with zero pressure on the code.
