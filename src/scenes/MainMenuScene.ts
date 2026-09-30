import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MENU_ENTRIES } from '../data/menu';
import { SaveService } from '../services/SaveService';
import { medalLabel } from '../ui/art';
import { createButton } from '../ui/Button';
import { BaseScene } from './BaseScene';

export class MainMenuScene extends BaseScene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('AleaSpel', 220).setFontSize(96);
    medalLabel(
      this,
      GAME_WIDTH - 30,
      60,
      `${SaveService.get().medals}`,
      { fontFamily: FONT, fontSize: '36px', color: COLORS.text, fontStyle: 'bold' },
      1,
    );

    const startY = 385;
    const gap = 126;
    MENU_ENTRIES.forEach((entry, i) => {
      createButton(this, GAME_WIDTH / 2, startY + i * gap, entry.label, () =>
        this.scene.start(entry.scene),
      );
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, `${__APP_NAME__} · v${__APP_VERSION__}`, {
        fontFamily: FONT,
        fontSize: '26px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);
  }
}
