import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { FURNITURE, type FurnitureDef } from '../data/furniture';
import { SaveService, type Position } from '../services/SaveService';
import { RoomScene, type Placeable } from './RoomScene';

const ROOM = { left: 20, top: 160, right: GAME_WIDTH - 20, bottom: GAME_HEIGHT - 20 };
const FLOOR_Y = 620;

// Mina hus: the gymnast's own room. Free and bought furniture, drag to move.
export class HomeScene extends RoomScene {
  protected readonly title = 'Mina hus';

  constructor() {
    super('Home');
  }

  protected bounds() {
    return ROOM;
  }

  protected drawRoom(): void {
    const g = this.add.graphics();
    const w = ROOM.right - ROOM.left;
    g.fillStyle(COLORS.wall, 1).fillRect(ROOM.left, ROOM.top, w, FLOOR_Y - ROOM.top);
    g.fillStyle(COLORS.floor, 1).fillRect(ROOM.left, FLOOR_Y, w, ROOM.bottom - FLOOR_Y);
    g.fillStyle(COLORS.skirting, 1).fillRect(ROOM.left, FLOOR_Y - 12, w, 12);
  }

  protected placeables(): Placeable[] {
    const { home, owned } = SaveService.get();
    return FURNITURE.filter(
      (f) => (f.room ?? 'house') === 'house' && (!f.price || owned.includes(f.id)),
    ).map((def) => {
      const pos = home.furniture[def.id] ?? { x: def.defaultX, y: def.defaultY };
      return {
        id: def.id,
        width: def.width,
        height: def.height,
        x: pos.x,
        y: pos.y,
        build: () => furnitureShape(this, def),
      };
    });
  }

  protected savePosition(id: string, pos: Position): void {
    SaveService.update((data) => {
      data.home.furniture[id] = pos;
    });
  }
}

// Placeholder furniture: a shape with the name on it.
export function furnitureShape(
  scene: Phaser.Scene,
  def: FurnitureDef,
): Phaser.GameObjects.GameObject[] {
  const shape =
    def.shape === 'ellipse'
      ? scene.add.ellipse(0, 0, def.width, def.height, def.color)
      : scene.add.rectangle(0, 0, def.width, def.height, def.color);
  shape.setStrokeStyle(4, 0x000000, 0.25);
  const label = scene.add
    .text(0, 0, def.name, { fontFamily: FONT, fontSize: '30px', color: '#3a2a4a' })
    .setOrigin(0.5);
  return [shape, label];
}
