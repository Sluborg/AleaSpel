import type { AssetManifest } from '../data/assets';
import { shopItems, type ShopItem } from '../data/shop';
import { SaveService, localDate, newUid } from './SaveService';

// Fredagspaket: a gift every Friday (the player's own calendar). Unopened gifts wait, up to
// MAX_WAITING. The first gift is waiting from the start. A gift holds one thing from Butiken
// (clothes and apparatus only if the team does not have them) and a few medals.
const FRIDAY = 5;
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

// The most recent Friday, today included.
export function latestFriday(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() - FRIDAY + 7) % 7));
  return localDate(d);
}

// Days until the next Friday (1-7).
export function daysToFriday(now = new Date()): number {
  return (FRIDAY - now.getDay() + 7) % 7 || 7;
}

function weeksSince(claimed: string, now: Date): number {
  const diff = parseDay(latestFriday(now)).getTime() - parseDay(claimed).getTime();
  return Math.max(0, Math.round(diff / (7 * DAY_MS)));
}

export function waitingGifts(now = new Date()): number {
  const { claimed } = SaveService.get().gifts;
  if (!claimed) return 1;
  return Math.min(MAX_WAITING, weeksSince(claimed, now));
}

// Opens one waiting gift: picks the reward, puts it in the save and returns it.
export function openGift(manifest: AssetManifest | undefined, now = new Date()): GiftReward | null {
  if (!waitingGifts(now)) return null;
  const save = SaveService.get();
  const choices = shopItems(manifest).filter(
    (i) => i.kind === 'furniture' || !save.owned.includes(i.id),
  );
  const item = choices.length ? choices[Math.floor(Math.random() * choices.length)] : undefined;
  const medals = item ? GIFT_MEDALS : GIFT_MEDALS * 2;
  SaveService.update((d) => {
    const { claimed } = d.gifts;
    const weeks = claimed ? weeksSince(claimed, now) : 0;
    // Mark one Friday as opened; gifts beyond MAX_WAITING are dropped.
    d.gifts.claimed = !claimed
      ? latestFriday(now)
      : weeks > MAX_WAITING
        ? addDays(latestFriday(now), -7 * (MAX_WAITING - 1))
        : addDays(claimed, 7);
    d.medals += medals;
    if (item?.kind === 'furniture')
      d.furniture.push({ uid: newUid(), def: item.id, x: 0, y: 0, stored: true });
    else if (item) d.owned.push(item.id);
  });
  return { item, medals };
}
