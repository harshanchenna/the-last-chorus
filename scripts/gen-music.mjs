/**
 * Generates actual COMPOSED background music (not just ambience) via the ElevenLabs
 * Music API, and writes it into the same per-zone stem files the manifest already
 * points at — a drop-in replacement for the ambient beds (zero gameplay-code change).
 *
 * The reactive 3-stem contract (AudioDirector) is preserved, but the stems are now
 * musical, Dead-Cells-style — the score DRIVES the atmosphere:
 *   - base    : a sustained, rhythmless pad in the zone's key (always on, subtle bed)
 *   - melody  : the main composed exploration track (fades out in combat)
 *   - tension : a composed combat track (fades in during combat)
 * base sits under melody/tension, so they layer without clashing.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/gen-music.mjs            # all zones
 *   ELEVENLABS_API_KEY=sk_... node scripts/gen-music.mjs ashchoir   # one zone
 *   ELEVENLABS_API_KEY=sk_... node scripts/gen-music.mjs ashchoir melody   # one stem
 *
 * Output: public/assets/zone_<zone>_ambient_{base,melody,tension}.mp3
 * (filenames match the manifest, so the AUDIO[...] entries need no change.)
 *
 * NOTE: I (the agent) can't aesthetically judge audio — run this, listen, and tell
 * me what to change in the prompts below; the loop is your-ears + my-prompts.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('Set ELEVENLABS_API_KEY (https://elevenlabs.io/app/settings/api-keys).');
  process.exit(1);
}

const ENDPOINT = 'https://api.elevenlabs.io/v1/music';
const MODEL = 'music_v1';
// Loop lengths (ms). The pad can be short; the songs want room to develop.
const LEN = { base: 30000, melody: 45000, tension: 40000 };

// Per-zone, per-stem prompts. Each zone fixes a key + tempo so the pad layers under
// the melody/combat tracks. Instrumental, looping game score — lonely, sacred, decaying.
const ZONES = {
  ashchoir: {
    base: 'instrumental ambient pad in D minor, sustained low choral drone and warm strings, no percussion, no rhythm, slow evolving, sacred and mournful, seamless loop, soft and subtle background bed',
    melody:
      'instrumental dark-fantasy exploration theme in D minor, around 70 bpm, a lonely grieving cello and sparse high choir over a low organ drone, distant ember crackle, slow and cinematic, sacred decaying cathedral, melancholic and beautiful, Dead Cells / Hollow Knight atmosphere, seamless loop',
    tension:
      'instrumental boss-fight battle music in D minor, around 130 bpm, driving low taiko-like drums, urgent dissonant choir stabs and tremolo strings, embers and fire, dramatic and dread-filled, climactic dark-fantasy combat, seamless loop',
  },
  glass_reliquary: {
    base: 'instrumental ambient pad in F-sharp minor, sustained crystalline glass and bell drone, cold and fragile, no percussion, no rhythm, sacred and lonely, seamless loop, subtle background bed',
    melody:
      'instrumental exploration theme in F-sharp minor, around 65 bpm, sparse shimmering glass-bell melody and a distant aching violin over a cold pad, memory-like and reverberant, lonely sacred ruin of singing glass, ethereal and beautiful, Dead Cells / Hollow Knight atmosphere, seamless loop',
    tension:
      'instrumental boss-fight music in F-sharp minor, around 125 bpm, sharp ringing glass percussion, dissonant high strings and a pounding low pulse, brittle shattering tension, cold and climactic dark-fantasy combat, seamless loop',
  },
  drowned_hymn: {
    base: 'instrumental ambient pad in C minor, deep muffled underwater drone with slow tidal swells, reverb-drenched, no percussion, no rhythm, drowned and sacred, seamless loop, subtle background bed',
    melody:
      'instrumental exploration theme in C minor, around 60 bpm, a muffled distant bell and slow drowned cello on the tide, reverberant and lonely, sunken cathedral beneath dark water, mournful and dreamlike, Dead Cells / Hollow Knight atmosphere, seamless loop',
    tension:
      'instrumental combat music in C minor, around 120 bpm, surging underwater pressure, groaning low brass and urgent muffled drums, foreboding and heavy, drowned dark-fantasy battle, seamless loop',
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.join(root, 'public', 'assets');
mkdirSync(outDir, { recursive: true });

const onlyZone = process.argv[2];
const onlyStem = process.argv[3];
const zones = onlyZone ? { [onlyZone]: ZONES[onlyZone] } : ZONES;

for (const [zone, stems] of Object.entries(zones)) {
  if (!stems) {
    console.error(`unknown zone "${onlyZone}" (one of: ${Object.keys(ZONES).join(', ')})`);
    process.exit(1);
  }
  const entries = onlyStem ? [[onlyStem, stems[onlyStem]]] : Object.entries(stems);
  for (const [stem, prompt] of entries) {
    if (!prompt) {
      console.error(`unknown stem "${onlyStem}" (one of: base, melody, tension)`);
      process.exit(1);
    }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt,
        music_length_ms: LEN[stem] ?? 40000,
        model_id: MODEL,
        force_instrumental: true,
      }),
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

console.log('\nDone. Manifest filenames are unchanged — these load as the zone beds.');
