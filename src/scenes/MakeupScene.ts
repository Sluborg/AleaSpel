import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { DEFAULT_OCCASION, lookTarget, outfitFor } from '../data/occasions';
import { BASE_BODY_ID, DEFAULT_TINT, drawOrder, FACE_REGION } from '../data/wardrobe';
import { SaveService, type Gymnast, type WornItem } from '../services/SaveService';
import { artCropped, visibleBox } from '../ui/art';
import { createButton } from '../ui/Button';
import { BaseScene } from './BaseScene';

// Sminkbordet: make-up by rubbing. The face fills the screen; she picks a kind of make-up and a
// colour and rubs the right spot with her finger. Every stroke makes it one step stronger (amount
// 0-1 on the worn item, five steps), Ångra takes back the last stroke, Klar saves into the look.
// The spot to rub is where the make-up art is drawn (its visible box), so new make-up art needs
// no new code. Opened from Mitt lag with { gymnastId, occasion }.
interface Tool {
  layer: string;
  name: string;
  hint: string;
}
const TOOLS: Tool[] = [
  { layer: 'blush', name: 'Rouge', hint: 'Gnid på kinderna!' },
  { layer: 'eyeshadow', name: 'Ögon', hint: 'Gnid på ögonlocken!' },
  { layer: 'lips', name: 'Läppar', hint: 'Gnid på läpparna!' },
  { layer: 'facepaint', name: 'Ansikte', hint: 'Gnid på kinden!' },
];
const COLOURS = [0xff6fae, 0xff4f7b, 0xff8a3d, 0xffd84d, 0x7ed957, 0x5aa9ff, 0x8f7bff, 0xc77dff];
const MASTER_W = 1024;
const MASTER_H = 1536;
const SCALE = 2.6; // master px -> design px
const FACE_X = GAME_WIDTH / 2;
const FACE_Y = 540;
const RUB_STEP = 160; // px of rubbing for one step
const STEP = 0.2; // strength added per step
const PANEL_TOP = 840;
const VARIANT_W = 120;

interface Layer {
  item: string;
  tint?: number;
  amount: number;
}

export class MakeupScene extends BaseScene {
  private gymnast!: Gymnast;
  private occasion = DEFAULT_OCCASION;
  private layers = new Map<string, Layer>();
  private images = new Map<string, Phaser.GameObjects.Image>();
  private tools: Tool[] = [];
  private tool?: Tool;
  private undo: { layer: string; before: Layer | undefined }[] = [];
  private rubbed = 0;
  private stroke?: { layer: string; before: Layer | undefined; changed: boolean };
  private hint?: Phaser.GameObjects.Text;
  private zoneMark?: Phaser.GameObjects.Graphics;
  private hintBg?: Phaser.GameObjects.Graphics;
  private ui?: Phaser.GameObjects.Container;

  constructor() {
    super('Makeup');
  }

