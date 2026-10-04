// Cut-out rig (movement plan, stage 2): the gymnast is split into ten parts that turn at their
// joints. Every layer (body, clothes, accessories) is split with the same part map at runtime, so
// a sleeve moves with its arm. All coordinates are master pixels (1024x1536 canvas).
//
//   joint   the point the part turns around (its parent keeps still there)
//   parent  the part it hangs from ('' = the root, which never turns on its own)
//   bone    a line through the part; a pixel belongs to the part whose bone is nearest, after
//           subtracting the part's radius (thick parts claim more)
//   radius  half the thickness of the part
//   cap     radius of the round end at the joint (ui/rig.ts), so no gap shows when it bends; keep it
//           inside the limb's width
//   front   drawn in front of its parent; other parts tuck behind their parent, which hides the cap
// Each part draws every layer in layer order.
export type RigPart =
  | 'torso'
  | 'thighL'
  | 'shinL'
  | 'thighR'
  | 'shinR'
  | 'upperArmL'
  | 'lowerArmL'
  | 'upperArmR'
  | 'lowerArmR'
  | 'head';

export interface RigPartDef {
  id: RigPart;
  parent: RigPart | '';
  joint: [number, number];
  bone: [number, number, number, number];
  radius: number;
  cap: number;
  front?: boolean;
}

// L/R are as seen on screen (left = the gymnast's right hand, like the anchors).
export const RIG_PARTS: RigPartDef[] = [
  { id: 'torso', parent: '', joint: [512, 600], bone: [512, 400, 512, 700], radius: 94, cap: 0 },
  {
    id: 'thighL',
    parent: 'torso',
    joint: [452, 770],
    bone: [452, 770, 447, 1065],
    radius: 55,
    cap: 66,
  },
  {
    id: 'shinL',
    parent: 'thighL',
    joint: [447, 1065],
    bone: [447, 1065, 443, 1400],
    radius: 45,
    cap: 36,
  },
  {
    id: 'thighR',
    parent: 'torso',
    joint: [572, 770],
    bone: [572, 770, 575, 1061],
    radius: 55,
    cap: 66,
  },
  {
    id: 'shinR',
    parent: 'thighR',
    joint: [575, 1061],
    bone: [575, 1061, 581, 1400],
    radius: 45,
    cap: 36,
  },
  {
    id: 'upperArmL',
    parent: 'torso',
    joint: [432, 440],
    bone: [432, 440, 362, 605],
    radius: 38,
    cap: 24,
  },
  {
    id: 'lowerArmL',
    parent: 'upperArmL',
    joint: [362, 605],
    bone: [362, 605, 288, 890],
    radius: 32,
    cap: 22,
  },
  {
    id: 'upperArmR',
    parent: 'torso',
    joint: [592, 440],
    bone: [592, 440, 662, 605],
    radius: 38,
    cap: 24,
  },
  {
    id: 'lowerArmR',
    parent: 'upperArmR',
    joint: [662, 605],
    bone: [662, 605, 735, 890],
    radius: 32,
    cap: 22,
  },
  {
    id: 'head',
    parent: 'torso',
    joint: [512, 372],
    bone: [512, 130, 512, 372],
    radius: 0,
    cap: 34,
  },
];

// Everything above this line belongs to the head (a clean cut across the neck).
export const NECK_CUT_Y = 374;

// Layers that move with the head as a whole (face, hair, hats). hair_back is drawn behind the body
// but still turns with the head.
export const HEAD_LAYERS = new Set([
  'hair_back',
  'eyes',
  'brows',
  'mouth',
  'eyeshadow',
  'blush',
  'lips',
  'facepaint',
  'acc_face',
  'acc_head',
  'hair_front',
]);

// Parts a layer may be split into. Skirts and shoes never ride on the arms (a tutu reaches out
// next to the hands), tops never on the legs. Layers not listed may use every part.
const ARMS: RigPart[] = ['upperArmL', 'lowerArmL', 'upperArmR', 'lowerArmR'];
const LEGS: RigPart[] = ['thighL', 'shinL', 'thighR', 'shinR'];
export const LAYER_SKIPS: Record<string, RigPart[]> = {
  bottoms: ARMS,
  socks: ARMS,
  shoes: ARMS,
  tops: LEGS,
  outerwear: LEGS,
};

// Part index (into RIG_PARTS) for every pixel of a w x h map; res = map pixels per master pixel.
// A pixel belongs to the part whose bone is nearest after subtracting the part's radius. Limbs
// only claim pixels past their joint (the shoulder and hip stay with the body, so the limb turns
// out from under them). Labels are found per 4x4 block and per pixel only where parts meet.
export function rigLabelMap(
  res: number,
  skip: readonly RigPart[] = [],
): { w: number; h: number; labels: Uint8Array } {
  const w = Math.round(1024 * res);
  const h = Math.round(1536 * res);
  const labels = new Uint8Array(w * h);
  const head = RIG_PARTS.findIndex((p) => p.id === 'head');
  const bones = RIG_PARTS.map((p, i) => {
    const [ax, ay, bx, by] = p.bone;
    const dx = bx - ax;
    const dy = by - ay;
    return { i, ax, ay, dx, dy, len2: dx * dx + dy * dy, r: p.radius, limb: p.parent !== '' };
  }).filter((b) => b.i !== head && !skip.includes(RIG_PARTS[b.i].id));
  const at = (x: number, y: number): number => {
    const mx = (x + 0.5) / res;
    const my = (y + 0.5) / res;
    if (my < NECK_CUT_Y) return head;
    let best = head;
    let bestD = Infinity;
    for (const b of bones) {
      const t0 = ((mx - b.ax) * b.dx + (my - b.ay) * b.dy) / b.len2;
      if (b.limb && t0 < 0) continue;
      const t = t0 > 1 ? 1 : t0 < 0 ? 0 : t0;
      const ex = mx - b.ax - t * b.dx;
      const ey = my - b.ay - t * b.dy;
      const d = Math.sqrt(ex * ex + ey * ey) - b.r;
      if (d < bestD) {
        bestD = d;
        best = b.i;
      }
    }
    return best;
  };
  const B = 4;
  for (let by = 0; by < h; by += B) {
    const y1 = Math.min(h, by + B) - 1;
    for (let bx = 0; bx < w; bx += B) {
      const x1 = Math.min(w, bx + B) - 1;
      const l = at(bx, by);
      const same = at(x1, by) === l && at(bx, y1) === l && at(x1, y1) === l;
      for (let y = by; y <= y1; y++) {
        for (let x = bx; x <= x1; x++) labels[y * w + x] = same ? l : at(x, y);
      }
    }
  }
  return { w, h, labels };
}

// Joint angles of a pose, in degrees (positive = clockwise on screen). Missing joints are 0.
export type RigPose = Partial<Record<RigPart, number>>;
