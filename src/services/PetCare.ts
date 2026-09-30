// Pet care rules: gentle needs and the secret personality.
import { PET_FOODS, PET_GAMES } from '../data/petActivities';
import type { Pet, PetNeeds } from './SaveService';

export const NEED_FLOOR = 20;
const DROP_PER_HOUR = 6;

export function applyDecay(pet: Pet, now = Date.now()): void {
  const hours = Math.max(0, (now - pet.updatedAt) / 3_600_000);
  for (const k of Object.keys(pet.needs) as (keyof PetNeeds)[]) {
    const v = Math.max(Math.min(pet.needs[k], NEED_FLOOR), pet.needs[k] - hours * DROP_PER_HOUR);
    pet.needs[k] = Math.round(v * 10) / 10;
  }
  pet.updatedAt = now;
}

export function care(pet: Pet, need: keyof PetNeeds, amount: number): void {
  applyDecay(pet);
  pet.needs[need] = Math.min(100, Math.round((pet.needs[need] + amount) * 10) / 10);
}

// The lowest need under 40, used for the thought bubble.
export function wish(pet: Pet): keyof PetNeeds | null {
  const entries = Object.entries(pet.needs) as [keyof PetNeeds, number][];
  const [k, v] = entries.sort((a, b) => a[1] - b[1])[0];
  return v < 40 ? k : null;
}

// Secret personality: every game and food gets love (+1), ok (0) or dislike (-1).
// Species favourite foods are always loved. At least one game is loved.
export function rollTraits(species: string): Record<string, number> {
  const roll = () => {
    const r = Math.random();
    return r < 0.4 ? 1 : r < 0.8 ? 0 : -1;
  };
  const traits: Record<string, number> = {};
  for (const g of PET_GAMES) traits[g.id] = roll();
  for (const f of PET_FOODS) traits[f.id] = f.favouriteOf.includes(species) ? 1 : roll();
  if (!PET_GAMES.some((g) => traits[g.id] === 1)) {
    traits[PET_GAMES[Math.floor(Math.random() * PET_GAMES.length)].id] = 1;
  }
  return traits;
}

// Records the discovery and returns the pet's reaction (-1, 0, 1).
export function react(pet: Pet, id: string): number {
  if (!pet.known.includes(id)) pet.known.push(id);
  return pet.traits[id] ?? 0;
}
