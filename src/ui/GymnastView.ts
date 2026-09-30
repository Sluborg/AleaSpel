import Phaser from 'phaser';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { BASE_BODY_ID, layerOrder } from '../data/wardrobe';
import type { Gymnast } from '../services/SaveService';

// The master canvas is 1024x1536; every layer is drawn at the same position and scale.
export const MASTER_W = 1024;
export const MASTER_H = 1536;

// Draws a gymnast (master + worn items in layer order) centred at (x, y).
export class GymnastView extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly viewHeight: number,
    gymnast: Gymnast,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.refresh(gymnast);
  }

  refresh(gymnast: Gymnast): void {
    this.removeAll(true);
    const scale = this.viewHeight / MASTER_H;
    const manifest = this.scene.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined;
    const known = new Set((manifest?.assets ?? []).map((a) => a.id));
    const worn = Object.entries(gymnast.outfit)
      .filter(([, w]) => known.has(w.item) && this.scene.textures.exists(w.item))
      .sort(([a], [b]) => layerOrder(a) - layerOrder(b));
    if (this.scene.textures.exists(BASE_BODY_ID)) {
      this.add(this.scene.add.image(0, 0, BASE_BODY_ID).setScale(scale));
    }
    for (const [, w] of worn) {
      const img = this.scene.add.image(0, 0, w.item).setScale(scale);
      if (w.tint !== undefined) img.setTint(w.tint);
      this.add(img);
    }
  }
}
