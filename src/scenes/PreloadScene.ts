import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { PET_SPECIES } from '../data/pets';
import { coreAssets, queueAssets } from '../services/AssetStream';
import { PET_SVG_SIZE, petSvg, petTextureKey } from '../ui/petSvg';

// Loads the core art only (see services/AssetStream.ts); the rest streams in the background.
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

    queueAssets(this, coreAssets(this));

    // Placeholder pets: SVG generated in code, only for species without delivered art (the
    // placeholder and the art share the texture key, so the art must win).
    const manifestIds = new Set(
      ((this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined)?.assets ?? []).map(
        (a) => a.id,
      ),
    );
    for (const species of PET_SPECIES) {
      for (const layer of ['fur', 'face'] as const) {
        if (manifestIds.has(petTextureKey(species.id, layer))) continue;
        const blob = new Blob([petSvg(species, layer)], { type: 'image/svg+xml' });
        this.load.svg(petTextureKey(species.id, layer), URL.createObjectURL(blob), {
          width: PET_SVG_SIZE,
          height: PET_SVG_SIZE,
        });
      }
    }
  }

  create(): void {
    this.scene.launch('AssetStream');
    this.scene.start('MainMenu');
  }
}
