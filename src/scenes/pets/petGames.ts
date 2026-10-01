import Phaser from 'phaser';
import { COLORS, FONT } from '../../config';
import type { GameKind } from '../../data/petActivities';
import type { PetView } from '../../ui/PetView';
import { artImage, hasArt } from '../../ui/art';

// Toy art from the manifest (Visuals), or the placeholder shape when the id is missing.
function toy(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fallback: () => Phaser.GameObjects.Shape,
): Phaser.GameObjects.Image | Phaser.GameObjects.Shape {
  return hasArt(scene, key) ? artImage(scene, x, y, key, w, h) : fallback();
}

// Each pet game is a small interaction. It calls finish() once when done and returns a cleanup.
export interface GameContext {
  scene: Phaser.Scene;
  pet: PetView;
  home: { x: number; y: number };
  floorY: number;
  width: number;
  add: (obj: Phaser.GameObjects.GameObject) => void;
  hint: (text: string) => void;
  sparkle: (x: number, y: number, symbol: string, count?: number) => void;
  finish: () => void;
}

type Runner = (ctx: GameContext) => () => void;

const text = (scene: Phaser.Scene, x: number, y: number, s: string, size = 64) =>
  scene.add
    .text(x, y, s, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color: COLORS.text,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(45);

const hop = (ctx: GameContext, height = 70, onDone?: () => void) =>
  ctx.scene.tweens.add({
    targets: ctx.pet,
    y: ctx.home.y - height,
    duration: 220,
    yoyo: true,
    ease: 'Quad.out',
    onComplete: () => onDone?.(),
  });

const spin = (ctx: GameContext, onDone?: () => void) =>
  ctx.scene.tweens.add({
    targets: ctx.pet,
    angle: 360,
    y: ctx.home.y - 90,
    duration: 700,
    yoyo: false,
    ease: 'Sine.inOut',
    onComplete: () => {
      ctx.pet.setAngle(0);
      ctx.scene.tweens.add({
        targets: ctx.pet,
        y: ctx.home.y,
        duration: 250,
        ease: 'Bounce.out',
        onComplete: () => onDone?.(),
      });
    },
  });

// Boll: drag the ball and let go, the pet runs and jumps for it. Three throws.
const ball: Runner = (ctx) => {
  ctx.hint('Dra bollen och släpp');
  const b = toy(ctx.scene, 'toy_ball', 150, ctx.floorY - 20, 90, 90, () =>
    ctx.scene.add.circle(150, ctx.floorY - 20, 36, 0xff4f7b).setStrokeStyle(6, 0xffffff),
  ).setDepth(35);
  ctx.add(b);
  b.setInteractive({ draggable: true, useHandCursor: true });
  let throws = 0;
  b.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => b.setPosition(x, y));
  b.on('dragend', () => {
    const tx = Phaser.Math.Clamp(b.x, 120, ctx.width - 120);
    ctx.scene.tweens.add({
      targets: b,
      x: tx,
      y: ctx.floorY - 20,
      duration: 350,
      ease: 'Bounce.out',
    });
    ctx.scene.tweens.add({
      targets: ctx.pet,
      x: tx,
      duration: 450,
      ease: 'Sine.inOut',
      onComplete: () =>
        hop(ctx, 90, () => {
          ctx.sparkle(ctx.pet.x, ctx.home.y - 120, '⭐', 2);
          throws++;
          ctx.scene.tweens.add({ targets: ctx.pet, x: ctx.home.x, duration: 450, delay: 150 });
          if (throws >= 3) ctx.scene.time.delayedCall(700, ctx.finish);
        }),
    });
  });
  return () => b.destroy();
};

// Hopplek: tap the pet quickly 6 times within 4 seconds, then it does a big spin jump.
const tapfast: Runner = (ctx) => {
  ctx.hint('Tryck snabbt på djuret!');
  let taps = 0;
  let done = false;
  const counter = text(ctx.scene, ctx.width / 2, 300, '0 / 6', 56);
  ctx.add(counter);
  const onTap = () => {
    if (done) return;
    taps++;
    counter.setText(`${taps} / 6`);
    ctx.scene.tweens.add({
      targets: ctx.pet,
      scaleY: ctx.pet.scaleY * 0.9,
      duration: 60,
      yoyo: true,
    });
    if (taps >= 6) end();
  };
  const end = () => {
    if (done) return;
    done = true;
    counter.setText(taps >= 6 ? 'Hopp!' : 'Hoppsan!');
    spin(ctx, ctx.finish);
  };
  ctx.pet.on('pointerdown', onTap);
  const timer = ctx.scene.time.delayedCall(4000, end);
  return () => {
    ctx.pet.off('pointerdown', onTap);
    timer.remove();
    counter.destroy();
  };
};

