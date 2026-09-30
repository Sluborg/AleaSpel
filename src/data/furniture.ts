// Furniture catalog. Adding furniture = adding a row here, no new code.
// Graphics are placeholders drawn in code (see CLAUDE.md, placeholder-graphics rule).
export type PlaceholderShape = 'rect' | 'ellipse';

export interface FurnitureDef {
  id: string;
  name: string;
  shape: PlaceholderShape;
  width: number;
  height: number;
  color: number;
  // Default position in room coordinates (design resolution).
  defaultX: number;
  defaultY: number;
}

export const FURNITURE: FurnitureDef[] = [
  {
    id: 'bed',
    name: 'Säng',
    shape: 'rect',
    width: 260,
    height: 150,
    color: 0x7fb3ff,
    defaultX: 200,
    defaultY: 900,
  },
  {
    id: 'table',
    name: 'Bord',
    shape: 'ellipse',
    width: 170,
    height: 110,
    color: 0xffc857,
    defaultX: 500,
    defaultY: 1050,
  },
  {
    id: 'lamp',
    name: 'Lampa',
    shape: 'rect',
    width: 80,
    height: 200,
    color: 0x9be08f,
    defaultX: 560,
    defaultY: 760,
  },
];
