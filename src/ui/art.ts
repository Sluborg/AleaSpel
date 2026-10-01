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

// A backdrop (720x1280 manifest id) behind everything. Without `area` it fills the screen. With
// a room rectangle it covers that rectangle's rows, tiled sideways (every other copy mirrored so
// the seams match) when the room is wider than the screen. Returns false when the id is missing
// so the caller draws its placeholder.
export function backdrop(
  scene: Phaser.Scene,
  key: string,
  area?: { left: number; top: number; right: number; bottom: number },
): boolean {
  if (!hasArt(scene, key)) return false;
  const width = area ? area.right + area.left : GAME_WIDTH;
  for (let i = 0; i * GAME_WIDTH < width; i++) {
    const img = scene.add
      .image(i * GAME_WIDTH, 0, key)
      .setOrigin(0)
      .setDepth(-100000)
      .setFlipX(i % 2 === 1);
    const sy = img.height / GAME_HEIGHT;
    img.setScale(GAME_WIDTH / img.width, 1 / sy);
    if (area) img.setCrop(0, area.top * sy, img.width, (area.bottom - area.top) * sy);
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

// The visible (opaque) part of a texture as shares of its size (0..1). Art has transparent
// margins; this is where it really starts and ends.
export interface VisibleBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const boxes = new Map<string, VisibleBox>();
export function visibleBox(scene: Phaser.Scene, key: string): VisibleBox {
  const known = boxes.get(key);
  if (known) return known;
  const box = { left: 0, top: 0, right: 1, bottom: 1 };
  try {
    const src = scene.textures.get(key).getSourceImage() as CanvasImageSource & {
      width: number;
      height: number;
    };
    const canvas = document.createElement('canvas');
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(src, 0, 0);
      const data = ctx.getImageData(0, 0, src.width, src.height).data;
      let [x0, y0, x1, y1] = [src.width, src.height, -1, -1];
      for (let y = 0; y < src.height; y += 2) {
        for (let x = 0; x < src.width; x += 2) {
          if (data[(y * src.width + x) * 4 + 3] <= 40) continue;
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
      }
      if (x1 >= 0) {
        box.left = x0 / src.width;
        box.top = y0 / src.height;
        box.right = Math.min(1, (x1 + 2) / src.width);
        box.bottom = Math.min(1, (y1 + 2) / src.height);
      }
    }
  } catch {
    // Keep the whole texture.
  }
  boxes.set(key, box);
  return box;
}

// Where the visible part of a texture ends, as a share of its height (0..1): where furniture
// stands on the floor.
export function visibleBottom(scene: Phaser.Scene, key: string): number {
  return visibleBox(scene, key).bottom;
}

// Shift the colours of an image around the colour wheel (degrees), for colour variants of art that
// is already coloured (a multiplying tint can only darken). WebGL only; Canvas keeps the colours.
export function applyHue<T extends Phaser.GameObjects.Image>(img: T, degrees?: number): T {
  if (degrees) img.preFX?.addColorMatrix().hue(degrees);
  return img;
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

// An art icon (manifest id) fitted in a size x size box at (x, y), or the emoji as text when the
// id is missing, so data rows keep their emoji as the fallback.
export function iconOrEmoji(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string | undefined,
  emoji: string,
  size: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  if (key && hasArt(scene, key)) return artImage(scene, x, y, key, size, size);
  return scene.add.text(x, y, emoji, { fontSize: `${Math.round(size * 0.8)}px` }).setOrigin(0.5);
}
