// The outside of the house (Trädgården): the house is put together from one part per slot. Each
// art row comes in every colour of HOUSE_HUES. Adding a wall, roof, door or window = one row.
export type HouseSlot = 'wall' | 'roof' | 'door' | 'window';

export interface HousePart {
  id: string; // saved choice
  slot: HouseSlot;
  art: string; // manifest id
  hue: number; // colour shift in degrees (0 = as drawn)
  color: number; // placeholder colour when the art is missing
}

export const HOUSE_SLOTS: { slot: HouseSlot; label: string }[] = [
  { slot: 'wall', label: 'Vägg' },
  { slot: 'roof', label: 'Tak' },
  { slot: 'door', label: 'Dörr' },
  { slot: 'window', label: 'Fönster' },
];

const HOUSE_ART: { slot: HouseSlot; art: string; color: number }[] = [
  { slot: 'wall', art: 'ext_wall_1', color: 0xffc4d6 },
  { slot: 'wall', art: 'ext_wall_2', color: 0xa8e6cf },
  { slot: 'wall', art: 'ext_wall_3', color: 0xffe08a },
  { slot: 'roof', art: 'ext_roof_1', color: 0xe0605a },
  { slot: 'roof', art: 'ext_roof_2', color: 0xc9a2ff },
  { slot: 'roof', art: 'ext_roof_3', color: 0x6fa8dc },
  { slot: 'door', art: 'ext_door_1', color: 0xa8744a },
  { slot: 'door', art: 'ext_door_2', color: 0xff8fc0 },
  { slot: 'window', art: 'ext_window_1', color: 0xbfe3ff },
  { slot: 'window', art: 'ext_window_2', color: 0xd6f0ff },
];

// Colour variants of every part (hue shift in degrees).
export const HOUSE_HUES = [0, 120, 240];

export const HOUSE_PARTS: HousePart[] = HOUSE_ART.flatMap((a) =>
  HOUSE_HUES.map((hue) => ({ ...a, hue, id: hue ? `${a.art}_h${hue}` : a.art })),
);

// The parts a new house starts with.
export const DEFAULT_HOUSE: Record<HouseSlot, string> = {
  wall: 'ext_wall_1',
  roof: 'ext_roof_1',
  door: 'ext_door_1',
  window: 'ext_window_1',
};

export function housePart(id: string): HousePart | undefined {
  return HOUSE_PARTS.find((p) => p.id === id);
}
