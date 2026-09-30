// One-off: turn the green-screen master (master-raw.png) into a transparent master.png.
// Character pixels are kept; only green is removed and spill is neutralized. No resize, no move.
// Run: node scripts/art/key-master.mjs
import { readPng, writePng, components, alphaReport } from './lib.mjs';

const SRC = 'assets/source/base/master-raw.png';
const OUT = 'assets/source/base/master.png';

const img = readPng(SRC);
const { width, height, data } = img;
const n = width * height;

// Background green = mean of clearly-green pixels.
let bg = [0, 0, 0];
let count = 0;
for (let i = 0; i < n; i++) {
  const r = data[i * 4];
  const g = data[i * 4 + 1];
  const b = data[i * 4 + 2];
  if (g - Math.max(r, b) > 200) {
    bg[0] += r;
    bg[1] += g;
    bg[2] += b;
    count++;
  }
}
bg = bg.map((v) => v / count);
const bgExcess = bg[1] - Math.max(bg[0], bg[2]);

// Green excess (G - max(R, B)) is ~0 or negative on the character and ~bgExcess on the background.
const FG = 12;
const BG = bgExcess - 30;
const out = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {
  const p = i * 4;
  let r = data[p];
  let g = data[p + 1];
  let b = data[p + 2];
  const excess = g - Math.max(r, b);
  let a = excess <= FG ? 1 : excess >= BG ? 0 : 1 - (excess - FG) / (BG - FG);
  if (a > 0 && a < 1) {
    // Unmix from the background, then remove remaining green spill.
    r = (r - (1 - a) * bg[0]) / a;
    g = (g - (1 - a) * bg[1]) / a;
    b = (b - (1 - a) * bg[2]) / a;
    g = Math.min(g, Math.max(r, b));
  } else if (a === 1 && excess > 0) {
    g = Math.max(r, b); // light spill on solid edge pixels
  }
  let alpha = Math.round(a * 255);
  if (alpha < 10) alpha = 0;
  if (alpha > 245) alpha = 255;
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  out[p] = alpha ? clamp(r) : 0;
  out[p + 1] = alpha ? clamp(g) : 0;
  out[p + 2] = alpha ? clamp(b) : 0;
  out[p + 3] = alpha;
}

// Keep only the character (largest connected component), drop specks.
const visible = new Uint8Array(n);
for (let i = 0; i < n; i++) visible[i] = out[i * 4 + 3] > 0 ? 1 : 0;
const { labels, sizes } = components(visible, width, height);
let main = 1;
for (let l = 1; l < sizes.length; l++) if (sizes[l] > sizes[main]) main = l;
let dropped = 0;
for (let i = 0; i < n; i++) {
  if (labels[i] && labels[i] !== main) {
    out.fill(0, i * 4, i * 4 + 4);
    dropped++;
  }
}

writePng(OUT, { width, height, data: out });
console.log('background rgb', bg.map((v) => v.toFixed(1)).join(','), 'specks removed px', dropped);
console.log(alphaReport(readPng(OUT)));
