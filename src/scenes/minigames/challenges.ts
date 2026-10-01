import Phaser from 'phaser';
import { COLORS, FONT, GAME_WIDTH } from '../../config';
import { createButton } from '../../ui/Button';

// Small brain challenges shared by the Uppvärmning games and the apparatus games (where a round
// can be a challenge instead of a pattern). Each builds into `layer`, lasts one round and calls
// `done(stars)` once with 0-3 stars. `level` (1-5) and `step` (round number) set how hard it is.
export type ChallengeKind = 'numbers' | 'letters' | 'timing' | 'colors' | 'pairs';

export interface ChallengeCtx {
  scene: Phaser.Scene;
  layer: Phaser.GameObjects.Container;
  level: number;
  step: number; // 1-based round within the game
  top: number; // play area
  bottom: number;
  done: (stars: number) => void;
}

export const CHALLENGE_HINT: Record<ChallengeKind, string> = {
  numbers: 'Tryck siffrorna i ordning!',
  letters: 'Tryck bokstäverna i ordning!',
  timing: '', // the challenge shows its own instruction
  colors: 'Kom ihåg färgerna!',
  pairs: '', // the challenge shows its own instruction
};

export function runChallenge(kind: ChallengeKind, ctx: ChallengeCtx, colorRow?: number[]): void {
  if (kind === 'numbers' || kind === 'letters') orderChallenge(ctx, kind);
  else if (kind === 'timing') timingChallenge(ctx);
  else if (kind === 'pairs') pairsChallenge(ctx);
  else colorChallenge(ctx, colorRow);
}

function text(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: string,
  size = 40,
  color = COLORS.text,
) {
  return scene.add
    .text(x, y, s, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);
}

// --- tap in order ----------------------------------------------------------------------------

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';
const TILE = 140;
const TILE_BG = [0xffc2dc, 0xc9e7ff, 0xd8f5c9, 0xfff0b3, 0xe6d4ff, 0xffd8c2];

// Tiles with numbers or letters lie around; tap them in order. Stars: 3 without mistakes, minus
// one per mistake, minus one when slow; at least 1 when done.
function orderChallenge(ctx: ChallengeCtx, kind: 'numbers' | 'letters'): void {
  const { scene, layer } = ctx;
  const count = Math.min(12, 2 + ctx.level + ctx.step);
  const labels = orderLabels(kind, count, ctx.level, ctx.step);
  const hint = text(scene, GAME_WIDTH / 2, ctx.top + 20, `Börja på ${labels[0]}`, 36);
  layer.add(hint);
  const cols = 4;
  const rows = 5;
  const cellW = (GAME_WIDTH - 80) / cols;
  const cellH = (ctx.bottom - ctx.top - 90) / rows;
  // Tiles shrink when the play area is short, so neighbours never overlap.
  const size = Math.min(TILE, cellH - 24, cellW - 24);
  const cells = Phaser.Utils.Array.Shuffle([...Array(cols * rows).keys()]).slice(0, count);
  let next = 0;
  let mistakes = 0;
  const started = scene.time.now;
  labels.forEach((label, i) => {
    const cell = cells[i];
    const x = 40 + cellW * ((cell % cols) + 0.5) + Phaser.Math.Between(-12, 12);
    const y = ctx.top + 90 + cellH * (Math.floor(cell / cols) + 0.5) + Phaser.Math.Between(-10, 10);
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(TILE_BG[i % TILE_BG.length], 1).fillRoundedRect(
      -size / 2,
      -size / 2,
      size,
      size,
      30,
    );
    g.lineStyle(5, 0xffffff, 1).strokeRoundedRect(-size / 2, -size / 2, size, size, 30);
    c.add([g, text(scene, 0, 0, label, Math.round(size * 0.5), '#3a2a4a')]);
    c.setSize(size, size).setInteractive({ useHandCursor: true });
    c.setScale(0).setAngle(Phaser.Math.Between(-8, 8));
    scene.tweens.add({ targets: c, scale: 1, duration: 220, delay: i * 50, ease: 'Back.out' });
    c.on('pointerdown', () => {
      if (i === next) {
        next++;
        c.disableInteractive();
        scene.tweens.add({ targets: c, scale: 1.25, alpha: 0, duration: 250 });
        if (next < labels.length) hint.setText(`Nästa: ${labels[next]}`);
        else {
          hint.setText('Klart!');
          const slow = (scene.time.now - started) / 1000 > count * (2.2 - ctx.level * 0.2);
          ctx.done(Math.max(1, 3 - mistakes - (slow ? 1 : 0)));
        }
      } else if (next < labels.length) {
        mistakes++;
        scene.tweens.add({
          targets: c,
          angle: { from: -12, to: 12 },
          duration: 60,
          yoyo: true,
          repeat: 2,
        });
        hint.setText(`Nästa: ${labels[next]}`);
      }
    });
    layer.add(c);
  });
}

