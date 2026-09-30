import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

// Helpers for delivered art (manifest ids). Every caller falls back to its placeholder when the
// texture is missing, so the game never depends on a specific delivery.
export function hasArt(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}

// Display height of `key` when scaled to `width`, keeping its aspect ratio.
export function artHeight(scene: Phaser.Scene, key: string, width: number): number {
  const src = scene.textures.get(key).getSourceImage() as { width: number; height: number };
  return Math.round((width * src.height) / src.width);
}

// A full-screen backdrop (720x1280 manifest id) behind everything, optionally cropped to a room
// rectangle. Returns false when the id is missing so the caller draws its placeholder.
export function backdrop(
  scene: Phaser.Scene,
  key: string,
  crop?: { left: number; top: number; right: number; bottom: number },
): boolean {
  if (!hasArt(scene, key)) return false;
  const img = scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);
  img.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
  if (crop) {
    const sx = img.width / GAME_WIDTH;
    const sy = img.height / GAME_HEIGHT;
    img.setCrop(
      crop.left * sx,
      crop.top * sy,
      (crop.right - crop.left) * sx,
      (crop.bottom - crop.top) * sy,
    );
  }
  return true;
}

// A medal count: icon_medal image (or the emoji) followed by text. originX 0, 0.5 or 1.
export function medalLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  originX = 0.5,
): Phaser.GameObjects.Container {
  const size = parseInt(String(style.fontSize ?? '32'), 10) * 1.2;
  const useIcon = hasArt(scene, 'icon_medal');
  const t = scene.add.text(0, 0, useIcon ? label : `🏅 ${label}`, style).setOrigin(0, 0.5);
  const gap = useIcon ? size + 10 : 0;
  const total = t.width + gap;
  const c = scene.add.container(x - total * originX, y);
  if (useIcon) c.add(artImage(scene, size / 2, 0, 'icon_medal', size, size));
  t.setX(gap);
  c.add(t);
  return c;
}

// An image scaled to fit inside w x h, centred at (x, y).
export function artImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  w: number,
  h: number,
) {
  const img = scene.add.image(x, y, key);
  const s = Math.min(w / img.width, h / img.height);
  return img.setScale(s);
}
