import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { backdrop } from '../ui/art';
import { createButton } from '../ui/Button';
import { ROOM_WORLD_W, RoomScene, pin, type Placeable } from './RoomScene';

const ROOM = { left: 20, top: 160, right: ROOM_WORLD_W - 20, bottom: GAME_HEIGHT - 20 };
const FLOOR_Y = 620;

// Mina hus: the gymnast's own room. Furniture pieces from the save (free ones, bought ones taken
// out of the Förråd); drag to move, tap for layer buttons. 🌳 Ute leads to Trädgården.
export class HomeScene extends RoomScene {
  protected readonly title = 'Mina hus';
  protected readonly furnitureRoom = 'house' as const;

  constructor() {
    super('Home');
  }

  protected bounds() {
    return ROOM;
  }

  protected drawRoom(): void {
    if (backdrop(this, 'bg_house_room', ROOM)) return;
    const g = this.add.graphics();
    const w = ROOM.right - ROOM.left;
    g.fillStyle(COLORS.wall, 1).fillRect(ROOM.left, ROOM.top, w, FLOOR_Y - ROOM.top);
    g.fillStyle(COLORS.floor, 1).fillRect(ROOM.left, FLOOR_Y, w, ROOM.bottom - FLOOR_Y);
    g.fillStyle(COLORS.skirting, 1).fillRect(ROOM.left, FLOOR_Y - 12, w, 12);
  }

  // Out to Trädgården (the house from outside).
  protected afterBuild(): void {
    const out = createButton(
      this,
      GAME_WIDTH - 115,
      GAME_HEIGHT - 80,
      '🌳 Ute',
      () => this.scene.start('Garden'),
      { width: 200, height: 110, fontSize: 34, color: 0x9ad97a },
    );
    pin(out).setDepth(40000);
  }

  protected placeables(): Placeable[] {
    return [];
  }

  // Only furniture pieces live here; RoomScene saves those itself.
  protected savePosition(): void {}
}
