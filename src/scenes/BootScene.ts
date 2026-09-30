import Phaser from 'phaser';
import { ASSET_MANIFEST_KEY } from '../data/assets';
import { ANCHORS_KEY } from '../data/wardrobe';

// Loads only what Preload needs (the asset manifest) plus the character anchors.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.json(ASSET_MANIFEST_KEY, 'assets/manifest.json');
    this.load.json(ANCHORS_KEY, 'assets/base/anchors.json');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
