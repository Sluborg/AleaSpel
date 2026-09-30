// Minigames, moves and gestures as data. A move is a gesture the player draws while the gymnast
// is in the air. Adding a move = a row; adding a gesture kind needs code in services/Gesture.ts.
export type GestureKind = 'up' | 'down' | 'left' | 'right' | 'circle' | 'zigzag' | 'v' | 'tap';

export interface GestureDef {
  id: string;
  kind: GestureKind;
  symbol: string; // shown on the move card
  hint: string; // Swedish, short
}

export const GESTURES: GestureDef[] = [
  { id: 'up', kind: 'up', symbol: '↑', hint: 'Svep uppåt' },
  { id: 'down', kind: 'down', symbol: '↓', hint: 'Svep nedåt' },
  { id: 'left', kind: 'left', symbol: '←', hint: 'Svep vänster' },
  { id: 'right', kind: 'right', symbol: '→', hint: 'Svep höger' },
  { id: 'circle', kind: 'circle', symbol: '○', hint: 'Rita en cirkel' },
  { id: 'zigzag', kind: 'zigzag', symbol: '⩗', hint: 'Rita sicksack' },
  { id: 'v', kind: 'v', symbol: 'V', hint: 'Rita ett V' },
  { id: 'tap', kind: 'tap', symbol: '●', hint: 'Tryck' },
];

export interface MoveDef {
  id: string;
  name: string; // Swedish
  gesture: string; // gesture id
  difficulty: 1 | 2 | 3; // stars at stake
  pose: 'tuck' | 'pike' | 'straddle' | 'twist' | 'flip' | 'straight';
}

export const MOVES: MoveDef[] = [
  { id: 'straight_jump', name: 'Raka hopp', gesture: 'up', difficulty: 1, pose: 'straight' },
  { id: 'tuck', name: 'Kroppa', gesture: 'tap', difficulty: 1, pose: 'tuck' },
  { id: 'pike', name: 'Pik', gesture: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle', name: 'Grenhopp', gesture: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'half_twist', name: 'Halv skruv', gesture: 'right', difficulty: 2, pose: 'twist' },
  { id: 'seat_drop', name: 'Sittfall', gesture: 'down', difficulty: 1, pose: 'straight' },
  { id: 'front_flip', name: 'Volt', gesture: 'circle', difficulty: 3, pose: 'flip' },
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
    moves: ['straight_jump', 'tuck', 'pike', 'straddle', 'half_twist', 'seat_drop', 'front_flip'],
    rounds: 5,
    available: true,
  },
  { id: 'beam', name: 'Bom', icon: '🪵', scene: '', moves: [], rounds: 5, available: false },
  { id: 'bars', name: 'Barr', icon: '🎽', scene: '', moves: [], rounds: 5, available: false },
  { id: 'vault', name: 'Hopp', icon: '🏃', scene: '', moves: [], rounds: 5, available: false },
];

// Medals per star earned in a round.
export const MEDALS_PER_STAR = 1;

export const gestureById = (id: string) => GESTURES.find((g) => g.id === id) ?? GESTURES[0];
export const moveById = (id: string) => MOVES.find((m) => m.id === id) ?? MOVES[0];
