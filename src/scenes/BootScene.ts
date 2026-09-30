import Phaser from 'phaser';
import { ASSET_MANIFEST_KEY } from '../data/assets';

// Loads only what Preload needs (the asset manifest).
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.json(ASSET_MANIFEST_KEY, 'assets/manifest.json');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
