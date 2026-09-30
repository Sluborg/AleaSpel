import Phaser from 'phaser';

// A trophy cup drawn in code (gold, silver or bronze by place), until trophy art arrives
// (`trophy_gold`, `trophy_silver`, `trophy_bronze`, art request row 90). Centred at (x, y).
const CUP = [0xffd84d, 0xdfe4ea, 0xd89056];
const SHADE = [0xe0a800, 0xa8b0bb, 0xa8612c];
const ART = ['trophy_gold', 'trophy_silver', 'trophy_bronze'];

export function trophyView(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  place: number,
): Phaser.GameObjects.Container {
  const i = Phaser.Math.Clamp(place - 1, 0, 2);
  const c = scene.add.container(x, y);
  if (scene.textures.exists(ART[i])) {
    const img = scene.add.image(0, 0, ART[i]);
    c.add(img.setScale(size / Math.max(img.width, img.height)));
    return c;
  }
  const s = size / 100;
  const g = scene.add.graphics();
  // Handles, bowl, stem, base.
  g.lineStyle(7 * s, SHADE[i], 1);
  g.strokeCircle(-30 * s, -18 * s, 14 * s).strokeCircle(30 * s, -18 * s, 14 * s);
  g.fillStyle(CUP[i], 1);
  g.fillRoundedRect(-30 * s, -40 * s, 60 * s, 44 * s, {
    tl: 4 * s,
    tr: 4 * s,
    bl: 26 * s,
    br: 26 * s,
  });
  g.fillRect(-6 * s, 2 * s, 12 * s, 18 * s);
  g.fillStyle(SHADE[i], 1).fillRoundedRect(-24 * s, 20 * s, 48 * s, 14 * s, 4 * s);
  g.fillStyle(0xffffff, 0.55).fillRoundedRect(-20 * s, -34 * s, 8 * s, 24 * s, 4 * s);
  c.add(g);
  c.add(
    scene.add
      .text(0, -18 * s, String(place), {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(22 * s)}px`,
        color: '#3a2a4a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );
  return c;
}
