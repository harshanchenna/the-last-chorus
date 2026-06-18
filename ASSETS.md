# Assets — drop-in-ready production spec

Every asset maps to a logical ID in [`src/assets/manifest.ts`](./src/assets/manifest.ts). Until a real
file exists, the engine renders a **programmatic placeholder** at the asset's final frame size. Produce
a file to the spec below, point the manifest entry's `file` at it, and it drops in with **zero
gameplay-code changes** (seed §8). **Match the frame dimensions and animation/stem names exactly — those
are the contract.**

## How to drop in a real asset (zero gameplay-code changes)

1. Produce a file to the spec below and put it under `public/assets/` (Vite serves `public/` at the
   web root, so the manifest path is e.g. `assets/enemy_ashling.png`).
2. In [`src/assets/manifest.ts`](./src/assets/manifest.ts), set that entry's `file` from `null` to the
   path. For a sprite, the `frame` w/h must match the file's frame size.
3. Done. `BootScene.preload()` loads every manifest entry with a non-null `file`
   (`src/assets/loader.ts` plans the load list); entries still `null` fall back to programmatic
   placeholders. No scene or gameplay code changes.

For a **layered ambient bed**, set one base path (e.g. `assets/zone_ashchoir_ambient.ogg`); the loader
derives the three stem files by suffix: `..._base.ogg`, `..._melody.ogg`, `..._tension.ogg`, and
registers them as `zone.ashchoir.ambient.base` etc. A `one_shot` track loads as a single file under its
own key. (This swap behavior is unit-tested in `src/test/loader.test.ts`.)

## Format summary

- **Images:** PNG-24, transparent where noted, **no anti-aliasing**, authored at 1× on a **16px grid**.
- **Internal resolution:** 480×270 (16:9). Tile size 16×16. Integer-scales to 960×540 / 1920×1080.
- **Sprites:** horizontal strip per animation (or atlas + JSON). Name to the logical ID + direction
  suffix: `player_walk_down.png`, `enemy_ashling_telegraph.png`.
- **Audio:** `.ogg` primary (+ optional `.mp3`), ~ -16 LUFS, **seamless zero-cross loops**. Ambient
  stems share a basename: `zone_ashchoir_ambient_{base,melody,tension}.ogg`.
- **Directions:** author 4 — `down`, `up`, `side` (facing right; engine mirrors for left).

## Visual north star

Lonely, sacred, decaying. Low-res pixel art, restrained desaturated palettes, heavy silhouette and
negative space. **Light is the player's power and reads as the brightest, most saturated thing on
screen** in every region. Readability first.

## Sprites (current manifest entries)

| Logical ID      | Frame | Animations (suggested frames)                                                      | Status      |
| --------------- | ----- | ---------------------------------------------------------------------------------- | ----------- |
| `player`        | 32×32 | idle 4, walk 6, dash 3, attack_light 4, attack_cast 5, hurt 2, death 6, interact 3 | placeholder |
| `enemy.ashling` | 24×24 | idle 4, walk 4, **telegraph 3**, attack 4, hurt 2, death 5                         | placeholder |

Per enemy, the **telegraph** (wind-up before attack) is required — combat reads depend on it.

### Roster to expand (specs ready, not yet in manifest)

| Enemy                        | Frame | Vibe                                       |
| ---------------------------- | ----- | ------------------------------------------ |
| `enemy.reliquary_warden`     | 32×32 | Slow glass sentinel; heavy telegraph       |
| `enemy.tideborn`             | 32×32 | Drowned figure; lunges                     |
| `enemy.miniboss_choirmaster` | 64×64 | Region-1 mini-boss; multi-phase telegraphs |

## Audio (current manifest entries)

| Logical ID                     | Stems                 | Status      |
| ------------------------------ | --------------------- | ----------- |
| `zone.ashchoir.ambient`        | base, melody, tension | placeholder |
| `zone.glass_reliquary.ambient` | base, melody, tension | placeholder |
| `zone.drowned_hymn.ambient`    | base, melody, tension | placeholder |
| `music.title`, `music.rest`    | one_shot              | placeholder |

Ambient beds are **3 stems that loop in sync** (same length & tempo): `base` (always on — the dying
god's held note), `melody` (fades in during calm), `tension` (fades in during combat). The
`AudioDirector` mixes them reactively — see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Tilesets & UI (specced, not yet wired)

- **Tilesets** `tileset.<region>`: 16×16, tilesheet PNG + Tiled `.tsx`/JSON; ground/wall/edge/corner +
  accent props + an **"unraveling" overlay set** (ash/glass/silence creeping in — the signature visual).
- **UI** `ui.*`: `ui.health` (light meter, not a red bar), `ui.refrain_slot`, `ui.refrain_icons`,
  `ui.dialogue_box` (9-slice), `ui.prompt`; a readable pixel bitmap font.

## Production priority (unblocks the build)

1. `player.idle`, `player.walk`, `player.dash` — M1 game-feel.
2. `player.attack_light`, full `enemy.ashling.*`, core `fx.*` — M2 combat.
3. `tileset.ashchoir` + props + `zone.ashchoir.ambient` stems — M5 vertical slice.
4. UI set, title/rest music, remaining SFX.

> Full hand-off detail lives in the original asset spec sheet; this file is the live, in-repo contract
> kept in sync with `manifest.ts`.
