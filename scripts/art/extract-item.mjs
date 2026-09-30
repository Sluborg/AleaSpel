// Extracts one wardrobe item from a "dressed" image: the master character wearing the item in the
// key colour (default bright pink #FF4FA3) on green. Keeps the item's pixels in place (registered
// to the master), removes everything else, and writes the full-colour and/or tintable PNG.
//
// Usage:
//   node scripts/art/extract-item.mjs --src assets/source/wardrobe/onepiece/x-raw.png \
//     --category onepiece --id x [--tint] [--key ff4fa3]
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readPng, writePng, components, bbox, alphaReport } from './lib.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) =>
      a.startsWith('--')
        ? [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]]
        : [],
    )
    .filter((p) => p.length),
);
for (const req of ['src', 'category', 'id']) if (!args[req]) throw new Error(`missing --${req}`);
const key = String(args.key ?? 'ff4fa3');
const K = [0, 2, 4].map((i) => parseInt(key.slice(i, i + 2), 16));

const wardrobe = JSON.parse(readFileSync('src/data/wardrobe.json', 'utf-8'));
const anchors = JSON.parse(readFileSync('public/assets/base/anchors.json', 'utf-8'));
const category = wardrobe.categories.find((c) => c.id === args.category);
if (!category) throw new Error(`unknown category ${args.category}`);
const layer = wardrobe.layers.find((l) => l.id === category.layer);

const src = readPng(args.src);
const raw = readPng('assets/source/base/master-raw.png');
const { width: W, height: H } = src;
if (W !== raw.width || H !== raw.height) throw new Error(`size ${W}x${H} differs from master`);

// 1. Registration check: character silhouettes must match the master.
const fgMask = (img) => {
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    m[i] = img.data[p + 1] - Math.max(img.data[p], img.data[p + 2]) < 60 ? 1 : 0;
  }
  return m;
};
const fa = fgMask(raw);
const fb = fgMask(src);
// Pixels in the key colour are the garment itself (loose clothes cover background), so they are
// left out of the comparison: only the rest of the character must match the master.
const isKey = (p) =>
  Math.abs(src.data[p] - K[0]) +
    Math.abs(src.data[p + 1] - K[1]) +
    Math.abs(src.data[p + 2] - K[2]) <
  150;
let inter = 0;
let union = 0;
for (let i = 0; i < fa.length; i++) {
  if (isKey(i * 4)) continue;
  inter += fa[i] & fb[i];
  union += fa[i] | fb[i];
}
const iou = inter / union;
const ba = bbox(fa, W, H);
// The item may stick out beyond the body (a headband above the head), so compare the character's
// bounding box without the key-coloured pixels.
const fbNoKey = fb.map((v, i) => (isKey(i * 4) ? 0 : v));
const bb = bbox(fbNoKey, W, H);
console.log(
  `registration: silhouette overlap ${(iou * 100).toFixed(1)}%, bbox master ${JSON.stringify(ba)} item ${JSON.stringify(bb)}`,
);
if (iou < 0.97 || Math.abs(ba.x - bb.x) > 3 || Math.abs(ba.y - bb.y) > 3) {
  throw new Error(
    'character moved or changed shape; regenerate the image (registration would be wrong)',
  );
}

// 2. Key-colour alpha: hue close to the key hue, saturation relative to the key.
const hsv = (r, g, b) => {
  const max = Math.max(r, g, b);
  const c = max - Math.min(r, g, b);
  let h = 0;
  if (c) {
    if (max === r) h = ((g - b) / c) % 6;
    else if (max === g) h = (b - r) / c + 2;
    else h = (r - g) / c + 4;
  }
  return { h: (h * 60 + 360) % 360, c };
};
const keyHsv = hsv(...K);
const satLo = 30;
const satHi = keyHsv.c * 0.7;
const alpha = new Float64Array(W * H);
for (let i = 0; i < W * H; i++) {
  const p = i * 4;
  const { h, c } = hsv(src.data[p], src.data[p + 1], src.data[p + 2]);
  const dh = Math.min(Math.abs(h - keyHsv.h), 360 - Math.abs(h - keyHsv.h));
  const hueW = dh <= 25 ? 1 : dh >= 45 ? 0 : 1 - (dh - 25) / 20;
  const satW = Math.max(0, Math.min(1, (c - satLo) / (satHi - satLo)));
  alpha[i] = hueW * satW;
}

// 3. Limit to the layer region and drop small islands.
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
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (y < r.top || y > r.bottom || x < r.left || x > r.right) alpha[y * W + x] = 0;
const vis = new Uint8Array(W * H);
for (let i = 0; i < vis.length; i++) vis[i] = alpha[i] > 0.04 ? 1 : 0;
const { labels, sizes } = components(vis, W, H);
for (let i = 0; i < vis.length; i++) if (!vis[i] || sizes[labels[i]] < 200) alpha[i] = 0;

// 4. Colour: solid pixels keep their colour; edge pixels take the nearest solid colour (no halo).
const out = Buffer.alloc(W * H * 4);
const solid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  if (alpha[i] >= 0.95) {
    solid[i] = 1;
    out[i * 4] = src.data[i * 4];
    out[i * 4 + 1] = src.data[i * 4 + 1];
    out[i * 4 + 2] = src.data[i * 4 + 2];
  }
}
for (let pass = 0; pass < 6; pass++) {
  const grown = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (solid[i] || alpha[i] === 0) continue;
      for (const n of [i - 1, i + 1, i - W, i + W]) {
        if (solid[n]) {
          grown.push([i, n]);
          break;
        }
      }
    }
  }
  for (const [i, n] of grown) {
    out.copy(out, i * 4, n * 4, n * 4 + 3);
    solid[i] = 1;
  }
}
for (let i = 0; i < W * H; i++) {
  let a = Math.round(alpha[i] * 255);
  if (a >= 243) a = 255;
  if (a < 10 || !solid[i]) a = 0;
  out[i * 4 + 3] = a;
  if (!a) out.fill(0, i * 4, i * 4 + 3);
}

const dir = `public/assets/wardrobe/${args.category}`;
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
if (args.tint) {
  // Grayscale, scaled so the item's typical colour becomes light grey (235).
  const lums = [];
  for (let i = 0; i < W * H; i++)
    if (out[i * 4 + 3] === 255)
      lums.push(0.299 * out[i * 4] + 0.587 * out[i * 4 + 1] + 0.114 * out[i * 4 + 2]);
  lums.sort((a, b) => a - b);
  const ref = lums[Math.floor(lums.length / 2)];
  for (let i = 0; i < W * H; i++) {
    if (!out[i * 4 + 3]) continue;
    const l = 0.299 * out[i * 4] + 0.587 * out[i * 4 + 1] + 0.114 * out[i * 4 + 2];
    out.fill(Math.max(0, Math.min(255, Math.round((l / ref) * 235))), i * 4, i * 4 + 3);
  }
}
const file = `${dir}/${args.id}${args.tint ? '_tint' : ''}.png`;
writePng(file, { width: W, height: H, data: out });
const rep = alphaReport(readPng(file));
console.log(`wrote ${file}`, {
  opaque: rep.opaquePixels,
  semi: rep.semiPixels,
  halo: rep.haloPixels,
  components: rep.components,
});
