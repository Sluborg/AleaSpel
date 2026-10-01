import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { FURNITURE, type FurnitureDef } from '../data/furniture';
import { SaveService, type Position } from '../services/SaveService';
import { artImage } from '../ui/art';
import { buttonBackground, createButton } from '../ui/Button';
import { ScrollList } from '../ui/ScrollList';
import { BaseScene } from './BaseScene';
import { furnitureArtKey, furnitureFoot, furnitureShape, furnitureSize } from '../ui/furnitureView';

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// One draggable thing in a room. `build` returns the children of its container (centred at 0,0).
export interface Placeable {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  build: () => Phaser.GameObjects.GameObject[];
  onTap?: () => void;
  flat?: boolean; // rugs, mats, wall items: always behind standing things
  z?: number; // manual layer (set with the layer buttons)
  foot?: number; // distance from the centre down to where it stands; default height / 2
  def?: string; // furniture id, for pieces of furniture
}

export type FurnitureRoom = 'house' | 'clubhouse' | 'garden';

// Rooms are wider than the screen: drag the floor to look around, like Toca Boca.
export const ROOM_WORLD_W = GAME_WIDTH * 2;

const TAP_DISTANCE = 14; // a drag shorter than this counts as a tap
const EDGE = 80; // dragging an item this close to the screen edge scrolls the room
const EDGE_SPEED = 14;
const STANDING = 10000; // depth offset of standing things over flat ones
const BAR_Y = GAME_HEIGHT - 95;

const LAYER_BUTTONS = [
  { icon: '⏫', label: 'Närmast', dir: 'front' },
  { icon: '🔼', label: 'Närmare', dir: 'forward' },
  { icon: '🔽', label: 'Längre bort', dir: 'backward' },
  { icon: '⏬', label: 'Längst bort', dir: 'back' },
] as const;
type LayerDir = (typeof LAYER_BUTTONS)[number]['dir'];

// Base for rooms with drag-and-drop (Mina hus, Mitt gym, Klubbstugan): places items, keeps them
// inside the room, sorts depth by where things stand, saves positions on drop, turns short drags
// into taps, scrolls sideways, and (for furniture rooms) offers layer buttons and the Förråd.
export abstract class RoomScene extends BaseScene {
  protected abstract readonly title: string;
  // Set in furniture rooms: pieces of that room come from the save and can be stored.
  protected readonly furnitureRoom?: FurnitureRoom;
  private dragFrom = new Map<string, Position>();
  private dragging?: Phaser.GameObjects.Container;
  private selected?: Phaser.GameObjects.Container;
  private bar?: Phaser.GameObjects.Container;
  private outline?: Phaser.GameObjects.Graphics;
  private pan?: { x: number; scroll: number; moved: boolean };
  private arrows: Phaser.GameObjects.Text[] = [];

