import { FURNITURE } from '../data/furniture';
import { rollTraits } from './PetCare';

// Versioned save data in localStorage.
// To change the schema: bump SAVE_VERSION, update SaveData, add a migration from the previous version.

export const SAVE_VERSION = 14;
const STORAGE_KEY = 'aleaspel.save';

export interface Position {
  x: number;
  y: number;
}

// One piece of furniture the team owns. Several of the same kind are allowed. Stored pieces wait
// in the room's Förråd (inventory); `z` is a manual layer set with the layer buttons (cleared when
// the piece is dragged, so it sorts by where it stands again).
export interface FurnitureItem {
  uid: string;
  def: string; // furniture id in data/furniture.ts, or a house part in data/exterior.ts
  x: number;
  y: number;
  z?: number;
  stored?: boolean;
}

export interface Trophy {
  place: 1 | 2 | 3;
  date: string; // YYYY-MM-DD
}

// Today's date in the player's own calendar (not UTC), as YYYY-MM-DD.
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function newUid(): string {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// The free furniture every save starts with, placed at its default spot.
function starterFurniture(extra: string[] = [], placed: Record<string, Position> = {}) {
  return FURNITURE.filter((f) => !f.price || extra.includes(f.id)).map((f): FurnitureItem => ({
    uid: newUid(),
    def: f.id,
    x: placed[f.id]?.x ?? f.defaultX,
    y: placed[f.id]?.y ?? f.defaultY,
  }));
}

// One worn item per wardrobe layer. tint is a 0xRRGGBB colour for tintable items.
export interface WornItem {
  item: string;
  tint?: number;
}

export interface Gymnast {
  id: string;
  name: string;
  outfit: Record<string, WornItem>; // key = wardrobe layer id; face and hair are shared here
  looks?: Record<string, Record<string, WornItem>>; // occasion id -> clothes per layer
  bests: Record<string, number>; // minigame id -> best score (stars)
  levels?: Record<string, number>; // minigame id -> difficulty level 1-5 (services/Difficulty.ts)
}

export interface PetNeeds {
  food: number; // 0-100
  clean: number;
  fun: number;
}

// Pets belong to the team (not to a gymnast).
export interface Pet {
  id: string;
  name: string;
  species: string;
  color: number;
  needs: PetNeeds;
  updatedAt: number; // ms timestamp of the last needs update
  traits: Record<string, number>; // secret personality: game/food id -> -1, 0 or 1
  known: string[]; // traits the player has discovered
}

export interface SaveData {
  version: number;
  furniture: FurnitureItem[]; // every piece in Mina hus and Klubbstugan, placed or stored
  gymnasts: Gymnast[];
  pets: Pet[];
  medals: number; // currency won in Tävlingar, spent in Butiken
  owned: string[]; // clothes ids bought in Butiken (furniture is counted in `furniture`)
  activeGymnastId: string; // the gymnast shown in Mitt lag and used in Tävlingar
  gym: {
    equipment: Record<string, Position>; // placed apparatus in Mitt gym
  };
  clubhouse: {
    pets: Record<string, Position>; // pet id (or 'gymnast') -> where it sits in Klubbstugan
  };
  team: {
    days: number; // Tävlingsdag competitions completed
    wins: number; // first places
    podiums: number; // top three places
    trophies: Trophy[]; // one cup per top-three place, shown in Klubbstugan's Prisskåp
  };
}

export function createGymnast(index: number): Gymnast {
  return {
    id: `g${index}`,
    name: `Gymnast ${index}`,
    outfit: {},
    looks: {},
    bests: {},
    levels: {},
  };
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

// MIGRATIONS[n] upgrades a save from version n to n + 1.
const MIGRATIONS: Record<number, Migration> = {
  1: (data) => ({ ...data, version: 2, gymnasts: [createGymnast(1)] }),
  2: (data) => ({ ...data, version: 3, pets: [] }),
  3: (data) => ({
    ...data,
    version: 4,
    pets: ((data.pets as Pet[]) ?? []).map((p) => ({
      ...p,
      traits: rollTraits(p.species),
      known: [],
    })),
  }),
  4: (data) => ({
    ...data,
    version: 5,
    medals: 0,
    gymnasts: ((data.gymnasts as Gymnast[]) ?? []).map((g) => ({ ...g, bests: {} })),
  }),
  5: (data) => ({ ...data, version: 6, owned: [] }),
  6: (data) => ({
    ...data,
    version: 7,
    activeGymnastId: ((data.gymnasts as Gymnast[]) ?? [])[0]?.id ?? 'g1',
  }),
  7: (data) => ({ ...data, version: 8, gym: { equipment: {} } }),
  8: (data) => ({ ...data, version: 9, clubhouse: { furniture: {}, pets: {} } }),
  9: (data) => ({ ...data, version: 10, team: { days: 0, wins: 0, podiums: 0 } }),
  // Looks per occasion: the clothes worn so far become the Vardag look.
  10: (data) => ({
    ...data,
    version: 11,
    gymnasts: ((data.gymnasts as Gymnast[]) ?? []).map((g) => ({
      ...g,
      looks: {
        vardag: Object.fromEntries(
          Object.entries(g.outfit ?? {}).filter(
            ([l]) => !['body', 'eyes', 'brows', 'mouth', 'hair_back', 'hair_front'].includes(l),
          ),
        ),
      },
    })),
  }),
  // Furniture becomes a list of pieces (buy several, keep some in the Förråd).
  11: (data) => {
    const owned = (data.owned as string[]) ?? [];
    const home = (data.home as { furniture?: Record<string, Position> })?.furniture ?? {};
    const club = (data.clubhouse as { furniture?: Record<string, Position> })?.furniture ?? {};
    const pets = (data.clubhouse as { pets?: Record<string, Position> })?.pets ?? {};
    const rest = { ...data };
    delete rest.home;
    return {
      ...rest,
      version: 12,
      furniture: starterFurniture(owned, { ...home, ...club }),
      owned: owned.filter((id) => !FURNITURE.some((f) => f.id === id)),
      clubhouse: { pets },
    };
  },
  // Difficulty levels per gymnast and game; everyone starts at level 1.
  12: (data) => ({
    ...data,
    version: 13,
    gymnasts: ((data.gymnasts as Gymnast[]) ?? []).map((g) => ({ ...g, levels: {} })),
  }),
  // Trophies: earlier wins become gold cups, other top-three places silver (the exact place
  // was not saved before v14).
  13: (data) => {
    const team = (data.team as { days: number; wins: number; podiums: number }) ?? {
      days: 0,
      wins: 0,
      podiums: 0,
    };
    const today = localDate();
    const trophies: Trophy[] = [
      ...Array.from({ length: team.wins }, (): Trophy => ({ place: 1, date: today })),
      ...Array.from({ length: Math.max(0, team.podiums - team.wins) }, (): Trophy => ({
        place: 2,
        date: today,
      })),
    ];
    return { ...data, version: 14, team: { ...team, trophies } };
  },
};

function createDefault(): SaveData {
  return {
    version: SAVE_VERSION,
    furniture: starterFurniture(),
    gymnasts: [createGymnast(1)],
    pets: [],
    medals: 0,
    owned: [],
    activeGymnastId: 'g1',
    gym: { equipment: {} },
    clubhouse: { pets: {} },
    team: { days: 0, wins: 0, podiums: 0, trophies: [] },
  };
}

function migrate(raw: Record<string, unknown>): SaveData {
  let data = raw;
  let version = typeof data.version === 'number' ? data.version : 0;
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) {
      console.warn(`SaveService: no migration from v${version}, resetting save`);
      return createDefault();
    }
    data = step(data);
    version = data.version as number;
  }
  return data as unknown as SaveData;
}

class SaveServiceImpl {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  get(): Readonly<SaveData> {
    return this.data;
  }

  update(mutator: (data: SaveData) => void): void {
    mutator(this.data);
    this.persist();
  }

  // The active gymnast, falling back to the first one.
  activeGymnast(): Gymnast {
    const { gymnasts, activeGymnastId } = this.data;
    return gymnasts.find((g) => g.id === activeGymnastId) ?? gymnasts[0];
  }

  reset(): void {
    this.data = createDefault();
    this.persist();
  }

  private load(): SaveData {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return createDefault();
      const parsed = JSON.parse(json) as Record<string, unknown>;
      if (typeof parsed.version === 'number' && parsed.version > SAVE_VERSION) {
        console.warn('SaveService: save is from a newer version, using defaults');
        return createDefault();
      }
      return migrate(parsed);
    } catch (err) {
      console.warn('SaveService: could not read save', err);
      return createDefault();
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('SaveService: could not write save', err);
    }
  }
}

export const SaveService = new SaveServiceImpl();
