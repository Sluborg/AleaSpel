import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { MENU_ENTRIES, type MenuEntry } from '../data/menu';
import { waitingGifts } from '../services/Gifts';
import { SaveService } from '../services/SaveService';
import { artImage, backdrop, hasArt, iconOrEmoji, medalLabel } from '../ui/art';
import { BaseScene } from './BaseScene';

const COLS = 2;
const TILE_W = 300;
const TILE_H = 170;
const GAP = 24;
const GRID_TOP = 360;

// Start screen: logo, medal count, and a grid of big tiles (icon + name) into the game.
export class MainMenuScene extends BaseScene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    if (backdrop(this, 'bg_welcome')) {
      this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 0.35)
        .setOrigin(0)
        .setDepth(-50000);
    }
    const logo = hasArt(this, 'logo_aleaspel')
      ? artImage(this, GAME_WIDTH / 2, 210, 'logo_aleaspel', 520, 200)
      : this.addTitle('AleaSpel', 210).setFontSize(96);
    // Hidden door for grown-ups: hold the logo for a second to open Rörelselabbet.
    logo.setInteractive();
    let hold: Phaser.Time.TimerEvent | undefined;
    logo.on('pointerdown', () => {
      hold = this.time.delayedCall(1000, () => this.scene.start('MoveLab'));
    });
    logo.on('pointerup', () => hold?.remove());
    logo.on('pointerout', () => hold?.remove());
    medalLabel(
      this,
      GAME_WIDTH - 30,
      60,
      `${SaveService.get().medals}`,
      { fontFamily: FONT, fontSize: '36px', color: COLORS.text, fontStyle: 'bold' },
      1,
    );

    this.giftButton();

    const rows = Math.ceil(MENU_ENTRIES.length / COLS);
    MENU_ENTRIES.forEach((entry, i) => {
      const row = Math.floor(i / COLS);
      const inRow = row === rows - 1 ? MENU_ENTRIES.length - row * COLS : COLS;
      const col = i % COLS;
      const x = GAME_WIDTH / 2 + (col - (inRow - 1) / 2) * (TILE_W + GAP);
      const y = GRID_TOP + row * (TILE_H + GAP) + TILE_H / 2;
      this.tile(x, y, entry, i);
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, `${__APP_NAME__} · v${__APP_VERSION__}`, {
        fontFamily: FONT,
        fontSize: '26px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);
  }

  // Daglig present: a gift box in the corner, bouncing with a count when gifts wait.
  private giftButton(): void {
    const waiting = waitingGifts();
    const c = this.add.container(75, 70);
    const bg = this.add.circle(0, 0, 52, waiting ? 0xff6fae : 0x6b5a85);
    const icon = iconOrEmoji(this, 0, 2, 'icon_menu_gift', '🎁', 80);
    c.add([bg, icon]);
    if (waiting) {
      c.add(this.add.circle(38, -36, 22, 0xffd84d));
      c.add(
        this.add
          .text(38, -36, `${waiting}`, {
            fontFamily: FONT,
            fontSize: '28px',
            color: '#3a2a4a',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
      this.tweens.add({
        targets: icon,
        angle: { from: -12, to: 12 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        repeatDelay: 900,
      });
    }
    c.setSize(MIN_TOUCH, MIN_TOUCH).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => this.scene.start('Gift'));
  }

  private tile(x: number, y: number, entry: MenuEntry, i: number): void {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.18).fillRoundedRect(
      -TILE_W / 2 + 4,
      -TILE_H / 2 + 8,
      TILE_W,
      TILE_H,
      34,
    );
    g.fillStyle(entry.color, 1).fillRoundedRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H, 34);
    g.fillStyle(0xffffff, 0.25).fillRoundedRect(
      -TILE_W / 2 + 12,
      -TILE_H / 2 + 10,
      TILE_W - 24,
      40,
      20,
    );
    const icon = iconOrEmoji(this, 0, -26, entry.art, entry.icon, 100);
    const label = this.add
      .text(0, 52, entry.label, {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#3a2a4a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    c.add([g, icon, label]);
    c.setSize(TILE_W, TILE_H).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => c.setScale(0.95));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerup', () => {
      c.setScale(1);
      this.scene.start(entry.scene);
    });
    // A little hello as the menu opens.
    c.setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: c,
      scale: 1,
      alpha: 1,
      duration: 260,
      delay: 40 * i,
      ease: 'Back.out',
    });
    this.tweens.add({
      targets: icon,
      angle: { from: -6, to: 6 },
      duration: 1400 + i * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }
}
