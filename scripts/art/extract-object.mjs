// Extracts a standalone object (furniture, pet, icon, ...) from a ChatGPT image on a flat key
// background (green, or magenta for green objects). Removes the key with spill suppression, keeps
// the object, and scales the whole canvas down to the requested size (premultiplied box filter).
//
// Usage:
//   node scripts/art/extract-object.mjs --src <raw.png> --out public/assets/furniture/furn_bed.png \
//     [--size 512] [--height <px, default = size>]
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { readPng, writePng, components, alphaReport } from './lib.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : []))
    .filter((p) => p.length),
);
for (const req of ['src', 'out']) if (!args[req]) throw new Error(`missing --${req}`);
const OW = Number(args.size ?? 512);
const OH = Number(args.height ?? OW);

const img = readPng(args.src);
const { width: W, height: H, data } = img;
const n = W * H;

// Key colour = mean of the border pixels; green or magenta decides the "excess" measure.
let bg = [0, 0, 0];
let cnt = 0;
for (let x = 0; x < W; x++)
  for (const y of [0, H - 1]) {
    const p = (y * W + x) * 4;
    for (let c = 0; c < 3; c++) bg[c] += data[p + c];
    cnt++;
  }
bg = bg.map((v) => v / cnt);
const magenta = bg[0] > 150 && bg[2] > 150 && bg[1] < 100;
const excessOf = (r, g, b) => (magenta ? Math.min(r, b) - g : g - Math.max(r, b));
const bgExcess = excessOf(...bg);
const FG = 12;
const BG = bgExcess - 40;

const out = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {
  const p = i * 4;
  let r = data[p];
  let g = data[p + 1];
  let b = data[p + 2];
  const e = excessOf(r, g, b);
  const a = e <= FG ? 1 : e >= BG ? 0 : 1 - (e - FG) / (BG - FG);
  if (a > 0 && a < 1) {
    r = (r - (1 - a) * bg[0]) / a;
    g = (g - (1 - a) * bg[1]) / a;
    b = (b - (1 - a) * bg[2]) / a;
  }
  // Spill suppression: never let the key channel(s) exceed the others.
  if (a > 0) {
    if (magenta) {
      const m = Math.max(g, (r + b) / 2 - 0);
      if (e > 0) {
        r = Math.min(r, m + 10);
        b = Math.min(b, m + 10);
      }
    } else if (e > 0) g = Math.max(r, b);
  }
  let alpha = Math.round(a * 255);
  if (alpha < 10) alpha = 0;
  if (alpha > 245) alpha = 255;
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  out[p] = alpha ? cl(r) : 0;
  out[p + 1] = alpha ? cl(g) : 0;
  out[p + 2] = alpha ? cl(b) : 0;
  out[p + 3] = alpha;
}

// Keep parts of meaningful size (drop specks and stray key-noise islands).
const vis = new Uint8Array(n);
for (let i = 0; i < n; i++) vis[i] = out[i * 4 + 3] > 0 ? 1 : 0;
const { labels, sizes } = components(vis, W, H);
const biggest = Math.max(...sizes.slice(1));
for (let i = 0; i < n; i++)
  if (labels[i] && sizes[labels[i]] < Math.max(200, biggest * 0.002)) out.fill(0, i * 4, i * 4 + 4);

// Centre-crop to the output aspect ratio, then box-filter down (premultiplied alpha).
const aspect = OW / OH;
let cw = W;
let ch = Math.round(W / aspect);
if (ch > H) {
  ch = H;
  cw = Math.round(H * aspect);
}
const cx = Math.floor((W - cw) / 2);
const cy = Math.floor((H - ch) / 2);
const res = Buffer.alloc(OW * OH * 4);
for (let oy = 0; oy < OH; oy++) {
  const y0 = cy + (oy * ch) / OH;
  const y1 = cy + ((oy + 1) * ch) / OH;
  for (let ox = 0; ox < OW; ox++) {
    const x0 = cx + (ox * cw) / OW;
    const x1 = cx + ((ox + 1) * cw) / OW;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let sa = 0;
    let sw = 0;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      const wy = Math.min(y + 1, y1) - Math.max(y, y0);
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        const w = wy * (Math.min(x + 1, x1) - Math.max(x, x0));
        const p = (y * W + x) * 4;
        const a = out[p + 3] / 255;
        sr += out[p] * a * w;
        sg += out[p + 1] * a * w;
        sb += out[p + 2] * a * w;
        sa += a * w;
        sw += w;
      }
    }
    const q = (oy * OW + ox) * 4;
    const A = sa / sw;
    if (A * 255 < 3) continue;
    res[q] = Math.round(sr / sa);
    res[q + 1] = Math.round(sg / sa);
    res[q + 2] = Math.round(sb / sa);
    res[q + 3] = Math.round(A * 255);
  }
}
mkdirSync(dirname(args.out), { recursive: true });
writePng(args.out, { width: OW, height: OH, data: res });
const rep = alphaReport(readPng(args.out));
console.log(`wrote ${args.out} (${magenta ? 'magenta' : 'green'} key)`, {
  opaque: rep.opaquePixels,
  semi: rep.semiPixels,
  components: rep.components,
  border: rep.borderPixels,
});
