import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { FURNITURE } from '../data/furniture';
import { SaveService, type Position } from '../services/SaveService';
import { backdrop } from '../ui/art';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { PetView } from '../ui/PetView';
import { furnitureShape, furnitureSize } from './HomeScene';
import { RoomScene, type Placeable } from './RoomScene';

const ROOM = { left: 20, top: 250, right: GAME_WIDTH - 20, bottom: GAME_HEIGHT - 20 };
const FLOOR_Y = 700;
const PET_SIZE = 180;

// Klubbstugan: the team's club house, joined to the gym. The team's pets live here (drag them
// around, tap one to care for it), the active gymnast hangs out, and a door leads to the gym.
export class ClubhouseScene extends RoomScene {
  protected readonly title = 'Klubbstugan';

  constructor() {
    super('Clubhouse');
  }

  protected bounds() {
    return ROOM;
  }

  protected drawRoom(): void {
    const g = this.add.graphics();
    const w = ROOM.right - ROOM.left;
    if (!backdrop(this, 'bg_clubhouse_room', ROOM)) {
      g.fillStyle(0xf7d9c4, 1).fillRect(ROOM.left, ROOM.top, w, FLOOR_Y - ROOM.top);
      // Bunting along the wall.
      for (let i = 0; i < 9; i++) {
        const x = ROOM.left + 40 + i * 80;
        g.fillStyle([0xff6fae, 0xffd84d, 0x7ed957, 0x5aa9ff][i % 4], 1);
        g.fillTriangle(x, ROOM.top + 20, x + 60, ROOM.top + 20, x + 30, ROOM.top + 70);
      }
      g.fillStyle(0xd9a27a, 1).fillRect(ROOM.left, FLOOR_Y, w, ROOM.bottom - FLOOR_Y);
      g.fillStyle(0xa86b3c, 1).fillRect(ROOM.left, FLOOR_Y - 12, w, 12);
    }
    // Door to the gym on the right wall.
    g.fillStyle(0x8fd36b, 1).fillRoundedRect(ROOM.right - 150, FLOOR_Y - 250, 120, 250, 12);
    g.fillStyle(0x4a7a2a, 1).fillCircle(ROOM.right - 60, FLOOR_Y - 120, 8);
  }

  protected afterBuild(): void {
    this.add
      .text(ROOM.right - 90, FLOOR_Y - 270, 'Gymmet', {
        fontFamily: FONT,
        fontSize: '26px',
        color: COLORS.text,
      })
      .setOrigin(0.5, 1);
    const door = this.add
      .zone(ROOM.right - 90, FLOOR_Y - 125, 130, 260)
      .setInteractive({ useHandCursor: true });
    door.on('pointerup', () => this.scene.start('Gym'));

    const gymnast = SaveService.activeGymnast();
    const view = new GymnastView(this, 130, FLOOR_Y - 160, 320, gymnast);
    view.setSize(150, 320).setInteractive({ useHandCursor: true });
    view.on('pointerup', () => this.scene.start('AvatarEditor'));

    if (!SaveService.get().pets.length) {
      this.add
        .text(GAME_WIDTH / 2, 1200, 'Laget har inget djur än', {
          fontFamily: FONT,
          fontSize: '30px',
          color: COLORS.textMuted,
        })
        .setOrigin(0.5);
      createButton(this, GAME_WIDTH / 2, 1120, 'Hämta ett djur', () => this.scene.start('Pets'), {
        width: 320,
        fontSize: 34,
      });
    }
  }

  protected placeables(): Placeable[] {
    const { clubhouse, owned, pets } = SaveService.get();
    const furniture: Placeable[] = FURNITURE.filter(
      (f) => f.room === 'clubhouse' && (!f.price || owned.includes(f.id)),
    ).map((def) => {
      const pos = clubhouse.furniture[def.id] ?? { x: def.defaultX, y: def.defaultY };
      const { width, height } = furnitureSize(this, def);
      return {
        id: def.id,
        width,
        height,
        x: pos.x,
        y: pos.y,
        build: () => furnitureShape(this, def),
      };
    });
    const petItems: Placeable[] = pets.map((pet, i) => {
      const pos = clubhouse.pets[pet.id] ?? {
        x: 300 + (i % 3) * 140,
        y: 900 + Math.floor(i / 3) * 120,
      };
      return {
        id: `pet:${pet.id}`,
        width: PET_SIZE * 0.7,
        height: PET_SIZE * 0.8,
        x: pos.x,
        y: pos.y,
        build: () => {
          const view = new PetView(this, 0, 0, PET_SIZE, pet.species, pet.color);
          this.children.remove(view); // the room container owns it
          const name = this.add
            .text(0, PET_SIZE * 0.42, pet.name, {
              fontFamily: FONT,
              fontSize: '24px',
              color: '#3a2a4a',
              fontStyle: 'bold',
            })
            .setOrigin(0.5);
          return [view, name];
        },
        onTap: () => this.scene.start('Pets', { petId: pet.id }),
      };
    });
    return [...furniture, ...petItems];
  }

  protected savePosition(id: string, pos: Position): void {
    SaveService.update((data) => {
      if (id.startsWith('pet:')) data.clubhouse.pets[id.slice(4)] = pos;
      else data.clubhouse.furniture[id] = pos;
    });
  }
}
