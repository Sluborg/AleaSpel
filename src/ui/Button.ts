import Phaser from 'phaser';
import { COLORS, FONT, MIN_TOUCH } from '../config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  color?: number;
  icon?: string; // manifest id drawn on a button without a label (round icon button)
  emoji?: string; // shown instead of the icon when its art is missing
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

  // Text buttons are text only (art next to the label looked crowded); an icon is drawn only on a
  // button without a label (round icon buttons), with the emoji as its fallback.
  const iconOnly = !label && !!options.icon && scene.textures.exists(options.icon);
  const shown = label || (iconOnly ? '' : (options.emoji ?? ''));
  const text = scene.add
    .text(0, 0, shown, {
      fontFamily: FONT,
      fontSize: `${options.fontSize ?? 44}px`,
      color: COLORS.text,
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);
  // Keep the label inside the pill: clear of the round ends and the top and bottom.
  const room = Math.min(width - height * 0.45, width * 0.88);
  const fit = Math.min(
    1,
    room / Math.max(1, text.width),
    (height * 0.8) / Math.max(1, text.height),
  );
  text.setScale(fit);

  const container = scene.add.container(x, y, [bg.object, text]);
  if (iconOnly) {
    const size = Math.min(width, height) * 0.58;
    const img = scene.add.image(0, 0, options.icon!);
    img.setScale(Math.min(size / img.width, size / img.height));
    container.add(img);
  }
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
  if (width <= height * 1.15 && scene.textures.exists(ROUND_KEY)) {
    // Always a true circle: a slightly wider or taller button must not stretch it into an oval.
    const d = Math.min(width, height);
    const disc = scene.add.image(0, 0, ROUND_KEY).setDisplaySize(d, d);
    return { object: disc, paint: (fill) => disc.setTint(fill) };
  }
  if (webgl && scene.textures.exists(BUTTON_KEY)) {
    const frameH = scene.textures.getFrame(BUTTON_KEY).height;
    const scale = height / frameH;
    // Round ends: half the pill height, so they keep their shape at any width.
    const cap = Math.ceil(frameH / 2);
    const sliceW = Math.max(width / scale, cap * 2);
    const pill = scene.add.nineslice(0, 0, BUTTON_KEY, undefined, sliceW, 0, cap, cap);
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
