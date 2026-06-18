/**
 * Generates real ambient beds via the ElevenLabs API and drops them where the
 * manifest expects them — proving the audio half of the placeholder→real pipeline
 * (seed §8). Each zone's bed is 3 in-sync stems (base/melody/tension); the loader
 * derives `<id>_<stem>.<ext>` from one manifest path, so setting the manifest
 * `file` is the only code touch (zero gameplay-code change).
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/gen-audio.mjs            # all zones
 *   ELEVENLABS_API_KEY=sk_... node scripts/gen-audio.mjs ashchoir   # one zone
 *
 * Output: public/assets/zone_<zone>_ambient_{base,melody,tension}.mp3
 * Then set AUDIO['zone.<zone>.ambient'].file = 'assets/zone_<zone>_ambient.mp3'.
 *
 * NOTE: I (the agent) can't aesthetically judge audio — run this, listen, and
 * tell me what to change in the prompts below; the loop is yours-ears + my-prompts.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('Set ELEVENLABS_API_KEY (get one at https://elevenlabs.io/app/settings/api-keys).');
  process.exit(1);
}

const ENDPOINT = 'https://api.elevenlabs.io/v1/sound-generation';
const SECONDS = 22; // seamless ambient loop length

// Per-zone, per-stem prompts. base = always-on drone; melody = calm layer;
// tension = combat layer. Tweak these freely — they're the creative knobs.
const ZONES = {
  ashchoir: {
    base: 'a low, grieving choral drone with distant ember crackle, sacred and mournful, seamless ambient loop, no melody, dark cathedral reverb',
    melody:
      'a sparse, fragile high choir melody over a quiet drone, slow, melancholic, ethereal, seamless ambient loop',
    tension:
      'a tense low pulsing dissonant choral swell with embers, ominous, building dread, seamless ambient loop',
  },
  glass_reliquary: {
    base: 'a high brittle glass/bell drone, cold and crystalline, minor key, fragile, sacred, seamless ambient loop',
    melody:
      'slow sparse glass bell tones, memory-like, shimmering, lonely, minor key, seamless ambient loop',
    tension:
      'sharp ringing glass shards and dissonant high strings, unease, brittle tension, seamless ambient loop',
  },
  drowned_hymn: {
    base: 'a deep muffled underwater drone with slow tidal swells, reverb-drenched, like breathing water, seamless ambient loop',
    melody:
      'a muffled distant bell on the tide, slow, drowned, reverberant, lonely, seamless ambient loop',
    tension:
      'a dark surging underwater pressure with groaning low tones, foreboding, seamless ambient loop',
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.join(root, 'public', 'assets');
mkdirSync(outDir, { recursive: true });

const only = process.argv[2];
const zones = only ? { [only]: ZONES[only] } : ZONES;

for (const [zone, stems] of Object.entries(zones)) {
  if (!stems) {
    console.error(`unknown zone "${only}" (one of: ${Object.keys(ZONES).join(', ')})`);
    process.exit(1);
  }
  for (const [stem, prompt] of Object.entries(stems)) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text: prompt, duration_seconds: SECONDS, loop: true }),
    });
    if (!res.ok) {
      console.error(`✗ ${zone}/${stem}: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const out = path.join(outDir, `zone_${zone}_ambient_${stem}.mp3`);
    writeFileSync(out, buf);
    console.log(`✓ ${path.relative(root, out)} (${(buf.length / 1024).toFixed(0)} KB)`);
  }
}

console.log('\nDone. Now set the manifest entries to load them, e.g.:');
console.log("  AUDIO['zone.ashchoir.ambient'].file = 'assets/zone_ashchoir_ambient.mp3'");
