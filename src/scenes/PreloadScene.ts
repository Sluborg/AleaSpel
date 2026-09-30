import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';

const AUDIO_EXT = /\.(mp3|ogg|wav|m4a)$/i;

// Loads every asset listed in public/assets/manifest.json.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const label = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Laddar...', {
        fontFamily: FONT,
        fontSize: '40px',
        color: COLORS.text,
      })
      .setOrigin(0.5);
    this.load.on('progress', (p: number) => label.setText(`Laddar... ${Math.round(p * 100)}%`));

    const manifest = this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined;
    for (const asset of manifest?.assets ?? []) {
      const url = `assets/${asset.file}`;
      if (AUDIO_EXT.test(asset.file)) this.load.audio(asset.id, url);
      else this.load.image(asset.id, url);
    }
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