function orderLabels(kind: 'numbers' | 'letters', count: number, level: number, step: number) {
  const easy = level <= 2 && step <= 2;
  if (kind === 'letters') {
    const start = easy ? 0 : Phaser.Math.Between(0, LETTERS.length - count);
    return LETTERS.slice(start, start + count).split('');
  }
  const start = easy ? 1 : Phaser.Math.Between(1, 5 + level * 4);
  return Array.from({ length: count }, (_, i) => String(start + i));
}

// --- stop the marker on the line -------------------------------------------------------------

const SWEEP_MS = [1900, 1600, 1350, 1150, 1000, 880, 780]; // one sweep across the bar
const ZONE = [0.11, 0.1, 0.085, 0.072, 0.062, 0.054, 0.048]; // half-width of the target zone

// A marker slides back and forth along a bar; stop it on the line. Stars by how close: inside a
// third of the zone 3, inside the zone 2, just outside 1.
function timingChallenge(ctx: ChallengeCtx): void {
  const { scene, layer } = ctx;
  const barX = 70;
  const barW = GAME_WIDTH - 140;
  const barY = ctx.top + 310;
  const i = Math.min(ctx.level - 1 + ctx.step - 1, SWEEP_MS.length - 1);
  const zone = ZONE[i] * barW;
  const target = barX + barW * (0.2 + Math.random() * 0.6);
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.9).fillRoundedRect(barX - 10, barY - 50, barW + 20, 100, 30);
  g.fillStyle(0xbfe8b0, 1).fillRect(target - zone, barY - 40, zone * 2, 80);
  g.fillStyle(0x5fbf5a, 1).fillRect(target - zone / 3, barY - 40, (zone * 2) / 3, 80);
  g.fillStyle(0x2f6b2c, 1).fillRect(target - 3, barY - 55, 6, 110);
  const marker = scene.add.triangle(barX, barY - 80, 0, 0, 44, 0, 22, 40, COLORS.primary);
  marker.setStrokeStyle(4, 0xffffff);
  const needle = scene.add.rectangle(barX, barY, 8, 90, COLORS.primaryDark);
  layer.add([
    g,
    text(scene, GAME_WIDTH / 2, ctx.top + 150, 'Stoppa på strecket!', 40),
    marker,
    needle,
  ]);
  const sweep = scene.tweens.add({
    targets: [marker, needle],
    x: barX + barW,
    duration: SWEEP_MS[i],
    yoyo: true,
    repeat: -1,
    ease: 'Linear',
  });
  let stopped = false;
  const stop = createButton(
    scene,
    GAME_WIDTH / 2,
    barY + 240,
    'STOPP!',
    () => {
      if (stopped) return;
      stopped = true;
      sweep.stop();
      stop.disableInteractive();
      const d = Math.abs(needle.x - target);
      ctx.done(d <= zone / 3 ? 3 : d <= zone ? 2 : d <= zone * 2 ? 1 : 0);
    },
    { width: 420, height: 170, fontSize: 64 },
  );
  layer.add(stop);
}

// --- colour memory ---------------------------------------------------------------------------

