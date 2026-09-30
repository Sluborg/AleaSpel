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

// Tabs in the wardrobe, in this order. Only categories with items are shown.
export const CATEGORY_TABS: { category: string; label: string }[] = [
  { category: 'eyes', label: 'Ögon' },
  { category: 'onepiece', label: 'Dräkter' },
  { category: 'tops', label: 'Tröjor' },
  { category: 'bottoms', label: 'Byxor' },
  { category: 'outerwear', label: 'Jackor' },
  { category: 'socks', label: 'Strumpor' },
  { category: 'shoes', label: 'Skor' },
  { category: 'hair_front', label: 'Hår' },
  { category: 'accessories', label: 'Pynt' },
];

// Colours offered for tintable items.
export const PALETTE: number[] = [
  0xff6fae, 0xff4f7b, 0xff8a3d, 0xffd84d, 0x7ed957, 0x3fd0c9, 0x5aa9ff, 0x8f7bff, 0xc77dff,
  0xffffff, 0x9aa0a6, 0x3a3a4a,
];
export const DEFAULT_TINT = PALETTE[0];

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
