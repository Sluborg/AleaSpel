// Clothing occasions: a gymnast has one look per occasion (clothes, shoes, make-up, accessories),
// while face and hair are shared. Scenes pick the occasion: Klubbstugan = chill, Mitt gym =
// träning, Tävlingar = tävling, Mina hus and Mitt lag = vardag, events = fest.
import type { Gymnast, WornItem } from '../services/SaveService';

export interface Occasion {
  id: string;
  name: string; // Swedish
  icon: string;
}

export const OCCASIONS: Occasion[] = [
  { id: 'vardag', name: 'Vardag', icon: '🏠' },
  { id: 'traning', name: 'Träning', icon: '🤸' },
  { id: 'tavling', name: 'Tävling', icon: '🏆' },
  { id: 'fest', name: 'Fest', icon: '🎉' },
  { id: 'chill', name: 'Chill', icon: '🛋️' },
];

export const DEFAULT_OCCASION = 'vardag';

// Layers that are part of the shared look (face and hair). Everything else belongs to an occasion.
const SHARED_LAYERS = new Set(['body', 'eyes', 'brows', 'mouth', 'hair_back', 'hair_front']);

export function isSharedLayer(layer: string): boolean {
  return SHARED_LAYERS.has(layer);
}

// The look for an occasion, falling back to vardag and then to the shared outfit's clothes.
export function lookOf(gymnast: Gymnast, occasion: string): Record<string, WornItem> {
  const looks = gymnast.looks ?? {};
  const own = looks[occasion] ?? looks[DEFAULT_OCCASION];
  if (own) return own;
  return Object.fromEntries(Object.entries(gymnast.outfit).filter(([l]) => !isSharedLayer(l)));
}

// The complete outfit to draw: shared face and hair plus the occasion's look.
export function outfitFor(gymnast: Gymnast, occasion: string): Record<string, WornItem> {
  const shared = Object.fromEntries(
    Object.entries(gymnast.outfit).filter(([l]) => isSharedLayer(l)),
  );
  return { ...shared, ...lookOf(gymnast, occasion) };
}

// The record to write a layer into for an occasion; creates the look from its fallback first.
export function lookTarget(gymnast: Gymnast, occasion: string, layer: string) {
  if (isSharedLayer(layer)) return gymnast.outfit;
  gymnast.looks ??= {};
  gymnast.looks[occasion] ??= { ...lookOf(gymnast, occasion) };
  return gymnast.looks[occasion];
}
