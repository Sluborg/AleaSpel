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
  // Bars
  { id: 'swing', name: 'Sväng', shape: 'circle', difficulty: 1, pose: 'straight' },
  { id: 'kip', name: 'Kipp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'handstand', name: 'Handstående', shape: 'triangle', difficulty: 2, pose: 'straight' },
  { id: 'bar_twist', name: 'Skruvsväng', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'release', name: 'Släpp och fång', shape: 'zigzag', difficulty: 3, pose: 'straddle' },
  { id: 'giant', name: 'Jättesväng', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'bar_dismount', name: 'Avhopp', shape: 'star', difficulty: 3, pose: 'flip' },
  // Vault
  { id: 'frog', name: 'Grodhopp', shape: 'square', difficulty: 1, pose: 'tuck' },
  { id: 'straight_vault', name: 'Raka hopp', shape: 'triangle', difficulty: 1, pose: 'straight' },
  { id: 'pike_vault', name: 'Pikhopp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle_vault', name: 'Grenhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'twist_vault', name: 'Skruvhopp', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'handspring', name: 'Överslag', shape: 'circle', difficulty: 2, pose: 'flip' },
  { id: 'vault_flip', name: 'Volt', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'vault_star', name: 'Stjärnhopp', shape: 'star', difficulty: 3, pose: 'straddle' },
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
  {
    id: 'bars',
    name: 'Barr',
    icon: '🎽',
    scene: 'Bars',
    moves: ['swing', 'kip', 'handstand', 'bar_twist', 'release', 'giant', 'bar_dismount'],
    rounds: 5,
    available: true,
  },
  {
    id: 'vault',
    name: 'Hopp',
    icon: '🏃',
    scene: 'Vault',
    moves: [
      'frog',
      'straight_vault',
      'pike_vault',
      'straddle_vault',
      'twist_vault',
      'handspring',
      'vault_flip',
      'vault_star',
    ],
    rounds: 5,
    available: true,
  },
];

// Medals per star earned in a round.
export const MEDALS_PER_STAR = 1;

export const moveById = (id: string) => MOVES.find((m) => m.id === id) ?? MOVES[0];
