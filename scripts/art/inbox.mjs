// Technical gate for images ChatGPT uploaded to the art-inbox branch.
// Checks canvas size, flat green background and (for template-based items) that nothing outside
// the item changed. Writes a contact sheet for the visual review.
//
// Usage (after `git fetch origin art-inbox` and checking out its art-inbox/ folder):
//   node scripts/art/inbox.mjs art-inbox/B2 [--sheet out.png]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readPng, writePng } from './lib.mjs';

const dir = process.argv[2];
const sheetArg = process.argv.indexOf('--sheet');
const sheetPath = sheetArg > 0 ? process.argv[sheetArg + 1] : null;
if (!dir || !existsSync(dir))
  throw new Error('usage: inbox.mjs <art-inbox/batch> [--sheet out.png]');

// Fallback upload format: base64 text, whole (`<id>.png.b64`) or in parts (`<id>.png.b64.001`,
// `.002`, ...). Decode into `<id>.png` before checking.
const parts = {};
for (const f of readdirSync(dir)) {
  const m = /^(.+\.png)\.b64(?:\.(\d+))?$/.exec(f);
  if (m) (parts[m[1]] ??= []).push([Number(m[2] ?? 0), f]);
}
for (const [png, list] of Object.entries(parts)) {
  const b64 = list
    .sort((a, b) => a[0] - b[0])
    .map(([, f]) => readFileSync(`${dir}/${f}`, 'utf-8').replace(/\s+/g, ''))
    .join('');
  writeFileSync(`${dir}/${png}`, Buffer.from(b64, 'base64'));
  console.log(`decoded ${png} from ${list.length} base64 part(s)`);
}

const TEMPLATES = {
  face: 'assets/source/face/face_blank-raw.png',
  master: 'assets/source/base/master-raw.png',
};
// Template and canvas by id prefix. Anything else: 1024x1024 standalone object.
const KIND = [
  [/^(eyes|brows|mouth|blush|lips|shadow|paint)_/, { canvas: [1024, 1536], template: 'face' }],
  [
    /^(tshirt|shorts|dress|jacket|slippers|socks|leotard|skirt|top|shoes)_/,
    { canvas: [1024, 1536], template: 'master' },
  ],
  [/^(pet|food|toy|furn)_/, { canvas: [1024, 1024], template: null }],
];
const kindOf = (id) => KIND.find(([re]) => re.test(id))?.[1] ?? { canvas: [1024, 1024] };

// Background key: flat green, or flat magenta for green objects (plants).
const isGreen = (d, p) =>
  (d[p + 1] > 180 && d[p] < 90 && d[p + 2] < 90) || (d[p] > 180 && d[p + 2] > 180 && d[p + 1] < 90);
const cache = {};
const results = [];
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith('.png'))
  .sort()) {
  const id = file.replace(/\.png$/, '');
  const kind = kindOf(id);
  const img = readPng(`${dir}/${file}`);
  const problems = [];
  const [cw, ch] = kind.canvas;
  // Template items must match the template pixel for pixel. Standalone objects are scaled later,
  // so any size with the right aspect ratio and at least the requested size is fine.
  const exact = img.width === cw && img.height === ch;
  const scalable =
    !kind.template && img.width >= cw && Math.abs(img.width / img.height - cw / ch) < 0.01;
  if (!exact && !scalable) problems.push(`canvas ${img.width}x${img.height}, expected ${cw}x${ch}`);
  // Background: the border must be flat green.
  let border = 0;
  let green = 0;
  for (let x = 0; x < img.width; x++)
    for (const y of [0, img.height - 1]) {
      border++;
      if (isGreen(img.data, (y * img.width + x) * 4)) green++;
    }
  if (green / border < 0.98)
    problems.push(`border only ${((green / border) * 100).toFixed(0)}% key colour`);
  // Template items: pixels far from the character's face/body centre must not change.
  if (kind.template && !problems.length) {
    const t = (cache[kind.template] ??= readPng(TEMPLATES[kind.template]));
    let changed = 0;
    let total = 0;
    for (let i = 0; i < img.width * img.height; i++) {
      const p = i * 4;
      const d = Math.max(
        Math.abs(img.data[p] - t.data[p]),
        Math.abs(img.data[p + 1] - t.data[p + 1]),
        Math.abs(img.data[p + 2] - t.data[p + 2]),
      );
      total++;
      if (d > 60) changed++;
    }
    const share = changed / total;
    // Face parts change a tiny area; clothes change more but never most of the canvas.
    const limit = kind.template === 'face' ? 0.02 : 0.25;
    if (share > limit)
      problems.push(`${(share * 100).toFixed(1)}% of pixels changed (character moved or redrawn?)`);
  }
  results.push({ id, ok: !problems.length, problems, img });
  console.log(
    `${problems.length ? 'FAIL' : 'ok  '} ${id}${problems.length ? ': ' + problems.join('; ') : ''}`,
  );
}

if (sheetPath && results.length) {
  // Contact sheet: 256 px wide thumbnails, 4 per row.
  const TW = 256;
  const cols = 4;
  const rows = Math.ceil(results.length / cols);
  const TH = 384;
  const W = TW * cols;
  const H = TH * rows;
  const out = Buffer.alloc(W * H * 4, 255);
  results.forEach(({ img }, k) => {
    const s = Math.max(img.width / TW, img.height / TH);
    const ox = (k % cols) * TW;
    const oy = Math.floor(k / cols) * TH;
    for (let y = 0; y < TH; y++)
      for (let x = 0; x < TW; x++) {
        const sx = Math.floor(x * s);
        const sy = Math.floor(y * s);
        if (sx >= img.width || sy >= img.height) continue;
        img.data.copy(
          out,
          ((oy + y) * W + ox + x) * 4,
          (sy * img.width + sx) * 4,
          (sy * img.width + sx) * 4 + 4,
        );
        out[((oy + y) * W + ox + x) * 4 + 3] = 255;
      }
  });
  writePng(sheetPath, { width: W, height: H, data: out });
  console.log(`sheet: ${sheetPath}`);
}
process.exit(results.some((r) => !r.ok) ? 1 : 0);
