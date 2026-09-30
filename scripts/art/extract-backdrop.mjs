// Turns a ChatGPT backdrop (full-bleed, no key colour, 1024x1536) into a game backdrop: centre crop
// to 9:16 and box-filter down to 720x1280, opaque.
//
// Usage: node scripts/art/extract-backdrop.mjs --src <raw.png> --out public/assets/backdrops/bg_x.png
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { readPng, writePng } from './lib.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : []))
    .filter((p) => p.length),
);
for (const req of ['src', 'out']) if (!args[req]) throw new Error(`missing --${req}`);
const OW = 720;
const OH = 1280;
const img = readPng(args.src);
const { width: W, height: H, data } = img;
let cw = W;
let ch = Math.round((W * OH) / OW);
if (ch > H) {
  ch = H;
  cw = Math.round((H * OW) / OH);
}
const cx = (W - cw) / 2;
const cy = (H - ch) / 2;
const out = Buffer.alloc(OW * OH * 4);
for (let oy = 0; oy < OH; oy++) {
  const y0 = cy + (oy * ch) / OH;
  const y1 = cy + ((oy + 1) * ch) / OH;
  for (let ox = 0; ox < OW; ox++) {
    const x0 = cx + (ox * cw) / OW;
    const x1 = cx + ((ox + 1) * cw) / OW;
    const s = [0, 0, 0];
    let sw = 0;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      const wy = Math.min(y + 1, y1) - Math.max(y, y0);
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        const w = wy * (Math.min(x + 1, x1) - Math.max(x, x0));
        const p = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) s[c] += data[p + c] * w;
        sw += w;
      }
    }
    const q = (oy * OW + ox) * 4;
    for (let c = 0; c < 3; c++) out[q + c] = Math.round(s[c] / sw);
    out[q + 3] = 255;
  }
}
mkdirSync(dirname(args.out), { recursive: true });
writePng(args.out, { width: OW, height: OH, data: out }, { colorType: 2, deflateLevel: 9 });
console.log(`wrote ${args.out} (${OW}x${OH}, crop ${cw}x${ch})`);
