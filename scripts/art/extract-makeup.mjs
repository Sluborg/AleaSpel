// Extracts make-up or face paint drawn in the key blue (#2F6BFF) on the blank-face template.
// Because the template is known, each pixel is unmixed exactly: src = a * paint + (1 - a) * skin,
// so soft gradients (blush, eyeshadow) keep their full softness. Output is tintable: light grey
// (shading kept from the paint's luminance) with the unmixed alpha, registered to the master.
//
// Usage: node scripts/art/extract-makeup.mjs --src <raw.png> --category blush --id blush_round
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readPng, writePng, components, alphaReport } from './lib.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : []))
    .filter((p) => p.length),
);
for (const req of ['src', 'category', 'id']) if (!args[req]) throw new Error(`missing --${req}`);
const K = [0x2f, 0x6b, 0xff]; // nominal key, refined below

const wardrobe = JSON.parse(readFileSync('src/data/wardrobe.json', 'utf-8'));
const anchors = JSON.parse(readFileSync('public/assets/base/anchors.json', 'utf-8'));
const category = wardrobe.categories.find((c) => c.id === args.category);
if (!category) throw new Error(`unknown category ${args.category}`);
const layer = wardrobe.layers.find((l) => l.id === category.layer);

const src = readPng(args.src);
const skin = readPng('assets/source/face/face_blank-raw.png');
const body = readPng('public/assets/base/master.png');
const { width: W, height: H } = src;

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

// The painted blue is shaded and never exactly the key: estimate the paint colour from the pixels
// that are clearly paint (strong projection towards the nominal key), then unmix against that.
const project = (p, key) => {
  let num = 0;
  let den = 0;
  for (let c = 0; c < 3; c++) {
    const d = key[c] - skin.data[p + c];
    num += (src.data[p + c] - skin.data[p + c]) * d;
    den += d * d;
  }
  return num / den;
};
const strong = [0, 0, 0];
let nStrong = 0;
for (let y = r.top; y <= r.bottom; y++)
  for (let x = r.left; x <= r.right; x++) {
    const p = (y * W + x) * 4;
    if (project(p, K) > 0.6) {
      for (let c = 0; c < 3; c++) strong[c] += src.data[p + c];
      nStrong++;
    }
  }
if (nStrong > 30) for (let c = 0; c < 3; c++) K[c] = strong[c] / nStrong;
console.log('paint colour', K.map((v) => Math.round(v)).join(','), 'from', nStrong, 'px');

const alpha = new Float64Array(W * H);
const grey = new Float64Array(W * H);
for (let y = r.top; y <= r.bottom; y++) {
  for (let x = r.left; x <= r.right; x++) {
    const i = y * W + x;
    const p = i * 4;
    if (body.data[p + 3] < 255) continue;
    const raw = project(p, K);
    // Ignore tiny differences (template noise); treat near-full paint as solid.
    const a = raw < 0.08 ? 0 : raw > 0.85 ? 1 : Math.min(1, raw / 0.85);
    alpha[i] = a;
    if (a > 0.02) {
      const un = [0, 1, 2].map((c) => skin.data[p + c] + (src.data[p + c] - skin.data[p + c]) / a);
      const lum = 0.299 * un[0] + 0.587 * un[1] + 0.114 * un[2];
      grey[i] = Math.max(
        120,
        Math.min(255, (lum / (0.299 * K[0] + 0.587 * K[1] + 0.114 * K[2])) * 235),
      );
    }
  }
}
const vis = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) vis[i] = alpha[i] > 0 ? 1 : 0;
const { labels, sizes } = components(vis, W, H);
const out = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const a = Math.round(alpha[i] * 255);
  if (a < 10) continue;
  // Drop pixels that are not near a meaningful blob (stray template noise).
  if (sizes[labels[i]] < 150) continue;
  const g = Math.round(grey[i] || 235);
  out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = g;
  out[i * 4 + 3] = a;
}
const dir = `public/assets/wardrobe/${args.category}`;
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const file = `${dir}/${args.id}_tint.png`;
writePng(file, { width: W, height: H, data: out });
const rep = alphaReport(readPng(file));
console.log(`wrote ${file}`, {
  opaque: rep.opaquePixels,
  semi: rep.semiPixels,
  components: rep.components,
});
