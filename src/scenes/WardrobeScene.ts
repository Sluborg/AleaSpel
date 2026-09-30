import Phaser from 'phaser';
import { COLORS, FONT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { ASSET_MANIFEST_KEY, type AssetEntry, type AssetManifest } from '../data/assets';
import {
  ANCHORS_KEY,
  CATEGORY_TABS,
  DEFAULT_TINT,
  PALETTE,
  layerOfCategory,
  layerRegion,
  wardrobeItems,
  type Anchors,
} from '../data/wardrobe';
import { SaveService, type Gymnast } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { itemBounds } from '../ui/itemBounds';
import { BaseScene } from './BaseScene';

const PANEL_TOP = 770;
const PANEL_BOTTOM = 1260;
const TAB_ZONE_BOTTOM = PANEL_TOP + 140;
const TILE = 140;
const TILE_GAP = 20;
const TAB_W = 190;
const TAB_STEP = 205;
const DRAG_THRESHOLD = 14;

// Garderob: pick clothes per category and colour tintable items. Items come from the manifest.
export class WardrobeScene extends BaseScene {
  private gymnast!: Gymnast;
  private view!: GymnastView;
  private panel?: Phaser.GameObjects.Container;
  private tab = '';
  // Drag scrolling: the tab strip scrolls sideways, the item grid up and down.
  private tabStrip?: Phaser.GameObjects.Container;
  private grid?: Phaser.GameObjects.Container;
  private tabScroll = 0;
  private gridScroll = 0;
  private tabMin = 0;
  private gridMin = 0;
  private dragZone: 'tabs' | 'grid' | null = null;
  private dragged = false;
  private dragStart = { x: 0, y: 0, scroll: 0 };

  constructor() {
    super('Wardrobe');
  }

  create(data: { gymnastId?: string }): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const gymnasts = SaveService.get().gymnasts;
    this.gymnast = gymnasts.find((g) => g.id === data.gymnastId) ?? gymnasts[0];
    this.addTitle(this.gymnast.name);
    this.addBackButton('AvatarEditor');
    this.view = new GymnastView(this, GAME_WIDTH / 2, 450, 640, this.gymnast);

    const tabs = this.tabs();
    this.tab = tabs[0]?.category ?? '';
    this.buildPanel();
    this.setupDragScroll();
  }

  private setupDragScroll(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragged = false;
      this.dragZone =
        p.y < PANEL_TOP || p.y > PANEL_BOTTOM ? null : p.y < TAB_ZONE_BOTTOM ? 'tabs' : 'grid';
      const scroll = this.dragZone === 'tabs' ? this.tabScroll : this.gridScroll;
      this.dragStart = { x: p.x, y: p.y, scroll };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || !this.dragZone) return;
      const dx = p.x - this.dragStart.x;
      const dy = p.y - this.dragStart.y;
      if (!this.dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      this.dragged = true;
      if (this.dragZone === 'tabs') {
        this.tabScroll = Phaser.Math.Clamp(this.dragStart.scroll + dx, this.tabMin, 0);
        this.tabStrip?.setX(this.tabScroll);
      } else {
        this.gridScroll = Phaser.Math.Clamp(this.dragStart.scroll + dy, this.gridMin, 0);
        this.grid?.setY(this.gridScroll);
      }
    });
  }

  // A tap counts only if it was not a drag and started in the zone the control belongs to.
  private tap(zone: 'tabs' | 'grid', action: () => void): () => void {
    return () => {
      if (!this.dragged && this.dragZone === zone) action();
    };
  }

  private maskRect(x: number, y: number, w: number, h: number) {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(x, y, w, h);
    return g.createGeometryMask();
  }

  private items(): AssetEntry[] {
    return wardrobeItems(this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined);
  }

  private tabs() {
    const items = this.items();
    return CATEGORY_TABS.filter((t) => items.some((i) => i.category === t.category));
  }

  private buildPanel(): void {
    this.panel?.destroy();
    const panel = this.add.container(0, 0);
    this.panel = panel;
    const bg = this.add.graphics();
    bg.fillStyle(0x3a2752, 1);
    bg.fillRoundedRect(20, PANEL_TOP, GAME_WIDTH - 40, PANEL_BOTTOM - PANEL_TOP, 36);
    panel.add(bg);

    const tabs = this.tabs();
    if (!tabs.length) {
      panel.add(this.label(GAME_WIDTH / 2, PANEL_TOP + 200, 'Inga kläder ännu'));
      return;
    }

    // Category tabs: one row, drag sideways when there are more than fit.
    const strip = this.add.container(this.tabScroll, 0);
    this.tabStrip = strip;
    tabs.forEach((t, i) => {
      const selected = t.category === this.tab;
      strip.add(
        createButton(
          this,
          40 + TAB_W / 2 + i * TAB_STEP,
          PANEL_TOP + 70,
          t.label,
          this.tap('tabs', () => {
            this.tab = t.category;
            this.gridScroll = 0;
            this.buildPanel();
          }),
          { width: TAB_W, fontSize: 32, color: selected ? COLORS.primary : 0x6b5a85 },
        ),
      );
    });
    this.tabMin = Math.min(0, GAME_WIDTH - 40 - (40 + tabs.length * TAB_STEP - (TAB_STEP - TAB_W)));
    this.tabScroll = Phaser.Math.Clamp(this.tabScroll, this.tabMin, 0);
    strip.setX(this.tabScroll);
    strip.setMask(this.maskRect(20, PANEL_TOP, GAME_WIDTH - 40, TAB_ZONE_BOTTOM - PANEL_TOP));
    panel.add(strip);

    const layer = layerOfCategory(this.tab) ?? '';
    const worn = this.gymnast.outfit[layer];
    const rowY = TAB_ZONE_BOTTOM + 20 + TILE / 2;

    // Item grid ("none" first, then every item in this category, then colours), drag up/down.
    const grid = this.add.container(0, this.gridScroll);
    this.grid = grid;
    const items = this.items().filter((i) => i.category === this.tab);
    const tiles: (AssetEntry | null)[] = [null, ...items];
    const perRow = 4;
    const startX = GAME_WIDTH / 2 - ((perRow - 1) * (TILE + TILE_GAP)) / 2;
    let lastY = rowY;
    tiles.forEach((item, i) => {
      const x = startX + (i % perRow) * (TILE + TILE_GAP);
      const y = rowY + Math.floor(i / perRow) * (TILE + TILE_GAP);
      lastY = y;
      grid.add(this.tile(x, y, item, item ? worn?.item === item.id : !worn, worn?.tint));
    });
    let contentBottom = lastY + TILE / 2;

    // Colour swatches for the worn item, when it can be coloured.
    const wornEntry = items.find((i) => i.id === worn?.item);
    if (wornEntry?.tintable) {
      const swY = lastY + TILE / 2 + 62;
      const perSwRow = 6;
      PALETTE.forEach((color, i) => {
        const x = GAME_WIDTH / 2 + ((i % perSwRow) - (perSwRow - 1) / 2) * 104;
        const y = swY + Math.floor(i / perSwRow) * 100;
        contentBottom = y + 50;
        grid.add(this.swatch(x, y, color, worn?.tint === color, () => this.setTint(layer, color)));
      });
    }
    this.gridMin = Math.min(0, PANEL_BOTTOM - 20 - contentBottom);
    this.gridScroll = Phaser.Math.Clamp(this.gridScroll, this.gridMin, 0);
    grid.setY(this.gridScroll);
    grid.setMask(
      this.maskRect(20, TAB_ZONE_BOTTOM, GAME_WIDTH - 40, PANEL_BOTTOM - TAB_ZONE_BOTTOM),
    );
    panel.add(grid);
  }

  private tile(x: number, y: number, item: AssetEntry | null, selected: boolean, tint?: number) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xf6eefc, 1);
    g.fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 24);
    if (selected) {
      g.lineStyle(8, COLORS.primary, 1);
      g.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 24);
    }
    c.add(g);
    if (item) {
      const r =
        itemBounds(this, item.id) ??
        layerRegion(
          layerOfCategory(item.category) ?? '',
          this.cache.json.get(ANCHORS_KEY) as Anchors,
        );
      const s = Math.min((TILE - 24) / r.w, (TILE - 24) / r.h);
      const img = this.add
        .image(-(r.x + r.w / 2) * s, -(r.y + r.h / 2) * s, item.id)
        .setOrigin(0)
        .setCrop(r.x, r.y, r.w, r.h)
        .setScale(s);
      if (item.tintable) img.setTint(selected && tint !== undefined ? tint : DEFAULT_TINT);
      c.add(img);
    } else {
      c.add(
        this.add
          .text(0, 0, '✕', { fontFamily: FONT, fontSize: '64px', color: '#9a86b8' })
          .setOrigin(0.5),
      );
    }
    c.setSize(TILE, TILE).setInteractive({ useHandCursor: true });
    c.on(
      'pointerup',
      this.tap('grid', () => this.wear(item)),
    );
    return c;
  }

  private swatch(x: number, y: number, color: number, selected: boolean, onPick: () => void) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    if (selected) {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, 0, 46);
    }
    g.fillStyle(color, 1);
    g.fillCircle(0, 0, 38);
    g.lineStyle(3, 0x000000, 0.2);
    g.strokeCircle(0, 0, 38);
    c.add(g);
    c.setSize(Math.max(100, MIN_TOUCH - 10), 100).setInteractive({ useHandCursor: true });
    c.on('pointerup', this.tap('grid', onPick));
    return c;
  }

  private label(x: number, y: number, text: string) {
    return this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: '40px', color: COLORS.textMuted })
      .setOrigin(0.5);
  }

  private wear(item: AssetEntry | null): void {
    const layer = layerOfCategory(this.tab);
    if (!layer) return;
    this.save((g) => {
      if (!item) delete g.outfit[layer];
      else {
        const prevTint = g.outfit[layer]?.tint;
        g.outfit[layer] = item.tintable
          ? { item: item.id, tint: prevTint ?? DEFAULT_TINT }
          : { item: item.id };
      }
    });
  }

  private setTint(layer: string, color: number): void {
    this.save((g) => {
      const w = g.outfit[layer];
      if (w) w.tint = color;
    });
  }

  // this.gymnast is the object inside the save data, so the change is visible right away.
  private save(change: (g: Gymnast) => void): void {
    SaveService.update(() => change(this.gymnast));
    this.view.refresh(this.gymnast);
    this.buildPanel();
  }
}
