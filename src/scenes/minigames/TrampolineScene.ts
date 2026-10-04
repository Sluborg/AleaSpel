import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { backdrop } from '../../ui/art';
import { MINIGAMES } from '../../data/minigames';
import { PatternGameScene } from './PatternGameScene';

const MAT_Y = 1010;
const GYMNAST_H = 360;
const STAND_Y = MAT_Y - GYMNAST_H / 2 + 10;
const APEX = 430;
const UP_MS = 1000;
const PREP_MS = 900;
const READ_MS = 400; // card is shown this long before the prep bounce

// Studsmatta: the gymnast bounces; draw the pattern on the card while she is in the air.
export class TrampolineScene extends PatternGameScene {
  protected readonly def = MINIGAMES.find((g) => g.id === 'trampoline')!;
  protected readonly introText = `{name} hoppar 5 gånger.\nRita mönstret på kortet\nmedan hon är i luften!`;
  private gotStars = 0;

  constructor() {
    super('Trampoline');
  }

  protected drawWorld(): void {
    const g = this.add.graphics();
    if (!backdrop(this, 'bg_trampoline_field')) {
      g.fillGradientStyle(0x7fc8ff, 0x7fc8ff, 0xd8f1ff, 0xd8f1ff, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xffffff, 0.9);
      for (const [x, y, r] of [
        [120, 300, 50],
        [180, 280, 70],
        [250, 310, 55],
        [520, 520, 45],
        [580, 500, 65],
        [650, 530, 50],
      ])
        g.fillCircle(x, y, r);
      g.fillStyle(0x8fd36b, 1).fillRect(0, MAT_Y + 40, GAME_WIDTH, GAME_HEIGHT - MAT_Y - 40);
    }
    g.fillStyle(0x4a4a55, 1);
    g.fillRect(150, MAT_Y, 24, 120).fillRect(GAME_WIDTH - 174, MAT_Y, 24, 120);
    g.fillStyle(0x2b6cb0, 1).fillEllipse(GAME_WIDTH / 2, MAT_Y, 560, 70);
    g.fillStyle(0x1a1a2e, 1).fillEllipse(GAME_WIDTH / 2, MAT_Y, 480, 46);
  }

  protected gymnastStart() {
    return { x: GAME_WIDTH / 2, y: STAND_Y, height: GYMNAST_H };
  }

  protected playRound(): void {
    this.gotStars = 0;
    this.openWindow();
    // Time to read the card, a small prep bounce, then the big jump.
    this.time.delayedCall(READ_MS, () =>
      this.tweens.add({
        targets: this.view,
        y: STAND_Y + 30,
        scaleY: this.view.scaleY * 0.92,
        duration: PREP_MS / 2,
        yoyo: true,
        ease: 'Sine.inOut',
        onComplete: () => this.jump(),
      }),
    );
  }

  private jump(): void {
    const scale = this.view.scaleX;
    this.tweens.add({
      targets: this.view,
      y: APEX,
      duration: UP_MS,
      ease: 'Quad.out',
      yoyo: true,
      onYoyo: () => this.performPose(),
      onComplete: () => {
        this.view
          .setScale(scale)
          .setAngle(0)
          .setPosition(GAME_WIDTH / 2, STAND_Y);
        this.roundDone();
      },
    });
  }

  protected onPattern(got: number): void {
    this.gotStars = got;
  }

  // The pose plays at the apex if the pattern was already drawn.
  private performPose(): void {
    if (!this.move || !this.patternDone || this.gotStars === 0) return;
    const t = (props: object) =>
      this.tweens.add({ targets: this.view, duration: 300, yoyo: true, ...props });
    switch (this.move.pose) {
      // Rigid body only (no squashing or flat turns, which look wrong on a flat figure) until the
      // cut-out rig brings real tuck, pike and straddle poses.
      case 'tuck':
        t({ angle: -30 });
        break;
      case 'pike':
        t({ angle: 35 });
        break;
      case 'straddle':
        t({ angle: 15 });
        break;
      case 'twist':
        t({ angle: -20 });
        break;
      case 'flip':
        this.tweens.add({
          targets: this.view,
          angle: 360,
          duration: 600,
          onComplete: () => this.view.setAngle(0),
        });
        break;
      default:
        t({ angle: 8 });
    }
  }
}
