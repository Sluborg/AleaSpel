import type { RigPose } from './rig';

// Whole-body moves for the gymnast (movement plan, stage 1). A move is a list of steps played in
// order; each step tweens the gymnast's pose to the given values. Adding a move = adding a row.
//   y       lift in view heights (0.1 = a tenth of the gymnast's height, up is positive)
//   scaleX  horizontal scale (negative = facing the other way), scaleY vertical scale (squash)
//   angle   rotation in degrees around the middle of the body
//   pose    joint angles of the cut-out rig (data/rig.ts) in degrees, positive = clockwise on
//           screen: arms and legs on the left of the screen swing outwards and up with positive
//           angles, those on the right with negative. Joints left out of a pose go back to 0.
// Values not given in a step keep their current value. Every move ends back in the rest pose.
export interface MoveStep {
  pose?: RigPose;
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
  pose: {},
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
  {
    id: 'wave',
    steps: [
      { pose: { upperArmR: -125, lowerArmR: -25 }, duration: 320, ease: 'Back.easeOut' },
      { pose: { upperArmR: -125, lowerArmR: 15 }, duration: 220 },
      { pose: { upperArmR: -125, lowerArmR: -30 }, duration: 220 },
      { pose: { upperArmR: -125, lowerArmR: 15 }, duration: 220 },
      { pose: { upperArmR: -125, lowerArmR: -25 }, duration: 220 },
      { ...REST, duration: 320 },
    ],
  },
  {
    id: 'victory',
    steps: [
      {
        pose: { upperArmL: 140, lowerArmL: 10, upperArmR: -140, lowerArmR: -10 },
        scaleY: 1.02,
        duration: 300,
        ease: 'Back.easeOut',
      },
      {
        pose: { upperArmL: 148, lowerArmL: 4, upperArmR: -148, lowerArmR: -4 },
        y: 0.03,
        duration: 220,
      },
      { y: 0, duration: 200 },
      { pose: { upperArmL: 140, lowerArmL: 10, upperArmR: -140, lowerArmR: -10 }, duration: 500 },
      { ...REST, duration: 300 },
    ],
  },
  {
    id: 'arms_up',
    steps: [
      {
        pose: { upperArmL: -20, lowerArmL: -10, upperArmR: 20, lowerArmR: 10 },
        scaleY: 0.88,
        scaleX: 1.07,
        duration: 200,
        ease: 'Sine.easeOut',
      },
      {
        pose: { upperArmL: 165, upperArmR: -165 },
        y: 0.35,
        scaleY: 1.06,
        scaleX: 0.96,
        duration: 340,
        ease: 'Quad.easeOut',
      },
      { y: 0, scaleY: 1, scaleX: 1, duration: 320, ease: 'Quad.easeIn' },
      { pose: { upperArmL: 120, upperArmR: -120 }, scaleY: 0.9, scaleX: 1.06, duration: 120 },
      REST,
    ],
  },
  {
    id: 'star',
    steps: [
      { scaleY: 0.88, scaleX: 1.07, duration: 180, ease: 'Sine.easeOut' },
      {
        pose: { upperArmL: 115, upperArmR: -115, thighL: 22, shinL: -3, thighR: -22, shinR: 3 },
        y: 0.32,
        scaleY: 1,
        scaleX: 1,
        duration: 340,
        ease: 'Quad.easeOut',
      },
      { duration: 120 },
      { pose: {}, y: 0, duration: 300, ease: 'Quad.easeIn' },
      { scaleY: 0.9, scaleX: 1.06, duration: 110 },
      REST,
    ],
  },
  {
    id: 'landing',
    steps: [
      { y: 0.25, duration: 1 },
      { y: 0, duration: 260, ease: 'Quad.easeIn' },
      {
        pose: {
          upperArmL: 75,
          lowerArmL: 10,
          upperArmR: -75,
          lowerArmR: -10,
          thighL: 14,
          shinL: -26,
          thighR: -14,
          shinR: 26,
        },
        scaleY: 0.86,
        scaleX: 1.05,
        duration: 160,
        ease: 'Quad.easeOut',
      },
      { duration: 250 },
      {
        pose: { upperArmL: 140, upperArmR: -140 },
        scaleY: 1.02,
        scaleX: 1,
        duration: 320,
        ease: 'Back.easeOut',
      },
      { duration: 400 },
      { ...REST, duration: 300 },
    ],
  },
];

// True when a move bends joints, so the gymnast needs the cut-out rig.
export function moveUsesRig(move: MoveDef): boolean {
  return move.steps.some((s) => s.pose && Object.values(s.pose).some((v) => v));
}

export function moveById(id: string): MoveDef | undefined {
  return MOVES.find((m) => m.id === id);
}
