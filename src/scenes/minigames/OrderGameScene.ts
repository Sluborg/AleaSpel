import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { PLAY_BOTTOM, PLAY_TOP, QuickGameScene } from './QuickGameScene';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';
const COUNTS = [4, 5, 6, 7, 8, 9, 10];
const TILE = 140;
const COLORS_BG = [0xffc2dc, 0xc9e7ff, 0xd8f5c9, 0xfff0b3, 0xe6d4ff, 0xffd8c2];

// Sifferhopp and Bokstavsjakt: tiles with numbers (or letters) lie around; tap them in order.
// Stars: 3 without mistakes, minus one per mistake, minus one when slow; at least 1 when done.
export class OrderGameScene extends QuickGameScene {
  constructor() {
    super('OrderGame');
  }

  protected playRound(roundNo: number): void {
    const count = COUNTS[Math.min(roundNo - 1, COUNTS.length - 1)];
    const labels = this.sequence(count, roundNo);
    const hint = this.text(GAME_WIDTH / 2, PLAY_TOP + 20, `Börja på ${labels[0]}`, 36);
    this.layer.add(hint);

    // Random cells in a 4 x 5 grid, with a little jitter so it looks scattered.
    const cols = 4;
    const rows = 5;
    const cellW = (GAME_WIDTH - 80) / cols;
    const cellH = (PLAY_BOTTOM - PLAY_TOP - 90) / rows;
    const cells = Phaser.Utils.Array.Shuffle([...Array(cols * rows).keys()]).slice(0, count);
    let next = 0;
    let mistakes = 0;
    const started = this.time.now;
    labels.forEach((label, i) => {
      const cell = cells[i];
      const x = 40 + cellW * ((cell % cols) + 0.5) + Phaser.Math.Between(-12, 12);
      const y =
        PLAY_TOP + 90 + cellH * (Math.floor(cell / cols) + 0.5) + Phaser.Math.Between(-10, 10);
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(COLORS_BG[i % COLORS_BG.length], 1).fillRoundedRect(
        -TILE / 2,
        -TILE / 2,
        TILE,
        TILE,
        30,
      );
      g.lineStyle(5, 0xffffff, 1).strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 30);
      c.add([g, this.text(0, 0, label, 72, '#3a2a4a')]);
      c.setSize(TILE, TILE).setInteractive({ useHandCursor: true });
      c.setScale(0).setAngle(Phaser.Math.Between(-8, 8));
      this.tweens.add({ targets: c, scale: 1, duration: 220, delay: i * 50, ease: 'Back.out' });
      c.on('pointerdown', () => {
        if (i === next) {
          next++;
          c.disableInteractive();
          this.tweens.add({ targets: c, scale: 1.25, alpha: 0, duration: 250 });
          if (next < labels.length) hint.setText(`Nästa: ${labels[next]}`);
          if (next === labels.length) {
            const slow = (this.time.now - started) / 1000 > count * 1.4;
            this.roundDone(Math.max(1, 3 - mistakes - (slow ? 1 : 0)));
          }
        } else if (next < labels.length) {
          mistakes++;
          this.tweens.add({
            targets: c,
            angle: { from: -12, to: 12 },
            duration: 60,
            yoyo: true,
            repeat: 2,
          });
          hint.setText(`Nästa: ${labels[next]}`);
        }
      });
      this.layer.add(c);
    });
  }

  private sequence(count: number, roundNo: number): string[] {
    if (this.def.variant === 'letters') {
      const start = roundNo === 1 ? 0 : Phaser.Math.Between(0, LETTERS.length - count);
      return LETTERS.slice(start, start + count).split('');
    }
    const start = roundNo <= 2 ? 1 : Phaser.Math.Between(1, 10);
    return Array.from({ length: count }, (_, i) => String(start + i));
  }
}
