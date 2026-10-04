import Phaser from 'phaser';
import { HEAD_LAYERS, LAYER_SKIPS, RIG_PARTS, rigLabelMap, type RigPart } from '../data/rig';

// Splits layer textures into rig parts (data/rig.ts) and builds the joint hierarchy.
// Part textures are cut once per texture and resolution and cached in the texture manager as
// `<key>@<part>@<res>`; every gymnast wearing the item reuses them.

interface PartMaps {
  w: number;
  h: number;
  // Part index (into RIG_PARTS) of every pixel.
  labels: Uint8Array;
  // Joint caps per part, as [target pixel, source pixel] pairs. A part tucked behind its parent
  // gets a round end: the half disc beyond its joint is filled with its own pixels mirrored across
  // the joint, so a bend shows more of the limb instead of a gap. The head (in front) keeps the
  // neck pixels around its joint as they are.
  caps: Int32Array[];
  // Bleed per part, as [pixel, neighbour] pairs: the pixel is copied when the neighbour (one of
  // the part's own pixels) is solid, so the part reaches past its edge only where it has a surface.
  bleed: Int32Array[];
}

const maps = new Map<string, PartMaps>();
const BLEED = 2;

function partMaps(res: number, layer: string): PartMaps {
  const skip = LAYER_SKIPS[layer] ?? [];
  const id = `${res}|${skip.join()}`;
  const cached = maps.get(id);
  if (cached) return cached;
  const { w, h, labels } = rigLabelMap(res, skip);
  const caps = RIG_PARTS.map((p, k) => {
    const pairs: number[] = [];
    if (!p.cap || !p.parent) return new Int32Array(0);
    const parent = RIG_PARTS.findIndex((q) => q.id === p.parent);
    const r = p.cap * res;
    const cx = p.joint[0] * res;
    const cy = p.joint[1] * res;
    const [ax, ay, bx, by] = p.bone;
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(h, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(w, Math.ceil(cx + r)); x++) {
        const i = y * w + x;
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (labels[i] === k || Math.hypot(dx, dy) > r) continue;
        if (p.front) {
          if (labels[i] === parent) pairs.push(i, i);
          continue;
        }
        const t = dx * ux + dy * uy;
        // Mirror across the joint line (perpendicular to the bone), behind the joint only.
        const sx = Math.floor(x - 2 * Math.min(t, 0) * ux);
        const sy = Math.floor(y - 2 * Math.min(t, 0) * uy);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const j = sy * w + sx;
        if (labels[j] === k) pairs.push(i, j);
      }
    }
    return Int32Array.from(pairs);
  });
  // Bleed: every part reaches BLEED pixels past its edge, so the seams between parts never show
  // the background through the soft (filtered) texture edges.
  const bleed = RIG_PARTS.map(() => [] as number[]);
  // Only pixels near a border between parts can bleed: mark them first.
  const near = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = labels[y * w + x];
      const edge =
        (x + 1 < w && labels[y * w + x + 1] !== l) || (y + 1 < h && labels[(y + 1) * w + x] !== l);
      if (!edge) continue;
      for (let dy = -BLEED; dy <= BLEED + 1; dy++) {
        for (let dx = -BLEED; dx <= BLEED + 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h) near[ny * w + nx] = 1;
        }
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!near[i]) continue;
      let seen = 1 << labels[i];
      for (let dy = -BLEED; dy <= BLEED; dy++) {
        for (let dx = -BLEED; dx <= BLEED; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const l = labels[ny * w + nx];
          if (seen & (1 << l)) continue;
          seen |= 1 << l;
          bleed[l].push(i, ny * w + nx);
        }
      }
    }
  }
  const m = { w, h, labels, caps, bleed: bleed.map((b) => Int32Array.from(b)) };
  maps.set(id, m);
  return m;
}

