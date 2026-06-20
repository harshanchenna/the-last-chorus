/**
 * Generates real environment tiles (per-region floor + wall) via the PixelLab REST
 * API (pixflux model) — the environment half of the placeholder→real pipeline.
 * PixelLab emits ≥32×32; walls are downscaled into the 16px wall cell at runtime
 * (see src/assets/placeholders.ts generateTileset), floors tile across the ground.
 *
 * Usage:
 *   PIXELLAB_API_KEY=... node scripts/gen-tiles.mjs                 # all specs below
 *   PIXELLAB_API_KEY=... node scripts/gen-tiles.mjs floor_ashchoir  # one, by key
 *
 * After a tile lands, flip its TILES[zone].floor/.wall path in
 * src/assets/manifest.ts from null to 'assets/<file>' so BootScene loads it.
 * Generated PNGs land in public/assets/ and are committed.
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

// Floors are 64×64 seamless ground; walls are 32×32 opaque blocks. Palettes track
// each region's tilePalette (src/data/zones.ts) + the north star (lonely, sacred,
// decaying; light is the saturated element).
const SPECS = [
  {
    key: 'floor_ashchoir',
    file: 'floor_ashchoir.png',
    w: 64,
    h: 64,
    description:
      'seamless tileable dark stone cathedral floor buried in grey ash, worn flagstones, scattered embers, top-down ground texture, muted warm browns',
    view: 'high top-down',
  },
  {
    key: 'wall_ashchoir',
    file: 'wall_ashchoir.png',
    w: 32,
    h: 32,
    description:
      'cracked charred stone cathedral wall block, scorched masonry, dim ember glow in the cracks, dark fantasy ruin, top-down',
    view: 'high top-down',
  },
  {
    key: 'floor_glass_reliquary',
    file: 'floor_glass_reliquary.png',
    w: 64,
    h: 64,
    description:
      'seamless tileable dark blue cathedral floor of cracked stained glass shards, faint cyan glints, cold sacred ground, top-down ground texture',
    view: 'high top-down',
  },
  {
    key: 'wall_glass_reliquary',
    file: 'wall_glass_reliquary.png',
    w: 32,
    h: 32,
    description:
      'wall block of fractured blue-grey crystalline glass, frosted brittle shards, faint inner cyan light, cold sacred ruin, top-down',
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
    // Tiles are opaque (floors tile seamlessly; walls fill their cell).
    no_background: false,
    text_guidance_scale: 8,
    ...(spec.view ? { view: spec.view } : {}),
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
