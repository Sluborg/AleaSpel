import Phaser from 'phaser';

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
