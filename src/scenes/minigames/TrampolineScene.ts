import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { shapeById, type Pt } from '../../data/gestureShapes';
import { MEDALS_PER_STAR, MINIGAMES, moveById, type MoveDef } from '../../data/minigames';
import { accuracy, stars } from '../../services/Gesture';
import { SaveService, type Gymnast } from '../../services/SaveService';
import { createButton } from '../../ui/Button';
import { GymnastView } from '../../ui/GymnastView';
import { BaseScene } from '../BaseScene';

const GAME = MINIGAMES.find((g) => g.id === 'trampoline')!;
const MAT_Y = 1010;
const GYMNAST_H = 360;
const STAND_Y = MAT_Y - GYMNAST_H / 2 + 10;
const APEX = 430;
const UP_MS = 1000;
const PREP_MS = 900;
const READ_MS = 400; // card is shown this long before the prep bounce

// Studsmatta: the gymnast bounces, a move card shows a finger pattern, draw it while she is in
// the air. Stars per move, medals for stars, personal best per gymnast.
export class TrampolineScene extends BaseScene {
  private gymnast!: Gymnast;
  private view!: GymnastView;
  private trail!: Phaser.GameObjects.Graphics;
  private card!: Phaser.GameObjects.Container;
  private cardShape!: Phaser.GameObjects.Graphics;
  private cardName!: Phaser.GameObjects.Text;
  private cardHint!: Phaser.GameObjects.Text;
  private progress!: Phaser.GameObjects.Text;
  private stroke: Pt[] = [];
  private drawing = false;
  private accepting = false;
  private evaluated = false;
  private move?: MoveDef;
  private round = 0;
  private total = 0;
  private maxTotal = 0;
  private done = false;

  constructor() {
    super('Trampoline');
  }

