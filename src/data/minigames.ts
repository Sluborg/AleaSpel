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
  { id: 'seat_drop', name: 'Sittfall', shape: 'u', difficulty: 1, pose: 'straight' },
  { id: 'back_drop', name: 'Ryggfall', shape: 'wave', difficulty: 2, pose: 'straight' },
  { id: 'pike', name: 'Pik', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle', name: 'Grenhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'half_twist', name: 'Halv skruv', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'front_flip', name: 'Volt', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'star_jump', name: 'Stjärnhopp', shape: 'star', difficulty: 3, pose: 'straddle' },
  { id: 'barani', name: 'Barani', shape: 'infinity', difficulty: 3, pose: 'twist' },
  // Beam
  { id: 'balance', name: 'Balans', shape: 'peak', difficulty: 1, pose: 'straight' },
  { id: 'squat', name: 'Knäböj', shape: 'house', difficulty: 1, pose: 'tuck' },
  { id: 'leap', name: 'Språng', shape: 'm', difficulty: 2, pose: 'straddle' },
  { id: 'arabesque', name: 'Arabesk', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'pirouette', name: 'Piruett', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'beam_jump', name: 'Hopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'cartwheel', name: 'Hjul', shape: 'circle', difficulty: 2, pose: 'flip' },
  { id: 'beam_flip', name: 'Volt på bom', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'dismount', name: 'Avhopp', shape: 'star', difficulty: 3, pose: 'flip' },
  // Bars
  { id: 'swing', name: 'Sväng', shape: 'circle', difficulty: 1, pose: 'straight' },
  { id: 'hip_circle', name: 'Bukrullning', shape: 'u', difficulty: 1, pose: 'tuck' },
  { id: 'kip', name: 'Kipp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'handstand', name: 'Handstående', shape: 'l', difficulty: 2, pose: 'straight' },
  { id: 'bar_twist', name: 'Skruvsväng', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'release', name: 'Släpp och fång', shape: 'zigzag', difficulty: 3, pose: 'straddle' },
  { id: 'giant', name: 'Jättesväng', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'flyaway', name: 'Flyaway', shape: 'infinity', difficulty: 3, pose: 'flip' },
  { id: 'bar_dismount', name: 'Avhopp', shape: 'star', difficulty: 3, pose: 'flip' },
  // Vault
  { id: 'frog', name: 'Grodhopp', shape: 'square', difficulty: 1, pose: 'tuck' },
  { id: 'round_off', name: 'Rondat', shape: 'diamond', difficulty: 2, pose: 'flip' },
  { id: 'straight_vault', name: 'Raka hopp', shape: 'triangle', difficulty: 1, pose: 'straight' },
  { id: 'pike_vault', name: 'Pikhopp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle_vault', name: 'Grenhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'twist_vault', name: 'Skruvhopp', shape: 's', difficulty: 2, pose: 'twist' },
  { id: 'handspring', name: 'Överslag', shape: 'circle', difficulty: 2, pose: 'flip' },
  { id: 'vault_flip', name: 'Volt', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'vault_star', name: 'Stjärnhopp', shape: 'star', difficulty: 3, pose: 'straddle' },
  { id: 'yurchenko', name: 'Jurtjenko', shape: 'm', difficulty: 3, pose: 'twist' },
];

export interface MinigameDef {
  id: string;
  name: string; // Swedish
  icon: string;
  scene: string; // Phaser scene key
  moves: string[]; // move ids in this game
  rounds: number;
  available: boolean; // false = "Kommer snart"
  kind?: 'apparatus' | 'warmup'; // warmup games are quick brain games, not in Tävlingsdag
  intro?: string; // warmup: how to play, shown before the first round
  variant?: string; // warmup: which version of a shared scene (numbers, letters)
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
      'back_drop',
      'front_flip',
      'star_jump',
      'barani',
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
      'leap',
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
    moves: [
      'swing',
      'hip_circle',
      'kip',
      'handstand',
      'bar_twist',
      'release',
      'giant',
      'flyaway',
      'bar_dismount',
    ],
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
      'round_off',
      'pike_vault',
      'straddle_vault',
      'twist_vault',
      'handspring',
      'vault_flip',
      'vault_star',
      'yurchenko',
    ],
    rounds: 5,
    available: true,
  },
  // Uppvärmning: quick games on the QuickGameScene base.
  {
    id: 'numbers',
    name: 'Sifferhopp',
    icon: '🔢',
    scene: 'OrderGame',
    moves: [],
    rounds: 5,
    available: true,
    kind: 'warmup',
    variant: 'numbers',
    intro: 'Tryck på siffrorna i ordning, 1, 2, 3 …\nSnabbt och utan fel ger flest stjärnor!',
  },
  {
    id: 'letters',
    name: 'Bokstavsjakt',
    icon: '🔤',
    scene: 'OrderGame',
    moves: [],
    rounds: 5,
    available: true,
    kind: 'warmup',
    variant: 'letters',
    intro: 'Tryck på bokstäverna i ordning, A, B, C …\nSnabbt och utan fel ger flest stjärnor!',
  },
  {
    id: 'timing',
    name: 'Pricka rätt',
    icon: '🎯',
    scene: 'TimingGame',
    moves: [],
    rounds: 5,
    available: true,
    kind: 'warmup',
    intro: 'Pilen åker fram och tillbaka.\nTryck STOPP när den är på strecket!',
  },
  {
    id: 'colors',
    name: 'Färgminne',
    icon: '🌈',
    scene: 'ColorMemory',
    moves: [],
    rounds: 5,
    available: true,
    kind: 'warmup',
    intro: 'Titta på färgerna som blinkar.\nTryck samma färger i samma ordning!',
  },
];

// Apparatus games (the gymnastics events), for Tävlingsdag and Mitt gym.
export const APPARATUS_GAMES = MINIGAMES.filter((g) => (g.kind ?? 'apparatus') === 'apparatus');

// Medals per star earned in a round.
export const MEDALS_PER_STAR = 1;

export const moveById = (id: string) => MOVES.find((m) => m.id === id) ?? MOVES[0];
