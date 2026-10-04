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
  release?: string; // YYYY-MM-DD: not in Butiken before (Veckans nyheter, shop.ts)
  flat?: boolean; // lies on the floor: always behind standing apparatus
  art?: string; // manifest id when it is not equip_<id without eq_>
  hue?: number; // colour variant of the art: hue shift in degrees
}

export function equipmentArtId(def: EquipmentDef): string {
  return def.art ?? `equip_${def.id.replace(/^eq_/, '')}`;
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
  // Butiken (Gym tab): extra apparatus and mats, bought once with medals.
  {
    id: 'eq_mat_pink',
    name: 'Rosa matta',
    minigame: '',
    width: 260,
    height: 90,
    color: 0xff9ad0,
    defaultX: 900,
    defaultY: 1080,
    price: 3,
    flat: true,
    art: 'equip_mat',
    hue: 100,
  },
  {
    id: 'eq_mat_lilac',
    name: 'Lila matta',
    minigame: '',
    width: 260,
    height: 90,
    color: 0xc9a2ff,
    defaultX: 1200,
    defaultY: 1080,
    price: 3,
    flat: true,
    art: 'equip_mat',
    hue: 45,
  },
  {
    id: 'eq_minitramp',
    name: 'Minitramp',
    minigame: 'trampoline',
    width: 170,
    height: 80,
    color: 0xff6fae,
    defaultX: 950,
    defaultY: 760,
    price: 6,
    art: 'equip_trampoline',
  },
  {
    id: 'eq_beam_low',
    name: 'Mintbom',
    minigame: 'beam',
    width: 240,
    height: 60,
    color: 0xffe4b5,
    defaultX: 1200,
    defaultY: 600,
    price: 5,
    art: 'equip_beam',
    hue: 160,
  },
  {
    id: 'eq_vault_gold',
    name: 'Guldbock',
    minigame: 'vault',
    width: 200,
    height: 120,
    color: 0xffd84d,
    defaultX: 1000,
    defaultY: 950,
    price: 9,
    art: 'equip_vault',
    hue: 25,
  },
];
