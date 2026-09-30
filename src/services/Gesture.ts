// Pattern matcher for the finger-pattern minigames. The player's stroke is compared with a
// shape template (data/gestureShapes.ts): both are resampled, moved to their centre and scaled
// to the same size, then the average point distance gives an accuracy 0..1. Not rotation
// invariant (a V is not a caret), but drawing direction and, for closed shapes, the start point
// do not matter.
import { shapeById, type Pt } from '../data/gestureShapes';

const N = 48;

function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++)
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
}

// Resamples to n evenly spaced points along the path.
function resample(pts: Pt[], n = N): Pt[] {
  const step = pathLength(pts) / (n - 1);
  const out: Pt[] = [pts[0]];
  let acc = 0;
  const src = pts.slice();
  for (let i = 1; i < src.length; i++) {
    const d = Math.hypot(src[i].x - src[i - 1].x, src[i].y - src[i - 1].y);
    if (acc + d >= step && d > 0) {
      const t = (step - acc) / d;
      const q = {
        x: src[i - 1].x + t * (src[i].x - src[i - 1].x),
        y: src[i - 1].y + t * (src[i].y - src[i - 1].y),
      };
      out.push(q);
      src.splice(i, 0, q);
      acc = 0;
    } else acc += d;
  }
  while (out.length < n) out.push(pts[pts.length - 1]);
  return out.slice(0, n);
}

// Centre at the origin, scale the larger side to 1 (aspect kept, so a flat circle is penalised).
function normalize(pts: Pt[]): Pt[] {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const s = Math.max(w, h, 1e-6);
  const cx = xs.reduce((a, b) => a + b, 0) / pts.length;
  const cy = ys.reduce((a, b) => a + b, 0) / pts.length;
  return pts.map((p) => ({ x: (p.x - cx) / s, y: (p.y - cy) / s }));
}

function avgDistance(a: Pt[], b: Pt[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  return d / a.length;
}

// Light smoothing so finger jitter does not inflate the path length.
function smooth(pts: Pt[]): Pt[] {
  if (pts.length < 5) return pts;
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) return p;
    const a = pts[i - 1];
    const b = pts[i + 1];
    return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4 };
  });
}

function rotateStart(pts: Pt[], offset: number): Pt[] {
  const body = pts.slice(0, -1); // closed templates repeat the first point at the end
  const r = [...body.slice(offset), ...body.slice(0, offset)];
  return [...r, r[0]];
}

// Accuracy 0..1: 1 = traced the template, about 0.5 = clearly the shape but sloppy, 0 = another
// shape or a scribble.
export function accuracy(raw: Pt[], shapeId: string): number {
  if (raw.length < 6 || pathLength(raw) < 80) return 0;
  // 0.04 is a careful trace on a phone, 0.30 is a different shape.
  return Math.max(0, Math.min(1, 1 - (matchDistance(raw, shapeId) - 0.04) / 0.26));
}

// Smallest average point distance between the stroke and the template (0 = identical).
export function matchDistance(raw: Pt[], shapeId: string): number {
  const shape = shapeById(shapeId);
  const stroke = normalize(resample(smooth(smooth(raw))));
  const reversed = stroke.slice().reverse();
  let best = Infinity;
  if (shape.closed) {
    // The player may start anywhere on a closed shape: try every start point.
    const ring = resample(shape.points, N + 1);
    for (let off = 0; off < N; off++) {
      const t = normalize(resample(rotateStart(ring, off)));
      best = Math.min(best, avgDistance(stroke, t), avgDistance(reversed, t));
    }
  } else {
    const t = normalize(resample(shape.points));
    best = Math.min(avgDistance(stroke, t), avgDistance(reversed, t));
  }
  return best;
}

// Stars 0..3 from accuracy; harder moves need more accuracy for full marks.
export function stars(acc: number, difficulty: 1 | 2 | 3): number {
  const need = { 1: [0.25, 0.45, 0.65], 2: [0.3, 0.5, 0.72], 3: [0.35, 0.58, 0.78] }[difficulty];
  const n = acc >= need[2] ? 3 : acc >= need[1] ? 2 : acc >= need[0] ? 1 : 0;
  return Math.min(n, difficulty);
}
