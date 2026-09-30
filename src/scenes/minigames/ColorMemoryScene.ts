import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config';
import { QuickGameScene } from './QuickGameScene';

const PADS = [
  { name: 'Röd', color: 0xff5a6e },
  { name: 'Blå', color: 0x4f9bff },
  { name: 'Grön', color: 0x5fd36b },
  { name: 'Gul', color: 0xffd84d },
];
const SIZE = 250;
const CENTER_Y = 640;
const DIM = 0.45;

// Färgminne: colours blink in a row; tap the same colours in the same order. Round N shows N + 1
// colours. Stars: all right 3, else a share of the row that was right.
export class ColorMemoryScene extends QuickGameScene {
  constructor() {
    super('ColorMemory');
  }

  protected playRound(roundNo: number): void {
    const length = roundNo + 1;
    const seq = Array.from({ length }, () => Phaser.Math.Between(0, PADS.length - 1));
    const info = this.text(GAME_WIDTH / 2, 330, 'Titta!', 44);
    this.layer.add(info);
    let accepting = false;
    let pos = 0;
    const pads = PADS.map((p, i) => {
      const x = GAME_WIDTH / 2 + (i % 2 === 0 ? -1 : 1) * (SIZE / 2 + 12);
      const y = CENTER_Y + (i < 2 ? -1 : 1) * (SIZE / 2 + 12);
      const pad = this.add
        .rectangle(x, y, SIZE, SIZE, p.color)
        .setStrokeStyle(8, 0xffffff)
        .setAlpha(DIM);
      pad.setInteractive({ useHandCursor: true });
      pad.on('pointerdown', () => {
        if (!accepting) return;
        this.flash(pad);
        if (i === seq[pos]) {
          pos++;
          if (pos === seq.length) {
            accepting = false;
            this.roundDone(3);
          }
        } else {
          accepting = false;
          info.setText(`Det var ${PADS[seq[pos]].name.toLowerCase()}!`);
          this.flash(pads[seq[pos]], 3);
          this.time.delayedCall(700, () => this.roundDone(Math.floor((3 * pos) / seq.length)));
        }
      });
      this.layer.add(pad);
      return pad;
    });
    const step = Math.max(380, 650 - roundNo * 50);
    seq.forEach((p, k) => this.time.delayedCall(700 + k * step, () => this.flash(pads[p])));
    this.time.delayedCall(700 + seq.length * step, () => {
      info.setText('Din tur!');
      accepting = true;
    });
  }

  private flash(pad: Phaser.GameObjects.Rectangle, times = 1): void {
    this.tweens.add({
      targets: pad,
      alpha: 1,
      scale: 1.08,
      duration: 180,
      yoyo: true,
      repeat: times - 1,
      onComplete: () => pad.setAlpha(DIM).setScale(1),
    });
  }
}