// Trick: swipe the three arrows in order. The pet rolls around.
const pattern: Runner = (ctx) => {
  ctx.hint('Svep i pilarnas riktning');
  const dirs = ['↑', '→', '↓', '←'];
  const seq = [0, 1, 2].map(() => Phaser.Math.Between(0, 3));
  const arrows = seq.map((d, i) => {
    const a = text(ctx.scene, ctx.width / 2 + (i - 1) * 130, 300, dirs[d], 90).setColor('#6b4a55');
    ctx.add(a);
    return a;
  });
  let step = 0;
  let start: Phaser.Math.Vector2 | null = null;
  const down = (p: Phaser.Input.Pointer) => (start = new Phaser.Math.Vector2(p.x, p.y));
  const up = (p: Phaser.Input.Pointer) => {
    if (!start || step >= seq.length) return;
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
    const arrow = arrows[step];
    if (dir === seq[step]) {
      arrow.setColor('#2e9e4f');
      ctx.scene.tweens.add({ targets: arrow, scale: 1.3, duration: 120, yoyo: true });
      step++;
      if (step === seq.length) spin(ctx, ctx.finish);
    } else {
      ctx.scene.tweens.add({
        targets: arrow,
        x: arrow.x + 12,
        duration: 50,
        yoyo: true,
        repeat: 2,
      });
    }
  };
  ctx.scene.input.on('pointerdown', down);
  ctx.scene.input.on('pointerup', up);
  return () => {
    ctx.scene.input.off('pointerdown', down);
    ctx.scene.input.off('pointerup', up);
    arrows.forEach((a) => a.destroy());
  };
};

// Balans: hold the finger on the pet for 2.5 seconds while it balances on a plank.
const hold: Runner = (ctx) => {
  ctx.hint('Håll fingret på djuret');
  const plank = toy(ctx.scene, 'toy_plank', ctx.home.x, ctx.floorY - 24, 420, 105, () =>
    ctx.scene.add.rectangle(ctx.home.x, ctx.floorY - 10, 380, 26, 0xb07a4a),
  ).setDepth(5);
  const ring = ctx.scene.add.graphics().setDepth(45);
  ctx.add(plank);
  ctx.add(ring);
  const wobble = ctx.scene.tweens.add({
    targets: ctx.pet,
    angle: { from: -8, to: 8 },
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut',
  });
  let held = 0;
  let holding = false;
  let finished = false;
  const down = () => (holding = true);
  const up = () => (holding = false);
  ctx.pet.on('pointerdown', down);
  ctx.scene.input.on('pointerup', up);
  const tick = ctx.scene.time.addEvent({
    delay: 50,
    loop: true,
    callback: () => {
      if (finished) return;
      held = holding ? held + 50 : Math.max(0, held - 25);
      ring.clear().lineStyle(14, 0x7ed957, 1);
      ring
        .beginPath()
        .arc(ctx.width / 2, 300, 50, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * held) / 2500)
        .strokePath();
      if (held >= 2500) {
        finished = true;
        wobble.stop();
        ctx.pet.setAngle(0);
        hop(ctx, 80, ctx.finish);
      }
    },
  });
  return () => {
    ctx.pet.off('pointerdown', down);
    ctx.scene.input.off('pointerup', up);
    tick.remove();
    wobble.stop();
    ctx.pet.setAngle(0);
  };
};

// Magkli: draw circles on the pet's belly.
const rub: Runner = (ctx) => {
  ctx.hint('Rita cirklar på magen');
  let dist = 0;
  let total = 0;
  let last: Phaser.Math.Vector2 | null = null;
  const move = (p: Phaser.Input.Pointer) => {
    if (!p.isDown) return (last = null);
    const onBelly =
      Math.abs(p.x - ctx.home.x) < 130 && p.y > ctx.home.y - 20 && p.y < ctx.home.y + 180;
    if (!onBelly) return (last = null);
    if (last) {
      const d = Phaser.Math.Distance.Between(p.x, p.y, last.x, last.y);
      dist += d;
      total += d;
    }
    last = new Phaser.Math.Vector2(p.x, p.y);
    if (dist > 250) {
      dist = 0;
      ctx.sparkle(p.x, p.y - 40, '💗', 1);
      ctx.scene.tweens.add({
        targets: ctx.pet,
        angle: { from: -4, to: 4 },
        duration: 80,
        yoyo: true,
        onComplete: () => ctx.pet.setAngle(0),
      });
    }
    if (total > 1000) {
      total = -1e9;
      hop(ctx, 50, ctx.finish);
    }
  };
  ctx.scene.input.on('pointermove', move);
  return () => ctx.scene.input.off('pointermove', move);
};

