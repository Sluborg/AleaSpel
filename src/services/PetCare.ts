// Gentle pet needs: they drop slowly over real time but never below NEED_FLOOR (cozy pillar).
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
  pet.needs[need] = Math.min(100, pet.needs[need] + amount);
}

// The lowest need under 40, used for the thought bubble.
export function wish(pet: Pet): keyof PetNeeds | null {
  const entries = Object.entries(pet.needs) as [keyof PetNeeds, number][];
  const [k, v] = entries.sort((a, b) => a[1] - b[1])[0];
  return v < 40 ? k : null;
}