// Clears small loose bits (cut-off slivers of a neighbouring part) from a part image: every
// 8-connected group of visible pixels smaller than ISLAND of the largest group, or than
// ISLAND_PX master pixels, goes.
const ISLAND = 0.03;
const ISLAND_PX = 400;
function dropIslands(data: Uint8ClampedArray, w: number, h: number, res: number): void {
  const comp = new Int32Array(w * h);
  const sizes = [0];
  const stack: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (comp[i] || !data[i * 4 + 3]) continue;
    const id = sizes.length;
    let size = 0;
    comp[i] = id;
    stack.push(i);
    while (stack.length) {
      const q = stack.pop()!;
      size++;
      const qx = q % w;
      const qy = (q - qx) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = qx + dx;
          const ny = qy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (comp[n] || !data[n * 4 + 3]) continue;
          comp[n] = id;
          stack.push(n);
        }
      }
    }
    sizes.push(size);
  }
  const min = Math.max(Math.max(...sizes) * ISLAND, ISLAND_PX * res * res);
  for (let i = 0; i < w * h; i++) if (comp[i] && sizes[comp[i]] < min) data[i * 4 + 3] = 0;
}

// One cut piece of a layer: texture key and its top-left corner in master pixels.
export interface RigPiece {
  key: string;
  x: number;
  y: number;
}

const HEAD = RIG_PARTS.findIndex((p) => p.id === 'head');

// Cuts the texture `key` into rig parts. Head layers (face, hair, hats) go whole to the head.
export function cutLayer(
  scene: Phaser.Scene,
  key: string,
  layer: string,
  res: number,
): Map<RigPart, RigPiece> {
  const out = new Map<RigPart, RigPiece>();
  const tag = (part: RigPart) => `${key}@${part}@${res}`;
  const known = RIG_PARTS.filter((p) => scene.textures.exists(tag(p.id)));
  if (known.length || scene.textures.exists(`${key}@none@${res}`)) {
    for (const p of known) {
      const f = scene.textures.get(tag(p.id)).get();
      const { x, y } = f.customData as { x: number; y: number };
      out.set(p.id, { key: tag(p.id), x, y });
    }
    return out;
  }
  const { w, h, labels, caps, bleed } = partMaps(res, layer);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(scene.textures.get(key).getSourceImage() as CanvasImageSource, 0, 0, w, h);
  const src = ctx.getImageData(0, 0, w, h).data;
  const headOnly = HEAD_LAYERS.has(layer);
  // A bleed pixel is used when it and the part's own neighbour are both solid.
  const solid = (i: number, j: number) => src[i * 4 + 3] > 0 && src[j * 4 + 3] >= 160;
  const partOf = (i: number) => (headOnly ? HEAD : labels[i]);
  // Bounding box of each part's visible pixels, caps included.
  const box = RIG_PARTS.map(() => [w, h, -1, -1]);
  const grow = (k: number, i: number) => {
    const x = i % w;
    const y = (i - x) / w;
    const bb = box[k];
    if (x < bb[0]) bb[0] = x;
    if (y < bb[1]) bb[1] = y;
    if (x > bb[2]) bb[2] = x;
    if (y > bb[3]) bb[3] = y;
  };
  for (let i = 0; i < w * h; i++) if (src[i * 4 + 3]) grow(partOf(i), i);
  if (!headOnly) {
    caps.forEach((pairs, k) => {
      for (let n = 0; n < pairs.length; n += 2) if (src[pairs[n + 1] * 4 + 3]) grow(k, pairs[n]);
    });
    bleed.forEach((pairs, k) => {
      for (let n = 0; n < pairs.length; n += 2)
        if (solid(pairs[n], pairs[n + 1])) grow(k, pairs[n]);
    });
  }
  RIG_PARTS.forEach((p, k) => {
    const [x0, y0, x1, y1] = box[k];
    if (x1 < 0) return;
    const bw = x1 - x0 + 1;
    const bh = y1 - y0 + 1;
    const tex = scene.textures.createCanvas(tag(p.id), bw, bh);
    if (!tex) return;
    const img = tex.context.createImageData(bw, bh);
    const copy = (to: number, from: number) => {
      const o = ((((to / w) | 0) - y0) * bw + (to % w) - x0) * 4;
      for (let c = 0; c < 4; c++) img.data[o + c] = src[from * 4 + c];
    };
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (partOf(i) === k && src[i * 4 + 3]) copy(i, i);
      }
    }
    if (!headOnly) {
      const edge = bleed[k];
      for (let n = 0; n < edge.length; n += 2) {
        if (solid(edge[n], edge[n + 1])) copy(edge[n], edge[n]);
      }
      const pairs = caps[k];
      for (let n = 0; n < pairs.length; n += 2) {
        if (src[pairs[n + 1] * 4 + 3]) copy(pairs[n], pairs[n + 1]);
      }
    }
    dropIslands(img.data, bw, bh, res);
    tex.context.putImageData(img, 0, 0);
    tex.refresh();
    const piece = { key: tag(p.id), x: x0 / res, y: y0 / res };
    tex.get().customData = { x: piece.x, y: piece.y };
    out.set(p.id, piece);
  });
  // Marks a texture with no visible pixels as cut, so it is not read again.
  if (!out.size) scene.textures.createCanvas(`${key}@none@${res}`, 1, 1);
  return out;
}

