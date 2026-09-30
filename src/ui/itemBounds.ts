import Phaser from 'phaser';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const cache = new Map<string, Rect | null>();

// Bounding box of the visible pixels of a texture (scanned once, then cached). Used for thumbnails.
export function itemBounds(scene: Phaser.Scene, key: string): Rect | null {
  if (cache.has(key)) return cache.get(key)!;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] < 32) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const rect = x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 2, h: y1 - y0 + 2 };
  cache.set(key, rect);
  return rect;
}
