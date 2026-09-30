// Design resolution (portrait). Phaser Scale.FIT scales this to the screen.
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// At FIT on a 360px-wide phone the scale is 0.5, so 110 units ≈ 55 CSS px (>= 48px rule).
export const MIN_TOUCH = 110;

export const COLORS = {
  background: 0x2b1a3d,
  primary: 0xff6fae,
  primaryDark: 0xd94f8c,
  text: '#ffffff',
  textMuted: '#c9b8e0',
  wall: 0xf3e3c3,
  floor: 0xc58b5a,
  skirting: 0x8a5a36,
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
