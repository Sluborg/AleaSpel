import Phaser from 'phaser';
import { COLORS, FONT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { createButton } from '../ui/Button';

// Shared helpers for all game scenes.
export abstract class BaseScene extends Phaser.Scene {
  protected addTitle(title: string, y = 90): Phaser.GameObjects.Text {
    return this.add
      .text(GAME_WIDTH / 2, y, title, {
        fontFamily: FONT,
        fontSize: '56px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  protected addBackButton(target = 'MainMenu'): Phaser.GameObjects.Container {
    const pad = 20;
    return createButton(
      this,
      pad + MIN_TOUCH / 2,
      pad + MIN_TOUCH / 2,
      '←',
      () => this.scene.start(target),
      { width: MIN_TOUCH, height: MIN_TOUCH, fontSize: 56 },
    ).setDepth(1000);
  }
}