// Kurragömma: the pet hides in one of three boxes. Find it.
const hide: Runner = (ctx) => {
  ctx.hint('Var gömmer sig djuret?');
  ctx.pet.setVisible(false);
  const right = Phaser.Math.Between(0, 2);
  let found = false;
  const boxes = [0, 1, 2].map((i) => {
    const x = ctx.width / 2 + (i - 1) * 200;
    const box = toy(ctx.scene, 'toy_box', x, ctx.floorY - 90, 190, 190, () =>
      ctx.scene.add.rectangle(x, ctx.floorY - 80, 160, 150, 0xc9955e).setStrokeStyle(6, 0x8a5a36),
    ).setDepth(20);
    box.setInteractive({ useHandCursor: true });
    box.on('pointerup', () => {
      if (found) return;
      if (i === right) {
        found = true;
        ctx.pet.setPosition(x, ctx.home.y).setVisible(true);
        ctx.scene.tweens.add({ targets: box, y: box.y + 200, alpha: 0, duration: 400 });
        hop(ctx, 100, () =>
          ctx.scene.tweens.add({
            targets: ctx.pet,
            x: ctx.home.x,
            duration: 400,
            onComplete: ctx.finish,
          }),
        );
      } else {
        const t = text(ctx.scene, x, ctx.floorY - 200, 'Tomt!', 40).setColor('#6b4a55');
        ctx.add(t);
        ctx.scene.tweens.add({
          targets: box,
          angle: { from: -6, to: 6 },
          duration: 70,
          yoyo: true,
          repeat: 2,
          onComplete: () => box.setAngle(0),
        });
      }
    });
    ctx.add(box);
    return box;
  });
  return () => {
    boxes.forEach((b) => b.destroy());
    ctx.pet.setVisible(true);
  };
};

// Fånga musen: a toy mouse scurries across the floor, tap it before it escapes. Four catches.
const mouse: Runner = (ctx) => {
  ctx.hint('Tryck på musen!');
  let caught = 0;
  let running: Phaser.Tweens.Tween | null = null;
  const m = toy(ctx.scene, 'toy_mouse', -80, ctx.floorY - 30, 110, 110, () =>
    ctx.scene.add.ellipse(-80, ctx.floorY - 30, 80, 50, 0x9a9a9a),
  ).setDepth(35);
  ctx.add(m);
  m.setInteractive({ useHandCursor: true });
  const run = () => {
    const fromLeft = Math.random() < 0.5;
    m.setPosition(fromLeft ? -80 : ctx.width + 80, ctx.floorY - 30 - Phaser.Math.Between(0, 60));
    if (m instanceof Phaser.GameObjects.Image) m.setFlipX(!fromLeft);
    running = ctx.scene.tweens.add({
      targets: m,
      x: fromLeft ? ctx.width + 80 : -80,
      duration: Phaser.Math.Between(1300, 1900),
      onComplete: () => ctx.scene.time.delayedCall(400, run),
    });
  };
  m.on('pointerdown', () => {
    running?.stop();
    caught++;
    ctx.sparkle(m.x, m.y - 40, '⭐', 2);
    ctx.scene.tweens.add({ targets: ctx.pet, x: m.x, duration: 250, yoyo: true });
    hop(ctx, 60);
    if (caught >= 4) ctx.scene.time.delayedCall(600, ctx.finish);
    else ctx.scene.time.delayedCall(500, run);
  });
  run();
  return () => {
    running?.stop();
    m.destroy();
  };
};

