import Phaser from 'phaser';
import { FONT } from '../config';
import type { FurnitureDef } from '../data/furniture';
import { artHeight, hasArt, visibleBottom } from './art';

// Delivered furniture art (`furn_<id>`, or `def.art`) is scaled to the row's width, keeping its
// aspect ratio. Without art the piece is a placeholder shape with its name.
export function furnitureArtKey(scene: Phaser.Scene, def: FurnitureDef): string | null {
  const key = def.art ?? `furn_${def.id}`;
  return hasArt(scene, key) ? key : null;
}

export function furnitureSize(
  scene: Phaser.Scene,
  def: FurnitureDef,
): { width: number; height: number } {
  const key = furnitureArtKey(scene, def);
  return key
    ? { width: def.width, height: artHeight(scene, key, def.width) }
    : { width: def.width, height: def.height };
}

// Distance from the piece's centre down to where it stands (its visible bottom).
export function furnitureFoot(scene: Phaser.Scene, def: FurnitureDef): number {
  const key = furnitureArtKey(scene, def);
  const { height } = furnitureSize(scene, def);
  return key ? (visibleBottom(scene, key) - 0.5) * height : height / 2;
}

export function furnitureShape(
  scene: Phaser.Scene,
  def: FurnitureDef,
): Phaser.GameObjects.GameObject[] {
  const key = furnitureArtKey(scene, def);
  if (key) {
    const img = scene.add.image(0, 0, key);
    return [img.setScale(def.width / img.width)];
  }
  const shape =
    def.shape === 'ellipse'
      ? scene.add.ellipse(0, 0, def.width, def.height, def.color)
      : scene.add.rectangle(0, 0, def.width, def.height, def.color);
  shape.setStrokeStyle(4, 0x000000, 0.25);
  const label = scene.add
    .text(0, 0, def.name, { fontFamily: FONT, fontSize: '30px', color: '#3a2a4a' })
    .setOrigin(0.5);
  return [shape, label];
}
