import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { MINIGAMES } from '../../data/minigames';
import { PatternGameScene } from './PatternGameScene';

const BEAM_Y = 900; // top of the beam
const BEAM_LEFT = 70;
const BEAM_RIGHT = GAME_WIDTH - 70;
const GYMNAST_H = 320;
const STAND_Y = BEAM_Y - GYMNAST_H / 2 + 8;
const WINDOW_MS = 3800; // time to draw once she stands still
const READ_MS = 400;

// Bom: the gymnast walks along the beam and stops at each station; draw the pattern before she
// wobbles. The last round is the dismount onto the mat.
export class BeamScene extends PatternGameScene {
  protected readonly def = MINIGAMES.find((g) => g.id === 'beam')!;
  protected readonly introText = `{name} går på bommen.\nRita mönstret innan\nhon börjar vingla!`;
  private wobble?: Phaser.Tweens.Tween;
  private windowTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('Beam');
  }

  protected drawWorld(): void {
    const g = this.add.graphics();
    g.fillStyle(0xf6e7d2, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xe8d3b6, 1).fillRect(0, 0, GAME_WIDTH, 560);
    // Windows.
    g.fillStyle(0xbfe3ff, 1);
    for (const x of [90, 300, 510]) g.fillRoundedRect(x, 120, 130, 170, 16);
    // Mats and floor.
    g.fillStyle(0x6fa8dc, 1).fillRect(0, BEAM_Y + 170, GAME_WIDTH, GAME_HEIGHT - BEAM_Y - 170);
    g.fillStyle(0x4f8fd0, 1).fillRoundedRect(20, BEAM_Y + 130, GAME_WIDTH - 40, 90, 20);
    // Beam legs and beam.
    g.fillStyle(0x7a7a85, 1);
    g.fillRect(BEAM_LEFT + 30, BEAM_Y, 22, 150).fillRect(BEAM_RIGHT - 52, BEAM_Y, 22, 150);
    g.fillStyle(0xd9b48c, 1).fillRoundedRect(BEAM_LEFT, BEAM_Y, BEAM_RIGHT - BEAM_LEFT, 36, 10);
    g.fillStyle(0xb98b5e, 1).fillRect(BEAM_LEFT, BEAM_Y + 26, BEAM_RIGHT - BEAM_LEFT, 10);
  }

  protected gymnastStart() {
    return { x: this.stationX(0), y: STAND_Y, height: GYMNAST_H };
  }

  private stationX(round: number): number {
    const n = this.def.rounds;
    const inner = 130;
    return BEAM_LEFT + inner + ((BEAM_RIGHT - BEAM_LEFT - 2 * inner) * round) / n;
  }

  protected playRound(): void {
    const last = this.round === this.def.rounds;
    const tx = last ? this.stationX(this.def.rounds) : this.stationX(this.round);
    // Walk to the next station with small steps, then stand still and the window opens.
    this.tweens.add({
      targets: this.view,
      x: tx,
      duration: 900,
      ease: 'Sine.inOut',
      onComplete: () => this.time.delayedCall(READ_MS, () => this.stand()),
    });
    this.tweens.add({ targets: this.view, y: STAND_Y - 8, duration: 150, yoyo: true, repeat: 2 });
  }

  private stand(): void {
    this.openWindow();
    // Growing wobble: gentle at first, clearly urgent at the end of the window.
    this.wobble = this.tweens.add({
      targets: this.view,
      angle: { from: -3, to: 3 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.windowTimer = this.time.delayedCall(WINDOW_MS, () => {
      if (!this.patternDone) this.slip();
      this.roundDone();
    });
  }

  protected onPattern(got: number): void {
    this.windowTimer?.remove();
    this.wobble?.stop();
    this.view.setAngle(0);
    if (got === 0) {
      this.slip();
      this.time.delayedCall(600, () => this.roundDone());
      return;
    }
    const last = this.round === this.def.rounds;
    const s = this.view.scaleX;
    const done = () => this.roundDone();
    if (last) {
      // Dismount: jump off the end of the beam onto the mat, flip if the pattern was good.
      this.tweens.add({
        targets: this.view,
        x: this.view.x + 110,
        y: STAND_Y + 190,
        angle: got >= 2 ? 360 : 0,
        duration: 700,
        ease: 'Quad.in',
        onComplete: () => {
          this.view.setAngle(0);
          done();
        },
      });
      return;
    }
    switch (this.move?.pose) {
      case 'pike':
        this.tweens.add({
          targets: this.view,
          angle: -30,
          scaleY: s * 0.8,
          duration: 350,
          yoyo: true,
          onComplete: done,
        });
        break;
      case 'twist':
        this.tweens.add({
          targets: this.view,
          scaleX: -s,
          duration: 350,
          yoyo: true,
          onComplete: done,
        });
        break;
      case 'flip':
        this.tweens.add({
          targets: this.view,
          y: STAND_Y - 120,
          angle: 360,
          duration: 700,
          onComplete: () => {
            this.view.setAngle(0).setY(STAND_Y);
            done();
          },
        });
        break;
      case 'straddle':
        this.tweens.add({
          targets: this.view,
          y: STAND_Y - 90,
          scaleX: s * 1.3,
          duration: 320,
          yoyo: true,
          onComplete: done,
        });
        break;
      default:
        this.tweens.add({
          targets: this.view,
          y: STAND_Y - 40,
          scaleY: s * 1.06,
          duration: 300,
          yoyo: true,
          onComplete: done,
        });
    }
  }

  // A miss: she dips off balance and catches herself.
  private slip(): void {
    this.wobble?.stop();
    this.tweens.add({
      targets: this.view,
      angle: { from: 0, to: 18 },
      y: STAND_Y + 40,
      duration: 220,
      yoyo: true,
      onComplete: () => this.view.setAngle(0).setY(STAND_Y),
    });
  }
}
