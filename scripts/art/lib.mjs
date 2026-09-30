// Shared helpers for art tooling: PNG IO, alpha analysis, masks. No dependencies besides pngjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

export const CANVAS = { width: 1024, height: 1536 };

export function readPng(path) {
  const png = PNG.sync.read(readFileSync(path));
  return { width: png.width, height: png.height, data: png.data, colorType: png.colorType };
}

// options: pngjs write options, e.g. { colorType: 4 } for grayscale + alpha (smaller files).
export function writePng(path, { width, height, data }, options = {}) {
  const png = new PNG({ width, height });
  png.data = Buffer.from(data);
  writeFileSync(path, PNG.sync.write(png, options));
}

export function alphaOf(img) {
  const a = new Uint8Array(img.width * img.height);
  for (let i = 0; i < a.length; i++) a[i] = img.data[i * 4 + 3];
  return a;
}

// Label 8-connected components of mask (Uint8Array 0/1). Returns { labels, sizes }.
export function components(mask, width, height) {
  const labels = new Int32Array(mask.length);
  const sizes = [0];
  const stack = [];
  let next = 1;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || labels[i]) continue;
    let size = 0;
    labels[i] = next;
    stack.push(i);
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % width;
      const y = (p - x) / width;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const q = ny * width + nx;
          if (mask[q] && !labels[q]) {
            labels[q] = next;
            stack.push(q);
          }
        }
      }
    }
    sizes.push(size);
    next++;
  }
  return { labels, sizes };
}

// Approximate Euclidean distance (chamfer 3-4, divided by 3) from every pixel to the nearest set pixel.
export function distanceTo(mask, width, height) {
  const INF = 1e9;
  const d = new Float64Array(mask.length);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 0 : INF;
  const at = (x, y) => (x < 0 || y < 0 || x >= width || y >= height ? INF : d[y * width + x]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      d[i] = Math.min(
        d[i],
        at(x - 1, y) + 3,
        at(x, y - 1) + 3,
        at(x - 1, y - 1) + 4,
        at(x + 1, y - 1) + 4,
      );
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      d[i] = Math.min(
        d[i],
        at(x + 1, y) + 3,
        at(x, y + 1) + 3,
        at(x + 1, y + 1) + 4,
        at(x - 1, y + 1) + 4,
      );
    }
  }
  for (let i = 0; i < d.length; i++) d[i] /= 3;
  return d;
}

// Alpha quality report used by both the master check and item validation.
export function alphaReport(img, { opaque = 240, edgePx = 3 } = {}) {
  const { width, height } = img;
  const a = alphaOf(img);
  const core = new Uint8Array(a.length);
  const any = new Uint8Array(a.length);
  let transparent = 0;
  let semi = 0;
  let full = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] >= opaque) core[i] = 1;
    if (a[i] > 0) any[i] = 1;
    if (a[i] === 0) transparent++;
    else if (a[i] === 255) full++;
    else semi++;
  }
  const dist = distanceTo(core, width, height);
  let halo = 0;
  let haloMaxAlpha = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] > 0 && a[i] < opaque && dist[i] > edgePx) {
      halo++;
      haloMaxAlpha = Math.max(haloMaxAlpha, a[i]);
    }
  }
  let border = 0;
  for (let x = 0; x < width; x++) border += (a[x] > 0) + (a[(height - 1) * width + x] > 0);
  for (let y = 0; y < height; y++) border += (a[y * width] > 0) + (a[y * width + width - 1] > 0);
  const { sizes } = components(any, width, height);
  const nonZero = a.length - transparent;
  return {
    width,
    height,
    hasAlphaChannel: img.colorType === 6 || img.colorType === 4,
    transparentShare: transparent / a.length,
    semiPixels: semi,
    semiShareOfVisible: nonZero ? semi / nonZero : 0,
    opaquePixels: full,
    haloPixels: halo,
    haloMaxAlpha,
    borderPixels: border,
    components: sizes.length - 1,
    largestComponent: Math.max(0, ...sizes.slice(1)),
  };
}

export function bbox(mask, width, height) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
