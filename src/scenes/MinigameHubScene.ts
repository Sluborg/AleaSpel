import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MINIGAMES, type MinigameDef } from '../data/minigames';
import { levelOf } from '../services/Difficulty';
import { SaveService } from '../services/SaveService';
import { medalLabel } from '../ui/art';
import { createButton } from '../ui/Button';
import { ScrollList } from '../ui/ScrollList';
import { BaseScene } from './BaseScene';

const LIST_TOP = 220;
const LIST_BOTTOM = GAME_HEIGHT - 150;
const CARD_H = 160;
const GAP = 20;

// Tävlingar: the gymnastics events, then the Uppvärmning quick games, one card per data row
// with the active gymnast's record. Tävlingsdag stays at the bottom.
export class MinigameHubScene extends BaseScene {
  constructor() {
    super('MinigameHub');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Tävlingar');
    this.addBackButton();
    const save = SaveService.get();
    const gymnast = SaveService.activeGymnast();
    medalLabel(this, GAME_WIDTH / 2, 175, `${save.medals} medaljer   ·   ${gymnast.name}`, {
      fontFamily: FONT,
      fontSize: '32px',
      color: COLORS.textMuted,
    });

    const list = new ScrollList(this, LIST_TOP, LIST_BOTTOM);
    const sections: [string, MinigameDef[]][] = [
      ['Grenar', MINIGAMES.filter((g) => (g.kind ?? 'apparatus') === 'apparatus')],
      ['Uppvärmning', MINIGAMES.filter((g) => g.kind === 'warmup')],
    ];
    let y = 10;
    for (const [label, games] of sections) {
      if (!games.length) continue;
      list.content.add(
        this.add
          .text(50, y + 25, label, {
            fontFamily: FONT,
            fontSize: '34px',
            color: '#ffd84d',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5),
      );
      y += 60;
      for (const game of games) {
        const best = gymnast.bests[game.id];
        const info = `Nivå ${levelOf(gymnast, game.id)} · ${best ? `Rekord ${best} ⭐` : 'Nytt spel'}`;
        list.content.add(this.card(game, y + CARD_H / 2, info, list));
        y += CARD_H + GAP;
      }
      y += 10;
    }
    list.setContentHeight(y);

    createButton(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 75,
      '🏆 Tävlingsdag',
      () => this.scene.start('TeamCompetition', { fresh: true }),
      { width: 500 },
    ).setDepth(10);
  }

  private card(game: MinigameDef, y: number, info: string, list: ScrollList) {
    const c = this.add.container(0, y);
    const g = this.add.graphics();
    g.fillStyle(0x3a2752, 1).fillRoundedRect(40, -CARD_H / 2, GAME_WIDTH - 80, CARD_H, 36);
    const start = () => {
      if (list.wasDragged()) return;
      this.scene.start(game.scene, { gymnastId: SaveService.activeGymnast().id, gameId: game.id });
    };
    const play = createButton(this, GAME_WIDTH - 130, 0, 'Spela', start, {
      width: 150,
      fontSize: 36,
    });
    c.add([
      g,
      this.add.text(80, 0, game.icon, { fontSize: '72px' }).setOrigin(0, 0.5),
      this.add
        .text(190, -28, game.name, {
          fontFamily: FONT,
          fontSize: '38px',
          color: COLORS.text,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5),
      this.add
        .text(190, 32, info, {
          fontFamily: FONT,
          fontSize: '26px',
          color: COLORS.textMuted,
        })
        .setOrigin(0, 0.5),
      play,
    ]);
    return c as Phaser.GameObjects.Container;
  }
}
