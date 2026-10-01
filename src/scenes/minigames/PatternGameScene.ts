import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { shapeById, type Pt } from '../../data/gestureShapes';
import {
  medalsFor,
  moveById,
  type MinigameDef,
  type MoveDef,
  type RoundKind,
} from '../../data/minigames';
import { accuracy, stars } from '../../services/Gesture';
import { SaveService, type Gymnast } from '../../services/SaveService';
import { createButton } from '../../ui/Button';
import { GymnastView } from '../../ui/GymnastView';
import { LEVEL_TIME_SCALE, adjustLevel, levelMessage, levelOf } from '../../services/Difficulty';
import { BaseScene } from '../BaseScene';
import { CHALLENGE_HINT, runChallenge, type ChallengeKind } from './challenges';

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

// Card text sits right of the pattern preview (which spans x -265..-115 on the card).
const CARD_TEXT_X = 95;
const CARD_TEXT_W = 370;

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
  private lastPopup?: Phaser.GameObjects.Text;
  private practice = false; // from Mitt gym: no medals, records untouched
  private team = false; // from Tävlingsdag: stars go to the team, medals come from the placement
  private returnTo = 'MinigameHub';
  protected level = 1; // this gymnast's level in this game (1-5)
  private ending = false; // roundDone already ran for this round
  private lastGot = 0; // this round's result for the gymnast's reaction (0 none, 2 good, 3 perfect)
  private deferred?: number; // stars waiting for the window to open (early stroke or challenge)
  private lastKind: RoundKind = 'pattern';

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
    this.ending = false;
    this.deferred = undefined;
    this.lastKind = 'pattern';
    this.level = levelOf(this.gymnast, this.def.id);
    // Lower levels play slower: more time to read the card and draw.
    this.time.timeScale = LEVEL_TIME_SCALE[this.level - 1];
    this.tweens.timeScale = LEVEL_TIME_SCALE[this.level - 1];

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
      .text(GAME_WIDTH - 40, 60, '', {
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
      .text(CARD_TEXT_X, -40, '', {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#3a2a4a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.cardHint = this.add
      .text(CARD_TEXT_X, 35, '', { fontFamily: FONT, fontSize: '32px', color: '#6b4a55' })
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
    const extra = this.add
      .text(GAME_WIDTH / 2, 662, 'Ibland kommer en extra uppgift!', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#ffd84d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setVisible(!!this.def.mix?.some((k) => k !== 'pattern'));
    const best = this.gymnast.bests[this.def.id];
    const bestText = this.add
      .text(
        GAME_WIDTH / 2,
        720,
        `Nivå ${this.level}   ·   ${best ? `Rekord: ${best} ⭐` : 'Första gången!'}`,
        {
          fontFamily: FONT,
          fontSize: '34px',
          color: COLORS.text,
        },
      )
      .setOrigin(0.5);
    const go = createButton(this, GAME_WIDTH / 2, 850, 'Kör!', () => {
      panel.destroy();
      this.time.delayedCall(300, () => this.nextRound());
    });
    panel.add([bg, title, text, extra, bestText, go]);
  }

  // --- rounds ------------------------------------------------------------------

  private nextRound(): void {
    // Last round's "⭐ Bra!" must not linger over the new round.
    this.lastPopup?.destroy();
    this.lastPopup = undefined;
    if (this.round >= this.def.rounds) return this.finish();
    this.round++;
    this.ending = false;
    this.deferred = undefined;
    this.move = this.pickMove();
    const kind = this.pickKind();
    if (kind !== 'pattern') return this.challengeRound(kind);
    this.maxTotal += this.move.difficulty;
    const shape = shapeById(this.move.shape);
    this.drawShapePreview(shape.points);
    // Long names shrink to stay right of the pattern preview.
    this.cardName.setText(this.move.name).setScale(1);
    this.cardName.setScale(Math.min(1, CARD_TEXT_W / this.cardName.width));
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
    // A pattern finished just before the window opened, or a challenge round's stars, count now.
    // Delivered a tick later so the subclass has set up its window timer first.
    if (this.pending && !this.evaluated) this.time.delayedCall(0, () => this.evaluate());
    else if (this.deferred !== undefined) {
      const got = this.deferred;
      this.deferred = undefined;
      this.time.delayedCall(0, () => this.onPattern(got));
    }
  }

  // Harder levels bring harder moves: level 1 only easy ones, level 4 and up all of them.
  private pickMove(): MoveDef {
    const all = this.def.moves.map(moveById);
    const maxDiff = this.level <= 1 ? 1 : this.level <= 3 ? 2 : 3;
    let pool = all.filter((m) => m.difficulty <= maxDiff);
    if (this.level >= 5) pool = pool.filter((m) => m.difficulty >= 2);
    if (!pool.length) pool = all;
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  // Rounds mix patterns with the apparatus' challenges (`mix` in data), never the same challenge
  // twice in a row, so she does not know what comes next.
  private pickKind(): RoundKind {
    const mix = this.def.mix ?? ['pattern'];
    const options = mix.filter((k) => k === 'pattern' || k !== this.lastKind);
    const kind = options[Phaser.Math.Between(0, options.length - 1)] ?? 'pattern';
    this.lastKind = kind;
    return kind;
  }

  // A challenge instead of a pattern: the gymnast waits while it is solved, then does her move
  // (well with stars, badly with none). Worth up to 3 stars.
  private challengeRound(kind: ChallengeKind): void {
    this.maxTotal += 3;
    this.card.setVisible(false);
    this.progress.setText(`${this.round} / ${this.def.rounds}`);
    this.stroke = [];
    this.drawing = false;
    this.trail.clear();
    this.evaluated = true; // no drawing this round
    this.accepting = false;
    this.pending = false;
    this.live = false;
    const layer = this.add.container(0, 0).setDepth(150);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.9).fillRoundedRect(24, 150, GAME_WIDTH - 48, 900, 40);
    layer.add(bg);
    if (CHALLENGE_HINT[kind])
      layer.add(
        this.add
          .text(GAME_WIDTH / 2, 205, CHALLENGE_HINT[kind], {
            fontFamily: FONT,
            fontSize: '36px',
            color: '#ffd84d',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    const content = this.add.container(0, 0);
    layer.add(content);
    this.popup('✨ Extra uppgift!');
    runChallenge(kind, {
      scene: this,
      layer: content,
      level: this.level,
      step: 1,
      top: 250,
      bottom: 1030,
      done: (got) => {
        const s = Phaser.Math.Clamp(got, 0, 3);
        this.total += s;
        this.lastGot = s;
        this.popup(s ? `${'⭐'.repeat(s)} ${s === 3 ? 'Perfekt!' : 'Bra!'}` : 'Nästan!');
        // The move's reaction uses the move's own scale (1 to its difficulty).
        const d = this.move?.difficulty ?? 1;
        this.deferred = s === 0 ? 0 : Math.max(1, Math.round((s * d) / 3));
        this.time.delayedCall(700, () => {
          layer.destroy();
          this.playRound();
        });
      },
    });
  }

  private popup(msg: string): void {
    this.lastPopup?.destroy();
    const t = this.add
      .text(GAME_WIDTH / 2, 640, msg, {
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
    this.lastPopup = t;
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
    if (this.ending) return; // once per round, however many timers end it
    this.ending = true;
    this.closeWindow();
    this.live = false;
    // Between rounds the gymnast reacts with a whole-body move (her apparatus move is done).
    void this.view.play(this.lastGot >= 3 ? 'happy' : this.lastGot > 0 ? 'jump' : 'wobble');
    this.lastGot = 0;
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
    this.lastGot = got >= this.move.difficulty ? 3 : got > 0 ? 2 : 0;
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
    const earned = this.practice || this.team ? 0 : medalsFor(this.def, this.total);
    const prev = this.gymnast.bests[this.def.id] ?? 0;
    const record = !this.practice && this.total > prev;
    let levelLine = `Nivå ${this.level}`;
    if (!this.practice) {
      SaveService.update((d) => {
        d.medals += earned;
        this.gymnast.bests[this.def.id] = Math.max(prev, this.total);
        const after = adjustLevel(this.gymnast, this.def.id, this.total, this.maxTotal);
        levelLine = levelMessage(this.level, after);
      });
    }

    void this.view.play(record ? 'flip' : 'bow');
    const panel = this.add.container(0, 0).setDepth(300);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.94).fillRoundedRect(40, 240, GAME_WIDTH - 80, 780, 40);
    const title = this.add
      .text(
        GAME_WIDTH / 2,
        330,
        record
          ? '🎉 Nytt rekord!'
          : !this.total
            ? 'Försök igen!'
            : this.practice
              ? 'Bra tränat!'
              : 'Bra jobbat!',
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
        this.team
          ? `${levelLine}   ·   Laget väntar på dig`
          : `${levelLine}   ·   Du har ${SaveService.get().medals} 🏅`,
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
