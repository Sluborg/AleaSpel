import Phaser from 'phaser';
import type { HousePart, HouseSlot } from '../data/exterior';
import { applyHue, hasArt, visibleBox } from './art';

export const HOUSE_W = 440; // visible wall width

interface Rect {
  x: number; // centre
  y: number; // centre
  w: number;
  h: number;
}

// One part scaled so its visible width is `w`, placed by its visible box: centred on x, with its
// visible bottom at `bottom`. Placeholder shape when the art is missing.
function part(
  scene: Phaser.Scene,
  p: HousePart,
  x: number,
  bottom: number,
  w: number,
  shape: 'rect' | 'roof' = 'rect',
): { obj: Phaser.GameObjects.GameObject; rect: Rect } {
  if (hasArt(scene, p.art)) {
    const img = scene.add.image(0, 0, p.art);
    const box = visibleBox(scene, p.art);
    const s = w / ((box.right - box.left) * img.width);
    const h = (box.bottom - box.top) * img.height * s;
    img.setScale(s);
    img.setPosition(
      x - ((box.left + box.right) / 2 - 0.5) * img.width * s,
      bottom - (box.bottom - 0.5) * img.height * s,
    );
    applyHue(img, p.hue);
    return { obj: img, rect: { x, y: bottom - h / 2, w, h } };
  }
  const h = shape === 'roof' ? w * 0.4 : w * 0.62;
  const g = scene.add.graphics();
  g.fillStyle(p.color, 1).lineStyle(4, 0x3a2a4a, 0.3);
  if (shape === 'roof') {
    g.fillTriangle(x - w / 2, bottom, x + w / 2, bottom, x, bottom - h);
    g.strokeTriangle(x - w / 2, bottom, x + w / 2, bottom, x, bottom - h);
  } else {
    g.fillRoundedRect(x - w / 2, bottom - h, w, h, 10).strokeRoundedRect(
      x - w / 2,
      bottom - h,
      w,
      h,
      10,
    );
  }
  return { obj: g, rect: { x, y: bottom - h / 2, w, h } };
}

// The house seen from outside, put together from its parts: wall, roof on top, door at the bottom
// in the middle, a window on each side. (x, ground) is the middle of the wall's bottom edge.
export function houseView(
  scene: Phaser.Scene,
  x: number,
  ground: number,
  parts: Record<HouseSlot, HousePart>,
): { container: Phaser.GameObjects.Container; door: Rect; top: number } {
  const c = scene.add.container(0, 0);
  const wall = part(scene, parts.wall, x, ground, HOUSE_W);
  const top = wall.rect.y - wall.rect.h / 2;
  const roof = part(scene, parts.roof, x, top + 30, HOUSE_W * 1.2, 'roof');
  const doorH = wall.rect.h * 0.6;
  const door = part(scene, parts.door, x, ground - 2, doorH * 0.72);
  const winW = HOUSE_W * 0.26;
  const winY = top + wall.rect.h * 0.42;
  const windows = [-1, 1].map((side) => {
    const w = part(scene, parts.window, x + side * HOUSE_W * 0.3, 0, winW);
    // Centre the window vertically at winY.
    const o = w.obj as unknown as Phaser.GameObjects.Components.Transform;
    o.y += winY + w.rect.h / 2;
    return w.obj;
  });
  c.add([wall.obj, ...windows, door.obj, roof.obj]);
  return { container: c, door: door.rect, top: roof.rect.y - roof.rect.h / 2 };
}
