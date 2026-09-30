import { rollTraits } from './PetCare';

// Versioned save data in localStorage.
// To change the schema: bump SAVE_VERSION, update SaveData, add a migration from the previous version.

export const SAVE_VERSION = 8;
const STORAGE_KEY = 'aleaspel.save';

export interface Position {
  x: number;
  y: number;
}

// One worn item per wardrobe layer. tint is a 0xRRGGBB colour for tintable items.
export interface WornItem {
  item: string;
  tint?: number;
}

export interface Gymnast {
  id: string;
  name: string;
  outfit: Record<string, WornItem>; // key = wardrobe layer id
  bests: Record<string, number>; // minigame id -> best score (stars)
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
  home: {
    furniture: Record<string, Position>;
  };
  gymnasts: Gymnast[];
  pets: Pet[];
  medals: number; // currency won in Tävlingar, spent in Butiken
  owned: string[]; // shop item ids bought in Butiken
  activeGymnastId: string; // the gymnast shown in Mitt lag and used in Tävlingar
  gym: {
    equipment: Record<string, Position>; // placed apparatus in Mitt gym
  };
}

export function createGymnast(index: number): Gymnast {
  return { id: `g${index}`, name: `Gymnast ${index}`, outfit: {}, bests: {} };
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
};

function createDefault(): SaveData {
  return {
    version: SAVE_VERSION,
    home: { furniture: {} },
    gymnasts: [createGymnast(1)],
    pets: [],
    medals: 0,
    owned: [],
    activeGymnastId: 'g1',
    gym: { equipment: {} },
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
