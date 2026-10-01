// Butiken: what medals can buy. Furniture rows come from furniture.ts (rows with a price).
// Gym rows are apparatus with a price in gymEquipment.ts (bought once, they appear in Mitt gym).
// Clothes are manifest ids with a price here; the wardrobe hides them until owned.
import type { AssetManifest } from './assets';
import { FURNITURE } from './furniture';
import { GYM_EQUIPMENT, equipmentArtId } from './gymEquipment';

export type ShopKind = 'furniture' | 'gym' | 'clothes';

export interface ShopItem {
  id: string; // furniture id or manifest id
  kind: ShopKind;
  name: string;
  price: number;
  icon: string;
  color?: number;
  art?: string; // manifest id for the tile picture
  hue?: number;
}

export const SHOP_TABS: { kind: ShopKind; label: string; art: string }[] = [
  { kind: 'furniture', label: 'Möbler', art: 'icon_tab_furniture' },
  { kind: 'gym', label: 'Gym', art: 'icon_tab_gym' },
  { kind: 'clothes', label: 'Kläder', art: 'icon_tab_clothes' },
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
  const gym: ShopItem[] = GYM_EQUIPMENT.filter((e) => e.price).map((e) => ({
    id: e.id,
    kind: 'gym',
    name: e.name,
    price: e.price!,
    icon: '🤸',
    color: e.color,
    art: equipmentArtId(e),
    hue: e.hue,
  }));
  const known = new Set((manifest?.assets ?? []).map((a) => a.id));
  const clothes: ShopItem[] = Object.entries(CLOTHES_PRICES)
    .filter(([id]) => known.has(id))
    .map(([id, c]) => ({ id, kind: 'clothes', name: c.name, price: c.price, icon: c.icon }));
  return [...furniture, ...gym, ...clothes].sort((a, b) => a.price - b.price);
}

export function isForSale(id: string): boolean {
  return (
    id in CLOTHES_PRICES ||
    FURNITURE.some((f) => f.id === id && f.price) ||
    GYM_EQUIPMENT.some((e) => e.id === id && e.price)
  );
}
