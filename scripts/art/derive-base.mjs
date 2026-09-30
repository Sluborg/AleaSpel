// Derives technical data from the master: silhouette mask, anchor points, debug overlay.
// Run: node scripts/art/derive-base.mjs
// "l" / "r" in anchor names mean image left / image right (the character's right / left).
import { writeFileSync, mkdirSync } from 'node:fs';
import { readPng, writePng, bbox } from './lib.mjs';

const DIR = 'assets/source/base';
const master = readPng(`${DIR}/master.png`);
const { width: W, height: H, data } = master;
const px = (x, y) => (y * W + x) * 4;
const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && data[px(x, y) + 3] >= 128;
const isGrey = (x, y) => {
  const p = px(x, y);
  const r = data[p];
  const g = data[p + 1];
  const b = data[p + 2];
  return solid(x, y) && Math.max(r, g, b) - Math.min(r, g, b) < 20 && r > 150;
};
const lum = (x, y) => {
  const p = px(x, y);
  return 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
};

// Silhouette mask.
const maskBits = new Uint8Array(W * H);
const maskImg = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const on = data[i * 4 + 3] >= 128;
  maskBits[i] = on ? 1 : 0;
  maskImg.fill(on ? 255 : 0, i * 4, i * 4 + 3);
  maskImg[i * 4 + 3] = 255;
}
writePng(`${DIR}/mask.png`, { width: W, height: H, data: maskImg });

const box = bbox(maskBits, W, H);
const cx = Math.round(box.x + box.w / 2);

function runs(y) {
  const out = [];
  let start = -1;
  for (let x = 0; x <= W; x++) {
    const on = x < W && solid(x, y);
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      out.push({ x0: start, x1: x - 1, w: x - start });
      start = -1;
    }
  }
  return out;
}
const centralRun = (y) => runs(y).find((r) => r.x0 <= cx && r.x1 >= cx);
const argmin = (y0, y1, f) => {
  let best = y0;
  for (let y = y0; y <= y1; y++) if (f(y) < f(best)) best = y;
  return best;
};
const argmax = (y0, y1, f) => argmin(y0, y1, (y) => -f(y));
const width = (y) => centralRun(y)?.w ?? 0;
const pt = (x, y) => ({ x: Math.round(x), y: Math.round(y) });

// Head, neck, shoulders.
let headTop = box.y;
while (!solid(cx, headTop)) headTop++;
const neckY = argmin(headTop + 180, headTop + 320, width);
const neckW = width(neckY);
let chinY = neckY;
while (width(chinY) < neckW * 1.25) chinY--;
let necklineY = headTop;
while (!isGrey(cx, necklineY)) necklineY++;
let armpitY = necklineY;
while (runs(armpitY).length < 3) armpitY++;
let shoulderY = neckY;
while (width(shoulderY) < 0.85 * width(armpitY - 1)) shoulderY++;
const sh = centralRun(shoulderY);

// Torso.
let crotchY = armpitY;
while (solid(cx, crotchY)) crotchY++;
const torso = (y) => {
  const rs = runs(y);
  return rs.find((r) => r.x0 <= cx && r.x1 >= cx);
};
const waistY = argmin(armpitY + 40, crotchY - 60, (y) => torso(y)?.w ?? 1e9);
const hipY = argmax(waistY, crotchY - 1, (y) => torso(y)?.w ?? 0);
const waist = torso(waistY);
const hip = torso(hipY);

// Legs: runs below the crotch inside the hip span.
const soleY = box.y + box.h - 1;
const legRun = (y, side) =>
  runs(y).find((r) => (side === 'l' ? r.x1 < cx && r.x1 > hip.x0 : r.x0 > cx && r.x0 < hip.x1));
const legW = (side) => (y) => legRun(y, side)?.w ?? 1e9;
const leg = (side) => {
  const span = soleY - crotchY;
  const kneeY = argmin(
    crotchY + Math.round(span * 0.35),
    crotchY + Math.round(span * 0.6),
    legW(side),
  );
  const ankleY = argmin(
    crotchY + Math.round(span * 0.8),
    crotchY + Math.round(span * 0.93),
    legW(side),
  );
  const k = legRun(kneeY, side);
  const a = legRun(ankleY, side);
  // Foot centroid below the ankle.
  let sx = 0;
  let sy = 0;
  let n = 0;
  let bottom = ankleY;
  for (let y = ankleY; y <= soleY; y++) {
    const r = legRun(y, side);
    if (!r) continue;
    bottom = y;
    for (let x = r.x0; x <= r.x1; x++) {
      sx += x;
      sy += y;
      n++;
    }
  }
  // Lowest unitard pixel on this leg (cuff).
  let cuffY = ankleY;
  for (let y = kneeY; y <= soleY; y++) {
    const r = legRun(y, side);
    if (r && isGrey(Math.round((r.x0 + r.x1) / 2), y)) cuffY = y;
  }
  return {
    knee: pt((k.x0 + k.x1) / 2, kneeY),
    ankle: pt((a.x0 + a.x1) / 2, ankleY),
    cuff: pt((a.x0 + a.x1) / 2, cuffY),
    foot: pt(sx / n, sy / n),
    sole: pt(sx / n, bottom),
  };
};

