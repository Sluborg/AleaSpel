// Pet games and foods. Each pet has a hidden preference (-1, 0, +1) for every row, discovered by
// trying it. Adding a food = a row. Adding a game = a row with an existing kind.
export type GameKind =
  'ball' | 'tapfast' | 'pattern' | 'hold' | 'rub' | 'hide' | 'mouse' | 'frisbee' | 'bubbles';

export interface PetGame {
  id: string;
  name: string; // Swedish
  icon: string;
  kind: GameKind;
  art?: string; // icon manifest id, default icon_pet_<id>
}

export const PET_GAMES: PetGame[] = [
  { id: 'ball', name: 'Boll', icon: '⚽', kind: 'ball' },
  { id: 'jump', name: 'Hopplek', icon: '🐾', kind: 'tapfast' },
  { id: 'trick', name: 'Trick', icon: '🌀', kind: 'pattern' },
  { id: 'balance', name: 'Balans', icon: '🪵', kind: 'hold' },
  { id: 'belly', name: 'Magkli', icon: '🤲', kind: 'rub', art: 'icon_pet_bellyrub' },
  { id: 'hide', name: 'Kurragömma', icon: '📦', kind: 'hide' },
  { id: 'mouse', name: 'Fånga musen', icon: '🐭', kind: 'mouse' },
  { id: 'frisbee', name: 'Frisbee', icon: '🥏', kind: 'frisbee' },
  { id: 'bubbles', name: 'Bubblor', icon: '🫧', kind: 'bubbles' },
];

export interface PetFood {
  id: string;
  name: string; // Swedish
  icon: string;
  favouriteOf: string[]; // species ids that always love it
}

export const PET_FOODS: PetFood[] = [
  { id: 'fish', name: 'Fisk', icon: '🐟', favouriteOf: ['cat'] },
  { id: 'bone', name: 'Ben', icon: '🦴', favouriteOf: ['dog'] },
  { id: 'carrot', name: 'Morot', icon: '🥕', favouriteOf: ['rabbit', 'guinea'] },
  { id: 'apple', name: 'Äpple', icon: '🍎', favouriteOf: ['pony'] },
  { id: 'seeds', name: 'Frön', icon: '🌻', favouriteOf: ['hamster'] },
  { id: 'cheese', name: 'Ost', icon: '🧀', favouriteOf: [] },
  { id: 'berries', name: 'Bär', icon: '🍓', favouriteOf: [] },
  { id: 'cookie', name: 'Kaka', icon: '🍪', favouriteOf: [] },
];

export function activityName(id: string): string {
  return (PET_GAMES.find((g) => g.id === id) ?? PET_FOODS.find((f) => f.id === id))?.name ?? id;
}
