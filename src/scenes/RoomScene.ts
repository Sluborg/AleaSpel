import Phaser from 'phaser';
import { COLORS } from '../config';
import type { Position } from '../services/SaveService';
import { BaseScene } from './BaseScene';

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// One draggable thing in a room. `build` returns the children of its container (centred at 0,0).
export interface Placeable {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  build: () => Phaser.GameObjects.GameObject[];
  onTap?: () => void;
}

const TAP_DISTANCE = 14; // a drag shorter than this counts as a tap

// Base for rooms with drag-and-drop (Mina hus, Mitt gym, Klubbstugan): places items, keeps them
// inside the room, sorts depth by y, saves positions on drop and turns short drags into taps.
export abstract class RoomScene extends BaseScene {
  protected abstract readonly title: string;
  private dragFrom = new Map<string, Position>();

  protected abstract bounds(): Bounds;
  protected abstract drawRoom(): void;
  protected abstract placeables(): Placeable[];
  protected abstract savePosition(id: string, pos: Position): void;
  // Extra scene setup after the items exist (buttons, hints).
  protected afterBuild(): void {}

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawRoom();
    this.addTitle(this.title);
    this.addBackButton();
    for (const item of this.placeables()) this.place(item);
    this.sortByDepth();
    this.afterBuild();

    const b = this.bounds();
    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      this.dragFrom.set(obj.getData('id') as string, { x: obj.x, y: obj.y });
      obj.setScale(1.06).setDepth(900);
    });
    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, x: number, y: number) => {
        obj.setPosition(
          Phaser.Math.Clamp(x, b.left + obj.width / 2, b.right - obj.width / 2),
          Phaser.Math.Clamp(y, b.top + obj.height / 2, b.bottom - obj.height / 2),
        );
      },
    );
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      obj.setScale(1);
      this.sortByDepth();
      const id = obj.getData('id') as string;
      const from = this.dragFrom.get(id);
      const moved = from ? Phaser.Math.Distance.Between(from.x, from.y, obj.x, obj.y) : 0;
      const onTap = obj.getData('onTap') as (() => void) | undefined;
      if (moved < TAP_DISTANCE && onTap) {
        if (from) obj.setPosition(from.x, from.y);
        onTap();
        return;
      }
      this.savePosition(id, { x: Math.round(obj.x), y: Math.round(obj.y) });
    });
  }

  private place(item: Placeable): void {
    const container = this.add.container(item.x, item.y, item.build());
    container.setSize(item.width, item.height);
    container.setData({ id: item.id, onTap: item.onTap });
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
