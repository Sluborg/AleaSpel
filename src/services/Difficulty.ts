import type { Gymnast } from './SaveService';

// Adaptive difficulty: every gymnast has a level (1-5) per game. A good game (75 % of the stars
// or more) moves her up, a hard one (under 40 %) moves her down, so games stay a challenge while
// she still wins most of the time. Practice in Mitt gym does not change the level.
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
const UP_AT = 0.75;
const DOWN_BELOW = 0.4;

export function levelOf(gymnast: Gymnast, gameId: string): number {
  return gymnast.levels?.[gameId] ?? MIN_LEVEL;
}

// Returns the new level; changes the gymnast (inside a SaveService.update).
export function adjustLevel(gymnast: Gymnast, gameId: string, stars: number, max: number): number {
  const before = levelOf(gymnast, gameId);
  const share = max > 0 ? stars / max : 0;
  const after =
    share >= UP_AT
      ? Math.min(MAX_LEVEL, before + 1)
      : share < DOWN_BELOW
        ? Math.max(MIN_LEVEL, before - 1)
        : before;
  gymnast.levels = { ...(gymnast.levels ?? {}), [gameId]: after };
  return after;
}

// Game speed per level for the apparatus games (animation and drawing window): slower is easier.
export const LEVEL_TIME_SCALE = [0.7, 0.8, 0.9, 1, 1.1];

// Result line for the end panel.
export function levelMessage(before: number, after: number): string {
  if (after > before) return `Ny nivå: ${after} ⬆`;
  if (after < before) return `Nivå ${after}, lite lättare nästa gång`;
  return `Nivå ${after}`;
}
