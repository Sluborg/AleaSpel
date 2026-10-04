import Phaser from 'phaser';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { DEFAULT_OCCASION, outfitFor } from '../data/occasions';
import { moveById, moveUsesRig } from '../data/moves';
import { RIG_PARTS, type RigPart } from '../data/rig';
import { BASE_BODY_ID, drawOrder } from '../data/wardrobe';
import type { Gymnast } from '../services/SaveService';
import { buildRig, cutLayer, type Rig, type RigCut, type RigLayer } from './rig';

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
//   rig     body parts turning at their joints (data/rig.ts), built the first time a move with a
//           pose plays; until then the layers are plain images (cheaper)
export class GymnastView extends Phaser.GameObjects.Container {
  private readonly feet: Phaser.GameObjects.Container;
  private readonly spinner: Phaser.GameObjects.Container;
  private tweenChain?: Phaser.Tweens.TweenChain;
  private readonly scale0: number;
  private layers: RigLayer[] = [];
  private rig?: Rig;
  private rigReady?: Promise<void>;
  // Bumped by refresh() and by every play(), so stale rig builds and moves stop.
  private outfitGen = 0;
  private playGen = 0;

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
    const gen = ++this.playGen;
    if (!move) return Promise.resolve();
    if (moveUsesRig(move) && !this.rig) {
      // First pose: cut the layers (a few frames), then play unless another move came first.
      return this.prepareRig().then(() =>
        gen === this.playGen && this.rig ? this.play(moveId) : undefined,
      );
    }
    const h = this.viewHeight;
    const feetY = this.feet.y;
    return new Promise((resolve) => {
      // Every value is tweened on one plain object and copied to the containers each frame:
      // Phaser wraps `angle` to -180..180, so a flip from -180 to -360 would take the wrong way.
      const st: Record<string, number> = { hold: 0, y: feetY, scaleX: 1, scaleY: 1, angle: 0 };
      for (const p of RIG_PARTS) st[p.id] = 0;
      const apply = () => {
        this.feet.setPosition(0, st.y).setScale(st.scaleX, st.scaleY);
        this.spinner.setAngle(st.angle);
        if (this.rig) this.setPose(st);
      };
      const tweens = move.steps.map((s) => {
        // `hold` keeps steps that change nothing (a pause) a valid tween.
        const props: Record<string, number> = { hold: 0 };
        if (s.y !== undefined) props.y = feetY - s.y * h;
        if (s.scaleX !== undefined) props.scaleX = s.scaleX;
        if (s.scaleY !== undefined) props.scaleY = s.scaleY;
        if (s.angle !== undefined) props.angle = s.angle;
        if (s.pose && this.rig) for (const p of RIG_PARTS) props[p.id] = s.pose[p.id] ?? 0;
        return {
          targets: st,
          props,
          duration: s.duration,
          ease: s.ease ?? 'Sine.easeInOut',
          onUpdate: apply,
        };
      });
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
    if (this.rig) this.setPose({});
  }

  private setPose(angles: Partial<Record<RigPart | string, number>>): void {
    const rig = this.rig!;
    for (const p of RIG_PARTS) rig.joints[p.id].setAngle(angles[p.id] ?? 0);
    rig.headBack.setAngle(angles.head ?? 0);
  }

  // Builds the jointed rig in the background, one layer per frame, then swaps it in for the
  // plain layer images. Scenes that will play poses can call this early; play() calls it anyway.
  prepareRig(): Promise<void> {
    this.rigReady ??= this.cutRig(this.outfitGen);
    return this.rigReady;
  }

  private async cutRig(gen: number): Promise<void> {
    const scale = this.scale0;
    // Cut at about the shown size (with headroom for sharp phones), at most full size.
    const res = Math.min(1, Math.ceil(((this.viewHeight * 1.6) / MASTER_H) * 4) / 4);
    const cut: RigCut[] = [];
    for (const l of this.layers) {
      await new Promise((r) => setTimeout(r, 0));
      if (gen !== this.outfitGen || !this.scene) return;
      cut.push({ l, pieces: cutLayer(this.scene, l.key, l.layer, res) });
    }
    this.rig = buildRig(this.scene, cut, res);
    const offY = (CENTRE_Y - BODY_MID_Y) * scale;
    this.rig.root
      .setPosition((-MASTER_W / 2) * scale, offY - (MASTER_H / 2) * scale)
      .setScale(scale);
    this.spinner.each((c: Phaser.GameObjects.GameObject) =>
      (c as Phaser.GameObjects.Image).setVisible(false),
    );
    this.spinner.add(this.rig.root);
  }

  refresh(gymnast: Gymnast, occasion = DEFAULT_OCCASION): void {
    this.spinner.removeAll(true);
    this.rig = undefined;
    this.rigReady = undefined;
    this.outfitGen++;
    this.layers = [];
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
      this.layers.push({ key: BASE_BODY_ID, layer: 'body' });
    }
    for (const [layer, w] of worn) {
      const img = this.scene.add.image(0, offY, w.item).setScale(scale);
      const alpha = w.amount === undefined ? undefined : Math.max(0, Math.min(1, w.amount));
      if (w.tint !== undefined) img.setTint(w.tint);
      if (alpha !== undefined) img.setAlpha(alpha);
      this.spinner.add(img);
      this.layers.push({ key: w.item, layer, tint: w.tint, alpha });
    }
  }
}
