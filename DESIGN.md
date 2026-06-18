# Design — The Last Chorus

> The living game-design doc. Expands the seed's World Bible and records design decisions with a
> one-line rationale (seed §6). Atmosphere over exposition — this doc is for builders, the _game_
> never explains itself in walls of text (Pillar 1).

## Pillars (every decision serves these)

1. **Atmosphere over exposition.** Lore lives in environment, item descriptions, and silence.
2. **The world is a song.** Music + reactive ambient audio are first-class systems (see `AudioDirector`).
3. **Fast, expressive, magical combat.** Snappy, dodge-driven, light/sung-magic. Feel > realism.
4. **Exploration & discovery first.** Go-anywhere, come-back-stronger gating via Refrains, not walls.
5. **Melancholic-mythic tone.** Lonely, sacred, decaying. Bittersweet, never heroic.

## Premise

The gods sang the world into being — one endless **Chorus**. For a thousand years it has been failing,
god by god. Where a god's voice falls silent, the land **unravels** into ash, glass, and silence. The
player is one of the last **Lantern-bearers**, carrying fragments of the divine song as **light**,
crossing the corpse-geography of the fallen pantheon to relight the sleeping gods — or let them rest.

**Tone rule:** "Relight" vs "let rest" must feel like real moral weight, never a good/evil meter.

## Regions (geography = dead gods)

Each major region is the body/domain of one fallen god, with its own biome, palette, motif, music key,
and unraveling-state. The title melody recurs, fragmented, in each.

### Ashchoir — a god of fire & grief _(starting region, M5 vertical-slice target)_

A smoldering cathedral-forest; pews of charred wood under a canopy that burned but never fell. Embers
drift upward and **hum** — a held chord the dead god can no longer resolve. The unraveling here is
**ash**: it creeps across the ground and eats sound, so the deeper you go, the quieter the world gets
until even your footsteps stop carrying. Palette: ember orange, char-black, smoke-grey — warm but
mournful. Music: low choral drone + ember crackle.

### The Glass Reliquary — a god of memory

Fields of **singing glass** where a god of memory shattered into brittle light. Every surface holds a
reflection of something that already happened; step wrong and the glass _remembers you back_. Cold,
high, fragile. The unraveling is **glass**: terrain crystallizes and rings, beautiful and lethal.
Palette: pale cyans, frost-white, memory-blue. Music: high bell/glass timbres, slow, minor-key.

### The Drowned Hymn — a god of tides

Flooded ruins where the tide still keeps time for a god that no longer breathes. Water rises and falls
on a slow rhythmic swell — _the god's last breathing_, mechanized into the level. The unraveling is
**silence-under-water**: drowned zones where sound (and your light) is muffled until you surface.
Palette: teal, drowned-green, moonlit silver; everything slightly wet. Music: muffled, reverb-drenched,
tidal. **Candidate for the low-combat traversal/atmosphere zone** (seed §3, Pillar 4).

## Player fiction

**Light is both weapon and key.** The player gathers **Refrains** — ability/upgrade fragments — that
gate exploration BOTW-style. Each Refrain is also a piece of the lost song; collecting them is
literally re-assembling a god's voice.

- **Refrain of the Held Breath** (`first_refrain`, grants `cross_silence`) — opens **silence-void**
  gates permanently. The Ashchoir chancel doorway.
- **Refrain of the Leap** (`light_dash`, grants `light_dash`) — lets you **dash across a `chasm`**: a
  fracture in the world that the dash carries you over, but only mid-leap. Found in the Glass Reliquary,
  walling off a memory-vault. Makes the dodge a traversal key, not just an i-frame (Pillar 3 × 4).

## Combat (v1 target)

A light melee (blade of light), a ranged/sung light attack, a dash/dodge with i-frames, and a slot for
an equipped Refrain. Enemies **telegraph**; the player is rewarded for reads (every enemy def carries a
`telegraphMs`). Lock-on optional. Death returns to the last rest-point — no permadeath.

## Save model

Single versioned `SaveData` object (`zoneId`, `spawn`, `lightCapacity`, `refrains[]`, `lore[]`).
Explicit save at rest-points; autosave on zone transition. Versioned from day one with a `migrate()`
seam so the shape can grow safely.

## Bosses

- **The Choirmaster** (Ashchoir mini-boss) — what remains of the cantor who once led the god's hymn,
  now conducting an empty choir. Three phases escalate as its light drains: **Adagio** (slow, long
  telegraphs, strikes + the occasional radial "chord"), **Crescendo** (faster, adds an aimed volley),
  **Finale** (frantic, mostly radial chords + volleys). Each phase shortens the read window — the
  player must internalize the tells. Holds the eastern hall beyond the silence-gate, so reaching the
  Glass Reliquary means passing (or beating) it.
- **The Reliquary Echo** (Glass Reliquary mini-boss) — a god of memory's last reflection, fighting at
  range with shards of recollection. Contrasts the Choirmaster: ranged-heavy and keeps its distance.
  Phases **Recollection** → **Distortion** → **Shatter** trade telegraph length for volley density,
  closing to melee only as it breaks apart.

## Decisions

- **Health reads as light, not a red bar** (asset spec §5) — reinforces "light is your power."
- **4-direction art, engine mirrors `side`** (asset spec §3) — halves art cost; 8-dir is a later upgrade.
- **Ashchoir is the first region** — its "ash eats sound" mechanic is the cleanest showcase of Pillar 2
  (the world literally going silent), making it the strongest vertical-slice proof.
- **Tension is currently enemy-count-driven** (placeholder) — real combat state will drive the
  melody→tension crossfade in M2.
- **Two gate kinds, one pure rule** (`systems/gating.ts`) — `silence` (own the Refrain → opens) vs
  `chasm` (own it _and_ be mid-dash). Keeping passage logic pure means a new traversal grant is data +
  geometry, not engine surgery, and the dash earns a second role beyond dodging.