// Arms: runs outside the torso, from the armpit down.
const armRun = (y, side) => {
  const rs = runs(y);
  return side === 'l'
    ? rs.find((r) => r.x1 < cx && r.x0 < hip.x0 - 20 && !(r.x0 <= cx && r.x1 >= cx))
    : [...rs].reverse().find((r) => r.x0 > cx && r.x1 > hip.x1 + 20 && !(r.x0 <= cx && r.x1 >= cx));
};
const arm = (side) => {
  let wristY = armpitY;
  let tipY = armpitY;
  for (let y = armpitY; y < soleY; y++) {
    const r = armRun(y, side);
    if (!r) continue;
    tipY = y;
    let grey = false;
    for (let x = r.x0; x <= r.x1; x++) if (isGrey(x, y)) grey = true;
    if (grey) wristY = y;
  }
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = wristY + 1; y <= tipY; y++) {
    const r = armRun(y, side);
    if (!r) continue;
    for (let x = r.x0; x <= r.x1; x++) {
      sx += x;
      sy += y;
      n++;
    }
  }
  const w = armRun(wristY, side);
  return {
    wrist: pt((w.x0 + w.x1) / 2, wristY),
    hand: pt(sx / n, sy / n),
    fingertips: pt(sx / n, tipY),
  };
};

// Eyes: dark pixel clusters in the upper face.
const eye = (side) => {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = headTop + 80; y < chinY - 40; y++) {
    const r = centralRun(y);
    if (!r) continue;
    for (let x = r.x0 + 20; x <= r.x1 - 20; x++) {
      if ((side === 'l' ? x < cx - 15 : x > cx + 15) && lum(x, y) < 70) {
        sx += x;
        sy += y;
        n++;
      }
    }
  }
  return pt(sx / n, sy / n);
};

const L = { leg: leg('l'), arm: arm('l'), eye: eye('l') };
const R = { leg: leg('r'), arm: arm('r'), eye: eye('r') };
const eyeLineY = (L.eye.y + R.eye.y) / 2;

const anchors = {
  canvas: { width: W, height: H },
  bbox: box,
  centerX: cx,
  note: 'Measured from master.png by scripts/art/derive-base.mjs. l/r = image left/right.',
  points: {
    headTop: pt(cx, headTop),
    eyeL: L.eye,
    eyeR: R.eye,
    faceCenter: pt(cx, (eyeLineY + chinY) / 2),
    chin: pt(cx, chinY),
    neck: pt(cx, neckY),
    neckline: pt(cx, necklineY),
    shoulderL: pt(sh.x0, shoulderY),
    shoulderR: pt(sh.x1, shoulderY),
    armpitL: pt(torso(armpitY).x0, armpitY),
    armpitR: pt(torso(armpitY).x1, armpitY),
    waist: pt(cx, waistY),
    waistL: pt(waist.x0, waistY),
    waistR: pt(waist.x1, waistY),
    hipL: pt(hip.x0, hipY),
    hipR: pt(hip.x1, hipY),
    crotch: pt(cx, crotchY),
    wristL: L.arm.wrist,
    wristR: R.arm.wrist,
    handL: L.arm.hand,
    handR: R.arm.hand,
    fingertipsL: L.arm.fingertips,
    fingertipsR: R.arm.fingertips,
    kneeL: L.leg.knee,
    kneeR: R.leg.knee,
    ankleL: L.leg.ankle,
    ankleR: R.leg.ankle,
    cuffL: L.leg.cuff,
    cuffR: R.leg.cuff,
    footL: L.leg.foot,
    footR: R.leg.foot,
    soleL: L.leg.sole,
    soleR: R.leg.sole,
  },
  widths: { neck: neckW, waist: waist.w, hip: hip.w, shoulders: sh.w },
};
writeFileSync(`${DIR}/anchors.json`, JSON.stringify(anchors, null, 2) + '\n');
mkdirSync('public/assets/base', { recursive: true });
writeFileSync('public/assets/base/anchors.json', JSON.stringify(anchors, null, 2) + '\n');

// Debug overlay: master on dark background, bbox, mask outline, anchor dots.
const dbg = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const a = data[i * 4 + 3] / 255;
  const bg = [30, 20, 50];
  for (let c = 0; c < 3; c++) dbg[i * 4 + c] = Math.round(data[i * 4 + c] * a + bg[c] * (1 - a));
  dbg[i * 4 + 3] = 255;
}
const set = (x, y, [r, g, b]) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = px(x, y);
  dbg[p] = r;
  dbg[p + 1] = g;
  dbg[p + 2] = b;
};
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const on = maskBits[y * W + x];
    if (
      on &&
      (!maskBits[y * W + x - 1] ||
        !maskBits[y * W + x + 1] ||
        !maskBits[(y - 1) * W + x] ||
        !maskBits[(y + 1) * W + x])
    )
      set(x, y, [0, 255, 255]);
  }
}
for (let x = box.x; x < box.x + box.w; x++) {
  set(x, box.y, [255, 255, 0]);
  set(x, box.y + box.h - 1, [255, 255, 0]);
}
for (let y = box.y; y < box.y + box.h; y++) {
  set(box.x, y, [255, 255, 0]);
  set(box.x + box.w - 1, y, [255, 255, 0]);
}
for (const [name, p] of Object.entries(anchors.points)) {
  const color = name.endsWith('L')
    ? [255, 60, 60]
    : name.endsWith('R')
      ? [60, 140, 255]
      : [255, 0, 200];
  for (let x = 0; x < W; x += 6) set(x, p.y, [90, 90, 90]);
  for (let dy = -7; dy <= 7; dy++)
    for (let dx = -7; dx <= 7; dx++)
      if (dx * dx + dy * dy <= 49)
        set(p.x + dx, p.y + dy, dx * dx + dy * dy >= 25 ? [255, 255, 255] : color);
}
writePng(`${DIR}/debug-anchors.png`, { width: W, height: H, data: dbg });
console.log(JSON.stringify(anchors.points));
