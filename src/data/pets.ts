// Pet species and colours. Adding a species = a row here (shape parameters for the placeholder SVG).
export type EarType = 'cat' | 'dog' | 'rabbit' | 'round' | 'pony';
export type TailType = 'cat' | 'dog' | 'puff' | 'none' | 'pony';

export interface PetSpecies {
  id: string;
  name: string; // Swedish
  defaultName: string;
  ears: EarType;
  tail: TailType;
  headR: number; // head radius in the 400x400 SVG
  bodyW: number; // body half-width
  bodyH: number; // body half-height
  snout: boolean;
  pose: 'sit' | 'stand';
  roomSize: number; // drawn size in rooms, as a share of the gymnast's height
}

export const PET_SPECIES: PetSpecies[] = [
  {
    id: 'cat',
    name: 'Katt',
    defaultName: 'Misse',
    ears: 'cat',
    tail: 'cat',
    headR: 88,
    bodyW: 92,
    bodyH: 70,
    snout: false,
    pose: 'sit',
    roomSize: 0.36,
  },
  {
    id: 'dog',
    name: 'Hund',
    defaultName: 'Bella',
    ears: 'dog',
    tail: 'dog',
    headR: 90,
    bodyW: 100,
    bodyH: 72,
    snout: true,
    pose: 'sit',
    roomSize: 0.42,
  },
  {
    id: 'rabbit',
    name: 'Kanin',
    defaultName: 'Stampe',
    ears: 'rabbit',
    tail: 'puff',
    headR: 80,
    bodyW: 90,
    bodyH: 74,
    snout: false,
    pose: 'sit',
    roomSize: 0.36,
  },
  {
    id: 'guinea',
    name: 'Marsvin',
    defaultName: 'Nöff',
    ears: 'round',
    tail: 'none',
    headR: 84,
    bodyW: 118,
    bodyH: 70,
    snout: false,
    pose: 'sit',
    roomSize: 0.3,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    defaultName: 'Pippi',
    ears: 'round',
    tail: 'none',
    headR: 96,
    bodyW: 96,
    bodyH: 80,
    snout: false,
    pose: 'sit',
    roomSize: 0.24,
  },
  {
    id: 'pony',
    name: 'Ponny',
    defaultName: 'Stjärna',
    ears: 'pony',
    tail: 'pony',
    headR: 84,
    bodyW: 120,
    bodyH: 76,
    snout: true,
    pose: 'stand',
    roomSize: 0.75,
  },
];

export const PET_COLORS: number[] = [
  0xfdf6ec, 0xf3d9a4, 0xf2a65a, 0xa86b3c, 0x9aa0a6, 0x4a4a55, 0xf7b8d0, 0xc9b6f2,
];

export function petSpecies(id: string): PetSpecies {
  return PET_SPECIES.find((s) => s.id === id) ?? PET_SPECIES[0];
}