// One worn layer for the rig: texture key, its wardrobe layer, tint and alpha.
export interface RigLayer {
  key: string;
  layer: string;
  tint?: number;
  alpha?: number;
}

// The built rig: a container in master pixels with one container per part at its joint.
export interface Rig {
  root: Phaser.GameObjects.Container;
  joints: Record<RigPart, Phaser.GameObjects.Container>;
  // hair_back turns with the head but is drawn behind the body.
  headBack: Phaser.GameObjects.Container;
}

// A layer with its cut pieces (cutLayer), ready for buildRig.
export interface RigCut {
  l: RigLayer;
  pieces: Map<RigPart, RigPiece>;
}

export function buildRig(scene: Phaser.Scene, cut: RigCut[], res: number): Rig {
  const root = scene.add.container(0, 0);
  const joints = {} as Record<RigPart, Phaser.GameObjects.Container>;
  const byId = new Map(RIG_PARTS.map((p) => [p.id, p]));
  for (const p of RIG_PARTS) {
    const parent = p.parent ? byId.get(p.parent) : undefined;
    const c = scene.add.container(
      p.joint[0] - (parent?.joint[0] ?? 0),
      p.joint[1] - (parent?.joint[1] ?? 0),
    );
    joints[p.id] = c;
  }
  const torso = joints.torso;
  const headJoint = byId.get('head')!.joint;
  const torsoJoint = byId.get('torso')!.joint;
  const headBack = scene.add.container(headJoint[0] - torsoJoint[0], headJoint[1] - torsoJoint[1]);
  root.add(torso);
  torso.add(headBack);
  // Paper-doll order: a part's children go behind it (their joint caps hide under the parent),
  // except front parts (the head), which go on top.
  for (const p of RIG_PARTS) {
    for (const child of RIG_PARTS) {
      if (child.parent === p.id && !child.front) joints[p.id].add(joints[child.id]);
    }
  }
  for (const p of RIG_PARTS) {
    const c = joints[p.id];
    for (const { l, pieces } of cut) {
      const piece = pieces.get(p.id);
      if (!piece) continue;
      const img = scene.add
        .image(piece.x - p.joint[0], piece.y - p.joint[1], piece.key)
        .setOrigin(0)
        .setScale(1 / res);
      if (l.tint !== undefined) img.setTint(l.tint);
      if (l.alpha !== undefined) img.setAlpha(l.alpha);
      (l.layer === 'hair_back' ? headBack : c).add(img);
    }
  }
  for (const p of RIG_PARTS) if (p.front && p.parent) joints[p.parent].add(joints[p.id]);
  return { root, joints, headBack };
}
