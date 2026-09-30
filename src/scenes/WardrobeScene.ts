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
const TILE = 140;
const TILE_GAP = 20;

// Garderob: pick clothes per category and colour tintable items. Items come from the manifest.
export class WardrobeScene extends BaseScene {
  private gymnast!: Gymnast;
  private view!: GymnastView;
  private panel?: Phaser.GameObjects.Container;
  private tab = '';

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
    bg.fillRoundedRect(20, PANEL_TOP, GAME_WIDTH - 40, 1280 - PANEL_TOP - 20, 36);
    panel.add(bg);

    const tabs = this.tabs();
    if (!tabs.length) {
      panel.add(this.label(GAME_WIDTH / 2, PANEL_TOP + 200, 'Inga kläder ännu'));
      return;
    }

    // Category tabs, up to 3 per row.
    tabs.forEach((t, i) => {
      const x = GAME_WIDTH / 2 + ((i % 3) - (Math.min(tabs.length, 3) - 1) / 2) * 215;
      const y = PANEL_TOP + 70 + Math.floor(i / 3) * 120;
      const selected = t.category === this.tab;
      panel.add(
        createButton(
          this,
          x,
          y,
          t.label,
          () => {
            this.tab = t.category;
            this.buildPanel();
          },
          { width: 200, fontSize: 36, color: selected ? COLORS.primary : 0x6b5a85 },
        ),
      );
    });

    const layer = layerOfCategory(this.tab) ?? '';
    const worn = this.gymnast.outfit[layer];
    const tabRows = Math.ceil(tabs.length / 3);
    const rowY = PANEL_TOP + 70 + (tabRows - 1) * 120 + 145;

    // Item tiles: "none" first, then every item in this category.
    const items = this.items().filter((i) => i.category === this.tab);
    const tiles: (AssetEntry | null)[] = [null, ...items];
    const perRow = 4;
    const startX = GAME_WIDTH / 2 - ((perRow - 1) * (TILE + TILE_GAP)) / 2;
    let lastY = rowY;
    tiles.forEach((item, i) => {
      const x = startX + (i % perRow) * (TILE + TILE_GAP);
      const y = rowY + Math.floor(i / perRow) * (TILE + TILE_GAP);
      lastY = y;
      panel.add(this.tile(x, y, item, item ? worn?.item === item.id : !worn, worn?.tint));
    });

    // Colour swatches for the worn item, when it can be coloured.
    const wornEntry = items.find((i) => i.id === worn?.item);
    if (wornEntry?.tintable) {
      const swY = lastY + TILE / 2 + 62;
      const perSwRow = 6;
      PALETTE.forEach((color, i) => {
        const x = GAME_WIDTH / 2 + ((i % perSwRow) - (perSwRow - 1) / 2) * 104;
        const y = swY + Math.floor(i / perSwRow) * 100;
        panel.add(this.swatch(x, y, color, worn?.tint === color, () => this.setTint(layer, color)));
      });
    }
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
    c.on('pointerup', () => this.wear(item));
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
    c.on('pointerup', onPick);
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
