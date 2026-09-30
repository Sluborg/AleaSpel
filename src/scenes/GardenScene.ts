import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { HOUSE_PARTS, HOUSE_SLOTS, type HousePart, type HouseSlot } from '../data/exterior';
import { FURNITURE } from '../data/furniture';
import { chooseHousePart, houseParts } from '../services/House';
import { SaveService, newUid } from '../services/SaveService';
import { applyHue, artImage, backdrop, hasArt } from '../ui/art';
import { createButton } from '../ui/Button';
import { houseView } from '../ui/houseView';
import { ROOM_WORLD_W, RoomScene, pin, type Placeable } from './RoomScene';

const GARDEN = { left: 20, top: 460, right: ROOM_WORLD_W - 20, bottom: GAME_HEIGHT - 20 };
const HOUSE_X = 360;
const GROUND = 830; // where the house stands
const HOUSE_DEPTH = 10000 + GROUND; // sorts with standing things (RoomScene depth rule)
const PANEL_TOP = 850;
const TILE = 124;

// Trädgården: the house from outside and its garden. Build the house from parts (wall, roof,
// door, windows, each in several colours), place garden things like furniture, tap the door to
// go inside (Mina hus).
export class GardenScene extends RoomScene {
  protected readonly title = 'Trädgården';
  protected readonly furnitureRoom = 'garden' as const;
  private house?: Phaser.GameObjects.Container;
  private builder?: Phaser.GameObjects.Container;
  private slot: HouseSlot = 'wall';

  constructor() {
    super('Garden');
  }

  create(): void {
    this.giveStarterGarden();
    this.house = undefined;
    this.builder = undefined;
    super.create();
  }

  // Saves from before the garden existed get its free pieces on the first visit.
  private giveStarterGarden(): void {
    const garden = FURNITURE.filter((f) => f.room === 'garden');
    SaveService.update((d) => {
      if (d.furniture.some((f) => garden.some((g) => g.id === f.def))) return;
      for (const f of garden.filter((g) => !g.price))
        d.furniture.push({ uid: newUid(), def: f.id, x: f.defaultX, y: f.defaultY });
    });
  }

  protected bounds() {
    return GARDEN;
  }

  protected drawRoom(): void {
    if (
      backdrop(this, 'bg_trampoline_field', {
        left: 0,
        top: 0,
        right: ROOM_WORLD_W,
        bottom: GAME_HEIGHT,
      })
    )
      return;
    const g = this.add.graphics();
    g.fillStyle(0xbfe3ff, 1).fillRect(0, 0, ROOM_WORLD_W, 760);
    g.fillStyle(0x9ad97a, 1).fillRect(0, 760, ROOM_WORLD_W, GAME_HEIGHT - 760);
  }

  protected placeables(): Placeable[] {
    return [];
  }

  // Only furniture pieces live here; RoomScene saves those itself.
  protected savePosition(): void {}

  protected afterBuild(): void {
    this.drawHouse();
    const build = createButton(this, 150, GAME_HEIGHT - 80, '🎨 Bygg', () => this.openBuilder(), {
      width: 240,
      height: 110,
      fontSize: 34,
      color: 0xb06bff,
    });
    const inside = createButton(
      this,
      GAME_WIDTH - 115,
      GAME_HEIGHT - 80,
      '🚪 In',
      () => this.scene.start('Home'),
      { width: 200, height: 110, fontSize: 34, color: 0xffb36b },
    );
    pin(build).setDepth(40000);
    pin(inside).setDepth(40000);
  }

  private drawHouse(): void {
    this.house?.destroy();
    const { container, door } = houseView(this, HOUSE_X, GROUND, houseParts());
    this.house = container.setDepth(HOUSE_DEPTH);
    // Tap the door to go inside.
    const zone = this.add.zone(door.x, door.y, Math.max(door.w, 110), Math.max(door.h, 110));
    zone.setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('Home'));
    container.add(zone);
  }

  // --- house builder ------------------------------------------------------------------------

  private openBuilder(): void {
    this.deselect();
    this.builder?.destroy();
    this.tweens.add({ targets: this.cameras.main, scrollX: 0, duration: 300, ease: 'Sine.inOut' });
    const panel = this.add.container(0, 0).setDepth(50000);
    this.builder = panel;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 0.96).fillRoundedRect(10, PANEL_TOP, GAME_WIDTH - 20, 420, 30);
    const swallow = this.add
      .zone(GAME_WIDTH / 2, PANEL_TOP + 210, GAME_WIDTH - 20, 420)
      .setInteractive();
    panel.add([swallow, bg]);

    const tabW = 134;
    HOUSE_SLOTS.forEach((s, i) => {
      panel.add(
        createButton(
          this,
          84 + i * (tabW + 8),
          PANEL_TOP + 70,
          s.label,
          () => this.showSlot(s.slot),
          {
            width: tabW,
            height: 110,
            fontSize: 26,
            color: s.slot === this.slot ? COLORS.primary : 0x6b5a85,
          },
        ),
      );
    });
    panel.add(
      createButton(this, GAME_WIDTH - 70, PANEL_TOP + 70, '✕', () => this.closeBuilder(), {
        width: 110,
        height: 110,
        fontSize: 40,
        color: 0x6b5a85,
      }),
    );

    const chosen = houseParts()[this.slot].id;
    const parts = HOUSE_PARTS.filter((p) => p.slot === this.slot);
    const perRow = 5;
    parts.forEach((p, i) => {
      const x = 20 + ((GAME_WIDTH - 40) * ((i % perRow) + 0.5)) / perRow;
      const y = PANEL_TOP + 205 + Math.floor(i / perRow) * (TILE + 10);
      panel.add(this.partTile(x, y, p, p.id === chosen));
    });
    pin(panel);
  }

  private partTile(x: number, y: number, p: HousePart, chosen: boolean) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xf6e7d2, 1).fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 20);
    if (chosen)
      g.lineStyle(8, COLORS.primary, 1).strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 20);
    c.add(g);
    if (hasArt(this, p.art))
      c.add(applyHue(artImage(this, 0, 0, p.art, TILE - 16, TILE - 16), p.hue));
    else c.add(this.add.rectangle(0, 0, TILE - 40, TILE - 40, p.color).setStrokeStyle(4, 0x6b4a55));
    c.setSize(TILE, TILE).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      chooseHousePart(p);
      this.drawHouse();
      this.openBuilder();
    });
    return c;
  }

  private showSlot(slot: HouseSlot): void {
    this.slot = slot;
    this.openBuilder();
  }

  private closeBuilder(): void {
    this.builder?.destroy();
    this.builder = undefined;
  }
}
