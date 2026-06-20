/**
 * Generates real pixel-art sprites via the PixelLab REST API (pixflux model) and
 * drops them where the manifest expects them — the art half of the placeholder→real
 * pipeline (seed §8). Frame sizes MUST match `src/assets/manifest.ts` exactly.
 *
 * Usage:
 *   PIXELLAB_API_KEY=... node scripts/gen-sprites.mjs            # all specs below
 *   PIXELLAB_API_KEY=... node scripts/gen-sprites.mjs player     # one, by key
 *
 * The agent can review the result in-game (playtest screenshots) and iterate on
 * the descriptions here. Generated PNGs land in public/assets/ and are committed.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('Set PIXELLAB_API_KEY (https://www.pixellab.ai/vibe-coding).');
  process.exit(1);
}

const ENDPOINT = 'https://api.pixellab.ai/v1/generate-image-pixflux';

// key = manifest sprite id; file = public/assets filename; w/h = frame size (must
// match the manifest). Lonely, sacred, decaying — light is the saturated element.
const SPECS = [
  {
    key: 'player',
    file: 'player.png',
    w: 32,
    h: 32,
    description:
      'lone hooded lantern-bearer pilgrim, dark tattered cloak, holding a small glowing warm lantern, melancholic dark-fantasy hero, full body',
    view: 'high top-down',
    direction: 'south',
  },
  {
    key: 'enemy.ashling',
    file: 'enemy_ashling.png',
    w: 32,
    h: 32,
    description:
      'small floating ember wisp creature, glowing orange and ash-grey, wispy smoke body, menacing little spirit',
    view: 'high top-down',
  },
  {
    key: 'npc.wisp',
    file: 'npc_wisp.png',
    w: 32,
    h: 32,
    description:
      'faint pale-blue ghostly wisp spirit, ethereal translucent figure, sorrowful, glowing softly',
    view: 'high top-down',
  },
  {
    key: 'enemy.reliquary_warden',
    file: 'enemy_reliquary_warden.png',
    w: 32,
    h: 32,
    description:
      'slow heavy sentinel made of cracked cyan glass and frost, hulking armored guardian, brittle crystalline',
    view: 'high top-down',
    direction: 'south',
  },
  {
    key: 'enemy.miniboss_choirmaster',
    file: 'enemy_miniboss_choirmaster.png',
    w: 64,
    h: 64,
    description:
      'towering robed choirmaster boss wreathed in fire and ash, conducting with burning hands, grand mournful cantor, ember crown',
    view: 'high top-down',
    direction: 'south',
  },
  {
    key: 'enemy.reliquary_echo',
    file: 'enemy_reliquary_echo.png',
    w: 64,
    h: 64,
    description:
      'shattered god of memory boss, a floating constellation of broken glass mirror-shards forming a ghostly figure, cold blue light',
    view: 'high top-down',
  },
];

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.join(root, 'public', 'assets');
mkdirSync(outDir, { recursive: true });

const only = process.argv[2];
const specs = only ? SPECS.filter((s) => s.key === only) : SPECS;
if (specs.length === 0) {
  console.error(`no spec for "${only}" (keys: ${SPECS.map((s) => s.key).join(', ')})`);
  process.exit(1);
}

for (const spec of specs) {
  const body = {
    description: spec.description,
    image_size: { width: spec.w, height: spec.h },
    no_background: true,
    text_guidance_scale: 8,
    ...(spec.view ? { view: spec.view } : {}),
    ...(spec.direction ? { direction: spec.direction } : {}),
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`✗ ${spec.key}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();
  const b64 = typeof json.image === 'string' ? json.image : json.image?.base64;
  if (!b64) {
    console.error(`✗ ${spec.key}: no image in response: ${JSON.stringify(json).slice(0, 200)}`);
    process.exit(1);
  }
  const out = path.join(outDir, spec.file);
  writeFileSync(out, Buffer.from(b64, 'base64'));
  const usage = json.usage ? JSON.stringify(json.usage) : '';
  console.log(`✓ ${path.relative(root, out)} (${spec.w}×${spec.h}) ${usage}`);
}
