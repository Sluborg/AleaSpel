import { COLORS, GAME_WIDTH } from '../../config';
import { createButton } from '../../ui/Button';
import { QuickGameScene } from './QuickGameScene';

const BAR_X = 70;
const BAR_W = GAME_WIDTH - 140;
const BAR_Y = 560;
const SPEEDS = [1700, 1400, 1150, 950, 800]; // ms for one sweep across the bar
const ZONES = [0.1, 0.085, 0.07, 0.06, 0.05]; // half-width of the target zone, share of the bar

// Pricka rätt: a marker slides back and forth along a bar; stop it on the line.
// Stars by how close: inside a third of the zone 3, inside the zone 2, just outside 1.
export class TimingGameScene extends QuickGameScene {
  constructor() {
    super('TimingGame');
  }

  protected playRound(roundNo: number): void {
    const i = Math.min(roundNo - 1, SPEEDS.length - 1);
    const zone = ZONES[i] * BAR_W;
    const target = BAR_X + BAR_W * (0.2 + Math.random() * 0.6);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(BAR_X - 10, BAR_Y - 50, BAR_W + 20, 100, 30);
    g.fillStyle(0xbfe8b0, 1).fillRect(target - zone, BAR_Y - 40, zone * 2, 80);
    g.fillStyle(0x5fbf5a, 1).fillRect(target - zone / 3, BAR_Y - 40, (zone * 2) / 3, 80);
    g.fillStyle(0x2f6b2c, 1).fillRect(target - 3, BAR_Y - 55, 6, 110);
    const marker = this.add.triangle(BAR_X, BAR_Y - 80, 0, 0, 44, 0, 22, 40, COLORS.primary);
    marker.setStrokeStyle(4, 0xffffff);
    const needle = this.add.rectangle(BAR_X, BAR_Y, 8, 90, COLORS.primaryDark);
    this.layer.add([g, this.text(GAME_WIDTH / 2, 380, 'Stoppa på strecket!', 40), marker, needle]);
    const sweep = this.tweens.add({
      targets: [marker, needle],
      x: BAR_X + BAR_W,
      duration: SPEEDS[i],
      yoyo: true,
      repeat: -1,
      ease: 'Linear',
    });
    let stopped = false;
    const stop = createButton(
      this,
      GAME_WIDTH / 2,
      800,
      'STOPP!',
      () => {
        if (stopped) return;
        stopped = true;
        sweep.stop();
        stop.disableInteractive();
        const d = Math.abs(needle.x - target);
        this.roundDone(d <= zone / 3 ? 3 : d <= zone ? 2 : d <= zone * 2 ? 1 : 0);
      },
      { width: 420, height: 170, fontSize: 64 },
    );
    this.layer.add(stop);
  }
}
