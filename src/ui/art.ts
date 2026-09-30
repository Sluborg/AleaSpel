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

// Where the visible part of a texture ends, as a share of its height (0..1): the lowest row with
// an opaque pixel. Art has transparent margins, so this is where furniture stands on the floor.
const bottoms = new Map<string, number>();
export function visibleBottom(scene: Phaser.Scene, key: string): number {
  const known = bottoms.get(key);
  if (known !== undefined) return known;
  let ratio = 1;
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
      scan: for (let y = src.height - 1; y >= 0; y--) {
        for (let x = 0; x < src.width; x += 2) {
          if (data[(y * src.width + x) * 4 + 3] > 40) {
            ratio = (y + 1) / src.height;
            break scan;
          }
        }
      }
    }
  } catch {
    ratio = 1;
  }
  bottoms.set(key, ratio);
  return ratio;
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
