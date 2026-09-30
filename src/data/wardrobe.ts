// Wardrobe data for the game: layer order, Swedish labels, colour palette, items from the manifest.
// Layers and regions are shared with the tooling in wardrobe.json. Adding clothes = manifest rows.
import wardrobe from './wardrobe.json';
import type { AssetEntry, AssetManifest } from './assets';

export const ANCHORS_KEY = 'base-anchors';
export const BASE_BODY_ID = 'base_body';

export interface Anchors {
  bbox: { x: number; y: number; w: number; h: number };
  points: Record<string, { x: number; y: number }>;
}

export interface WardrobeLayer {
  id: string;
  order: number;
  region: Record<'top' | 'bottom' | 'left' | 'right', string | number>;
}

export const LAYERS: WardrobeLayer[] = [...wardrobe.layers].sort((a, b) => a.order - b.order);

// Tabs in the wardrobe, in this order. Only tabs with items are shown. A tab can hold several
// categories (Smink: one layer per kind of make-up, so they combine).
export interface WardrobeTab {
  label: string;
  categories: string[];
}
export const CATEGORY_TABS: WardrobeTab[] = [
  { label: 'Ögon', categories: ['eyes'] },
  { label: 'Bryn', categories: ['brows'] },
  { label: 'Mun', categories: ['mouth'] },
  { label: 'Smink', categories: ['eyeshadow', 'blush', 'lips', 'facepaint'] },
  { label: 'Dräkter', categories: ['onepiece'] },
  { label: 'Tröjor', categories: ['tops'] },
  { label: 'Byxor', categories: ['bottoms'] },
  { label: 'Jackor', categories: ['outerwear'] },
  { label: 'Strumpor', categories: ['socks'] },
  { label: 'Skor', categories: ['shoes'] },
  { label: 'Hår', categories: ['hair_front'] },
  {
    label: 'Pynt',
    categories: ['accessories', 'acc_head', 'acc_face', 'acc_neck', 'acc_wrist', 'acc_bag'],
  },
];

// Colours offered for tintable items: every hue in a light, a medium and a strong shade (that is
// also how colour strength is chosen), then neutrals. Medium shades are the original palette.
const HUES = [
  0xff6fae, 0xff4f7b, 0xff8a3d, 0xffd84d, 0x7ed957, 0x3fd0c9, 0x5aa9ff, 0x8f7bff, 0xc77dff,
  0xb07a4f,
];
const mix = (a: number, b: number, t: number) => {
  const ch = (c: number, sh: number) => (c >> sh) & 255;
  const m = (sh: number) => Math.round(ch(a, sh) + (ch(b, sh) - ch(a, sh)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};
export const PALETTE: number[] = [
  ...HUES.map((h) => mix(h, 0xffffff, 0.55)),
  ...HUES,
  ...HUES.map((h) => mix(h, 0x000000, 0.35)),
  0xffffff,
  0xd9d9e0,
  0x9aa0a6,
  0x5c5c6e,
  0x3a3a4a,
  0x1e1e28,
];
export const DEFAULT_TINT = 0xff6fae;

// Face tabs zoom the gymnast to the head, and their tiles show a zoomed face crop.
export const FACE_CATEGORIES = new Set([
  'eyes',
  'brows',
  'mouth',
  'eyeshadow',
  'blush',
  'lips',
  'facepaint',
]);
// Face crop in master pixels (tiles) and the head centre (zoom).
export const FACE_REGION = { x: 392, y: 168, w: 240, h: 210 };
export const HEAD_CENTRE_Y = 265;

// Item rules against clipping, matched on the item id:
//   order    draw order that replaces the layer's order (a tutu goes over a leotard)
//   excludes layers taken off when this item is worn (a dress replaces tops and bottoms);
//            wearing something in an excluded layer takes this item off again.
export interface ItemRule {
  match: RegExp;
  order?: number;
  excludes?: string[];
}
export const ITEM_RULES: ItemRule[] = [
  { match: /^dress_/, excludes: ['tops', 'bottoms'] },
  { match: /^skirt_tutu/, order: 55 },
];

export function itemRule(itemId: string): ItemRule | undefined {
  return ITEM_RULES.find((r) => r.match.test(itemId));
}

// Draw order of a worn item: its rule's order, else its layer's order.
export function drawOrder(layer: string, itemId: string): number {
  return itemRule(itemId)?.order ?? layerOrder(layer);
}

export function layerOfCategory(category: string): string | undefined {
  return wardrobe.categories.find((c) => c.id === category)?.layer;
}

export function layerOrder(layer: string): number {
  return LAYERS.find((l) => l.id === layer)?.order ?? 0;
}

export function wardrobeItems(manifest: AssetManifest | undefined): AssetEntry[] {
  return (manifest?.assets ?? []).filter(
    (a) => a.category !== 'base' && layerOfCategory(a.category) !== undefined,
  );
}

// Resolves a layer region (anchor expressions) to a rectangle in master pixels.
export function layerRegion(layerId: string, anchors: Anchors) {
  const layer = LAYERS.find((l) => l.id === layerId);
  const b = anchors.bbox;
  const refs: Record<string, Record<string, number>> = {
    ...anchors.points,
    bbox: { left: b.x, right: b.x + b.w - 1, top: b.y, bottom: b.y + b.h - 1 },
  };
  const resolve = (e: string | number): number => {
    if (typeof e === 'number') return e;
    const m = /^([A-Za-z]+)\.([a-z]+)([+-]\d+)?$/.exec(e);
    return m ? (refs[m[1]]?.[m[2]] ?? 0) + Number(m[3] ?? 0) : 0;
  };
  const r = layer?.region ?? { top: 0, bottom: 1536, left: 0, right: 1024 };
  const left = Math.max(0, resolve(r.left));
  const top = Math.max(0, resolve(r.top));
  return {
    x: left,
    y: top,
    w: Math.min(1024, resolve(r.right)) - left,
    h: Math.min(1536, resolve(r.bottom)) - top,
  };
}
