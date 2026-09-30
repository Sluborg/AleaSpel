// Minigames and moves as data. A move is a pattern (see gestureShapes.ts) the player draws
// while the gymnast is in the air; the score depends on how accurately it was drawn.
export interface MoveDef {
  id: string;
  name: string; // Swedish
  shape: string; // shape id from gestureShapes.ts
  difficulty: 1 | 2 | 3; // stars at stake
  pose: 'tuck' | 'pike' | 'straddle' | 'twist' | 'flip' | 'straight';
}

export const MOVES: MoveDef[] = [
  { id: 'straight_jump', name: 'Raka hopp', shape: 'triangle', difficulty: 1, pose: 'straight' },
  { id: 'tuck', name: 'Kroppa', shape: 'circle', difficulty: 1, pose: 'tuck' },
  { id: 'seat_drop', name: 'Sittfall', shape: 'square', difficulty: 1, pose: 'straight' },
  { id: 'pike', name: 'Pik', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle', name: 'Grenhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'half_twist', name: 'Halv skruv', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'front_flip', name: 'Volt', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'star_jump', name: 'Stjärnhopp', shape: 'star', difficulty: 3, pose: 'straddle' },
  // Beam
  { id: 'balance', name: 'Balans', shape: 'triangle', difficulty: 1, pose: 'straight' },
  { id: 'squat', name: 'Knäböj', shape: 'square', difficulty: 1, pose: 'tuck' },
  { id: 'arabesque', name: 'Arabesk', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'pirouette', name: 'Piruett', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'beam_jump', name: 'Hopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'cartwheel', name: 'Hjul', shape: 'circle', difficulty: 2, pose: 'flip' },
  { id: 'beam_flip', name: 'Volt på bom', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'dismount', name: 'Avhopp', shape: 'star', difficulty: 3, pose: 'flip' },
];

export interface MinigameDef {
  id: string;
  name: string; // Swedish
  icon: string;
  scene: string; // Phaser scene key
  moves: string[]; // move ids in this game
  rounds: number;
  available: boolean; // false = "Kommer snart"
}

export const MINIGAMES: MinigameDef[] = [
  {
    id: 'trampoline',
    name: 'Studsmatta',
    icon: '🤸',
    scene: 'Trampoline',
    moves: [
      'straight_jump',
      'tuck',
      'seat_drop',
      'pike',
      'straddle',
      'half_twist',
      'front_flip',
      'star_jump',
    ],
    rounds: 5,
    available: true,
  },
  {
    id: 'beam',
    name: 'Bom',
    icon: '🪵',
    scene: 'Beam',
    moves: [
      'balance',
      'squat',
      'arabesque',
      'pirouette',
      'beam_jump',
      'cartwheel',
      'beam_flip',
      'dismount',
    ],
    rounds: 5,
    available: true,
  },
  { id: 'bars', name: 'Barr', icon: '🎽', scene: '', moves: [], rounds: 5, available: false },
  { id: 'vault', name: 'Hopp', icon: '🏃', scene: '', moves: [], rounds: 5, available: false },
];

// Medals per star earned in a round.
export const MEDALS_PER_STAR = 1;

export const moveById = (id: string) => MOVES.find((m) => m.id === id) ?? MOVES[0];
