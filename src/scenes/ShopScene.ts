import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { SHOP_TABS, shopItems, type ShopItem, type ShopKind } from '../data/shop';
import { SaveService } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { ScrollList } from '../ui/ScrollList';
import { BaseScene } from './BaseScene';

const TILE_W = 300;
const TILE_H = 300;
const LIST_TOP = 350;

// Butiken: spend medals on furniture (and clothes, when Visuals adds priced items).
export class ShopScene extends BaseScene {
  private tab: ShopKind = 'furniture';
  private layer?: Phaser.GameObjects.Container;
  private list?: ScrollList;
  private medalText!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Butiken');
    this.addBackButton();
    this.medalText = this.add
      .text(GAME_WIDTH / 2, 175, '', {
        fontFamily: FONT,
        fontSize: '40px',
        color: '#ffd84d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.build();
  }

  private build(): void {
    this.layer?.destroy();
    this.list?.content.destroy();
    this.layer = this.add.container(0, 0);
    const save = SaveService.get();
    this.medalText.setText(`🏅 ${save.medals} medaljer`);

    SHOP_TABS.forEach((t, i) => {
      const x = GAME_WIDTH / 2 + (i - (SHOP_TABS.length - 1) / 2) * 260;
      this.layer!.add(
        createButton(
          this,
          x,
          270,
          t.label,
          () => {
            this.tab = t.kind;
            this.build();
          },
          { width: 240, fontSize: 36, color: t.kind === this.tab ? COLORS.primary : 0x6b5a85 },
        ),
      );
    });

    const items = shopItems(
      this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined,
    ).filter((i) => i.kind === this.tab);
    if (!items.length) {
      this.layer.add(
        this.add
          .text(GAME_WIDTH / 2, 600, 'Kommer snart!', {
            fontFamily: FONT,
            fontSize: '44px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
      return;
    }
    this.list = new ScrollList(this, LIST_TOP, GAME_HEIGHT - 20);
    items.forEach((item, i) => {
      const x = GAME_WIDTH / 2 + ((i % 2) - 0.5) * (TILE_W + 30);
      const y = 20 + Math.floor(i / 2) * (TILE_H + 24) + TILE_H / 2;
      this.list!.content.add(this.tile(x, y, item, save.owned.includes(item.id), save.medals));
    });
    this.list.setContentHeight(20 + Math.ceil(items.length / 2) * (TILE_H + 24) + 20);
  }

  private tile(x: number, y: number, item: ShopItem, owned: boolean, medals: number) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(owned ? 0x2f4a3a : 0x3a2752, 1).fillRoundedRect(
      -TILE_W / 2,
      -TILE_H / 2,
      TILE_W,
      TILE_H,
      30,
    );
    if (item.color !== undefined) {
      g.fillStyle(item.color, 1).fillRoundedRect(-60, -TILE_H / 2 + 22, 120, 70, 16);
    }
    c.add(g);
    c.add(this.add.text(0, -TILE_H / 2 + 57, item.icon, { fontSize: '44px' }).setOrigin(0.5));
    c.add(
      this.add
        .text(0, 10, item.name, {
          fontFamily: FONT,
          fontSize: '32px',
          color: COLORS.text,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    const afford = medals >= item.price;
    const label = owned ? 'Köpt ✓' : `Köp  🏅${item.price}`;
    const btn = createButton(this, 0, TILE_H / 2 - 70, label, () => this.buy(item), {
      width: 250,
      height: 84,
      fontSize: 30,
      color: owned ? 0x4f8a5f : afford ? COLORS.primary : 0x6b5a85,
    });
    if (owned || !afford) btn.disableInteractive();
    c.add(btn);
    if (!owned && !afford) {
      c.add(
        this.add
          .text(0, TILE_H / 2 - 18, `${item.price - medals} till`, {
            fontFamily: FONT,
            fontSize: '22px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
    }
    return c;
  }

  private buy(item: ShopItem): void {
    const save = SaveService.get();
    if (save.owned.includes(item.id) || save.medals < item.price) return;
    SaveService.update((d) => {
      d.medals -= item.price;
      d.owned.push(item.id);
    });
    this.build();
    const t = this.add
      .text(GAME_WIDTH / 2, 600, `🎉 ${item.name} är din!`, {
        fontFamily: FONT,
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#3a2a4a',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(500);
    this.tweens.add({
      targets: t,
      y: 520,
      alpha: 0,
      duration: 1600,
      delay: 600,
      onComplete: () => t.destroy(),
    });
    for (let i = 0; i < 10; i++) {
      const s = this.add
        .text(GAME_WIDTH / 2 + Phaser.Math.Between(-200, 200), 640, '⭐', { fontSize: '40px' })
        .setOrigin(0.5)
        .setDepth(500);
      this.tweens.add({
        targets: s,
        y: 640 - Phaser.Math.Between(150, 320),
        alpha: 0,
        duration: 1200,
        delay: i * 60,
        onComplete: () => s.destroy(),
      });
    }
  }
}
