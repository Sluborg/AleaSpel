// Butiken: what medals can buy. Furniture rows come from furniture.ts (rows with a price).
// Clothes are manifest ids with a price here; the wardrobe hides them until owned.
import type { AssetManifest } from './assets';
import { FURNITURE } from './furniture';

export type ShopKind = 'furniture' | 'clothes';

export interface ShopItem {
  id: string; // furniture id or manifest id
  kind: ShopKind;
  name: string;
  price: number;
  icon: string;
  color?: number;
}

export const SHOP_TABS: { kind: ShopKind; label: string }[] = [
  { kind: 'furniture', label: 'Möbler' },
  { kind: 'clothes', label: 'Kläder' },
];

// Clothes for sale: manifest id -> price and Swedish name. Free clothes are not listed.
export const CLOTHES_PRICES: Record<string, { name: string; price: number; icon: string }> = {};

export function shopItems(manifest: AssetManifest | undefined): ShopItem[] {
  const furniture: ShopItem[] = FURNITURE.filter((f) => f.price).map((f) => ({
    id: f.id,
    kind: 'furniture',
    name: f.name,
    price: f.price!,
    icon: f.icon ?? '🪑',
    color: f.color,
  }));
  const known = new Set((manifest?.assets ?? []).map((a) => a.id));
  const clothes: ShopItem[] = Object.entries(CLOTHES_PRICES)
    .filter(([id]) => known.has(id))
    .map(([id, c]) => ({ id, kind: 'clothes', name: c.name, price: c.price, icon: c.icon }));
  return [...furniture, ...clothes].sort((a, b) => a.price - b.price);
}

export function isForSale(id: string): boolean {
  return id in CLOTHES_PRICES || FURNITURE.some((f) => f.id === id && f.price);
}
