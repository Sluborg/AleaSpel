import Phaser from 'phaser';
import { COLORS, FONT, GAME_WIDTH, MIN_TOUCH } from '../config';
import {
  WaitFile,
  missingAssets,
  queueAssets,
  streamDone,
  streamState,
} from '../services/AssetStream';
import { createButton } from '../ui/Button';

// Scenes that open with the core art only (the rest streams in the background).
const NO_ART_WAIT = new Set(['MainMenu', 'AvatarEditor']);

// Shared helpers for all game scenes.
export abstract class BaseScene extends Phaser.Scene {
  // Fast start: if this scene opens before the background stream has loaded all art, load what is
  // still missing here, so the scene is built with its real art (not placeholders).
  preload(): void {
    if (NO_ART_WAIT.has(this.scene.key)) return;
    const { streaming } = streamState();
    const missing = missingAssets(this);
    if (!streaming && !missing.length) return;
    const label = this.add
      .text(GAME_WIDTH / 2, 640, 'Laddar...', {
        fontFamily: FONT,
        fontSize: '40px',
        color: COLORS.text,
      })
      .setOrigin(0.5);
    if (streaming) {
      // The background stream is already fetching everything: wait for it (no double download).
      // Scene timers do not run while loading, so use a plain interval for the percentage.
      const timer = window.setInterval(
        () => label.setText(`Laddar... ${Math.round(streamState().progress * 100)}%`),
        150,
      );
      this.load.addFile(new WaitFile(this.load, `stream-${this.scene.key}`, streamDone));
      this.load.once('complete', () => {
        window.clearInterval(timer);
        label.destroy();
      });
      return;
    }
    this.load.on('progress', (p: number) => label.setText(`Laddar... ${Math.round(p * 100)}%`));
    this.load.once('complete', () => label.destroy());
    queueAssets(this, missing);
  }

  protected addTitle(title: string, y = 90): Phaser.GameObjects.Text {
    const text = this.add
      .text(GAME_WIDTH / 2, y, title, {
        fontFamily: FONT,
        fontSize: '56px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    // Long titles shrink so they never touch the back button or the right-hand corner button.
    return text.setScale(Math.min(1, (GAME_WIDTH - 2 * 160) / text.width));
  }

  protected addBackButton(target = 'MainMenu'): Phaser.GameObjects.Container {
    const pad = 20;
    const button = createButton(
      this,
      pad + MIN_TOUCH / 2,
      pad + MIN_TOUCH / 2,
      '',
      () => this.scene.start(target),
      { width: MIN_TOUCH, height: MIN_TOUCH },
    );
    // A drawn arrow sits exactly in the middle (the ← glyph's font metrics put it off-centre).
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffffff, 1);
    arrow.fillRoundedRect(-8, -6, 28, 12, 6);
    arrow.fillTriangle(-22, 0, -4, -18, -4, 18);
    button.add(arrow);
    return button.setDepth(1000).setScrollFactor(0);
  }
}
