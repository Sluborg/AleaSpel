import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { shapeById, type Pt } from '../../data/gestureShapes';
import { MEDALS_PER_STAR, moveById, type MinigameDef, type MoveDef } from '../../data/minigames';
import { accuracy, stars } from '../../services/Gesture';
import { SaveService, type Gymnast } from '../../services/SaveService';
import { createButton } from '../../ui/Button';
import { GymnastView } from '../../ui/GymnastView';
import { BaseScene } from '../BaseScene';

// Shared engine for the pattern minigames: move card with the pattern, drawing, accuracy,
// stars, medals, records and the result panel. A subclass draws its world, positions the
// gymnast and animates each round; it opens and closes the drawing window.
const MIN_STROKE = 60; // design px: shorter strokes are taps, not patterns

function strokeLength(pts: { x: number; y: number }[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++)
    d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

export abstract class PatternGameScene extends BaseScene {
  protected abstract readonly def: MinigameDef;
  protected abstract readonly introText: string;
  protected gymnast!: Gymnast;
  protected view!: GymnastView;
  protected move?: MoveDef;
  protected round = 0;
  private trail!: Phaser.GameObjects.Graphics;
  private card!: Phaser.GameObjects.Container;
  private cardShape!: Phaser.GameObjects.Graphics;
  private cardName!: Phaser.GameObjects.Text;
  private cardHint!: Phaser.GameObjects.Text;
  private progress!: Phaser.GameObjects.Text;
  private stroke: Pt[] = [];
  private drawing = false;
  private live = false; // a round's card is showing: strokes may start
  private pending = false; // a full stroke was drawn before the window opened
  private accepting = false;
  private evaluated = false;
  private total = 0;
  private maxTotal = 0;
  private done = false;
  private practice = false; // from Mitt gym: no medals, records untouched
  private team = false; // from Tävlingsdag: stars go to the team, medals come from the placement
  private returnTo = 'MinigameHub';

  // --- subclass hooks ------------------------------------------------------

  protected abstract drawWorld(): void;
  protected abstract gymnastStart(): { x: number; y: number; height: number };
  // Animate one round. Call openWindow() when drawing may start, closeWindow() when it must
  // end, and roundDone() when the animation is over.
  protected abstract playRound(): void;
  // Reaction to the drawn pattern (called right after evaluation, with the stars earned).
  protected abstract onPattern(got: number): void;

  create(data: {
    gymnastId?: string;
    practice?: boolean;
    team?: boolean;
    returnTo?: string;
  }): void {
    const gymnasts = SaveService.get().gymnasts;
    this.gymnast = gymnasts.find((g) => g.id === data.gymnastId) ?? SaveService.activeGymnast();
    this.practice = data.practice ?? false;
    this.team = data.team ?? false;
    this.returnTo = data.returnTo ?? 'MinigameHub';
    this.round = 0;
    this.total = 0;
    this.maxTotal = 0;
    this.done = false;
    this.drawing = false;
    this.accepting = false;
    this.evaluated = false;
    this.live = false;
    this.pending = false;

    this.drawWorld();
    this.addBackButton(this.returnTo);
    const start = this.gymnastStart();
    this.view = new GymnastView(
      this,
      start.x,
      start.y,
      start.height,
      this.gymnast,
      this.practice ? 'traning' : 'tavling',
    );
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

  // --- card ------------------------------------------------------------------

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
      .text(GAME_WIDTH / 2, 380, this.def.name, {
        fontFamily: FONT,
        fontSize: '64px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const text = this.add
      .text(GAME_WIDTH / 2, 560, this.introText.replace('{name}', this.gymnast.name), {
        fontFamily: FONT,
        fontSize: '38px',
        color: COLORS.textMuted,
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5);
    const best = this.gymnast.bests[this.def.id];
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

  // --- rounds ------------------------------------------------------------------

  private nextRound(): void {
    if (this.round >= this.def.rounds) return this.finish();
    this.round++;
    const pool = this.def.moves.map(moveById);
    this.move = pool[Phaser.Math.Between(0, pool.length - 1)];
    this.maxTotal += this.move.difficulty;
    const shape = shapeById(this.move.shape);
    this.drawShapePreview(shape.points);
    this.cardName.setText(this.move.name);
    this.cardHint.setText(`Rita: ${shape.name.toLowerCase()}`);
    this.card.setVisible(true).setScale(0.6);
    this.tweens.add({ targets: this.card, scale: 1, duration: 250, ease: 'Back.out' });
    this.progress.setText(`${this.round} / ${this.def.rounds}`);
    this.stroke = [];
    this.drawing = false;
    this.trail.clear();
    this.evaluated = false;
    this.accepting = false;
    this.pending = false;
    this.live = true;
    this.playRound();
  }

  protected openWindow(): void {
    this.accepting = true;
    // A pattern finished just before the window opened still counts.
    if (this.pending && !this.evaluated) this.evaluate();
  }

  // Ends the drawing window; evaluates what was drawn if the player has not lifted the finger.
  protected closeWindow(): void {
    if (!this.accepting) return;
    if (!this.evaluated) this.evaluate();
    this.accepting = false;
  }

  protected get patternDone(): boolean {
    return this.evaluated;
  }

  protected roundDone(): void {
    this.closeWindow();
    this.live = false;
    this.time.delayedCall(900, () => {
      this.card.setVisible(false);
      this.trail.clear();
      this.nextRound();
    });
  }

  // --- drawing -----------------------------------------------------------------

  // Drawing may start as soon as the card shows (not only once the window is open), so a quick
  // player never loses a stroke. A stroke too short to be a pattern (a stray tap) is ignored and
  // she can simply draw again.
  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.live || this.evaluated) return;
    this.drawing = true;
    this.pending = false;
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
    if (this.evaluated) return;
    if (strokeLength(this.stroke) < MIN_STROKE) {
      this.stroke = [];
      this.trail.clear();
      return;
    }
    if (this.accepting) this.evaluate();
    else this.pending = true;
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
      y: 560,
      alpha: 0,
      duration: 1400,
      delay: 500,
      onComplete: () => t.destroy(),
    });
    this.onPattern(got);
  }

  // --- result --------------------------------------------------------------------

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const earned = this.practice || this.team ? 0 : this.total * MEDALS_PER_STAR;
    const prev = this.gymnast.bests[this.def.id] ?? 0;
    const record = !this.practice && this.total > prev;
    if (!this.practice) {
      SaveService.update((d) => {
        d.medals += earned;
        this.gymnast.bests[this.def.id] = Math.max(prev, this.total);
      });
    }

    const panel = this.add.container(0, 0).setDepth(300);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.94).fillRoundedRect(40, 240, GAME_WIDTH - 80, 780, 40);
    const title = this.add
      .text(
        GAME_WIDTH / 2,
        330,
        record ? '🎉 Nytt rekord!' : this.practice ? 'Bra tränat!' : 'Bra jobbat!',
        {
          fontFamily: FONT,
          fontSize: '60px',
          color: COLORS.text,
          fontStyle: 'bold',
        },
      )
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
      .text(
        GAME_WIDTH / 2,
        590,
        this.practice
          ? 'Träning ger inga medaljer'
          : this.team
            ? `${this.total} ⭐ till laget`
            : `+${earned} 🏅`,
        {
          fontFamily: FONT,
          fontSize: this.practice ? '38px' : '56px',
          color: COLORS.text,
        },
      )
      .setOrigin(0.5);
    const bank = this.add
      .text(
        GAME_WIDTH / 2,
        670,
        this.team ? 'Laget väntar på dig' : `Du har ${SaveService.get().medals} medaljer`,
        {
          fontFamily: FONT,
          fontSize: '32px',
          color: COLORS.textMuted,
        },
      )
      .setOrigin(0.5);
    const again = createButton(
      this,
      GAME_WIDTH / 2 - 150,
      860,
      'Igen',
      () =>
        this.scene.restart({
          gymnastId: this.gymnast.id,
          practice: this.practice,
          returnTo: this.returnTo,
        }),
      {
        width: 260,
      },
    );
    const back = createButton(
      this,
      this.team ? GAME_WIDTH / 2 : GAME_WIDTH / 2 + 150,
      860,
      this.team ? 'Vidare' : 'Klar',
      () =>
        this.scene.start(
          this.returnTo,
          this.team
            ? {
                result: {
                  gymnastId: this.gymnast.id,
                  gameId: this.def.id,
                  stars: this.total,
                  max: this.maxTotal,
                },
              }
            : undefined,
        ),
      {
        width: this.team ? 320 : 260,
        color: this.team ? COLORS.primary : 0x6b5a85,
      },
    );
    panel.add([bg, title, score, medals, bank, back]);
    if (this.team) again.destroy();
    else panel.add(again);
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
