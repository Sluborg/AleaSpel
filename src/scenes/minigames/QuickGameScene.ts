import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { MEDALS_PER_STAR, MINIGAMES, type MinigameDef } from '../../data/minigames';
import { SaveService, type Gymnast } from '../../services/SaveService';
import { backdrop } from '../../ui/art';
import { createButton } from '../../ui/Button';
import { GymnastView } from '../../ui/GymnastView';
import { adjustLevel, levelMessage, levelOf } from '../../services/Difficulty';
import { BaseScene } from '../BaseScene';

export const PLAY_TOP = 250; // the round's play area, between the header and the gymnast
export const PLAY_BOTTOM = 1030;

const STAR_TEXT = ['Oj!', 'Bra!', 'Jättebra!', 'Perfekt!'];
// Whole-body move per star count (data/moves.ts).
const REACTION = ['wobble', 'jump', 'spin', 'flip'];

// Base for the quick warm-up games (Uppvärmning): an intro card, N rounds worth 0-3 stars each,
// medals (1 per star) and a personal best like the apparatus games. A subclass builds each round
// into `this.round` (cleared between rounds) and calls `roundDone(stars)` when it is over.
export abstract class QuickGameScene extends BaseScene {
  protected def!: MinigameDef;
  protected gymnast!: Gymnast;
  protected roundNo = 0;
  protected level = 1; // this gymnast's level in this game (1-5)
  protected layer!: Phaser.GameObjects.Container;
  private total = 0;
  private practice = false;
  private returnTo = 'MinigameHub';
  private progress!: Phaser.GameObjects.Text;
  private score!: Phaser.GameObjects.Text;
  private view!: GymnastView;
  private finished = false;

  // Build round `roundNo` (1-based) into `this.layer` and call roundDone when it is over.
  protected abstract playRound(roundNo: number): void;

