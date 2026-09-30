import { COLORS, FONT, GAME_WIDTH } from '../config';
import { MINIGAMES } from '../data/minigames';
import { SaveService } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { BaseScene } from './BaseScene';

// Tävlingar: one card per minigame (data rows), personal best of the active gymnast, medals.
export class MinigameHubScene extends BaseScene {
  constructor() {
    super('MinigameHub');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Tävlingar');
    this.addBackButton();
    const save = SaveService.get();
    const gymnast = save.gymnasts[0];

    this.add
      .text(GAME_WIDTH / 2, 175, `🏅 ${save.medals} medaljer   ·   ${gymnast.name}`, {
        fontFamily: FONT,
        fontSize: '32px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    MINIGAMES.forEach((game, i) => {
      const y = 320 + i * 220;
      const card = this.add.graphics();
      card
        .fillStyle(game.available ? 0x3a2752 : 0x2f2340, 1)
        .fillRoundedRect(40, y - 90, GAME_WIDTH - 80, 180, 36);
      this.add.text(90, y, game.icon, { fontSize: '80px' }).setOrigin(0, 0.5);
      this.add
        .text(210, y - 30, game.name, {
          fontFamily: FONT,
          fontSize: '46px',
          color: game.available ? COLORS.text : '#8a7aa0',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
      const best = gymnast.bests[game.id];
      this.add
        .text(
          210,
          y + 35,
          game.available ? (best ? `Rekord: ${best} ⭐` : 'Inget rekord än') : 'Kommer snart',
          {
            fontFamily: FONT,
            fontSize: '30px',
            color: COLORS.textMuted,
          },
        )
        .setOrigin(0, 0.5);
      if (game.available) {
        createButton(
          this,
          GAME_WIDTH - 150,
          y,
          'Spela',
          () => this.scene.start(game.scene, { gymnastId: gymnast.id }),
          {
            width: 170,
            fontSize: 36,
          },
        );
      }
    });
  }
}