  create(data: { gymnastId?: string }): void {
    const gymnasts = SaveService.get().gymnasts;
    this.gymnast = gymnasts.find((g) => g.id === data.gymnastId) ?? gymnasts[0];
    this.round = 0;
    this.total = 0;
    this.maxTotal = 0;
    this.done = false;

    this.drawBackground();
    this.addBackButton('MinigameHub');
    this.view = new GymnastView(this, GAME_WIDTH / 2, STAND_Y, GYMNAST_H, this.gymnast);
    this.trail = this.add.graphics().setDepth(200);
    this.buildCard();
    this.progress = this.add
      .text(GAME_WIDTH - 30, 60, '', {
        fontFamily: FONT,
        fontSize: '34px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => this.onUp());

    this.showIntro();
  }

  // --- world -------------------------------------------------------------

  private drawBackground(): void {
    const g = this.add.graphics();
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
    // Trampoline: legs, frame, mat.
    g.fillStyle(0x4a4a55, 1);
    g.fillRect(150, MAT_Y, 24, 120).fillRect(GAME_WIDTH - 174, MAT_Y, 24, 120);
    g.fillStyle(0x2b6cb0, 1).fillEllipse(GAME_WIDTH / 2, MAT_Y, 560, 70);
    g.fillStyle(0x1a1a2e, 1).fillEllipse(GAME_WIDTH / 2, MAT_Y, 480, 46);
  }

  private buildCard(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95).fillRoundedRect(-300, -110, 600, 220, 36);
    this.cardShape = this.add.graphics();
    this.cardName = this.add
      .text(40, -40, '', {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#3a2a4a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.cardHint = this.add
      .text(40, 35, '', { fontFamily: FONT, fontSize: '32px', color: '#6b4a55' })
      .setOrigin(0.5);
    this.card = this.add.container(GAME_WIDTH / 2, 250, [
      bg,
      this.cardShape,
      this.cardName,
      this.cardHint,
    ]);
    this.card.setDepth(100).setVisible(false);
  }

  // The pattern drawn on the card, with a dot where to start.
  private drawShapePreview(points: Pt[]): void {
    const g = this.cardShape;
    const size = 150;
    const ox = -190 - size / 2;
    const oy = -size / 2;
    g.clear();
    g.lineStyle(10, 0xff4f7b, 1);
    g.beginPath();
    points.forEach((p, i) =>
      i ? g.lineTo(ox + p.x * size, oy + p.y * size) : g.moveTo(ox + p.x * size, oy + p.y * size),
    );
    g.strokePath();
    g.fillStyle(0x3a2a4a, 1).fillCircle(ox + points[0].x * size, oy + points[0].y * size, 11);
  }

  private showIntro(): void {
    const panel = this.add.container(0, 0).setDepth(300);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.92).fillRoundedRect(40, 300, GAME_WIDTH - 80, 640, 40);
    const title = this.add
      .text(GAME_WIDTH / 2, 380, 'Studsmatta', {
        fontFamily: FONT,
        fontSize: '64px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const text = this.add
      .text(
        GAME_WIDTH / 2,
        560,
        `${this.gymnast.name} hoppar ${GAME.rounds} gånger.\nRita mönstret på kortet\nmedan hon är i luften!`,
        {
          fontFamily: FONT,
          fontSize: '38px',
          color: COLORS.textMuted,
          align: 'center',
          lineSpacing: 12,
        },
      )
      .setOrigin(0.5);
    const best = this.gymnast.bests[GAME.id];
    const bestText = this.add
      .text(GAME_WIDTH / 2, 720, best ? `Ditt rekord: ${best} ⭐` : 'Första gången!', {
        fontFamily: FONT,
        fontSize: '34px',
        color: COLORS.text,
      })
      .setOrigin(0.5);
    const go = createButton(this, GAME_WIDTH / 2, 850, 'Kör!', () => {
      panel.destroy();
      this.time.delayedCall(300, () => this.nextRound());
    });
    panel.add([bg, title, text, bestText, go]);
  }

  // --- rounds ------------------------------------------------------------

  private nextRound(): void {
    if (this.round >= GAME.rounds) return this.finish();
    this.round++;
    const pool = GAME.moves.map(moveById);
    this.move = pool[Phaser.Math.Between(0, pool.length - 1)];
    this.maxTotal += this.move.difficulty;
    const shape = shapeById(this.move.shape);
    this.drawShapePreview(shape.points);
    this.cardName.setText(this.move.name);
    this.cardHint.setText(`Rita: ${shape.name.toLowerCase()}`);
    this.card.setVisible(true).setScale(0.6);
    this.tweens.add({ targets: this.card, scale: 1, duration: 250, ease: 'Back.out' });
    this.progress.setText(`${this.round} / ${GAME.rounds}`);
    this.stroke = [];
    this.drawing = false;
    this.trail.clear();
    this.evaluated = false;
    this.accepting = true;

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
        this.land();
      },
    });
  }

  // The pose plays at the apex if the gesture was already drawn well enough.
  private performPose(): void {
    if (!this.move || !this.evaluated) return;
    const s = this.view.scaleX;
    const t = (props: object) =>
      this.tweens.add({ targets: this.view, duration: 300, yoyo: true, ...props });
    switch (this.move.pose) {
      case 'tuck':
        t({ scale: s * 0.7 });
        break;
      case 'pike':
        t({ scaleY: s * 0.75, angle: 35 });
        break;
      case 'straddle':
        t({ scaleX: s * 1.35 });
        break;
      case 'twist':
        this.tweens.add({ targets: this.view, scaleX: -s, duration: 300, yoyo: true });
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
        t({ scaleY: s * 1.08 });
    }
  }

  private land(): void {
    if (!this.evaluated) this.evaluate();
    this.accepting = false;
    this.time.delayedCall(900, () => {
      this.card.setVisible(false);
      this.trail.clear();
      this.nextRound();
    });
  }

  // --- drawing -----------------------------------------------------------

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.accepting || this.evaluated) return;
    this.drawing = true;
    this.stroke = [{ x: p.x, y: p.y }];
    this.trail.clear();
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.drawing) return;
    const last = this.stroke[this.stroke.length - 1];
    if (!last) {
      this.stroke.push({ x: p.x, y: p.y });
      return;
    }
    if (Math.hypot(p.x - last.x, p.y - last.y) < 4) return;
    this.stroke.push({ x: p.x, y: p.y });
    this.trail.lineStyle(14, 0xff4f7b, 0.9);
    this.trail.beginPath().moveTo(last.x, last.y).lineTo(p.x, p.y).strokePath();
  }

  private onUp(): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.accepting && !this.evaluated) this.evaluate();
  }

  private evaluate(): void {
    if (!this.move) return;
    this.evaluated = true;
    const acc = accuracy(this.stroke, this.move.shape);
    const got = stars(acc, this.move.difficulty);
    const pct = Math.round(acc * 100);
    this.total += got;
    const label =
      got === 0
        ? 'Nästan!'
        : got >= this.move.difficulty
          ? 'Perfekt!'
          : got === 1
            ? 'Okej!'
            : 'Bra!';
    const t = this.add
      .text(GAME_WIDTH / 2, 640, `${'⭐'.repeat(got)}${got ? ' ' : ''}${label}  ${pct}%`, {
        fontFamily: FONT,
        fontSize: '56px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#3a2a4a',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(250);
    this.tweens.add({
      targets: t,
      y: 340,
      alpha: 0,
      duration: 1400,
      delay: 500,
      onComplete: () => t.destroy(),
    });
  }

  // --- result ------------------------------------------------------------

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const earned = this.total * MEDALS_PER_STAR;
    const prev = this.gymnast.bests[GAME.id] ?? 0;
    const record = this.total > prev;
    SaveService.update((d) => {
      d.medals += earned;
      this.gymnast.bests[GAME.id] = Math.max(prev, this.total);
    });

    const panel = this.add.container(0, 0).setDepth(300);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.94).fillRoundedRect(40, 240, GAME_WIDTH - 80, 780, 40);
    const title = this.add
      .text(GAME_WIDTH / 2, 330, record ? '🎉 Nytt rekord!' : 'Bra jobbat!', {
        fontFamily: FONT,
        fontSize: '60px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const score = this.add
      .text(GAME_WIDTH / 2, 470, `${this.total} av ${this.maxTotal} ⭐`, {
        fontFamily: FONT,
        fontSize: '72px',
        color: '#ffd84d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const medals = this.add
      .text(GAME_WIDTH / 2, 590, `+${earned} 🏅`, {
        fontFamily: FONT,
        fontSize: '56px',
        color: COLORS.text,
      })
      .setOrigin(0.5);
    const bank = this.add
      .text(GAME_WIDTH / 2, 670, `Du har ${SaveService.get().medals} medaljer`, {
        fontFamily: FONT,
        fontSize: '32px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);
    const again = createButton(
      this,
      GAME_WIDTH / 2 - 150,
      860,
      'Igen',
      () => this.scene.restart({ gymnastId: this.gymnast.id }),
      { width: 260 },
    );
    const back = createButton(
      this,
      GAME_WIDTH / 2 + 150,
      860,
      'Klar',
      () => this.scene.start('MinigameHub'),
      { width: 260, color: 0x6b5a85 },
    );
    panel.add([bg, title, score, medals, bank, again, back]);
    for (let i = 0; i < 12; i++) {
      const c = this.add
        .rectangle(
          Phaser.Math.Between(60, GAME_WIDTH - 60),
          Phaser.Math.Between(-100, 0),
          18,
          28,
          Phaser.Math.Between(0x60ff60, 0xff60ff),
        )
        .setDepth(310);
      this.tweens.add({
        targets: c,
        y: GAME_HEIGHT + 40,
        angle: 720,
        duration: Phaser.Math.Between(1800, 3200),
        delay: i * 80,
      });
    }
  }
}
