import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { backdrop } from '../../ui/art';
import { MINIGAMES } from '../../data/minigames';
import { PatternGameScene } from './PatternGameScene';

const FLOOR_Y = 1010;
const GYMNAST_H = 300;
const STAND_Y = FLOOR_Y - GYMNAST_H / 2 + 8;
const START_X = 110;
const BOARD_X = 330;
const TABLE_X = 470;
const LAND_X = 640;
const APEX_Y = 380;
const RUN_MS = 1100;
const FLIGHT_MS = 1600;
const READ_MS = 500;

// Hopp: run-up, springboard, flight over the vault table. Draw the pattern during the run and
// the flight; the pattern decides what she does in the air and how she lands.
export class VaultScene extends PatternGameScene {
  protected readonly def = MINIGAMES.find((g) => g.id === 'vault')!;
  protected readonly introText = `{name} springer mot bocken.\nRita mönstret innan\nhon landar!`;
  private gotStars = 0;

  constructor() {
    super('Vault');
  }

  protected drawWorld(): void {
    const g = this.add.graphics();
    if (!backdrop(this, 'bg_gym_hall')) {
      g.fillStyle(0xf6e7d2, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0xe8d3b6, 1).fillRect(0, 0, GAME_WIDTH, 560);
      g.fillStyle(0xbfe3ff, 1);
      for (const x of [90, 300, 510]) g.fillRoundedRect(x, 120, 130, 170, 16);
      g.fillStyle(0x6fa8dc, 1).fillRect(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);
    }
    // Runway, springboard, vault table, landing mat.
    g.fillStyle(0xd94f8c, 1).fillRect(0, FLOOR_Y, BOARD_X - 40, 14);
    g.fillStyle(0xf3d9a4, 1).fillTriangle(
      BOARD_X - 60,
      FLOOR_Y,
      BOARD_X + 40,
      FLOOR_Y,
      BOARD_X + 40,
      FLOOR_Y - 46,
    );
    g.fillStyle(0x7a7a85, 1).fillRect(TABLE_X - 14, FLOOR_Y - 250, 28, 250);
    g.fillStyle(0x5aa9ff, 1).fillRoundedRect(TABLE_X - 80, FLOOR_Y - 300, 160, 60, 24);
    g.fillStyle(0x4f8fd0, 1).fillRoundedRect(LAND_X - 100, FLOOR_Y - 30, 200, 40, 14);
  }

  protected gymnastStart() {
    return { x: START_X, y: STAND_Y, height: GYMNAST_H };
  }

  protected playRound(): void {
    this.gotStars = 0;
    this.view.setPosition(START_X, STAND_Y).setAngle(0);
    this.time.delayedCall(READ_MS, () => {
      this.openWindow();
      // Run-up with small bobs, hit the board, fly over the table, land.
      this.tweens.add({
        targets: this.view,
        y: STAND_Y - 10,
        duration: 120,
        yoyo: true,
        repeat: 4,
      });
      this.tweens.add({
        targets: this.view,
        x: BOARD_X,
        duration: RUN_MS,
        ease: 'Sine.in',
        onComplete: () => this.fly(),
      });
    });
  }

  private fly(): void {
    const s = this.view.scaleX;
    this.tweens.add({ targets: this.view, x: LAND_X, duration: FLIGHT_MS, ease: 'Linear' });
    this.tweens.add({
      targets: this.view,
      y: APEX_Y,
      duration: FLIGHT_MS / 2,
      ease: 'Quad.out',
      yoyo: true,
      onYoyo: () => {
        this.closeWindow();
        this.pose();
      },
      onComplete: () => {
        this.view.setScale(s).setAngle(0).setY(STAND_Y);
        this.land();
      },
    });
  }

  protected onPattern(got: number): void {
    this.gotStars = got;
  }

  private pose(): void {
    if (!this.move || this.gotStars === 0) return;
    const s = this.view.scaleX;
    const t = (props: object) =>
      this.tweens.add({ targets: this.view, duration: 320, yoyo: true, ...props });
    switch (this.move.pose) {
      case 'flip':
        this.tweens.add({
          targets: this.view,
          angle: 360,
          duration: 650,
          onComplete: () => this.view.setAngle(0),
        });
        break;
      case 'twist':
        this.tweens.add({ targets: this.view, scaleX: -s, duration: 320, yoyo: true });
        break;
      case 'tuck':
        t({ scale: s * 0.7 });
        break;
      case 'straddle':
        t({ scaleX: s * 1.35 });
        break;
      case 'pike':
        t({ scaleY: s * 0.75, angle: 35 });
        break;
      default:
        t({ scaleY: s * 1.08 });
    }
  }

  // Stuck landing on a good pattern, a stumble on a poor one.
  private land(): void {
    if (this.gotStars >= 2) {
      this.tweens.add({
        targets: this.view,
        scaleY: this.view.scaleY * 0.9,
        duration: 120,
        yoyo: true,
        onComplete: () => this.roundDone(),
      });
    } else {
      this.tweens.add({
        targets: this.view,
        x: LAND_X + 40,
        angle: 12,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          this.view.setAngle(0);
          this.roundDone();
        },
      });
    }
  }
}
