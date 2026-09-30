import Phaser from 'phaser';

const DRAG_THRESHOLD = 12;

// Vertical drag-to-scroll container clipped to a viewport. Put items into `content`.
// Taps still reach children: check `wasDragged()` in a child's pointerup to ignore scroll drags.
export class ScrollList {
  readonly content: Phaser.GameObjects.Container;
  private readonly maskShape: Phaser.GameObjects.Graphics;
  private contentHeight = 0;
  private dragStartY = 0;
  private startScroll = 0;
  private dragging = false;
  private dragged = false;
  private readonly handlers: [string, (...args: never[]) => void][];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly top: number,
    private readonly bottom: number,
  ) {
    this.content = scene.add.container(0, top);
    this.maskShape = scene.make.graphics({}, false);
    this.maskShape.fillStyle(0xffffff).fillRect(0, top, scene.scale.width, bottom - top);
    this.content.setMask(this.maskShape.createGeometryMask());

    this.handlers = [
      [
        'pointerdown',
        (p: Phaser.Input.Pointer) => {
          this.dragged = false;
          if (p.y < top || p.y > bottom) return;
          this.dragging = true;
          this.dragStartY = p.y;
          this.startScroll = this.content.y;
        },
      ],
      [
        'pointermove',
        (p: Phaser.Input.Pointer) => {
          if (!this.dragging || !p.isDown) return;
          if (Math.abs(p.y - this.dragStartY) > DRAG_THRESHOLD) this.dragged = true;
          if (this.dragged) this.scrollTo(this.startScroll + (p.y - this.dragStartY));
        },
      ],
      ['pointerup', () => (this.dragging = false)],
      [
        'wheel',
        (_p: unknown, _o: unknown, _dx: number, dy: number) => this.scrollTo(this.content.y - dy),
      ],
    ];
    for (const [event, fn] of this.handlers) scene.input.on(event, fn);
  }

  setContentHeight(h: number): void {
    this.contentHeight = h;
    this.scrollTo(this.content.y);
  }

  // Keep the list (and its clip) fixed on screen in a scene whose camera scrolls.
  setScrollFactor(f: number): this {
    this.content.setScrollFactor(f);
    this.maskShape.setScrollFactor(f);
    return this;
  }

  setDepth(d: number): this {
    this.content.setDepth(d);
    return this;
  }

  // True when the current or last pointer gesture scrolled the list (not a tap).
  wasDragged(): boolean {
    return this.dragged;
  }

  destroy(): void {
    for (const [event, fn] of this.handlers) this.scene.input.off(event, fn);
    this.content.destroy();
    this.maskShape.destroy();
  }

  private scrollTo(y: number): void {
    const minY = Math.min(this.top, this.bottom - this.contentHeight);
    this.content.y = Phaser.Math.Clamp(y, minY, this.top);
  }
}
