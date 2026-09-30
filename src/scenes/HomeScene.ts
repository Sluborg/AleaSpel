import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { FURNITURE, type FurnitureDef } from '../data/furniture';
import { SaveService } from '../services/SaveService';
import { BaseScene } from './BaseScene';

// Room area in design coordinates. Furniture is kept inside it.
const ROOM = { left: 20, top: 160, right: GAME_WIDTH - 20, bottom: GAME_HEIGHT - 20 };
const FLOOR_Y = 620;

export class HomeScene extends BaseScene {
  constructor() {
    super('Home');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawRoom();
    this.addTitle('Mina hus');
    this.addBackButton();

    const saved = SaveService.get().home.furniture;
    for (const def of FURNITURE) {
      const pos = saved[def.id] ?? { x: def.defaultX, y: def.defaultY };
      this.createFurniture(def, pos.x, pos.y);
    }
    this.sortByDepth();

    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, x: number, y: number) => {
        const halfW = obj.width / 2;
        const halfH = obj.height / 2;
        obj.setPosition(
          Phaser.Math.Clamp(x, ROOM.left + halfW, ROOM.right - halfW),
          Phaser.Math.Clamp(y, ROOM.top + halfH, ROOM.bottom - halfH),
        );
      },
    );
    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      obj.setScale(1.06).setDepth(900);
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      obj.setScale(1);
      this.sortByDepth();
      const id = obj.getData('id') as string;
      SaveService.update((data) => {
        data.home.furniture[id] = { x: Math.round(obj.x), y: Math.round(obj.y) };
      });
    });
  }

  private drawRoom(): void {
    const g = this.add.graphics();
    const w = ROOM.right - ROOM.left;
    g.fillStyle(COLORS.wall, 1);
    g.fillRect(ROOM.left, ROOM.top, w, FLOOR_Y - ROOM.top);
    g.fillStyle(COLORS.floor, 1);
    g.fillRect(ROOM.left, FLOOR_Y, w, ROOM.bottom - FLOOR_Y);
    g.fillStyle(COLORS.skirting, 1);
    g.fillRect(ROOM.left, FLOOR_Y - 12, w, 12);
  }

  private createFurniture(def: FurnitureDef, x: number, y: number): void {
    const shape =
      def.shape === 'ellipse'
        ? this.add.ellipse(0, 0, def.width, def.height, def.color)
        : this.add.rectangle(0, 0, def.width, def.height, def.color);
    shape.setStrokeStyle(4, 0x000000, 0.25);

    const label = this.add
      .text(0, 0, def.name, { fontFamily: FONT, fontSize: '30px', color: '#3a2a4a' })
      .setOrigin(0.5);

    const container = this.add.container(x, y, [shape, label]);
    container.setSize(def.width, def.height);
    container.setData('id', def.id);
    container.setInteractive({ draggable: true, useHandCursor: true });
  }

  // Objects lower on screen are drawn in front.
  private sortByDepth(): void {
    for (const obj of this.children.list) {
      if (obj instanceof Phaser.GameObjects.Container && obj.getData('id')) {
        obj.setDepth(obj.y + obj.height / 2);
      }
    }
  }
}
