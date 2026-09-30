// Turns a keyed pet image (transparent PNG from extract-object.mjs, 1024x1024) into the two layers
// the game uses: pet_<species>_fur (grayscale, tinted in code) and pet_<species>_face (eyes, nose,
// inner ears, hooves: everything coloured or dark, untinted, drawn on top). The pet is moved so its
// feet stand on y = 940 and it is centred horizontally (art request 10).
//
// Usage: node scripts/art/split-pet.mjs --src <keyed.png> --species cat --dir public/assets/pets
import { mkdirSync } from 'node:fs';
import { readPng, writePng, bbox } from './lib.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : []))
    .filter((p) => p.length),
);
for (const req of ['src', 'species', 'dir']) if (!args[req]) throw new Error(`missing --${req}`);
const FEET_Y = 940;

const img = readPng(args.src);
const { width: W, height: H, data } = img;
const vis = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) vis[i] = data[i * 4 + 3] > 128 ? 1 : 0;
const b = bbox(vis, W, H);
const dx = Math.round(W / 2 - (b.x + b.w / 2));
const dy = FEET_Y - (b.y + b.h - 1);

const fur = Buffer.alloc(W * H * 4);
const face = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const sx = x - dx;
    const sy = y - dy;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
    const p = (sy * W + sx) * 4;
    const a = data[p + 3];
    if (!a) continue;
    const r = data[p];
    const g = data[p + 1];
    const bl = data[p + 2];
    const sat = Math.max(r, g, bl) - Math.min(r, g, bl);
    const lum = 0.299 * r + 0.587 * g + 0.114 * bl;
    // Fur = light and nearly grey. Soft ramp so fur/face borders blend.
    const furW =
      Math.min(1, Math.max(0, (40 - sat) / 20)) * Math.min(1, Math.max(0, (lum - 110) / 30));
    const q = (y * W + x) * 4;
    // Fur layer covers the whole silhouette (grey base under the face parts).
    const l = Math.round(lum);
    fur[q] = fur[q + 1] = fur[q + 2] = l;
    fur[q + 3] = a;
    // Face layer: the non-fur parts in full colour.
    const fa = Math.round(a * (1 - furW));
    if (fa >= 8) {
      face[q] = r;
      face[q + 1] = g;
      face[q + 2] = bl;
      face[q + 3] = fa;
    }
  }
}
// Normalise fur so its typical colour becomes light grey (235): tints then look true.
const lums = [];
for (let i = 0; i < W * H; i++) if (fur[i * 4 + 3] === 255) lums.push(fur[i * 4]);
lums.sort((m, n) => m - n);
const ref = lums[Math.floor(lums.length * 0.6)] || 235;
for (let i = 0; i < W * H; i++) {
  if (!fur[i * 4 + 3]) continue;
  const v = Math.max(0, Math.min(255, Math.round((fur[i * 4] / ref) * 235)));
  fur[i * 4] = fur[i * 4 + 1] = fur[i * 4 + 2] = v;
}
mkdirSync(args.dir, { recursive: true });
const base = `${args.dir}/pet_${args.species}`;
writePng(`${base}_fur.png`, { width: W, height: H, data: fur }, { colorType: 4, deflateLevel: 9 });
writePng(`${base}_face.png`, { width: W, height: H, data: face });
console.log(`wrote ${base}_fur.png and _face.png (moved ${dx},${dy})`);
