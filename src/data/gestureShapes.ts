// Pattern templates for the finger-pattern minigames, as points in a unit square (0..1).
// Drawn on the move card and matched against the player's stroke. Adding a shape = a row.
export interface Pt {
  x: number;
  y: number;
}

export interface ShapeDef {
  id: string;
  name: string; // Swedish
  closed: boolean; // closed shapes may start anywhere along the path
  points: Pt[];
}

const poly = (...pts: [number, number][]): Pt[] => pts.map(([x, y]) => ({ x, y }));
const param = (n: number, f: (t: number) => [number, number]): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const [x, y] = f(i / (n - 1));
    return { x, y };
  });

export const SHAPES: ShapeDef[] = [
  {
    id: 'circle',
    name: 'Cirkel',
    closed: true,
    points: param(40, (t) => [
      0.5 + 0.5 * Math.cos(t * Math.PI * 2 - Math.PI / 2),
      0.5 + 0.5 * Math.sin(t * Math.PI * 2 - Math.PI / 2),
    ]),
  },
  { id: 'v', name: 'V', closed: false, points: poly([0, 0], [0.5, 1], [1, 0]) },
  {
    id: 'zigzag',
    name: 'Sicksack',
    closed: false,
    points: poly([0, 1], [0.25, 0], [0.5, 1], [0.75, 0], [1, 1]),
  },
  {
    id: 'triangle',
    name: 'Triangel',
    closed: true,
    points: poly([0.5, 0], [1, 1], [0, 1], [0.5, 0]),
  },
  {
    id: 'square',
    name: 'Fyrkant',
    closed: true,
    points: poly([0, 0], [1, 0], [1, 1], [0, 1], [0, 0]),
  },
  {
    id: 's',
    name: 'S',
    closed: false,
    points: param(40, (t) => [0.5 - 0.5 * Math.sin(t * Math.PI * 2), t]),
  },
  {
    id: 'star',
    name: 'Stjärna',
    closed: true,
    points: poly([0.5, 0], [0.8, 1], [0, 0.38], [1, 0.38], [0.2, 1], [0.5, 0]),
  },
  {
    id: 'heart',
    name: 'Hjärta',
    closed: true,
    points: param(40, (t) => {
      const a = t * Math.PI * 2;
      const x = 16 * Math.sin(a) ** 3;
      const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
      return [0.5 + x / 34, 0.5 - y / 34];
    }),
  },
];

export const shapeById = (id: string) => SHAPES.find((s) => s.id === id) ?? SHAPES[0];
