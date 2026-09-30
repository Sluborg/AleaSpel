// Small feature-based gesture recognizer for finger patterns. Returns a quality 0..1 for how
// well a stroke matches a gesture kind. No rotation invariance on purpose (up is not down).
import type { GestureKind } from '../data/minigames';

export interface Pt {
  x: number;
  y: number;
}

function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++)
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
}

// Resamples to n evenly spaced points along the path.
function resample(pts: Pt[], n = 32): Pt[] {
  if (pts.length < 2) return pts.slice();
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

function bounds(pts: Pt[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

// Straightness of a swipe in a direction: 1 = perfectly straight along (dx, dy).
function swipe(pts: Pt[], dx: number, dy: number): number {
  const first = pts[0];
  const last = pts[pts.length - 1];
  const len = pathLength(pts);
  if (len < 60) return 0;
  const vx = last.x - first.x;
  const vy = last.y - first.y;
  const chord = Math.hypot(vx, vy);
  const along = (vx * dx + vy * dy) / (chord || 1); // cosine to wanted direction
  const straight = chord / len;
  // A stroke that zigzags across the swipe direction is not a swipe.
  const wobble = reversals(pts, dx ? 'y' : 'x') >= 2 ? 0.3 : 1;
  return Math.max(0, along) * Math.max(0, (straight - 0.6) / 0.4) * wobble;
}

// Total signed turning angle in radians.
function turning(pts: Pt[]): number {
  let total = 0;
  for (let i = 2; i < pts.length; i++) {
    const a1 = Math.atan2(pts[i - 1].y - pts[i - 2].y, pts[i - 1].x - pts[i - 2].x);
    const a2 = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    total += d;
  }
  return total;
}

// Number of direction reversals along one axis (ignoring tiny wiggles).
function reversals(pts: Pt[], axis: 'x' | 'y'): number {
  let sign = 0;
  let count = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i][axis] - pts[i - 1][axis];
    if (Math.abs(d) < 3) continue;
    const s = Math.sign(d);
    if (sign && s !== sign) count++;
    sign = s;
  }
  return count;
}

export function recognize(raw: Pt[], kind: GestureKind): number {
  if (kind === 'tap') {
    return raw.length > 0 && pathLength(raw) < 40 ? 1 : 0;
  }
  if (raw.length < 4) return 0;
  const pts = resample(raw);
  const { w, h } = bounds(pts);
  const len = pathLength(pts);
  switch (kind) {
    case 'up':
      return swipe(pts, 0, -1);
    case 'down':
      return swipe(pts, 0, 1);
    case 'left':
      return swipe(pts, -1, 0);
    case 'right':
      return swipe(pts, 1, 0);
    case 'circle': {
      const turn = Math.abs(turning(pts)) / (2 * Math.PI); // 1 = full circle
      const closed =
        1 -
        Math.min(
          1,
          Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) /
            (0.5 * len),
        );
      const round = Math.min(w, h) / Math.max(w, h, 1);
      if (len < 150) return 0;
      return Math.min(1, turn / 0.85) * (0.4 + 0.6 * closed) * (0.5 + 0.5 * round);
    }
    case 'zigzag': {
      const r = Math.max(reversals(pts, 'x'), reversals(pts, 'y'));
      if (Math.max(w, h) < 80 || r < 2) return 0;
      return Math.min(1, r / 2);
    }
    case 'v': {
      // Down then up, lowest point in the middle, few horizontal reversals.
      const bottom = pts.reduce((b, p, i) => (p.y > pts[b].y ? i : b), 0);
      const mid = 1 - Math.abs(bottom / (pts.length - 1) - 0.5) * 2; // 1 = bottom at the middle
      const depth = (pts[bottom].y - Math.max(pts[0].y, pts[pts.length - 1].y)) / Math.max(h, 1);
      if (h < 60 || depth < 0.4 || reversals(pts, 'x') > 1) return 0;
      return Math.min(1, mid * 1.4) * Math.min(1, depth / 0.7);
    }
  }
}

// Stars (0..3) from a match quality.
export function stars(quality: number, difficulty: 1 | 2 | 3): number {
  if (quality < 0.3) return 0;
  if (quality < 0.6) return 1;
  if (quality < 0.85) return Math.min(2, difficulty);
  return difficulty;
}
