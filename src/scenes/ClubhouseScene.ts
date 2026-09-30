import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SaveService, type Position } from '../services/SaveService';
import { backdrop } from '../ui/art';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { PetView } from '../ui/PetView';
import { petSpecies } from '../data/pets';
import type { FurnitureDef } from '../data/furniture';
import { trophyView } from '../ui/trophy';
import { ROOM_WORLD_W, RoomScene, pin, type Placeable } from './RoomScene';

const ROOM = { left: 20, top: 250, right: ROOM_WORLD_W - 20, bottom: GAME_HEIGHT - 20 };
const FLOOR_Y = 700;
const GYMNAST_H = 320; // pets are drawn to scale next to the gymnast (PetSpecies.roomSize)
const GYMNAST_KEY = 'gymnast'; // her spot is kept with the pets' spots

// Klubbstugan: the team's club house, joined to the gym. The team's pets live here (drag them
// around, tap one to care for it), the active gymnast hangs out, and a door leads to the gym.
export class ClubhouseScene extends RoomScene {
  protected readonly title = 'Klubbstugan';
  protected readonly furnitureRoom = 'clubhouse' as const;

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
    // Door to the gym on the right wall, over the backdrop.
    const door = this.add.graphics();
    door.fillStyle(0x8fd36b, 1).fillRoundedRect(ROOM.right - 150, FLOOR_Y - 250, 120, 250, 12);
    door.fillStyle(0x4a7a2a, 1).fillCircle(ROOM.right - 60, FLOOR_Y - 120, 8);
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

  // The Prisskåp shows how many cups the team has won and opens the trophy shelf.
  protected furnitureExtras(def: FurnitureDef): Phaser.GameObjects.GameObject[] {
    if (def.action !== 'trophies') return [];
    const count = SaveService.get().team.trophies.length;
    if (!count) return [];
    const badge = this.add.graphics();
    badge.fillStyle(COLORS.primary, 1).fillCircle(def.width / 2 - 14, -60, 26);
    const text = this.add
      .text(def.width / 2 - 14, -60, String(count), {
        fontFamily: FONT,
        fontSize: '28px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    return [badge, text];
  }

  protected furnitureAction(def: FurnitureDef) {
    if (def.action !== 'trophies') return undefined;
    return { label: '🏆 Visa pokaler', run: () => this.openTrophies() };
  }

  private openTrophies(): void {
    this.deselect();
    // Best first (gold, silver, bronze), newest first within each.
    const trophies = [...SaveService.get().team.trophies]
      .reverse()
      .sort((a, b) => a.place - b.place);
    const modal = this.add.container(0, 0).setDepth(60000);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0);
    shade.setInteractive();
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.background, 1).fillRoundedRect(30, 150, GAME_WIDTH - 60, 1000, 36);
    const title = this.add
      .text(GAME_WIDTH / 2, 215, 'Prisskåpet', {
        fontFamily: FONT,
        fontSize: '52px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    modal.add([shade, bg, title]);
    if (!trophies.length) {
      modal.add(
        this.add
          .text(GAME_WIDTH / 2, 560, 'Inga pokaler än.\nVinn en plats på pallen\ni Tävlingsdag!', {
            fontFamily: FONT,
            fontSize: '36px',
            color: COLORS.textMuted,
            align: 'center',
          })
          .setOrigin(0.5),
      );
    }
    const perRow = 4;
    const cell = (GAME_WIDTH - 120) / perRow;
    trophies.slice(0, 16).forEach((t, i) => {
      const x = 60 + cell * ((i % perRow) + 0.5);
      const y = 360 + Math.floor(i / perRow) * 175;
      modal.add(trophyView(this, x, y, 135, t.place));
      modal.add(
        this.add
          .text(x, y + 82, t.date.slice(5), {
            fontFamily: FONT,
            fontSize: '22px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
    });
    if (trophies.length > 16) {
      modal.add(
        this.add
          .text(GAME_WIDTH / 2, 1000, `+ ${trophies.length - 16} till`, {
            fontFamily: FONT,
            fontSize: '28px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
    }
    modal.add(
      createButton(this, GAME_WIDTH / 2, 1080, 'Stäng', () => modal.destroy(), {
        width: 260,
        color: 0x6b5a85,
      }),
    );
    pin(modal);
  }

  protected placeables(): Placeable[] {
    const { clubhouse, pets } = SaveService.get();
    // The active gymnast hangs out here too: drag her, tap her for Mitt lag.
    const gymnast = SaveService.activeGymnast();
    const gPos = clubhouse.pets[GYMNAST_KEY] ?? { x: 130, y: FLOOR_Y + 60 };
    const gymnastItem: Placeable = {
      id: `pet:${GYMNAST_KEY}`,
      width: 150,
      height: GYMNAST_H,
      x: gPos.x,
      y: gPos.y,
      foot: GYMNAST_H * 0.47,
      build: () => {
        const view = new GymnastView(this, 0, 0, GYMNAST_H, gymnast, 'chill');
        this.children.remove(view); // the room container owns it
        return [view];
      },
      onTap: () => this.scene.start('AvatarEditor'),
    };
    const petItems = pets.map((pet, i): Placeable => {
      const size = Math.round(GYMNAST_H * petSpecies(pet.species).roomSize);
      const pos = clubhouse.pets[pet.id] ?? {
        x: 300 + (i % 3) * 140,
        y: 900 + Math.floor(i / 3) * 120,
      };
      return {
        id: `pet:${pet.id}`,
        width: size * 0.7,
        height: size * 0.9,
        x: pos.x,
        y: pos.y,
        build: () => {
          const view = new PetView(this, 0, 0, size, pet.species, pet.color);
          this.children.remove(view); // the room container owns it
          const name = this.add
            .text(0, size * 0.45 + 14, pet.name, {
              fontFamily: FONT,
              fontSize: '24px',
              color: '#3a2a4a',
              fontStyle: 'bold',
            })
            .setOrigin(0.5);
          return [view, name];
        },
        foot: size * 0.47,
        onTap: () => this.scene.start('Pets', { petId: pet.id }),
      };
    });
    return [gymnastItem, ...petItems];
  }

  protected savePosition(id: string, pos: Position): void {
    SaveService.update((data) => {
      if (id.startsWith('pet:')) data.clubhouse.pets[id.slice(4)] = pos;
    });
  }
}
