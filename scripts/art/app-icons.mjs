// Builds the app icons from the ChatGPT app icon (full-bleed square, no key colour):
// public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png (180) and
// public/icon-maskable-512.png (art shrunk to 80% for the round safe zone, edges extended).
//
// Usage: node scripts/art/app-icons.mjs [assets/source/ui/app_icon-raw.png]
import { readPng, writePng } from './lib.mjs';

const src = readPng(process.argv[2] ?? 'assets/source/ui/app_icon-raw.png');
const { width: W, height: H, data } = src;

// Box filter from the source square, scaled by `zoom` around the centre; samples outside the
// source clamp to its edge, which extends the background gradient.
function icon(size, zoom = 1) {
  const out = Buffer.alloc(size * size * 4);
  const span = Math.min(W, H) / zoom;
  const ox0 = (W - span) / 2;
  const oy0 = (H - span) / 2;
  const step = span / size;
  const px = (x, y) => (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4;
  for (let oy = 0; oy < size; oy++) {
    const y0 = oy0 + oy * step;
    const y1 = y0 + step;
    for (let ox = 0; ox < size; ox++) {
      const x0 = ox0 + ox * step;
      const x1 = x0 + step;
      const s = [0, 0, 0];
      let sw = 0;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0);
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          const w = wy * (Math.min(x + 1, x1) - Math.max(x, x0));
          const p = px(x, y);
          for (let c = 0; c < 3; c++) s[c] += data[p + c] * w;
          sw += w;
        }
      }
      const q = (oy * size + ox) * 4;
      for (let c = 0; c < 3; c++) out[q + c] = Math.round(s[c] / sw);
      out[q + 3] = 255;
    }
  }
  return { width: size, height: size, data: out };
}

const opts = { colorType: 2, deflateLevel: 9 };
for (const [file, size, zoom] of [
  ['public/icon-192.png', 192, 1],
  ['public/icon-512.png', 512, 1],
  ['public/apple-touch-icon.png', 180, 1],
  ['public/icon-maskable-512.png', 512, 0.8],
]) {
  writePng(file, icon(size, zoom), opts);
  console.log(`wrote ${file}`);
}
