import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GYM_EQUIPMENT, type EquipmentDef } from '../data/gymEquipment';
import { MINIGAMES } from '../data/minigames';
import { SaveService } from '../services/SaveService';
import { BaseScene } from './BaseScene';

const HALL = { left: 20, top: 250, right: GAME_WIDTH - 20, bottom: GAME_HEIGHT - 20 };
const WALL_Y = 420;
const TAP_DISTANCE = 14; // a drag shorter than this counts as a tap

// Mitt gym: the team's training hall. Drag the apparatus around; tap one to practise its
// minigame (no medals, records untouched).
export class GymScene extends BaseScene {
  private dragFrom = new Map<string, { x: number; y: number }>();

  constructor() {
    super('Gym');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawHall();
    this.addTitle('Mitt gym');
    this.addBackButton();
    this.add
      .text(GAME_WIDTH / 2, 190, 'Tryck för att träna, dra för att flytta', {
        fontFamily: FONT,
        fontSize: '28px',
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    const { gym, owned } = SaveService.get();
    for (const def of GYM_EQUIPMENT.filter((e) => !e.price || owned.includes(e.id))) {
      const pos = gym.equipment[def.id] ?? { x: def.defaultX, y: def.defaultY };
      this.createEquipment(def, pos.x, pos.y);
    }
    this.sortByDepth();

    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      this.dragFrom.set(obj.getData('id') as string, { x: obj.x, y: obj.y });
      obj.setScale(1.06).setDepth(900);
    });
    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, x: number, y: number) => {
        obj.setPosition(
          Phaser.Math.Clamp(x, HALL.left + obj.width / 2, HALL.right - obj.width / 2),
          Phaser.Math.Clamp(y, HALL.top + obj.height / 2, HALL.bottom - obj.height / 2),
        );
      },
    );
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      obj.setScale(1);
      this.sortByDepth();
      const id = obj.getData('id') as string;
      const from = this.dragFrom.get(id);
      const moved = from ? Phaser.Math.Distance.Between(from.x, from.y, obj.x, obj.y) : 0;
      if (moved < TAP_DISTANCE) {
        if (from) obj.setPosition(from.x, from.y);
        this.practise(obj.getData('minigame') as string);
        return;
      }
      SaveService.update((data) => {
        data.gym.equipment[id] = { x: Math.round(obj.x), y: Math.round(obj.y) };
      });
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

  private drawHall(): void {
    const g = this.add.graphics();
    const w = HALL.right - HALL.left;
    g.fillStyle(0xe8d3b6, 1).fillRect(HALL.left, HALL.top, w, WALL_Y - HALL.top);
    g.fillStyle(0xbfe3ff, 1);
    for (const x of [80, 300, 520]) g.fillRoundedRect(x, HALL.top + 30, 120, 110, 14);
    g.fillStyle(0x6fa8dc, 1).fillRect(HALL.left, WALL_Y, w, HALL.bottom - WALL_Y);
    g.fillStyle(0x4f8fd0, 1).fillRect(HALL.left, WALL_Y - 10, w, 10);
  }

  private createEquipment(def: EquipmentDef, x: number, y: number): void {
    const shape = this.add
      .rectangle(0, 0, def.width, def.height, def.color)
      .setStrokeStyle(4, 0x000000, 0.25);
    const label = this.add
      .text(0, 0, def.name, {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const children: Phaser.GameObjects.GameObject[] = [shape, label];
    if (def.minigame) {
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
    const container = this.add.container(x, y, children);
    container.setSize(def.width, def.height);
    container.setData({ id: def.id, minigame: def.minigame });
    container.setInteractive({ draggable: true, useHandCursor: true });
  }

  private sortByDepth(): void {
    for (const obj of this.children.list) {
      if (obj instanceof Phaser.GameObjects.Container && obj.getData('id')) {
        obj.setDepth(obj.y + obj.height / 2);
      }
    }
  }
}