// Frisbee: tap anywhere to throw, the frisbee flies in an arc and the pet jumps to catch it.
const frisbee: Runner = (ctx) => {
  ctx.hint('Tryck för att kasta');
  let throws = 0;
  let flying = false;
  const startX = 120;
  const f = toy(ctx.scene, 'toy_frisbee', startX, ctx.floorY - 200, 120, 120, () =>
    ctx.scene.add.ellipse(startX, ctx.floorY - 200, 100, 40, 0xff9f40),
  ).setDepth(35);
  ctx.add(f);
  const zone = ctx.scene.add.zone(ctx.width / 2, ctx.floorY - 300, ctx.width, 700).setInteractive();
  ctx.add(zone);
  zone.on('pointerdown', () => {
    if (flying) return;
    flying = true;
    const tx = Phaser.Math.Between(ctx.width / 2, ctx.width - 120);
    ctx.scene.tweens.add({ targets: f, angle: 720, duration: 900 });
    ctx.scene.tweens.add({ targets: f, x: tx, duration: 900, ease: 'Sine.out' });
    ctx.scene.tweens.add({
      targets: f,
      y: ctx.floorY - 420,
      duration: 450,
      yoyo: true,
      ease: 'Sine.out',
    });
    ctx.scene.tweens.add({
      targets: ctx.pet,
      x: tx,
      duration: 700,
      delay: 100,
      onComplete: () =>
        hop(ctx, 140, () => {
          ctx.sparkle(tx, ctx.home.y - 160, '⭐', 2);
          throws++;
          ctx.scene.tweens.add({ targets: ctx.pet, x: ctx.home.x, duration: 450, delay: 150 });
          ctx.scene.tweens.add({
            targets: f,
            x: startX,
            y: ctx.floorY - 200,
            angle: 0,
            duration: 500,
            delay: 300,
            onComplete: () => {
              flying = false;
              if (throws >= 3) ctx.finish();
            },
          });
        }),
    });
  });
  return () => {
    f.destroy();
    zone.destroy();
  };
};

// Bubblor: soap bubbles float up past the pet; tap them to pop and the pet jumps for joy.
// Six pops; bubbles that float away come back as new ones.
const bubbles: Runner = (ctx) => {
  ctx.hint('Tryck på bubblorna!');
  const goal = 6;
  let popped = 0;
  let done = false;
  const live = new Set<Phaser.GameObjects.Container>();
  const blow = () => {
    if (done) return;
    const x = Phaser.Math.Between(110, ctx.width - 110);
    const r = Phaser.Math.Between(38, 56);
    const b = ctx.scene.add.container(x, ctx.floorY - 30).setDepth(44);
    b.add(ctx.scene.add.circle(0, 0, r, 0x9fd8ff, 0.45).setStrokeStyle(4, 0xffffff, 0.9));
    b.add(ctx.scene.add.circle(-r * 0.35, -r * 0.35, r * 0.22, 0xffffff, 0.8));
    b.setSize(r * 2 + 30, r * 2 + 30).setInteractive({ useHandCursor: true });
    live.add(b);
    ctx.add(b);
    const rise = ctx.scene.tweens.add({
      targets: b,
      y: 300,
      x: x + Phaser.Math.Between(-90, 90),
      duration: Phaser.Math.Between(3200, 4200),
      ease: 'Sine.inOut',
      onComplete: () => {
        live.delete(b);
        b.destroy();
        blow();
      },
    });
    b.on('pointerdown', () => {
      if (done) return;
      rise.stop();
      live.delete(b);
      b.disableInteractive();
      ctx.sparkle(b.x, b.y, '💦', 2);
      ctx.scene.tweens.add({
        targets: b,
        scale: 1.5,
        alpha: 0,
        duration: 160,
        onComplete: () => b.destroy(),
      });
      popped++;
      ctx.hint(`${popped} / ${goal}`);
      if (popped >= goal) {
        done = true;
        ctx.scene.tweens.killTweensOf(ctx.pet);
        ctx.pet.setPosition(ctx.home.x, ctx.home.y);
        spin(ctx, ctx.finish);
      } else {
        // A hop that starts mid-air would yoyo back to mid-air, so wait for the last one.
        if (!ctx.scene.tweens.isTweening(ctx.pet)) hop(ctx, 50);
        ctx.scene.time.delayedCall(300, blow);
      }
    });
  };
  [0, 600, 1200].forEach((t) => ctx.scene.time.delayedCall(t, blow));
  return () => {
    done = true;
    ctx.scene.tweens.killTweensOf([...live]);
    live.forEach((b) => b.destroy());
    live.clear();
  };
};

export const PET_GAME_RUNNERS: Record<GameKind, Runner> = {
  ball,
  tapfast,
  pattern,
  hold,
  rub,
  hide,
  mouse,
  frisbee,
  bubbles,
};
