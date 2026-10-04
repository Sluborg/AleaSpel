import Phaser from 'phaser';
import { COLORS, FONT, GAME_WIDTH } from '../config';
import { MOVES } from '../data/moves';
import { SaveService } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { BaseScene } from './BaseScene';

// Rörelselabbet: a test bench for the gymnast's moves (Stefan and Art, not part of the game
// loop). Every row in data/moves.ts gets a button; poses planned for the body-part rig (movement
// plan stage 2) show as greyed "Snart" buttons until their rows exist. Reached with a long press
// on the logo in the main menu.
const NAMES: Record<string, string> = {
  idle: 'Andas',
  happy: 'Glad',
  jump: 'Hoppa',
  spin: 'Snurra',
  flip: 'Volt',
  wobble: 'Vingla',
  bow: 'Buga',
  wave: 'Vinka',
  sit: 'Sitta',
  victory: 'Seger',
  arms_up: 'Armar upp',
  star: 'Stjärna',
  landing: 'Landning',
};
const PLANNED = ['wave', 'victory', 'arms_up', 'star', 'landing', 'sit'];
// Four columns so every move and planned pose fits above the bottom edge (13 today).
const COLS = 4;
const BTN_W = 160;
const BTN_H = 110;
const GRID_TOP = 830;

export class MoveLabScene extends BaseScene {
  private view?: GymnastView;
  private status?: Phaser.GameObjects.Text;

  constructor() {
    super('MoveLab');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Rörelselabbet');
    this.addBackButton();
    this.add.ellipse(GAME_WIDTH / 2, 760, 300, 50, 0x000000, 0.25);
    this.view = new GymnastView(this, GAME_WIDTH / 2, 470, 580, SaveService.activeGymnast());
    this.status = this.add
      .text(GAME_WIDTH / 2, 160, 'Tryck på en rörelse', {
        fontFamily: FONT,
        fontSize: '30px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    const ids = [
      ...MOVES.map((m) => m.id),
      ...PLANNED.filter((p) => !MOVES.some((m) => m.id === p)),
    ];
    ids.forEach((id, i) => {
      const x = GAME_WIDTH / 2 + ((i % COLS) - (COLS - 1) / 2) * (BTN_W + 16);
      const y = GRID_TOP + Math.floor(i / COLS) * (BTN_H + 12);
      const ready = MOVES.some((m) => m.id === id);
      const b = createButton(
        this,
        x,
        y,
        ready ? (NAMES[id] ?? id) : `${NAMES[id] ?? id}\nsnart`,
        () => this.play(id),
        {
          width: BTN_W,
          height: BTN_H,
          fontSize: ready ? 30 : 22,
          color: ready ? COLORS.primary : 0x6b5a85,
        },
      );
      if (!ready) b.disableInteractive().setAlpha(0.6);
    });
  }

  private play(id: string): void {
    const started = this.time.now;
    this.status?.setText(`${NAMES[id] ?? id} …`);
    void this.view?.play(id).then(() => {
      const ms = Math.round(this.time.now - started);
      this.status?.setText(`${NAMES[id] ?? id}: ${ms} ms`);
      if (this.scene.isActive()) void this.view?.play('idle');
    });
  }
}
