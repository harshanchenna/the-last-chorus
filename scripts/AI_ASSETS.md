# AI asset generation pipeline

How real art + audio get generated and dropped into the game. Both swap in through
`src/assets/manifest.ts` with **zero gameplay-code changes** (seed §8) — set an
entry's `file` and `BootScene` loads it instead of the programmatic placeholder.

The agent can **see** generated art (it reviews screenshots via the playtest
harness) so it self-iterates on sprites. It **cannot hear** audio — for sound the
loop is: agent generates → you listen → agent refines the prompts.

---

## Sprites & tilesets — PixelLab (MCP)

[PixelLab](https://www.pixellab.ai/) is purpose-built for top-down / 4–8-direction
pixel-art characters, animations, and Wang tilesets. Its **MCP server** lets the
agent call it as native tools (`create_character`, `animate_character`,
`create_tileset`, `create_isometric_tile`).

**Setup (one-time):**

1. Get an API token at <https://www.pixellab.ai/vibe-coding>.
2. Add the server to `.claude/settings.local.json` (git-ignored via `*.local`):
   ```json
   {
     "mcpServers": {
       "pixellab": {
         "url": "https://api.pixellab.ai/mcp",
         "transport": "http",
         "headers": { "Authorization": "Bearer YOUR_PIXELLAB_TOKEN" }
       }
     }
   }
   ```
3. **Restart Claude Code** so the MCP tools load. Then the agent can generate
   sprites, post-process to the frame sizes in `manifest.ts`, save under
   `public/assets/`, set the manifest `file`, and review the result in-game.

Frame-size contract (must match `manifest.ts` / `ASSETS.md`): `player` 32×32,
`enemy.ashling` 32×32, `enemy.reliquary_warden` 32×32, `enemy.tideborn` 32×32,
`enemy.miniboss_choirmaster` 64×64, `enemy.reliquary_echo` 64×64, `npc.wisp` 32×32.

**REST scripts (no MCP needed)** — the agent drives these directly:

```
PIXELLAB_API_KEY=... npm run gen:sprites              # characters (gen-sprites.mjs)
PIXELLAB_API_KEY=... npm run gen:sprites player       # one, by key
PIXELLAB_API_KEY=... npm run gen:tiles                # floors + walls (gen-tiles.mjs)
PIXELLAB_API_KEY=... npm run gen:tiles floor_ashchoir # one, by key
```

Tiles: floors are 64×64 seamless (tiled by a TileSprite under the map); walls are
32×32 opaque, downscaled into the 16px wall cell at runtime by `generateTileset`.
After a tile lands, set its `TILES[zone].floor/.wall` path in `manifest.ts`
(null → `assets/<file>`); BootScene then loads it with zero gameplay-code change.

---

## Music & SFX — ElevenLabs (script)

[ElevenLabs](https://elevenlabs.io/) generates studio-grade audio from text:
[Sound Effects API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert)
(`/v1/sound-generation`, with a seamless `loop` param) and a
[Music API](https://elevenlabs.io/music-api).

**Setup + run:**

1. Get a key at <https://elevenlabs.io/app/settings/api-keys>.
2. Run the generator (prompts live in the script — tweak freely):
   ```bash
   ELEVENLABS_API_KEY=sk_... npm run gen:audio            # all zones
   ELEVENLABS_API_KEY=sk_... npm run gen:audio ashchoir   # one zone
   ```
   Writes `public/assets/zone_<zone>_ambient_{base,melody,tension}.mp3`.
3. Point the manifest at it (the loader derives the 3 stem files from one path):
   ```ts
   AUDIO['zone.ashchoir.ambient'].file = 'assets/zone_ashchoir_ambient.mp3';
   ```
   The reactive `AudioDirector` (base always on, melody in calm, tension in combat)
   then mixes the real stems with no other change.

Ambient beds are the priority (the "background audio"). One-shot SFX currently use
the synthesized `WebAudioToneBackend`; sampled SFX can be added later behind the
same `AudioBackend` interface.

---

## Credentials — where they live

Never commit secrets. Put tokens in **`.claude/settings.local.json`** (git-ignored)
or pass them as env vars on the command line (as above). `public/assets/*` (the
generated binaries) **are** committed — they're shipped game assets.
