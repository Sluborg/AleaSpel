import type { AssetManifest } from '../data/assets';
import { FURNITURE } from '../data/furniture';
import { shopItems, type ShopItem } from '../data/shop';
import { SaveService, localDate, newUid } from './SaveService';

// Daglig present: a gift every day (the player's own calendar). Unopened gifts wait, up to
// MAX_WAITING. The first gift is waiting from the start. A gift holds one thing from Butiken
// (clothes and apparatus only if the team does not have them) or, half of the time, a gift-only
// surprise from furniture.ts (`giftOnly`), and a few medals.
const MAX_WAITING = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
export const GIFT_MEDALS = 5;

export interface GiftReward {
  item?: ShopItem;
  medals: number;
}

function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(key: string, days: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

function today(now: Date): string {
  return localDate(now);
}

function daysSince(claimed: string, now: Date): number {
  const diff = parseDay(today(now)).getTime() - parseDay(claimed).getTime();
  return Math.max(0, Math.round(diff / DAY_MS));
}

export function waitingGifts(now = new Date()): number {
  const { claimed } = SaveService.get().gifts;
  if (!claimed) return 1;
  return Math.min(MAX_WAITING, daysSince(claimed, now));
}

// Opens one waiting gift: picks the reward, puts it in the save and returns it.
export function openGift(manifest: AssetManifest | undefined, now = new Date()): GiftReward | null {
  if (!waitingGifts(now)) return null;
  const save = SaveService.get();
  const choices = shopItems(manifest).filter(
    (i) => i.kind === 'furniture' || !save.owned.includes(i.id),
  );
  // Gift-only surprises the team does not have yet come first, half of the time.
  const surprises: ShopItem[] = FURNITURE.filter(
    (f) => f.giftOnly && !save.furniture.some((p) => p.def === f.id),
  ).map((f) => ({ id: f.id, kind: 'furniture', name: f.name, price: 0, icon: '🎁', hue: f.hue }));
  const pool = surprises.length && Math.random() < 0.5 ? surprises : choices;
  const item = pool.length ? pool[Math.floor(Math.random() * pool.length)] : undefined;
  const medals = item ? GIFT_MEDALS : GIFT_MEDALS * 2;
  SaveService.update((d) => {
    const { claimed } = d.gifts;
    const days = claimed ? daysSince(claimed, now) : 0;
    // Mark one day as opened; gifts beyond MAX_WAITING are dropped.
    d.gifts.claimed = !claimed
      ? today(now)
      : days > MAX_WAITING
        ? addDays(today(now), -(MAX_WAITING - 1))
        : addDays(claimed, 1);
    d.medals += medals;
    if (item?.kind === 'furniture')
      d.furniture.push({ uid: newUid(), def: item.id, x: 0, y: 0, stored: true });
    else if (item) d.owned.push(item.id);
  });
  return { item, medals };
}
