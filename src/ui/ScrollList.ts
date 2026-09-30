import Phaser from 'phaser';

// Vertical drag-to-scroll container clipped to a viewport. Put items into `content`.
// Taps still reach children: a pointer that moves less than the drag threshold is not a scroll.
export class ScrollList {
  readonly content: Phaser.GameObjects.Container;
  private contentHeight = 0;
  private dragStartY = 0;
  private startScroll = 0;
  private dragging = false;

  constructor(
    scene: Phaser.Scene,
    private readonly top: number,
    private readonly bottom: number,
  ) {
    this.content = scene.add.container(0, top);
    const mask = scene.make.graphics({}, false);
    mask.fillStyle(0xffffff).fillRect(0, top, scene.scale.width, bottom - top);
    this.content.setMask(mask.createGeometryMask());

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < top || p.y > bottom) return;
      this.dragging = true;
      this.dragStartY = p.y;
      this.startScroll = this.content.y;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      this.scrollTo(this.startScroll + (p.y - this.dragStartY));
    });
    scene.input.on('pointerup', () => (this.dragging = false));
    scene.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) =>
      this.scrollTo(this.content.y - dy),
    );
  }

  setContentHeight(h: number): void {
    this.contentHeight = h;
    this.scrollTo(this.content.y);
  }

  private scrollTo(y: number): void {
    const minY = Math.min(this.top, this.bottom - this.contentHeight);
    this.content.y = Phaser.Math.Clamp(y, minY, this.top);
  }
}