export const PADS = [
  { name: 'Röd', color: 0xff5a6e },
  { name: 'Blå', color: 0x4f9bff },
  { name: 'Grön', color: 0x5fd36b },
  { name: 'Gul', color: 0xffd84d },
];
const PAD = 230;
const DIM = 0.45;

export function randomPad(): number {
  return Phaser.Math.Between(0, PADS.length - 1);
}

// Colours blink in a row; tap the same colours in the same order. Pass `row` to keep a growing
// row across rounds (Färgminne); otherwise a fresh row as long as the level asks for.
function colorChallenge(ctx: ChallengeCtx, row?: number[]): void {
  const { scene, layer } = ctx;
  const seq = row ?? Array.from({ length: ctx.level + 1 }, randomPad);
  const centerY = ctx.top + 390;
  const info = text(scene, GAME_WIDTH / 2, ctx.top + 60, 'Titta!', 44);
  layer.add(info);
  let accepting = false;
  let pos = 0;
  const pads = PADS.map((p, i) => {
    const x = GAME_WIDTH / 2 + (i % 2 === 0 ? -1 : 1) * (PAD / 2 + 12);
    const y = centerY + (i < 2 ? -1 : 1) * (PAD / 2 + 12);
    const pad = scene.add
      .rectangle(x, y, PAD, PAD, p.color)
      .setStrokeStyle(8, 0xffffff)
      .setAlpha(DIM);
    pad.setInteractive({ useHandCursor: true });
    pad.on('pointerdown', () => {
      if (!accepting) return;
      flash(scene, pad);
      if (i === seq[pos]) {
        pos++;
        info.setText(`${pos} / ${seq.length}`);
        if (pos === seq.length) {
          accepting = false;
          // Let the last colour light up before the stars come.
          scene.time.delayedCall(550, () => {
            info.setText('Rätt!');
            ctx.done(3);
          });
        }
      } else {
        accepting = false;
        info.setText(`Det var ${PADS[seq[pos]].name.toLowerCase()}!`);
        flash(scene, pads[seq[pos]], 3);
        scene.time.delayedCall(900, () => ctx.done(Math.floor((3 * pos) / seq.length)));
      }
    });
    layer.add(pad);
    return pad;
  });
  const step = Math.max(380, 760 - ctx.level * 60 - ctx.step * 20);
  seq.forEach((p, k) => scene.time.delayedCall(800 + k * step, () => flash(scene, pads[p])));
  scene.time.delayedCall(800 + seq.length * step, () => {
    info.setText('Din tur!');
    accepting = true;
  });
}

function flash(scene: Phaser.Scene, pad: Phaser.GameObjects.Rectangle, times = 1): void {
  scene.tweens.add({
    targets: pad,
    alpha: 1,
    scale: 1.08,
    duration: 180,
    yoyo: true,
    repeat: times - 1,
    onComplete: () => pad.setAlpha(DIM).setScale(1),
  });
}

// --- find the pairs --------------------------------------------------------------------------

const PAIR_ICONS = ['🤸', '🏅', '🏆', '⭐', '🎀', '🦄', '🐰', '🌸', '💖', '🌈', '🐱', '🍓'];
const CARD_W = 140;
const CARD_H = 160;
const FLIP_MS = 90; // half a card flip

