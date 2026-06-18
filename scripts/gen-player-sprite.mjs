/**
 * Generates the real `player` sprite — a 32×32 Lantern-bearer — to
 * `public/assets/player.png`. Proves the placeholder→real asset pipeline
 * end-to-end (seed §8): with the manifest entry's `file` set, BootScene loads
 * this instead of the programmatic placeholder, with zero gameplay-code changes.
 *
 * Pure Node (zlib only) so there's no image dependency. Run: `npm run gen:assets`.
 * Authored to the asset spec: 32×32 frame, no anti-aliasing, light is the
 * brightest element on screen (the lantern).
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const W = 32;
const H = 32;
const px = new Uint8Array(W * H * 4); // RGBA, transparent by default

function set(x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
  px[i + 3] = a;
}
function blend(x, y, [r, g, b], a) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  const sa = a / 255;
  const da = px[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa === 0) return;
  px[i] = Math.round((r * sa + px[i] * da * (1 - sa)) / oa);
  px[i + 1] = Math.round((g * sa + px[i + 1] * da * (1 - sa)) / oa);
  px[i + 2] = Math.round((b * sa + px[i + 2] * da * (1 - sa)) / oa);
  px[i + 3] = Math.round(oa * 255);
}
function isOpaque(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  return px[(y * W + x) * 4 + 3] > 0;
}

const CLOAK = [42, 34, 52]; // deep indigo
const CLOAK_DK = [28, 22, 36];
const FACE = [18, 14, 24]; // shadow under the hood
const RIM = [96, 86, 120]; // silhouette edge light
const LANTERN = [255, 242, 196]; // the light — brightest on screen
const GLOW = [255, 196, 120]; // warm halo

// Warm glow pool first (drawn under everything), centered on the lantern.
const lx = 24;
const ly = 19;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - lx, y - ly);
    if (d <= 7) blend(x, y, GLOW, Math.max(0, Math.round(70 * (1 - d / 7))));
  }
}

// Hood + head (a soft ellipse), with a shadowed face.
for (let y = 5; y <= 14; y++) {
  for (let x = 9; x <= 23; x++) {
    if (((x - 16) / 5) ** 2 + ((y - 9.5) / 5) ** 2 <= 1) set(x, y, y < 8 ? CLOAK_DK : CLOAK);
  }
}
for (let y = 9; y <= 13; y++) {
  for (let x = 13; x <= 19; x++) {
    if (((x - 16) / 3) ** 2 + ((y - 11) / 3) ** 2 <= 1) set(x, y, FACE);
  }
}

// Cloak body — a bell that widens toward the hem.
for (let y = 12; y <= 28; y++) {
  const t = (y - 12) / 16;
  const half = Math.round(4 + t * 6);
  for (let x = 16 - half; x <= 16 + half; x++) set(x, y, x < 14 ? CLOAK_DK : CLOAK);
}

// Left-edge rim light so the silhouette reads at low res.
for (let y = 5; y <= 28; y++) {
  for (let x = 0; x < W; x++) {
    if (isOpaque(x, y) && !isOpaque(x - 1, y)) {
      set(x, y, RIM);
      break;
    }
  }
}

// The lantern — a small bright lozenge held at the right hand.
for (let y = 17; y <= 21; y++) {
  for (let x = 23; x <= 25; x++) set(x, y, LANTERN);
}
set(24, 16, LANTERN);
set(24, 22, [255, 220, 150]); // the flame's base, a touch warmer

// ---- PNG encode (zlib + manual chunks) ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
// 10,11,12 = compression/filter/interlace = 0

// Raw image: each row prefixed with filter byte 0.
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0;
  for (let x = 0; x < W * 4; x++) raw[y * (1 + W * 4) + 1 + x] = px[y * W * 4 + x];
}
const idat = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.join(root, 'public', 'assets');
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'player.png');
writeFileSync(out, png);
console.log(`wrote ${path.relative(root, out)} (${png.length} bytes, ${W}×${H})`);
