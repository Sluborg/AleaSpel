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
// Top of the eye band (lashes start just above the eye anchor; the brows sit higher).
const eyeTop = anchors.points.eyeL.y - 4;

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
  if (sizes[labels[i]] < Number(args['min-blob'] ?? 150)) continue;
  const g = Math.round(grey[i] || 235);
  out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = g;
  out[i * 4 + 3] = a;
}
// Optional soft edges (--feather <px>): blur the alpha twice with a box of that radius, kept on
// the skin, so blush and eyeshadow fade out instead of ending in a hard line.
const feather = Number(args.feather ?? 0);
if (feather > 0) {
  let a = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) a[i] = out[i * 4 + 3];
  const pass = (src, dx, dy) => {
    const dst = new Float64Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let sum = 0;
        let n = 0;
        for (let k = -feather; k <= feather; k++) {
          const xx = x + k * dx;
          const yy = y + k * dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          sum += src[yy * W + xx];
          n++;
        }
        dst[y * W + x] = sum / n;
      }
    return dst;
  };
  for (let r = 0; r < 2; r++) a = pass(pass(a, 1, 0), 0, 1);
  for (let i = 0; i < W * H; i++) {
    const v = body.data[i * 4 + 3] === 255 ? Math.round(a[i]) : 0;
    if (v >= 6 && out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 235;
    out[i * 4 + 3] = v >= 6 ? v : 0;
  }
}
// Optional --max <0-1>: caps the strength so make-up stays see-through (Sminkbordet lowers it more).
// Optional --flat 1: one flat colour (shape only in the alpha), so the tint shows its true colour.
const maxA = Math.round(Number(args.max ?? 1) * 255);
for (let i = 0; i < W * H; i++) {
  if (out[i * 4 + 3] > maxA) out[i * 4 + 3] = maxA;
  if (args.flat && out[i * 4 + 3]) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255;
}
// Optional --cut-eyes 1 (eyeshadow): no paint on the eyes themselves. The eyes are where the
// master differs from the blank-face template inside the eye band; those pixels are cleared.
if (args['cut-eyes']) {
  const master = readPng('assets/source/base/master-raw.png');
  const blank = readPng('assets/source/face/face_blank-raw.png');
  const eye = new Uint8Array(W * H);
  for (let y = r.top; y <= r.bottom; y++)
    for (let x = r.left; x <= r.right; x++) {
      const i = y * W + x;
      const p = i * 4;
      const d =
        Math.abs(master.data[p] - blank.data[p]) +
        Math.abs(master.data[p + 1] - blank.data[p + 1]) +
        Math.abs(master.data[p + 2] - blank.data[p + 2]);
      // Eye whites, iris and lashes, but not soft skin noise or the brows above.
      if (d > 60 && y > eyeTop) eye[i] = 1;
    }
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (eye[i] || eye[i - 1] || eye[i + 1] || eye[i - W] || eye[i + W]) out[i * 4 + 3] = 0;
    }
}
// Final clean-up: drop tiny islands left by the cuts above (validate:art rejects specks).
{
  const vis2 = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) vis2[i] = out[i * 4 + 3] > 0 ? 1 : 0;
  const { labels: l2, sizes: s2 } = components(vis2, W, H);
  const minIsland = Math.min(40, Number(args['min-blob'] ?? 40));
  for (let i = 0; i < W * H; i++) if (vis2[i] && s2[l2[i]] < minIsland) out[i * 4 + 3] = 0;
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
