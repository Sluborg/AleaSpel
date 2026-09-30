// Whole-body moves for the gymnast (movement plan, stage 1). A move is a list of steps played in
// order; each step tweens the gymnast's pose to the given values. Adding a move = adding a row.
//   y       lift in view heights (0.1 = a tenth of the gymnast's height, up is positive)
//   scaleX  horizontal scale (negative = facing the other way), scaleY vertical scale (squash)
//   angle   rotation in degrees around the middle of the body
// Values not given in a step keep their current value. Every move ends back in the rest pose.
export interface MoveStep {
  y?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  duration: number; // ms
  ease?: string; // Phaser ease name
}

export interface MoveDef {
  id: string;
  steps: MoveStep[];
  loop?: boolean;
}

const REST: MoveStep = {
  y: 0,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  duration: 160,
  ease: 'Sine.easeOut',
};

export const MOVES: MoveDef[] = [
  {
    id: 'idle',
    loop: true,
    steps: [
      { scaleY: 1.012, scaleX: 0.995, duration: 1400, ease: 'Sine.easeInOut' },
      { scaleY: 1, scaleX: 1, duration: 1400, ease: 'Sine.easeInOut' },
    ],
  },
  {
    id: 'happy',
    steps: [
      { scaleY: 0.94, scaleX: 1.04, duration: 110, ease: 'Sine.easeOut' },
      { y: 0.08, scaleY: 1.05, scaleX: 0.97, duration: 180, ease: 'Quad.easeOut' },
      { y: 0, scaleY: 1, scaleX: 1, duration: 170, ease: 'Quad.easeIn' },
      { scaleY: 0.95, scaleX: 1.03, duration: 90 },
      REST,
    ],
  },
  {
    id: 'jump',
    steps: [
      { scaleY: 0.88, scaleX: 1.07, duration: 180, ease: 'Sine.easeOut' },
      { y: 0.35, scaleY: 1.08, scaleX: 0.95, duration: 340, ease: 'Quad.easeOut' },
      { y: 0, scaleY: 1, scaleX: 1, duration: 320, ease: 'Quad.easeIn' },
      { scaleY: 0.9, scaleX: 1.06, duration: 110 },
      REST,
    ],
  },
  {
    id: 'spin',
    steps: [
      { scaleX: 0, duration: 150, ease: 'Sine.easeIn' },
      { scaleX: -1, duration: 150, ease: 'Sine.easeOut' },
      { scaleX: 0, duration: 150, ease: 'Sine.easeIn' },
      { scaleX: 1, duration: 150, ease: 'Sine.easeOut' },
    ],
  },
  {
    id: 'flip',
    steps: [
      { scaleY: 0.88, scaleX: 1.07, duration: 160 },
      { y: 0.45, scaleY: 1, scaleX: 1, angle: -180, duration: 380, ease: 'Quad.easeOut' },
      { y: 0, angle: -360, duration: 380, ease: 'Quad.easeIn' },
      { angle: 0, scaleY: 0.9, scaleX: 1.06, duration: 1 },
      REST,
    ],
  },
  {
    id: 'wobble',
    steps: [
      { angle: -6, duration: 180, ease: 'Sine.easeInOut' },
      { angle: 6, duration: 300, ease: 'Sine.easeInOut' },
      { angle: -3, duration: 240, ease: 'Sine.easeInOut' },
      { angle: 0, duration: 180, ease: 'Sine.easeInOut' },
    ],
  },
  {
    id: 'bow',
    steps: [
      { angle: 12, scaleY: 0.97, duration: 260, ease: 'Sine.easeOut' },
      { angle: 12, duration: 250 },
      REST,
    ],
  },
];

export function moveById(id: string): MoveDef | undefined {
  return MOVES.find((m) => m.id === id);
}
