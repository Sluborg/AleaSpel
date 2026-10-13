// Minigames and moves as data. A move is a pattern (see gestureShapes.ts) the player draws
// while the gymnast is in the air; the score depends on how accurately it was drawn.
export interface MoveDef {
  id: string;
  name: string; // Swedish
  shape: string; // shape id from gestureShapes.ts
  difficulty: 1 | 2 | 3; // stars at stake
  // No 'twist': a turn around the long axis cannot be shown on a flat 2D figure.
  pose: 'tuck' | 'pike' | 'straddle' | 'flip' | 'straight';
}

export const MOVES: MoveDef[] = [
  { id: 'straight_jump', name: 'Rakt hopp', shape: 'triangle', difficulty: 1, pose: 'straight' },
  { id: 'tuck', name: 'Grupperat hopp', shape: 'circle', difficulty: 1, pose: 'tuck' },
  { id: 'seat_drop', name: 'Sittstuds', shape: 'u', difficulty: 1, pose: 'straight' },
  { id: 'back_drop', name: 'Ryggstuds', shape: 'wave', difficulty: 2, pose: 'straight' },
  { id: 'pike', name: 'Pikhopp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle', name: 'Grenhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'split_jump', name: 'Spagathopp', shape: 's', difficulty: 2, pose: 'straddle' },
  { id: 'front_flip', name: 'Frivolt', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'star_jump', name: 'Stjärnhopp', shape: 'star', difficulty: 3, pose: 'straddle' },
  { id: 'back_flip', name: 'Bakåtvolt', shape: 'infinity', difficulty: 3, pose: 'flip' },
  // Beam
  { id: 'balance', name: 'Balans', shape: 'peak', difficulty: 1, pose: 'straight' },
  { id: 'squat', name: 'Knäböj', shape: 'house', difficulty: 1, pose: 'tuck' },
  { id: 'leap', name: 'Språng', shape: 'm', difficulty: 2, pose: 'straddle' },
  { id: 'arabesque', name: 'Arabesk', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'leg_lift', name: 'Benlyft', shape: 's', difficulty: 2, pose: 'pike' },
  { id: 'beam_jump', name: 'Saxhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'cartwheel', name: 'Hjul', shape: 'circle', difficulty: 2, pose: 'flip' },
  { id: 'beam_flip', name: 'Volt på bommen', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'dismount', name: 'Avhopp', shape: 'star', difficulty: 3, pose: 'flip' },
  // Bars
  { id: 'swing', name: 'Sväng', shape: 'circle', difficulty: 1, pose: 'straight' },
  { id: 'hip_circle', name: 'Bukomsväng', shape: 'u', difficulty: 1, pose: 'tuck' },
  { id: 'kip', name: 'Kipp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'handstand', name: 'Handstående', shape: 'l', difficulty: 2, pose: 'straight' },
  { id: 'knee_lift', name: 'Knälyft', shape: 's', difficulty: 2, pose: 'tuck' },
  { id: 'release', name: 'Släpp och fång', shape: 'zigzag', difficulty: 3, pose: 'straddle' },
  { id: 'giant', name: 'Jättesväng', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'flyaway', name: 'Flygande avhopp', shape: 'infinity', difficulty: 3, pose: 'flip' },
  { id: 'bar_dismount', name: 'Avhopp', shape: 'star', difficulty: 3, pose: 'flip' },
  // Vault
  { id: 'frog', name: 'Katthopp', shape: 'square', difficulty: 1, pose: 'tuck' },
  { id: 'round_off', name: 'Rondat', shape: 'diamond', difficulty: 2, pose: 'flip' },
  { id: 'straight_vault', name: 'Rakt hopp', shape: 'triangle', difficulty: 1, pose: 'straight' },
  { id: 'pike_vault', name: 'Pikhopp', shape: 'v', difficulty: 2, pose: 'pike' },
  { id: 'straddle_vault', name: 'Grenhopp', shape: 'zigzag', difficulty: 2, pose: 'straddle' },
  { id: 'tuck_vault', name: 'Grupperat hopp', shape: 's', difficulty: 2, pose: 'tuck' },
  { id: 'handspring', name: 'Överslag', shape: 'circle', difficulty: 2, pose: 'flip' },
  { id: 'vault_flip', name: 'Frivolt', shape: 'heart', difficulty: 3, pose: 'flip' },
  { id: 'vault_star', name: 'Stjärnhopp', shape: 'star', difficulty: 3, pose: 'straddle' },
  { id: 'back_flip_vault', name: 'Bakåtvolt', shape: 'm', difficulty: 3, pose: 'flip' },
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
  variant?: string; // warmup: which challenge the OrderGame scene runs (numbers, letters, pairs)
  // apparatus: what a round can be, picked at random each round ('pattern' = draw the move).
  mix?: RoundKind[];
}

export type RoundKind = 'pattern' | 'numbers' | 'letters' | 'timing' | 'colors' | 'pairs';

export const MINIGAMES: MinigameDef[] = [
  {
    id: 'trampoline',
    name: 'Studsmatta',
    icon: '🤸',
    scene: 'Trampoline',
    mix: ['pattern', 'pattern', 'pattern', 'timing', 'colors'],
    moves: [
      'straight_jump',
      'tuck',
      'seat_drop',
      'pike',
      'straddle',
      'split_jump',
      'back_drop',
      'front_flip',
      'star_jump',
      'back_flip',
    ],
    rounds: 5,
    available: true,
  },
  {
    id: 'beam',
    name: 'Bom',
    icon: '🪵',
    scene: 'Beam',
    mix: ['pattern', 'pattern', 'pattern', 'colors', 'timing'],
    moves: [
      'balance',
      'squat',
      'arabesque',
      'leap',
      'leg_lift',
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
    mix: ['pattern', 'pattern', 'pattern', 'numbers', 'timing'],
    moves: [
      'swing',
      'hip_circle',
      'kip',
      'handstand',
      'knee_lift',
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
    mix: ['pattern', 'pattern', 'pattern', 'timing', 'letters'],
    moves: [
      'frog',
      'straight_vault',
      'round_off',
      'pike_vault',
      'straddle_vault',
      'tuck_vault',
      'handspring',
      'vault_flip',
      'vault_star',
      'back_flip_vault',
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
    intro:
      'Titta på färgerna som blinkar.\nTryck samma färger i samma ordning!\nVarje runda kommer en färg till.',
  },
  {
    id: 'pairs',
    name: 'Para ihop',
    icon: '🃏',
    scene: 'OrderGame',
    moves: [],
    rounds: 5,
    available: true,
    kind: 'warmup',
    variant: 'pairs',
    intro: 'Vänd två kort i taget.\nHitta alla par som är lika!',
  },
];

// Apparatus games (the gymnastics events), for Tävlingsdag and Mitt gym.
export const APPARATUS_GAMES = MINIGAMES.filter((g) => (g.kind ?? 'apparatus') === 'apparatus');

// Medals per star earned in a round.
export const MEDALS_PER_STAR = 1;
// Warm-up games are quick and give many stars, so they pay less: 1 medal per 3 stars.
export const WARMUP_STARS_PER_MEDAL = 3;

export function medalsFor(def: MinigameDef, stars: number): number {
  return def.kind === 'warmup'
    ? Math.round(stars / WARMUP_STARS_PER_MEDAL)
    : stars * MEDALS_PER_STAR;
}

export const moveById = (id: string) => MOVES.find((m) => m.id === id) ?? MOVES[0];
