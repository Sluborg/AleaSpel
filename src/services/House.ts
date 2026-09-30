import { DEFAULT_HOUSE, housePart, type HousePart, type HouseSlot } from '../data/exterior';
import { SaveService, newUid } from './SaveService';

// The chosen house parts live in the save's furniture list (one piece per slot, never placed in
// a room), so the house needs no save schema change. A missing slot uses DEFAULT_HOUSE.
export function houseParts(): Record<HouseSlot, HousePart> {
  const chosen = { ...DEFAULT_HOUSE };
  for (const f of SaveService.get().furniture) {
    const part = housePart(f.def);
    if (part) chosen[part.slot] = part.id;
  }
  return {
    wall: housePart(chosen.wall)!,
    roof: housePart(chosen.roof)!,
    door: housePart(chosen.door)!,
    window: housePart(chosen.window)!,
  };
}

export function chooseHousePart(part: HousePart): void {
  SaveService.update((d) => {
    d.furniture = d.furniture.filter((f) => housePart(f.def)?.slot !== part.slot);
    d.furniture.push({ uid: newUid(), def: part.id, x: 0, y: 0, stored: true });
  });
}
