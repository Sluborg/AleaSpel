import Phaser from 'phaser';
import { COLORS, FONT, MIN_TOUCH } from '../config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  color?: number;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const width = Math.max(options.width ?? 440, MIN_TOUCH);
  const height = Math.max(options.height ?? MIN_TOUCH, MIN_TOUCH);
  const color = options.color ?? COLORS.primary;

  const bg = scene.add.graphics();
  const draw = (fill: number) => {
    bg.clear();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 28);
  };
  draw(color);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${options.fontSize ?? 44}px`,
      color: COLORS.text,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  container.on('pointerdown', () => {
    draw(COLORS.primaryDark);
    container.setScale(0.96);
  });
  container.on('pointerout', () => {
    draw(color);
    container.setScale(1);
  });
  container.on('pointerup', () => {
    draw(color);
    container.setScale(1);
    onClick();
  });

  return container;
}