  create(data: { gymnastId?: string; occasion?: string }): void {
    this.cameras.main.setBackgroundColor(0xf6e1ea);
    this.gymnast =
      SaveService.get().gymnasts.find((g) => g.id === data.gymnastId) ??
      SaveService.activeGymnast();
    this.occasion = data.occasion ?? DEFAULT_OCCASION;
    this.layers.clear();
    this.images.clear();
    this.undo = [];
    const manifest = this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined;
    const outfit = outfitFor(this.gymnast, this.occasion);
    // One tool per kind of make-up that has art; worn make-up keeps its item, else the first one.
    this.tools = TOOLS.filter((t) =>
      (manifest?.assets ?? []).some((a) => a.category === t.layer && this.textures.exists(a.id)),
    );
    for (const t of this.tools) {
      const worn = outfit[t.layer];
      const item = worn?.item ?? (manifest?.assets ?? []).find((a) => a.category === t.layer)!.id;
      // Make-up art is white and coloured by its tint, so a new layer starts pink.
      this.layers.set(t.layer, {
        item,
        tint: worn ? worn.tint : DEFAULT_TINT,
        amount: worn ? (worn.amount ?? 1) : 0,
      });
    }
    this.drawFace(outfit);
    // Sminkbordet opens from Ansikte (the face mode of Garderob) and goes back there.
    this.addBackButton('Wardrobe', this.faceMode());
    this.hint = this.add
      .text(GAME_WIDTH / 2, 175, '', {
        fontFamily: FONT,
        fontSize: '38px',
        color: '#6b3a55',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.hintBg = this.add.graphics().setDepth(20);
    this.zoneMark = this.add.graphics().setDepth(15);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.startStroke(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.rub(p));
    this.input.on('pointerup', () => this.endStroke());
    this.pick(this.tools[0]);
  }

  // The face, big: the body and the worn layers, scaled around the face region.
  private drawFace(outfit: Record<string, WornItem>): void {
    const cx = FACE_REGION.x + FACE_REGION.w / 2;
    const cy = FACE_REGION.y + FACE_REGION.h / 2;
    const at = (key: string) =>
      this.add
        .image(FACE_X + (MASTER_W / 2 - cx) * SCALE, FACE_Y + (MASTER_H / 2 - cy) * SCALE, key)
        .setScale(SCALE);
    if (this.textures.exists(BASE_BODY_ID)) at(BASE_BODY_ID);
    const worn = Object.entries(outfit).filter(
      ([l, w]) => !this.layers.has(l) && this.textures.exists(w.item),
    );
    const all: [string, WornItem | Layer][] = [...worn, ...this.layers.entries()];
    all.sort(([a, wa], [b, wb]) => drawOrder(a, wa.item) - drawOrder(b, wb.item));
    for (const [layer, w] of all) {
      const img = at(w.item);
      if (w.tint !== undefined) img.setTint(w.tint);
      if (this.layers.has(layer)) {
        img.setAlpha((w as Layer).amount);
        this.images.set(layer, img);
      }
    }
  }

  // The rectangle (design px) where a make-up item is drawn: where she should rub.
  private zone(layer: string): Phaser.Geom.Rectangle {
    const img = this.images.get(layer)!;
    const b = visibleBox(this, this.layers.get(layer)!.item);
    const left = img.x - img.displayWidth / 2;
    const top = img.y - img.displayHeight / 2;
    const r = new Phaser.Geom.Rectangle(
      left + b.left * img.displayWidth,
      top + b.top * img.displayHeight,
      (b.right - b.left) * img.displayWidth,
      (b.bottom - b.top) * img.displayHeight,
    );
    return Phaser.Geom.Rectangle.Inflate(r, 20, 20);
  }

  private pick(tool: Tool | undefined): void {
    this.tool = tool;
    this.hint?.setText(tool ? tool.hint : 'Inget smink än');
    const hw = (this.hint?.width ?? 0) + 50;
    this.hintBg
      ?.clear()
      .fillStyle(0xffffff, 0.9)
      .fillRoundedRect(GAME_WIDTH / 2 - hw / 2, 175 - 34, hw, 68, 34);
    this.drawUi();
    if (!tool) return;
    // Show where to rub: a soft blinking outline over the spot.
    const z = this.zone(tool.layer);
    this.zoneMark!.clear()
      .lineStyle(6, 0xffffff, 0.9)
      .strokeRoundedRect(z.x, z.y, z.width, z.height, 30);
    this.tweens.killTweensOf(this.zoneMark!);
    this.zoneMark!.setAlpha(1);
    this.tweens.add({ targets: this.zoneMark, alpha: 0, duration: 500, yoyo: true, repeat: 2 });
  }

  private drawUi(): void {
    this.ui?.destroy();
    const ui = this.add.container(0, 0).setDepth(30);
    this.ui = ui;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.96).fillRoundedRect(
      0,
      PANEL_TOP,
      GAME_WIDTH,
      GAME_HEIGHT - PANEL_TOP + 40,
      40,
    );
    // Taps on the panel are not rubbing.
    const shield = this.add
      .zone(GAME_WIDTH / 2, (PANEL_TOP + GAME_HEIGHT) / 2, GAME_WIDTH, GAME_HEIGHT - PANEL_TOP)
      .setInteractive();
    ui.add([shield, bg]);
    const w = (GAME_WIDTH - 40) / Math.max(1, this.tools.length);
    this.tools.forEach((t, i) =>
      ui.add(
        createButton(this, 20 + w * (i + 0.5), PANEL_TOP + 62, t.name, () => this.pick(t), {
          width: w - 10,
          height: 110,
          fontSize: 28,
          color: t === this.tool ? COLORS.primary : 0x6b5a85,
        }),
      ),
    );
    const cur = this.tool && this.layers.get(this.tool.layer);
    // Variants of the chosen kind of make-up (all manifest items in that layer): tap to switch.
    if (this.tool && cur) {
      const variants = this.variants(this.tool.layer);
      variants.forEach((id, i) => {
        const x = GAME_WIDTH / 2 + (i - (variants.length - 1) / 2) * (VARIANT_W + 12);
        const y = PANEL_TOP + 165;
        const tile = this.add.graphics();
        tile
          .fillStyle(0xf6e1ea, 1)
          .fillRoundedRect(x - VARIANT_W / 2, y - 45, VARIANT_W, 90, 20)
          .lineStyle(5, id === cur.item ? COLORS.primary : 0xf6e1ea, 1)
          .strokeRoundedRect(x - VARIANT_W / 2, y - 45, VARIANT_W, 90, 20);
        const pic = artCropped(this, x, y, id, VARIANT_W - 24, 66);
        pic.setTint(cur.tint ?? DEFAULT_TINT);
        const hit = this.add.zone(x, y, VARIANT_W, 90).setInteractive({ useHandCursor: true });
        hit.on('pointerup', () => this.setVariant(id));
        ui.add([tile, pic, hit]);
      });
    }
    COLOURS.forEach((c, i) => {
      const x = 60 + i * 86;
      const dot = this.add.circle(x, PANEL_TOP + 268, 34, c);
      if (cur?.tint === c) dot.setStrokeStyle(6, 0xffffff);
      dot.setInteractive({ useHandCursor: true }).on('pointerup', () => this.setColour(c));
      ui.add(dot);
    });
    ui.add(
      createButton(this, 130, PANEL_TOP + 365, 'Ångra', () => this.doUndo(), {
        width: 220,
        fontSize: 34,
        color: 0x6b5a85,
      }),
    );
    ui.add(
      createButton(this, 360, PANEL_TOP + 365, 'Sudda', () => this.clearTool(), {
        width: 200,
        fontSize: 34,
        color: 0x6b5a85,
      }),
    );
    ui.add(
      createButton(this, 590, PANEL_TOP + 365, 'Klar', () => this.save(), {
        width: 220,
        fontSize: 38,
      }),
    );
  }

  private variants(layer: string): string[] {
    const manifest = this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined;
    return (manifest?.assets ?? [])
      .filter((a) => a.category === layer && this.textures.exists(a.id))
      .map((a) => a.id)
      .slice(0, 5);
  }

  private setVariant(id: string): void {
    if (!this.tool) return;
    const layer = this.tool.layer;
    const cur = this.layers.get(layer)!;
    if (cur.item === id) return;
    this.undo.push({ layer, before: { ...cur } });
    this.images.get(layer)!.setTexture(id);
    // A new shape shows at once, even before any rubbing.
    this.apply(layer, { ...cur, item: id, amount: cur.amount || STEP * 2 });
    this.pick(this.tool);
  }

  private setColour(c: number): void {
    if (!this.tool) return;
    const layer = this.tool.layer;
    this.undo.push({ layer, before: { ...this.layers.get(layer)! } });
    this.layers.get(layer)!.tint = c;
    this.images.get(layer)!.setTint(c);
    this.drawUi();
  }

  private clearTool(): void {
    if (!this.tool) return;
    const layer = this.tool.layer;
    const cur = this.layers.get(layer)!;
    if (!cur.amount) return;
    this.undo.push({ layer, before: { ...cur } });
    this.apply(layer, { ...cur, amount: 0 });
  }

  private startStroke(p: Phaser.Input.Pointer): void {
    if (!this.tool || p.y >= PANEL_TOP) return;
    const layer = this.tool.layer;
    this.stroke = { layer, before: { ...this.layers.get(layer)! }, changed: false };
    this.rubbed = 0;
  }

  private rub(p: Phaser.Input.Pointer): void {
    const s = this.stroke;
    if (!s || !p.isDown || s.changed) return; // one step per stroke
    if (!this.zone(s.layer).contains(p.x, p.y)) return;
    this.rubbed += Phaser.Math.Distance.Between(p.prevPosition.x, p.prevPosition.y, p.x, p.y);
    if (this.rubbed < RUB_STEP) return;
    this.rubbed = 0;
    const cur = this.layers.get(s.layer)!;
    if (cur.amount >= 1) return;
    this.apply(s.layer, { ...cur, amount: Math.min(1, Math.round((cur.amount + STEP) * 10) / 10) });
    s.changed = true;
    this.sparkle(p.x, p.y);
  }

  private endStroke(): void {
    const s = this.stroke;
    this.stroke = undefined;
    if (s?.changed) this.undo.push({ layer: s.layer, before: s.before });
  }

  private doUndo(): void {
    const last = this.undo.pop();
    if (last?.before) this.apply(last.layer, last.before);
  }

  private apply(layer: string, value: Layer): void {
    this.layers.set(layer, value);
    const img = this.images.get(layer)!;
    if (img.texture.key !== value.item) img.setTexture(value.item);
    img.setAlpha(value.amount);
    if (value.tint !== undefined) img.setTint(value.tint);
    else img.clearTint();
    this.drawUi();
  }

  private sparkle(x: number, y: number): void {
    const t = this.add.text(x, y, '✨', { fontSize: '40px' }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      duration: 600,
      onComplete: () => t.destroy(),
    });
  }

  private save(): void {
    SaveService.update(() => {
      for (const [layer, v] of this.layers) {
        const target = lookTarget(this.gymnast, this.occasion, layer);
        if (v.amount <= 0) delete target[layer];
        else
          target[layer] = { item: v.item, tint: v.tint, ...(v.amount < 1 && { amount: v.amount }) };
      }
    });
    this.scene.start('Wardrobe', this.faceMode());
  }

  private faceMode() {
    return { gymnastId: this.gymnast.id, occasion: this.occasion, mode: 'face' };
  }
}