  create(data: {
    gymnastId?: string;
    gameId?: string;
    practice?: boolean;
    returnTo?: string;
  }): void {
    const id = data.gameId ?? this.defaultGameId();
    this.def = MINIGAMES.find((g) => g.id === id) ?? MINIGAMES[0];
    const gymnasts = SaveService.get().gymnasts;
    this.gymnast = gymnasts.find((g) => g.id === data.gymnastId) ?? SaveService.activeGymnast();
    this.practice = data.practice ?? false;
    this.returnTo = data.returnTo ?? 'MinigameHub';
    this.level = levelOf(this.gymnast, this.def.id);
    this.roundNo = 0;
    this.total = 0;
    this.finished = false;

    this.cameras.main.setBackgroundColor(COLORS.background);
    if (backdrop(this, 'bg_gym_hall')) {
      this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 0.55)
        .setOrigin(0)
        .setDepth(-50000);
    }
    this.addTitle(this.def.name);
    this.addBackButton(this.returnTo);
    this.progress = this.text(GAME_WIDTH - 40, 190, '', 34).setOrigin(1, 0.5);
    this.score = this.text(40, 190, '⭐ 0', 34).setOrigin(0, 0.5);
    this.view = new GymnastView(this, 110, GAME_HEIGHT - 150, 260, this.gymnast, 'traning');
    void this.view.play('idle');
    this.layer = this.add.container(0, 0);
    this.showIntro();
  }

  // The scene's game when it is started without a game id (one scene can serve several rows).
  protected defaultGameId(): string {
    return MINIGAMES.find((g) => g.scene === this.scene.key)?.id ?? '';
  }

  protected text(x: number, y: number, s: string, size = 40, color: string = COLORS.text) {
    return this.add
      .text(x, y, s, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        color,
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private showIntro(): void {
    const panel = this.add.container(0, 0).setDepth(300);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.95).fillRoundedRect(50, 300, GAME_WIDTH - 100, 620, 40);
    const title = this.text(GAME_WIDTH / 2, 380, `${this.def.icon} ${this.def.name}`, 52);
    const how = this.text(GAME_WIDTH / 2, 530, this.def.intro ?? '', 32, COLORS.textMuted);
    how.setWordWrapWidth(GAME_WIDTH - 160);
    const best = this.gymnast.bests[this.def.id];
    const bestText = this.text(
      GAME_WIDTH / 2,
      680,
      `Nivå ${this.level}   ·   ${best ? `Rekord: ${best} ⭐` : 'Första gången!'}`,
      32,
    );
    const go = createButton(this, GAME_WIDTH / 2, 820, 'Kör!', () => {
      panel.destroy();
      this.nextRound();
    });
    panel.add([bg, title, how, bestText, go]);
  }

  private nextRound(): void {
    if (this.roundNo >= this.def.rounds) return this.finish();
    this.roundNo++;
    this.progress.setText(`${this.roundNo} / ${this.def.rounds}`);
    this.layer.removeAll(true);
    this.playRound(this.roundNo);
  }

  // Called by the subclass once per round.
  protected roundDone(stars: number): void {
    const got = Phaser.Math.Clamp(Math.round(stars), 0, 3);
    this.total += got;
    this.score.setText(`⭐ ${this.total}`);
    const pop = this.text(
      GAME_WIDTH / 2,
      640,
      `${'⭐'.repeat(got) || '💫'}\n${STAR_TEXT[got]}`,
      56,
    ).setDepth(200);
    pop.setStroke('#3a2a4a', 8).setScale(0.4);
    this.tweens.add({ targets: pop, scale: 1, duration: 250, ease: 'Back.out' });
    this.tweens.add({
      targets: pop,
      alpha: 0,
      delay: 900,
      duration: 300,
      onComplete: () => pop.destroy(),
    });
    // The gymnast reacts with a whole-body move (bigger for more stars), then breathes again.
    void this.view.play(REACTION[got]).then(() => {
      if (!this.finished) void this.view.play('idle');
    });
    this.time.delayedCall(1300, () => this.nextRound());
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.layer.removeAll(true);
    const max = this.def.rounds * 3;
    const earned = this.practice ? 0 : this.total * MEDALS_PER_STAR;
    const prev = this.gymnast.bests[this.def.id] ?? 0;
    const record = !this.practice && this.total > prev;
    let levelLine = `Nivå ${this.level}`;
    if (!this.practice) {
      SaveService.update((d) => {
        d.medals += earned;
        this.gymnast.bests[this.def.id] = Math.max(prev, this.total);
        levelLine = levelMessage(
          this.level,
          adjustLevel(this.gymnast, this.def.id, this.total, max),
        );
      });
    }
    void this.view.play(record ? 'happy' : 'bow');
    const panel = this.add.container(0, 0).setDepth(300);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.95).fillRoundedRect(40, 240, GAME_WIDTH - 80, 780, 40);
    panel.add([
      bg,
      this.text(GAME_WIDTH / 2, 330, record ? '🎉 Nytt rekord!' : 'Bra jobbat!', 60),
      this.text(GAME_WIDTH / 2, 470, `${this.total} av ${max} ⭐`, 72, '#ffd84d'),
      this.text(
        GAME_WIDTH / 2,
        590,
        this.practice ? 'Träning ger inga medaljer' : `+${earned} 🏅`,
        52,
      ),
      this.text(
        GAME_WIDTH / 2,
        670,
        `${levelLine}   ·   ${SaveService.get().medals} 🏅`,
        32,
        COLORS.textMuted,
      ),
      createButton(
        this,
        GAME_WIDTH / 2 - 150,
        860,
        'Igen',
        () =>
          this.scene.restart({
            gymnastId: this.gymnast.id,
            gameId: this.def.id,
            practice: this.practice,
            returnTo: this.returnTo,
          }),
        { width: 260 },
      ),
      createButton(this, GAME_WIDTH / 2 + 150, 860, 'Klar', () => this.scene.start(this.returnTo), {
        width: 260,
        color: 0x6b5a85,
      }),
    ]);
  }
}
