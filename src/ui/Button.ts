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

  const bg = buttonBackground(scene, width, height);
  const draw = (fill: number) => bg.paint(fill);
  draw(color);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${options.fontSize ?? 44}px`,
      color: COLORS.text,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg.object, text]);
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

// Art pill (ui_button: white, shaded, tinted with the colour) as a 3-slice, so the round ends keep
// their shape at any width. The drawn rounded rectangle stays as the fallback when the texture is
// missing or the renderer is Canvas (NineSlice is WebGL only).
const BUTTON_KEY = 'ui_button';
const BUTTON_CAP = 88;
const ROUND_KEY = 'ui_button_round';

export interface ButtonBackground {
  object: Phaser.GameObjects.GameObject;
  paint: (fill: number) => void;
}

export function buttonBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
): ButtonBackground {
  const webgl = scene.game.renderer.type === Phaser.WEBGL;
  // Near-square buttons (back, icons): the round art, since the pill caps would meet in a seam.
  if (width < height * 1.4 && scene.textures.exists(ROUND_KEY)) {
    const disc = scene.add.image(0, 0, ROUND_KEY).setDisplaySize(width, height);
    return { object: disc, paint: (fill) => disc.setTint(fill) };
  }
  if (webgl && scene.textures.exists(BUTTON_KEY)) {
    const frameH = scene.textures.getFrame(BUTTON_KEY).height;
    const scale = height / frameH;
    const sliceW = Math.max(width / scale, BUTTON_CAP * 2);
    const pill = scene.add.nineslice(
      0,
      0,
      BUTTON_KEY,
      undefined,
      sliceW,
      0,
      BUTTON_CAP,
      BUTTON_CAP,
    );
    pill.setScale(width / sliceW, scale);
    return { object: pill, paint: (fill) => pill.setTint(fill) };
  }
  const g = scene.add.graphics();
  return {
    object: g,
    paint: (fill) => {
      g.clear();
      g.fillStyle(fill, 1);
      g.fillRoundedRect(-width / 2, -height / 2, width, height, 28);
    },
  };
}