// Memory: cards lie face down; turn two at a time to find matching pairs. On low levels all
// cards are shown for a moment first. Stars: 3 with few wrong turns, then 2, then 1.
function pairsChallenge(ctx: ChallengeCtx): void {
  const { scene, layer } = ctx;
  const pairs = Math.min(8, 2 + ctx.level + Math.floor(ctx.step / 2));
  const icons = Phaser.Utils.Array.Shuffle([...PAIR_ICONS]).slice(0, pairs);
  const deck = Phaser.Utils.Array.Shuffle([...icons, ...icons]);
  const cols = deck.length > 12 ? 4 : deck.length > 6 ? 4 : 3;
  const rows = Math.ceil(deck.length / cols);
  const info = text(scene, GAME_WIDTH / 2, ctx.top + 20, 'Hitta paren!', 36);
  layer.add(info);
  const gapX = (GAME_WIDTH - 60 - cols * CARD_W) / (cols - 1 || 1);
  const areaH = ctx.bottom - ctx.top - 80;
  const gapY = Math.min(24, (areaH - rows * CARD_H) / Math.max(1, rows - 1));
  const startY = ctx.top + 80 + (areaH - (rows * CARD_H + (rows - 1) * gapY)) / 2 + CARD_H / 2;
  let open: { icon: string; card: Phaser.GameObjects.Container }[] = [];
  let found = 0;
  let wrong = 0;
  let busy = true;
  const cards = deck.map((icon, i) => {
    const x = 30 + CARD_W / 2 + (i % cols) * (CARD_W + gapX);
    const y = startY + Math.floor(i / cols) * (CARD_H + gapY);
    const c = scene.add.container(x, y);
    const back = scene.add.graphics();
    back.fillStyle(0xb06bff, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 22);
    back.lineStyle(5, 0xffffff, 1).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 22);
    back.fillStyle(0xffffff, 0.35).fillCircle(0, 0, 26);
    const face = scene.add.container(0, 0);
    const fg = scene.add.graphics();
    fg.fillStyle(0xfff6e6, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 22);
    fg.lineStyle(5, 0xffc2dc, 1).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 22);
    face.add([fg, scene.add.text(0, 0, icon, { fontSize: '76px' }).setOrigin(0.5)]);
    c.add([back, face]);
    c.setData('face', face).setData('back', back);
    c.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      if (busy || open.some((o) => o.card === c) || !c.input?.enabled) return;
      turn(c, true);
      open.push({ icon, card: c });
      if (open.length < 2) return;
      const [a, b] = open;
      open = [];
      if (a.icon === b.icon) {
        found++;
        [a.card, b.card].forEach((k) => {
          k.disableInteractive();
          // After the flip, so the pop starts from a full-width card.
          scene.tweens.add({
            targets: k,
            scale: 1.12,
            duration: 140,
            yoyo: true,
            delay: FLIP_MS * 2 + 20,
          });
        });
        info.setText(found < pairs ? `${found} / ${pairs}` : 'Alla par!');
        if (found === pairs) {
          busy = true;
          const stars = wrong <= pairs / 2 ? 3 : wrong <= pairs ? 2 : 1;
          scene.time.delayedCall(500, () => ctx.done(stars));
        }
      } else {
        wrong++;
        busy = true;
        scene.time.delayedCall(700, () => {
          turn(a.card, false);
          turn(b.card, false);
          scene.time.delayedCall(FLIP_MS * 2 + 20, () => (busy = false));
        });
      }
    });
    c.setScale(0);
    scene.tweens.add({ targets: c, scale: 1, duration: 220, delay: i * 40, ease: 'Back.out' });
    layer.add(c);
    return c;
  });
  const peek = ctx.level <= 2 ? 1600 : 0;
  cards.forEach((c) => turn(c, peek > 0, true));
  scene.time.delayedCall(400 + deck.length * 40 + peek, () => {
    if (peek) cards.forEach((c) => turn(c, false));
    scene.time.delayedCall(peek ? FLIP_MS * 2 + 20 : 0, () => (busy = false));
  });

  function turn(card: Phaser.GameObjects.Container, up: boolean, instant = false): void {
    const face = card.getData('face') as Phaser.GameObjects.Container;
    const back = card.getData('back') as Phaser.GameObjects.Graphics;
    if (instant) {
      face.setVisible(up);
      back.setVisible(!up);
      return;
    }
    // A new flip replaces any running one, so a card never ends half-turned.
    scene.tweens.killTweensOf(card);
    card.setScale(1);
    scene.tweens.add({
      targets: card,
      scaleX: 0,
      duration: FLIP_MS,
      yoyo: true,
      onYoyo: () => {
        face.setVisible(up);
        back.setVisible(!up);
      },
    });
  }
}
