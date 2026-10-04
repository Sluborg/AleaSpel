// Butiken: what medals can buy. Furniture rows come from furniture.ts (rows with a price).
// Gym rows are apparatus with a price in gymEquipment.ts (bought once, they appear in Mitt gym).
// Clothes are manifest ids with a price here; the wardrobe hides them until owned.
import type { AssetManifest } from './assets';
import { FURNITURE } from './furniture';
import { GYM_EQUIPMENT, equipmentArtId } from './gymEquipment';
import { localDate } from '../services/SaveService';

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
  release?: string; // YYYY-MM-DD: hidden before, marked NY! for NEW_DAYS after
}

// Veckans nyheter: a row with `release` stays out of Butiken (and the gifts) until that day and is
// marked NY! for a week after. Spread new rows a week apart so something new arrives every week.
export const NEW_DAYS = 7;

export function isReleased(release: string | undefined, today: string): boolean {
  return !release || release <= today;
}

export function isNew(release: string | undefined, today: string): boolean {
  if (!release || release > today) return false;
  const [y, m, d] = release.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const days = (Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000;
  return days < NEW_DAYS;
}

export const SHOP_TABS: { kind: ShopKind; label: string; art: string }[] = [
  { kind: 'furniture', label: 'Möbler', art: 'icon_tab_furniture' },
  { kind: 'gym', label: 'Gym', art: 'icon_tab_gym' },
  { kind: 'clothes', label: 'Kläder', art: 'icon_tab_clothes' },
];

// Clothes for sale: manifest id -> price and Swedish name. Free clothes are not listed.
export const CLOTHES_PRICES: Record<
  string,
  { name: string; price: number; icon: string; release?: string }
> = {
  // Art batch B30/B31 (row 170). The first five come at once, then three a week (Veckans nyheter).
  shoes_sneakers: { name: 'Sneakers', price: 6, icon: '👟' },
  shoes_ballet: { name: 'Ballerinaskor', price: 6, icon: '🩰' },
  bag_heart: { name: 'Hjärtväska', price: 7, icon: '👜' },
  glasses_heart: { name: 'Hjärtglasögon', price: 8, icon: '🕶️' },
  headband_cat: { name: 'Kattdiadem', price: 7, icon: '🐱' },
  shoes_sandals: { name: 'Sandaler', price: 5, icon: '👡', release: '2026-10-11' },
  socks_knee: { name: 'Knästrumpor', price: 4, icon: '🧦', release: '2026-10-11' },
  hat_sun: { name: 'Solhatt', price: 8, icon: '👒', release: '2026-10-11' },
  shoes_gym: { name: 'Gympaskor', price: 4, icon: '👟', release: '2026-10-18' },
  hat_beanie: { name: 'Mössa', price: 7, icon: '🧢', release: '2026-10-18' },
  necklace_heart: { name: 'Hjärthalsband', price: 6, icon: '📿', release: '2026-10-18' },
};

// Clothes that only come in Daglig present (never in Butiken).
export const GIFT_CLOTHES: Record<string, { name: string; icon: string; release?: string }> = {
  shoes_boots: { name: 'Glitterboots', icon: '👢' },
  headband_bunny: { name: 'Kanindiadem', icon: '🐰' },
  socks_frill: { name: 'Volangstrumpor', icon: '🧦' },
  clip_star: { name: 'Stjärnspänne', icon: '⭐' },
  bracelet_beads: { name: 'Pärlarmband', icon: '📿' },
};

// Garderob shows a clothing item only when it is free or the team owns it.
export function isLockedClothing(id: string, owned: readonly string[]): boolean {
  return (id in CLOTHES_PRICES || id in GIFT_CLOTHES) && !owned.includes(id);
}

export function shopItems(manifest: AssetManifest | undefined, today = localDate()): ShopItem[] {
  const furniture: ShopItem[] = FURNITURE.filter((f) => f.price).map((f) => ({
    id: f.id,
    kind: 'furniture',
    name: f.name,
    price: f.price!,
    icon: f.icon ?? '🪑',
    color: f.color,
    release: f.release,
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
    release: e.release,
  }));
  const known = new Set((manifest?.assets ?? []).map((a) => a.id));
  const clothes: ShopItem[] = Object.entries(CLOTHES_PRICES)
    .filter(([id]) => known.has(id))
    .map(([id, c]) => ({
      id,
      kind: 'clothes' as const,
      name: c.name,
      price: c.price,
      icon: c.icon,
      release: c.release,
    }));
  // New things first, then by price.
  return [...furniture, ...gym, ...clothes]
    .filter((i) => isReleased(i.release, today))
    .sort(
      (a, b) =>
        Number(isNew(b.release, today)) - Number(isNew(a.release, today)) || a.price - b.price,
    );
}

export function isForSale(id: string): boolean {
  return (
    id in CLOTHES_PRICES ||
    id in GIFT_CLOTHES ||
    FURNITURE.some((f) => f.id === id && f.price) ||
    GYM_EQUIPMENT.some((e) => e.id === id && e.price)
  );
}
