import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';

// Empty scene with a title and a back button. Replace with real content per scene.
export abstract class PlaceholderScene extends BaseScene {
  protected abstract readonly title: string;

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle(this.title, 240);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Kommer snart!', {
        fontFamily: FONT,
        fontSize: '40px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);
    this.addBackButton();
  }
}
