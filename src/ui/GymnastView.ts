import Phaser from 'phaser';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { DEFAULT_OCCASION, outfitFor } from '../data/occasions';
import { moveById } from '../data/moves';
import { BASE_BODY_ID, drawOrder } from '../data/wardrobe';
import type { Gymnast } from '../services/SaveService';

// The master canvas is 1024x1536; every layer is drawn at the same position and scale.
export const MASTER_W = 1024;
export const MASTER_H = 1536;

// Feet of the master (image pixels, measured bbox bottom) and the canvas centre.
const FEET_Y = 1436;
const CENTRE_Y = MASTER_H / 2;
const BODY_MID_Y = (124 + 1436) / 2;

// Draws a gymnast (master + worn items in layer order) centred at (x, y), in the look of an
// occasion (see data/occasions.ts). play(move) animates the whole gymnast (data/moves.ts):
//   feet    squash, stretch and lift, pivoting at the feet
//   spinner rotation around the middle of the body
export class GymnastView extends Phaser.GameObjects.Container {
  private readonly feet: Phaser.GameObjects.Container;
  private readonly spinner: Phaser.GameObjects.Container;
  private tweenChain?: Phaser.Tweens.TweenChain;
  private readonly scale0: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly viewHeight: number,
    gymnast: Gymnast,
    occasion = DEFAULT_OCCASION,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.scale0 = viewHeight / MASTER_H;
    const feetY = (FEET_Y - CENTRE_Y) * this.scale0;
    const midY = (BODY_MID_Y - CENTRE_Y) * this.scale0;
    this.feet = scene.add.container(0, feetY);
    this.spinner = scene.add.container(0, midY - feetY);
    this.feet.add(this.spinner);
    this.add(this.feet);
    this.refresh(gymnast, occasion);
  }

  // Plays a move from data/moves.ts. Resolves when it ends (never for looping moves).
  play(moveId: string): Promise<void> {
    const move = moveById(moveId);
    this.stopMove();
    if (!move) return Promise.resolve();
    const h = this.viewHeight;
    const feetY = this.feet.y;
    return new Promise((resolve) => {
      // The spin is tweened on a plain object and copied to the container each frame: Phaser
      // wraps `angle` to -180..180, so a flip from -180 to -360 would take the wrong way round.
      const spin = { y: 0, scaleX: 1, scaleY: 1, angle: this.spinner.angle };
      const tweens = move.steps.map((s) => ({
        targets: [this.feet, spin],
        onUpdate: () => this.spinner.setAngle(spin.angle),
        duration: s.duration,
        ease: s.ease ?? 'Sine.easeInOut',
        props: {
          ...(s.y !== undefined && {
            y: {
              getEnd: (t: unknown) => (t === this.feet ? feetY - s.y! * h : 0),
            },
          }),
          ...(s.scaleX !== undefined && {
            scaleX: { getEnd: (t: unknown) => (t === this.feet ? s.scaleX! : 1) },
          }),
          ...(s.scaleY !== undefined && {
            scaleY: { getEnd: (t: unknown) => (t === this.feet ? s.scaleY! : 1) },
          }),
          ...(s.angle !== undefined && {
            angle: { getEnd: (t: unknown) => (t === spin ? s.angle! : 0) },
          }),
        },
      }));
      this.tweenChain = this.scene.tweens.chain({
        tweens,
        loop: move.loop ? -1 : 0,
        onComplete: () => resolve(),
      });
      // Moves play at real speed even when a scene slows its other tweens (easy levels).
      this.tweenChain.setTimeScale(1 / (this.scene.tweens.timeScale || 1));
    });
  }

  // Stops the current move and returns to the rest pose.
  stopMove(): void {
    this.tweenChain?.stop();
    this.tweenChain = undefined;
    const feetY = (FEET_Y - CENTRE_Y) * this.scale0;
    this.feet.setPosition(0, feetY).setScale(1);
    this.spinner.setAngle(0);
  }

  refresh(gymnast: Gymnast, occasion = DEFAULT_OCCASION): void {
    this.spinner.removeAll(true);
    const scale = this.viewHeight / MASTER_H;
    // Layers sit at the canvas centre; the spinner is at the body middle, so offset them.
    const offY = (CENTRE_Y - BODY_MID_Y) * scale;
    const manifest = this.scene.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined;
    const known = new Set((manifest?.assets ?? []).map((a) => a.id));
    const worn = Object.entries(outfitFor(gymnast, occasion))
      .filter(([, w]) => known.has(w.item) && this.scene.textures.exists(w.item))
      .sort(([a, wa], [b, wb]) => drawOrder(a, wa.item) - drawOrder(b, wb.item));
    if (this.scene.textures.exists(BASE_BODY_ID)) {
      this.spinner.add(this.scene.add.image(0, offY, BASE_BODY_ID).setScale(scale));
    }
    for (const [, w] of worn) {
      const img = this.scene.add.image(0, offY, w.item).setScale(scale);
      if (w.tint !== undefined) img.setTint(w.tint);
      if (w.amount !== undefined) img.setAlpha(Math.max(0, Math.min(1, w.amount)));
      this.spinner.add(img);
    }
  }
}
