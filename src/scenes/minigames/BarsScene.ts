import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { backdrop } from '../../ui/art';
import { MINIGAMES } from '../../data/minigames';
import { PatternGameScene } from './PatternGameScene';

const BAR_X = GAME_WIDTH / 2;
const BAR_Y = 430;
const GYMNAST_H = 300;
const HANG = 150; // distance from the bar to the gymnast's centre while hanging
const WINDOW_MS = 3600;
const READ_MS = 400;

// Barr: she hangs from the high bar and swings while you draw; a good pattern becomes a full
// swing around the bar (or a release move), a miss is a small dangle.
export class BarsScene extends PatternGameScene {
  protected readonly def = MINIGAMES.find((g) => g.id === 'bars')!;
  protected readonly introText = `{name} gungar på barren.\nRita mönstret medan hon\nsvänger, så snurrar hon!`;
  private pivot!: Phaser.GameObjects.Container;
  private swing?: Phaser.Tweens.Tween;
  private windowTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('Bars');
  }

  protected drawWorld(): void {
    const g = this.add.graphics();
    if (!backdrop(this, 'bg_gym_hall')) {
      g.fillStyle(0xf6e7d2, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xe8d3b6, 1).fillRect(0, 0, GAME_WIDTH, 300);
      g.fillStyle(0x6fa8dc, 1).fillRect(0, 1000, GAME_WIDTH, GAME_HEIGHT - 1000);
    }
    g.fillStyle(0x4f8fd0, 1).fillRoundedRect(20, 960, GAME_WIDTH - 40, 90, 20);
    // Uprights, the low bar behind and the high bar in front.
    g.fillStyle(0x7a7a85, 1);
    g.fillRect(120, 300, 20, 700).fillRect(GAME_WIDTH - 140, 300, 20, 700);
    g.fillStyle(0xc9a06c, 1).fillRoundedRect(130, 640, GAME_WIDTH - 260, 22, 10);
    g.fillStyle(0xd9b48c, 1).fillRoundedRect(110, BAR_Y - 12, GAME_WIDTH - 220, 24, 12);
  }

  protected gymnastStart() {
    return { x: BAR_X, y: BAR_Y + HANG, height: GYMNAST_H };
  }

  create(data: { gymnastId?: string }): void {
    super.create(data);
    // Re-parent the gymnast under a pivot at the bar, so rotating the pivot swings her.
    this.pivot = this.add.container(BAR_X, BAR_Y);
    this.pivot.add(this.view);
    this.view.setPosition(0, HANG);
  }

  protected playRound(): void {
    this.pivot.setAngle(0);
    this.time.delayedCall(READ_MS, () => {
      this.openWindow();
      this.swing = this.tweens.add({
        targets: this.pivot,
        angle: { from: -35, to: 35 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      this.windowTimer = this.time.delayedCall(WINDOW_MS, () => {
        this.swing?.stop();
        this.tweens.add({
          targets: this.pivot,
          angle: 0,
          duration: 300,
          onComplete: () => this.roundDone(),
        });
      });
    });
  }

  protected onPattern(got: number): void {
    this.windowTimer?.remove();
    this.swing?.stop();
    const done = () => {
      this.pivot.setAngle(0);
      this.view
        .setPosition(0, HANG)
        .setAngle(0)
        .setScale(this.view.scaleX > 0 ? this.view.scaleX : -this.view.scaleX);
      this.roundDone();
    };
    if (got === 0) {
      this.tweens.add({
        targets: this.pivot,
        angle: { from: this.pivot.angle, to: 8 },
        duration: 250,
        yoyo: true,
        repeat: 1,
        onComplete: done,
      });
      return;
    }
    const s = this.view.scaleX;
    const last = this.round === this.def.rounds;
    if (last) {
      // Dismount: one giant swing, let go at the top and land on the mat.
      this.tweens.add({
        targets: this.pivot,
        angle: this.pivot.angle + 360,
        duration: 800,
        ease: 'Sine.in',
        onComplete: () => {
          this.pivot.remove(this.view);
          this.add.existing(this.view);
          this.view.setPosition(BAR_X + 60, BAR_Y + HANG).setAngle(0);
          this.tweens.add({
            targets: this.view,
            x: BAR_X + 200,
            y: 960 - GYMNAST_H / 2 + 8,
            angle: got >= 2 ? 360 : 0,
            duration: 650,
            ease: 'Quad.in',
            onComplete: () => this.roundDone(),
          });
        },
      });
      return;
    }
    switch (this.move?.pose) {
      case 'twist':
        this.tweens.add({
          targets: this.pivot,
          angle: this.pivot.angle + 360,
          duration: 900,
          ease: 'Sine.inOut',
          onComplete: done,
        });
        this.tweens.add({ targets: this.view, scaleX: -s, duration: 450, yoyo: true });
        break;
      case 'flip':
        this.tweens.add({
          targets: this.pivot,
          angle: this.pivot.angle + 720,
          duration: 1300,
          ease: 'Sine.inOut',
          onComplete: done,
        });
        break;
      case 'straddle':
        // Release and catch: fly up above the bar, straddle, come back.
        this.tweens.add({
          targets: this.view,
          y: -HANG,
          scaleX: s * 1.3,
          duration: 450,
          yoyo: true,
          ease: 'Quad.out',
          onComplete: done,
        });
        break;
      case 'pike':
        this.tweens.add({
          targets: this.pivot,
          angle: this.pivot.angle + 360,
          duration: 900,
          ease: 'Sine.inOut',
          onComplete: done,
        });
        this.tweens.add({ targets: this.view, scaleY: s * 0.75, duration: 450, yoyo: true });
        break;
      default:
        this.tweens.add({
          targets: this.pivot,
          angle: this.pivot.angle + 360,
          duration: 900,
          ease: 'Sine.inOut',
          onComplete: done,
        });
    }
  }
}
