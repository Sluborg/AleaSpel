import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GYM_EQUIPMENT, equipmentArtId, type EquipmentDef } from '../data/gymEquipment';
import { MINIGAMES } from '../data/minigames';
import { SaveService, type Position } from '../services/SaveService';
import { applyHue, artHeight, backdrop, hasArt, visibleBottom } from '../ui/art';
import { ROOM_WORLD_W, RoomScene, type Placeable } from './RoomScene';

const HALL = { left: 20, top: 250, right: ROOM_WORLD_W - 20, bottom: GAME_HEIGHT - 20 };
const WALL_Y = 420;

// Mitt gym: the team's training hall. Drag the apparatus around; tap one to practise its
// minigame (no medals, records untouched).
export class GymScene extends RoomScene {
  protected readonly title = 'Mitt gym';

  constructor() {
    super('Gym');
  }

  protected bounds() {
    return HALL;
  }

  protected drawRoom(): void {
    if (backdrop(this, 'bg_gym_hall', HALL)) return;
    const g = this.add.graphics();
    const w = HALL.right - HALL.left;
    g.fillStyle(0xe8d3b6, 1).fillRect(HALL.left, HALL.top, w, WALL_Y - HALL.top);
    g.fillStyle(0xbfe3ff, 1);
    for (const x of [80, 300, 520]) g.fillRoundedRect(x, HALL.top + 30, 120, 110, 14);
    g.fillStyle(0x6fa8dc, 1).fillRect(HALL.left, WALL_Y, w, HALL.bottom - WALL_Y);
    g.fillStyle(0x4f8fd0, 1).fillRect(HALL.left, WALL_Y - 10, w, 10);
  }

  protected afterBuild(): void {
    this.add
      .text(GAME_WIDTH / 2, 190, 'Tryck för att träna, dra för att flytta', {
        fontFamily: FONT,
        fontSize: '28px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  protected placeables(): Placeable[] {
    const { gym, owned } = SaveService.get();
    return GYM_EQUIPMENT.filter((e) => !e.price || owned.includes(e.id)).map((def) => {
      const pos = gym.equipment[def.id] ?? { x: def.defaultX, y: def.defaultY };
      const key = this.artKey(def);
      const height = key ? artHeight(this, key, def.width) + (def.minigame ? 50 : 0) : def.height;
      return {
        id: def.id,
        width: def.width,
        height,
        x: pos.x,
        y: pos.y,
        build: () => this.equipmentShape(def),
        onTap: def.minigame ? () => this.practise(def.minigame) : undefined,
        flat: def.flat,
        foot: key
          ? (def.minigame ? -15 : 0) +
            (visibleBottom(this, key) - 0.5) * artHeight(this, key, def.width)
          : def.height / 2,
      };
    });
  }

  protected savePosition(id: string, pos: Position): void {
    SaveService.update((data) => {
      data.gym.equipment[id] = pos;
    });
  }

  private practise(minigameId: string): void {
    const game = MINIGAMES.find((g) => g.id === minigameId);
    if (!game?.available) return;
    this.scene.start(game.scene, {
      gymnastId: SaveService.activeGymnast().id,
      practice: true,
      returnTo: 'Gym',
    });
  }

  // Delivered equipment art is `equip_<id without eq_>`.
  private artKey(def: EquipmentDef): string | null {
    const key = equipmentArtId(def);
    return hasArt(this, key) ? key : null;
  }

  private equipmentShape(def: EquipmentDef): Phaser.GameObjects.GameObject[] {
    const key = this.artKey(def);
    if (key) {
      const img = this.add.image(0, def.minigame ? -15 : 0, key);
      img.setScale(def.width / img.width);
      applyHue(img, def.hue);
      const children: Phaser.GameObjects.GameObject[] = [img];
      if (def.minigame) {
        // A small pink "Träna" pill just under the apparatus' visible bottom.
        const bottom = img.y + (visibleBottom(this, key) - 0.5) * img.displayHeight;
        children.push(...this.practicePill(bottom + 6));
      }
      return children;
    }
    const shape = this.add
      .rectangle(0, 0, def.width, def.height, def.color)
      .setStrokeStyle(4, 0x000000, 0.25);
    // Low equipment has room for one line only: the play mark goes into the name.
    const low = def.height < 100;
    const label = this.add
      .text(0, low ? 0 : -6, low && def.minigame ? `▶ ${def.name}` : def.name, {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const children: Phaser.GameObjects.GameObject[] = [shape, label];
    if (def.minigame && !low) {
      children.push(
        this.add
          .text(0, def.height / 2 - 4, '▶ Träna', {
            fontFamily: FONT,
            fontSize: '22px',
            color: '#ffffff',
          })
          .setOrigin(0.5, 1),
      );
    }
    return children;
  }

  private practicePill(top: number): Phaser.GameObjects.GameObject[] {
    const label = this.add
      .text(10, top + 20, 'Träna', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const w = label.width + 56;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15).fillRoundedRect(-w / 2, top + 3, w, 40, 20);
    g.fillStyle(0xff6fae, 1).fillRoundedRect(-w / 2, top, w, 40, 20);
    g.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(-w / 2, top, w, 40, 20);
    const x = -w / 2 + 20;
    g.fillStyle(0xffffff, 1).fillTriangle(x, top + 11, x, top + 29, x + 14, top + 20);
    return [g, label];
  }
}
