# TOOLING.md — external tool dependencies

A **living** record of every external tool the project depends on for development, so
a fresh agent (or human) can get fully set up. This is part of the recursion: when a
cycle discovers or adopts a new tool, **add it here in the same commit**.

Legend: **Required** = needed to build/verify the game · **Optional** = only needed
to (re)generate assets or do specialized work.

---

## Core toolchain — Required

| Tool                  | What for                                  | Setup                           |
| --------------------- | ----------------------------------------- | ------------------------------- |
| **Node 22+ & npm**    | Runtime for everything below              | install Node 22+; `npm install` |
| **Vite**              | Dev server + production bundler           | dev dep (`npm install`)         |
| **TypeScript**        | Strict typing; `tsc --noEmit` gate        | dev dep                         |
| **Phaser 3**          | Game engine                               | dep                             |
| **ESLint + Prettier** | Lint + format gate (`npm run lint`)       | dev dep                         |
| **Vitest**            | Unit tests for pure logic + boot contract | dev dep (`npm test`)            |

After `npm install`, the full verify gate runs offline:
`npm test && npm run build && npm run lint`.

## Visual playtest — Required for the playtest gate

| Tool                | What for                                             | Setup                             |
| ------------------- | ---------------------------------------------------- | --------------------------------- |
| **Playwright**      | Headless Chromium that drives the game + screenshots | dev dep                           |
| **Chromium binary** | The browser Playwright launches                      | `npx playwright install chromium` |

`npm run playtest` boots the game in headless Chromium, runs the scenario in
`playtest/`, asserts ~20 state checks via `window.__lastChorus`, and writes
screenshots to `playtest/shots/` for visual review. See `playtest/README` /
`playtest/harness.mjs`.

## Asset generation — Optional (only to regenerate art/audio)

The game ships generated binaries in `public/assets/`, so you do **not** need these
to build or play — only to (re)generate assets. Full guide: **`scripts/AI_ASSETS.md`**.

| Tool / API                     | What for                                   | Auth                         | Notes                                                                                                              |
| ------------------------------ | ------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **PixelLab**                   | Pixel-art sprites + tiles (REST API)       | `PIXELLAB_API_KEY` env var   | `npm run gen:sprites`, `npm run gen:tiles`. Min canvas 32×32. Free tier allows generations.                        |
| **ElevenLabs — Sound Effects** | Ambient/SFX loops (`/v1/sound-generation`) | `ELEVENLABS_API_KEY` env var | `npm run gen:audio`. Works on the **free** tier.                                                                   |
| **ElevenLabs — Music**         | Composed background songs (`/v1/music`)    | `ELEVENLABS_API_KEY` env var | `npm run gen:music`. **Requires a PAID plan** (free keys → `402 paid_plan_required`). Pipeline is wired and ready. |

### Credentials

Never commit secrets. Pass keys as **env vars on the command line** (e.g.
`PIXELLAB_API_KEY=… npm run gen:tiles`) or put them in **`.claude/settings.local.json`**
(git-ignored). Generated binaries under `public/assets/` **are** committed (shipped
game assets); API keys are **not**.

---

_Keep this current. New tool adopted → new row here, same commit._