  protected abstract bounds(): Bounds;
  protected abstract drawRoom(): void;
  protected abstract placeables(): Placeable[];
  protected abstract savePosition(id: string, pos: Position): void;
  // Extra scene setup after the items exist (buttons, hints).
  protected afterBuild(): void {}
  // Extra things drawn on a piece of furniture (for example the cup count on the Prisskåp).
  protected furnitureExtras(def: FurnitureDef): Phaser.GameObjects.GameObject[] {
    void def;
    return [];
  }
  // An extra action shown above the layer buttons when a piece is tapped.
  protected furnitureAction(def: FurnitureDef): { label: string; run: () => void } | undefined {
    void def;
    return undefined;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.cameras.main.setBounds(0, 0, ROOM_WORLD_W, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.dragFrom.clear();
    this.dragging = undefined;
    this.selected = undefined;
    this.bar = undefined;
    this.pan = undefined;
    this.drawRoom();
    for (const obj of this.children.list) (obj as Phaser.GameObjects.Image).setDepth?.(-100000);
    this.addTitle(this.title);
    this.addBackButton();
    for (const item of [...this.furniturePlaceables(), ...this.placeables()]) this.place(item);
    this.sortByDepth();
    this.outline = this.add.graphics().setDepth(STANDING * 3);
    this.afterBuild();
    if (this.furnitureRoom) this.addStoreButton();
    // Arrows at the edges: tap to slide most of a screen that way (dragging the floor works too).
    this.arrows = [-1, 1].map((dir) => {
      const t = this.fixedText(dir < 0 ? 40 : GAME_WIDTH - 40, 700, dir < 0 ? '‹' : '›', 110);
      t.setAlpha(0.85).setStroke('#3a2a4a', 8);
      t.setInteractive(
        new Phaser.Geom.Rectangle(-30, -60, t.width + 60, t.height + 120),
        Phaser.Geom.Rectangle.Contains,
      );
      t.on('pointerup', () => this.slide(dir));
      return t;
    });
    this.setupInput();
  }

  update(): void {
    const cam = this.cameras.main;
    const p = this.input.activePointer;
    if (this.dragging && p.isDown) {
      const dx = p.x < EDGE ? -EDGE_SPEED : p.x > GAME_WIDTH - EDGE ? EDGE_SPEED : 0;
      const before = cam.scrollX;
      if (dx) cam.setScroll(Phaser.Math.Clamp(before + dx, 0, ROOM_WORLD_W - GAME_WIDTH), 0);
      const moved = cam.scrollX - before;
      if (moved) this.clampInto(this.dragging, this.dragging.x + moved, this.dragging.y);
    }
    this.arrows[0]?.setVisible(cam.scrollX > 4);
    this.arrows[1]?.setVisible(cam.scrollX < ROOM_WORLD_W - GAME_WIDTH - 4);
    if (this.selected && this.outline) this.drawOutline(this.selected);
  }

  private slide(dir: number): void {
    const cam = this.cameras.main;
    const max = ROOM_WORLD_W - GAME_WIDTH;
    const to = Phaser.Math.Clamp(cam.scrollX + dir * GAME_WIDTH * 0.8, 0, max);
    this.tweens.add({ targets: cam, scrollX: to, duration: 350, ease: 'Sine.inOut' });
  }

  private setupInput(): void {
    const cam = this.cameras.main;
    this.input.on(
      'pointerdown',
      (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (over.length) return;
        this.pan = { x: p.x, scroll: cam.scrollX, moved: false };
      },
    );
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.pan || !p.isDown) return;
      if (Math.abs(p.x - this.pan.x) > TAP_DISTANCE) this.pan.moved = true;
      if (this.pan.moved) cam.setScroll(this.pan.scroll - (p.x - this.pan.x), 0);
    });
    this.input.on('pointerup', () => {
      if (this.pan && !this.pan.moved) this.select(undefined);
      this.pan = undefined;
    });

    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      this.dragFrom.set(obj.getData('id') as string, { x: obj.x, y: obj.y });
      this.dragging = obj;
      obj.setScale(1.06).setDepth(STANDING * 2);
    });
    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, x: number, y: number) =>
        this.clampInto(obj, x, y),
    );
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      this.dragging = undefined;
      obj.setScale(1);
      const id = obj.getData('id') as string;
      const from = this.dragFrom.get(id);
      const moved = from ? Phaser.Math.Distance.Between(from.x, from.y, obj.x, obj.y) : 0;
      if (moved < TAP_DISTANCE) {
        if (from) obj.setPosition(from.x, from.y);
        this.sortByDepth();
        const onTap = obj.getData('onTap') as (() => void) | undefined;
        if (onTap) onTap();
        else if (obj.getData('selectable')) {
          this.select(obj);
          this.react(obj);
        }
        return;
      }
      obj.setData('z', undefined); // dragged: sort by where it stands again
      this.sortByDepth();
      const pos = { x: Math.round(obj.x), y: Math.round(obj.y) };
      if (id.startsWith('furn:'))
        this.saveFurniture(id.slice(5), (f) => Object.assign(f, pos, { z: undefined }));
      else this.savePosition(id, pos);
      if (this.selected === obj) this.drawOutline(obj);
    });
  }

  private clampInto(obj: Phaser.GameObjects.Container, x: number, y: number): void {
    const b = this.bounds();
    obj.setPosition(
      Phaser.Math.Clamp(x, b.left + obj.width / 2, b.right - obj.width / 2),
      Phaser.Math.Clamp(y, b.top + obj.height / 2, b.bottom - obj.height / 2),
    );
  }

  private place(item: Placeable): Phaser.GameObjects.Container {
    const container = this.add.container(item.x, item.y, item.build());
    container.setSize(item.width, item.height);
    container.setData({
      id: item.id,
      onTap: item.onTap,
      flat: item.flat ?? false,
      z: item.z,
      foot: item.foot ?? item.height / 2,
      selectable: item.id.startsWith('furn:'),
      def: item.def,
    });
    container.setInteractive({ draggable: true, useHandCursor: true });
    return container;
  }

  // Standing things lower on screen are drawn in front; flat things (rugs, wall items) are
  // always behind them. A manual layer (`z`) wins until the item is dragged again.
  private autoDepth(obj: Phaser.GameObjects.Container): number {
    return (obj.getData('flat') ? 0 : STANDING) + obj.y + (obj.getData('foot') as number);
  }

  private depthOf(obj: Phaser.GameObjects.Container): number {
    return (obj.getData('z') as number | undefined) ?? this.autoDepth(obj);
  }

  private items(): Phaser.GameObjects.Container[] {
    return this.children.list.filter(
      (o): o is Phaser.GameObjects.Container =>
        o instanceof Phaser.GameObjects.Container && !!o.getData('id'),
    );
  }

  private sortByDepth(): void {
    for (const obj of this.items()) obj.setDepth(this.depthOf(obj));
  }

  // --- selection and layer buttons ------------------------------------------------------

  // Clears the selection and its buttons (for example before a panel opens).
  protected deselect(): void {
    this.select(undefined);
  }

  private select(obj: Phaser.GameObjects.Container | undefined): void {
    this.selected = obj;
    this.bar?.destroy();
    this.bar = undefined;
    this.outline?.clear();
    if (!obj) return;
    this.drawOutline(obj);
    const bar = this.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(STANDING * 4);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.92).fillRoundedRect(10, BAR_Y - 80, GAME_WIDTH - 20, 160, 30);
    bar.add(bg);
    const buttons = [
      ...LAYER_BUTTONS.map((b) => ({ ...b, run: () => this.layer(obj, b.dir) })),
      ...(this.furnitureRoom ? [{ icon: '📦', label: 'Förråd', run: () => this.store(obj) }] : []),
    ];
    const def = FURNITURE.find((f) => f.id === obj.getData('def'));
    const action = def && this.furnitureAction(def);
    if (action) {
      bar.add(
        createButton(this, GAME_WIDTH / 2, BAR_Y - 160, action.label, action.run, {
          width: 420,
          fontSize: 36,
        }),
      );
    }
    const step = (GAME_WIDTH - 40) / buttons.length;
    buttons.forEach((b, i) => bar.add(this.iconButton(30 + step * (i + 0.5), BAR_Y, step - 10, b)));
    this.bar = pin(bar);
  }

  private iconButton(
    x: number,
    y: number,
    w: number,
    b: { icon: string; label: string; run: () => void },
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    // UI kit art (ui_button_round, tinted) like createButton, drawn shape as fallback.
    const bg = buttonBackground(this, w, 132);
    bg.paint(0x6b5a85);
    const g = bg.object;
    const icon = this.add.text(0, -18, b.icon, { fontSize: '46px' }).setOrigin(0.5);
    // Near-square buttons use the round art (see buttonBackground): a smaller label, shrunk
    // further if needed, so it stays inside the circle.
    const round = w <= 132 * 1.15;
    const label = this.add
      .text(0, round ? 34 : 38, b.label, {
        fontFamily: FONT,
        fontSize: round ? '17px' : '20px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (round) label.setScale(Math.min(1, (w * 0.72) / label.width));
    c.add([g, icon, label]);
    c.setSize(w, 132).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      c.setScale(0.94);
      bg.paint(0x54466b);
    });
    c.on('pointerout', () => {
      c.setScale(1);
      bg.paint(0x6b5a85);
    });
    c.on('pointerup', () => {
      c.setScale(1);
      bg.paint(0x6b5a85);
      b.run();
    });
    return c;
  }

  // A tapped piece with a `reaction` wobbles and lets a few emojis float up.
  private react(obj: Phaser.GameObjects.Container): void {
    const def = FURNITURE.find((f) => f.id === obj.getData('def'));
    if (!def?.reaction) return;
    this.tweens.add({ targets: obj, scaleX: 1.08, scaleY: 0.92, duration: 90, yoyo: true });
    for (let i = 0; i < 4; i++) {
      const t = this.add
        .text(
          obj.x + Phaser.Math.Between(-obj.width / 3, obj.width / 3),
          obj.y - obj.height / 2,
          def.reaction,
          { fontSize: `${Phaser.Math.Between(40, 60)}px` },
        )
        .setOrigin(0.5)
        .setDepth(STANDING * 3 + 1)
        .setAlpha(0);
      this.tweens.add({
        targets: t,
        y: t.y - Phaser.Math.Between(120, 200),
        x: t.x + Phaser.Math.Between(-40, 40),
        alpha: { from: 1, to: 0 },
        delay: i * 110,
        duration: 1100,
        ease: 'Sine.out',
        onComplete: () => t.destroy(),
      });
    }
  }

  private drawOutline(obj: Phaser.GameObjects.Container): void {
    if (!this.outline) return;
    this.outline.clear();
    this.outline.lineStyle(6, COLORS.primary, 1);
    this.outline.strokeRoundedRect(
      obj.x - obj.width / 2 - 8,
      obj.y - obj.height / 2 - 8,
      obj.width + 16,
      obj.height + 16,
      18,
    );
  }

  private layer(obj: Phaser.GameObjects.Container, dir: LayerDir): void {
    const others = this.items()
      .filter((o) => o !== obj)
      .map((o) => this.depthOf(o))
      .sort((a, b) => a - b);
    const mine = this.depthOf(obj);
    let z = mine;
    if (!others.length) return;
    if (dir === 'front') z = others[others.length - 1] + 1;
    if (dir === 'back') z = others[0] - 1;
    if (dir === 'forward') {
      const next = others.find((d) => d > mine);
      if (next === undefined) return;
      const after = others.find((d) => d > next);
      z = after === undefined ? next + 1 : (next + after) / 2;
    }
    if (dir === 'backward') {
      const prev = [...others].reverse().find((d) => d < mine);
      if (prev === undefined) return;
      const before = [...others].reverse().find((d) => d < prev);
      z = before === undefined ? prev - 1 : (prev + before) / 2;
    }
    obj.setData('z', z);
    this.sortByDepth();
    const id = obj.getData('id') as string;
    if (id.startsWith('furn:')) this.saveFurniture(id.slice(5), (f) => (f.z = z));
    this.tweens.add({ targets: obj, scale: 1.08, duration: 90, yoyo: true });
  }

  // --- furniture pieces and the Förråd ---------------------------------------------------------

  private roomDefs(): FurnitureDef[] {
    return FURNITURE.filter((f) => (f.room ?? 'house') === this.furnitureRoom);
  }

  private furniturePlaceables(): Placeable[] {
    if (!this.furnitureRoom) return [];
    const defs = new Map(this.roomDefs().map((d) => [d.id, d]));
    return SaveService.get()
      .furniture.filter((f) => !f.stored && defs.has(f.def))
      .map((f) => {
        const def = defs.get(f.def)!;
        const { width, height } = furnitureSize(this, def);
        return {
          id: `furn:${f.uid}`,
          width,
          height,
          x: f.x,
          y: f.y,
          z: f.z,
          flat: def.flat,
          foot: furnitureFoot(this, def),
          def: def.id,
          build: () => [...furnitureShape(this, def), ...this.furnitureExtras(def)],
        };
      });
  }

  private saveFurniture(uid: string, change: (f: SaveFurniture) => void): void {
    SaveService.update((d) => {
      const f = d.furniture.find((i) => i.uid === uid);
      if (f) change(f);
    });
  }

  private store(obj: Phaser.GameObjects.Container): void {
    const id = obj.getData('id') as string;
    this.saveFurniture(id.slice(5), (f) => {
      f.stored = true;
      f.z = undefined;
    });
    this.select(undefined);
    this.tweens.add({
      targets: obj,
      scale: 0.2,
      alpha: 0,
      x: this.cameras.main.scrollX + GAME_WIDTH - 75,
      y: 75,
      duration: 350,
      onComplete: () => obj.destroy(),
    });
  }

  private addStoreButton(): void {
    const c = this.iconButton(GAME_WIDTH - 75, 85, 110, {
      icon: '📦',
      label: 'Förråd',
      run: () => this.openStore(),
    });
    pin(c).setDepth(STANDING * 4);
  }

  private openStore(): void {
    this.select(undefined);
    const modal = this.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(STANDING * 5);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    shade.setInteractive(); // swallow taps behind the panel
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 1).fillRoundedRect(30, 150, GAME_WIDTH - 60, 1060, 36);
    const title = this.fixedText(GAME_WIDTH / 2, 215, 'Förråd', 52);
    modal.add([shade, bg, title]);

    const defs = new Map(this.roomDefs().map((d) => [d.id, d]));
    const stored = SaveService.get().furniture.filter((f) => f.stored && defs.has(f.def));
    const groups = [...new Set(stored.map((f) => f.def))].map((def) => ({
      def: defs.get(def)!,
      uids: stored.filter((f) => f.def === def).map((f) => f.uid),
    }));
    const close = () => {
      list?.destroy();
      modal.destroy();
    };
    let list: ScrollList | undefined;
    if (!groups.length) {
      modal.add(
        this.fixedText(GAME_WIDTH / 2, 560, 'Förrådet är tomt.\nKöp saker i Butiken!', 36).setAlign(
          'center',
        ),
      );
    } else {
      list = new ScrollList(this, 280, 1060);
      list.setScrollFactor(0).setDepth(STANDING * 5 + 1);
      const tileW = 300;
      const tileH = 250;
      groups.forEach((g, i) => {
        const x = GAME_WIDTH / 2 + ((i % 2) - 0.5) * (tileW + 24);
        const y = 20 + Math.floor(i / 2) * (tileH + 24) + tileH / 2;
        const c = this.add.container(x, y);
        const tg = this.add.graphics();
        tg.fillStyle(0xf6e7d2, 1).fillRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH, 26);
        c.add(tg);
        const key = furnitureArtKey(this, g.def);
        c.add(
          key
            ? artImage(this, 0, -30, key, 180, 140)
            : this.add.rectangle(0, -30, 140, 90, g.def.color).setStrokeStyle(4, 0x6b4a55),
        );
        c.add(
          this.add
            .text(
              0,
              tileH / 2 - 40,
              `${g.def.name}${g.uids.length > 1 ? `  ×${g.uids.length}` : ''}`,
              {
                fontFamily: FONT,
                fontSize: '28px',
                color: '#6b4a55',
                fontStyle: 'bold',
              },
            )
            .setOrigin(0.5),
        );
        c.setSize(tileW, tileH).setInteractive({ useHandCursor: true });
        c.on('pointerup', () => {
          if (list?.wasDragged()) return;
          close();
          this.unstore(g.uids[0], g.def);
        });
        list!.content.add(c);
      });
      list.setContentHeight(20 + Math.ceil(groups.length / 2) * (tileH + 24) + 20);
    }
    const shut = this.makeCloseButton(close);
    modal.add(shut);
    pin(modal);
    if (list) pin(list.content);
  }

  private makeCloseButton(onClose: () => void): Phaser.GameObjects.Container {
    return this.iconButton(GAME_WIDTH - 110, 215, 110, { icon: '✕', label: 'Stäng', run: onClose });
  }

  // Take a piece out of the Förråd and put it on the floor in the middle of the view.
  private unstore(uid: string, def: FurnitureDef): void {
    const b = this.bounds();
    const { width, height } = furnitureSize(this, def);
    const x = Phaser.Math.Clamp(
      this.cameras.main.scrollX + GAME_WIDTH / 2,
      b.left + width / 2,
      b.right - width / 2,
    );
    const y = Phaser.Math.Clamp(b.bottom - 260, b.top + height / 2, b.bottom - height / 2);
    this.saveFurniture(uid, (f) => Object.assign(f, { stored: false, x, y, z: undefined }));
    const obj = this.place({
      id: `furn:${uid}`,
      width,
      height,
      x,
      y,
      flat: def.flat,
      foot: furnitureFoot(this, def),
      def: def.id,
      build: () => [...furnitureShape(this, def), ...this.furnitureExtras(def)],
    });
    this.sortByDepth();
    obj.setScale(0.3);
    this.tweens.add({ targets: obj, scale: 1, duration: 300, ease: 'Back.out' });
    this.select(obj);
  }

  private fixedText(x: number, y: number, s: string, size: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, s, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(STANDING * 4);
  }
}

type SaveFurniture = ReturnType<typeof SaveService.get>['furniture'][number];

// Fix a UI object and everything inside it to the screen. Input hit tests use each object's own
// scroll factor, so children of a pinned container must be pinned too.
export function pin<T extends Phaser.GameObjects.GameObject>(obj: T): T {
  (obj as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor?.(0);
  if (obj instanceof Phaser.GameObjects.Container) obj.list.forEach((c) => pin(c));
  return obj;
}
