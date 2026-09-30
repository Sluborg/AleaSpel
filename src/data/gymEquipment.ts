// Apparatus in Mitt gym. Each row is placeable like furniture and starts a minigame when tapped.
// Adding equipment = a row (graphics are placeholder shapes until art arrives).
export interface EquipmentDef {
  id: string;
  name: string;
  minigame: string; // minigame id from minigames.ts
  width: number;
  height: number;
  color: number;
  defaultX: number;
  defaultY: number;
  price?: number; // medals; no price = free from the start
  flat?: boolean; // lies on the floor: always behind standing apparatus
}

export const GYM_EQUIPMENT: EquipmentDef[] = [
  {
    id: 'eq_trampoline',
    name: 'Studsmatta',
    minigame: 'trampoline',
    width: 260,
    height: 110,
    color: 0x2b6cb0,
    defaultX: 200,
    defaultY: 760,
  },
  {
    id: 'eq_beam',
    name: 'Bom',
    minigame: 'beam',
    width: 320,
    height: 70,
    color: 0xd9b48c,
    defaultX: 480,
    defaultY: 560,
  },
  {
    id: 'eq_bars',
    name: 'Barr',
    minigame: 'bars',
    width: 240,
    height: 200,
    color: 0x7a7a85,
    defaultX: 200,
    defaultY: 480,
  },
  {
    id: 'eq_vault',
    name: 'Hopp',
    minigame: 'vault',
    width: 200,
    height: 120,
    color: 0x5aa9ff,
    defaultX: 500,
    defaultY: 900,
  },
  {
    id: 'eq_mat',
    name: 'Matta',
    minigame: '',
    width: 260,
    height: 90,
    color: 0x4f8fd0,
    defaultX: 250,
    defaultY: 1080,
    flat: true,
  },
];
