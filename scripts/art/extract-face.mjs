// Extracts one face part (eyes, brows, mouth) from an image made on the blank-face template
// (assets/source/face/face_blank-raw.png). Keeps every pixel that differs from the template, plus
// template skin where the master's own feature sits, so the part fully replaces the master's
// feature when drawn on top of it. Output is registered to the master (1024x1536, full colour).
//
// Usage:
//   node scripts/art/extract-face.mjs --src assets/source/face/eyes/eyes_round-raw.png \
//     --category eyes --id eyes_round
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readPng, writePng, components, alphaReport } from './lib.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : []))
    .filter((p) => p.length),
);
for (const req of ['src', 'category', 'id']) if (!args[req]) throw new Error(`missing --${req}`);

const wardrobe = JSON.parse(readFileSync('src/data/wardrobe.json', 'utf-8'));
const anchors = JSON.parse(readFileSync('public/assets/base/anchors.json', 'utf-8'));
const category = wardrobe.categories.find((c) => c.id === args.category);
if (!category) throw new Error(`unknown category ${args.category}`);
const layer = wardrobe.layers.find((l) => l.id === category.layer);

const src = readPng(args.src);
const blank = readPng('assets/source/face/face_blank-raw.png');
const master = readPng('assets/source/base/master-raw.png');
const { width: W, height: H } = src;
if (W !== blank.width || H !== blank.height)
  throw new Error(`size ${W}x${H} differs from template`);

// Per-pixel colour difference (max channel) between two images.
const diff = (a, b) => {
  const d = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    d[i] = Math.max(
      Math.abs(a.data[p] - b.data[p]),
      Math.abs(a.data[p + 1] - b.data[p + 1]),
      Math.abs(a.data[p + 2] - b.data[p + 2]),
    );
  }
  return d;
};
const ramp = (v, lo, hi) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

// 1. Registration check: outside the face the image must match the template.
const dAll = diff(src, blank);
let changed = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) if ((y < 140 || y > 380) && dAll[y * W + x] > 60) changed++;
console.log(`registration: ${changed} px changed outside the face`);
if (changed > 8000) throw new Error('image differs from the template outside the face; regenerate');

// 2. Layer region from anchors.
const resolve = (e) => {
  if (typeof e === 'number') return e;
  const m = /^([A-Za-z]+)\.([a-z]+)([+-]\d+)?$/.exec(e);
  const box = anchors.bbox;
  const refs = {
    ...anchors.points,
    bbox: { left: box.x, right: box.x + box.w - 1, top: box.y, bottom: box.y + box.h - 1 },
  };
  return refs[m[1]][m[2]] + Number(m[3] ?? 0);
};
const r = Object.fromEntries(Object.entries(layer.region).map(([k, v]) => [k, resolve(v)]));
const inside = (x, y) => y >= r.top && y <= r.bottom && x >= r.left && x <= r.right;

// 3. Alpha: the new part (differs from the template) ...
const alpha = new Float64Array(W * H);
for (let i = 0; i < W * H; i++) alpha[i] = ramp(dAll[i], 14, 40);
// ... plus a skin patch over the master's own feature, grown 4 px and feathered.
const dMaster = diff(master, blank);
let cover = new Float64Array(W * H);
for (let i = 0; i < W * H; i++) cover[i] = dMaster[i] > 20 ? 1 : 0;
for (let pass = 0; pass < 4; pass++) {
  const next = Float64Array.from(cover);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (cover[i]) continue;
      const n = Math.max(cover[i - 1], cover[i + 1], cover[i - W], cover[i + W]);
      if (n) next[i] = n - 0.2;
    }
  cover = next;
}
for (let i = 0; i < W * H; i++) alpha[i] = Math.max(alpha[i], cover[i]);
// Feather the region border so the patch blends into the skin.
const edge = 4;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!inside(x, y)) {
      alpha[i] = 0;
      continue;
    }
    const d = Math.min(y - r.top, r.bottom - y, x - r.left, r.right - x);
    if (d < edge) alpha[i] *= (d + 1) / (edge + 1);
  }

// Never outside the body: clip to the master's alpha.
const body = readPng('public/assets/base/master.png');
for (let i = 0; i < W * H; i++) alpha[i] *= body.data[i * 4 + 3] === 255 ? 1 : 0;

// 4. Drop small islands and hair/ear noise outside the main shapes.
const vis = new Uint8Array(W * H);
for (let i = 0; i < vis.length; i++) vis[i] = alpha[i] > 0.04 ? 1 : 0;
const { labels, sizes } = components(vis, W, H);
for (let i = 0; i < vis.length; i++) if (!vis[i] || sizes[labels[i]] < 200) alpha[i] = 0;

// 5. Colour from the source, shifted by a smooth offset so the template skin blends into the
// master's skin (seamless cloning: the offset is harmonic inside the part and equals
// master - source on its border).
const inPart = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) inPart[i] = alpha[i] * 255 >= 10 ? 1 : 0;
const offset = [0, 1, 2].map(() => new Float64Array(W * H));
for (let i = 0; i < W * H; i++)
  if (!inPart[i])
    for (let c = 0; c < 3; c++) offset[c][i] = master.data[i * 4 + c] - src.data[i * 4 + c];
const partPixels = [];
for (let y = 1; y < H - 1; y++)
  for (let x = 1; x < W - 1; x++) if (inPart[y * W + x]) partPixels.push(y * W + x);
for (let iter = 0; iter < 1500; iter++)
  for (const o of offset)
    for (const i of partPixels) o[i] = (o[i - 1] + o[i + 1] + o[i - W] + o[i + W]) / 4;
const out = Buffer.alloc(W * H * 4);
for (const i of partPixels) {
  let a = Math.round(alpha[i] * 255);
  if (a >= 243) a = 255;
  for (let c = 0; c < 3; c++)
    out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(src.data[i * 4 + c] + offset[c][i])));
  out[i * 4 + 3] = a;
}

const dir = `public/assets/wardrobe/${args.category}`;
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const file = `${dir}/${args.id}.png`;
writePng(file, { width: W, height: H, data: out });
const rep = alphaReport(readPng(file));
console.log(`wrote ${file}`, {
  opaque: rep.opaquePixels,
  semi: rep.semiPixels,
  halo: rep.haloPixels,
  components: rep.components,
});
