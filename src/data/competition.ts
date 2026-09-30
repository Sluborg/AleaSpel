// Tävlingsdag: the team competes against rival clubs. Rivals are data rows; their score is a
// random share of the same maximum the player's team can reach.
export interface RivalTeam {
  id: string;
  name: string; // Swedish
  color: number;
  skill: [number, number]; // min and max share of the maximum score
}

export const RIVAL_TEAMS: RivalTeam[] = [
  { id: 'sol', name: 'Solstrålarna', color: 0xffc94d, skill: [0.35, 0.6] },
  { id: 'stjarna', name: 'Stjärnskotten', color: 0x7ec8ff, skill: [0.45, 0.75] },
  { id: 'blixt', name: 'Blixtarna', color: 0xb388ff, skill: [0.55, 0.85] },
];

export const TEAM_NAME = 'Mitt lag';

// Medals for placing 1st, 2nd, 3rd, 4th.
export const PLACEMENT_MEDALS = [12, 8, 5, 2];
export const PLACEMENT_ICONS = ['🥇', '🥈', '🥉', '🎗️'];
