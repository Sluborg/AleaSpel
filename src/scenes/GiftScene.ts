import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ASSET_MANIFEST_KEY, type AssetManifest } from '../data/assets';
import { FURNITURE } from '../data/furniture';
import type { ShopItem } from '../data/shop';
import { daysToFriday, openGift, waitingGifts, type GiftReward } from '../services/Gifts';
import { applyHue, artImage, backdrop, hasArt, medalLabel } from '../ui/art';
import { createButton } from '../ui/Button';
import { furnitureArtKey } from '../ui/furnitureView';
import { BaseScene } from './BaseScene';

const BOX_Y = 640;
const TAPS_TO_OPEN = 3;

const WHERE: Record<ShopItem['kind'], string> = {
  furniture: 'Den ligger i förrådet.',
  gym: 'Den står i gymmet.',
  clothes: 'Den finns i garderoben.',
};

// Fredagspaket: tap the box a few times, it opens with confetti and shows what was inside.
export class GiftScene extends BaseScene {
  private box?: Phaser.GameObjects.Container;
  private lid?: Phaser.GameObjects.Container;
  private boxArt?: Phaser.GameObjects.Image;
  private taps = 0;

  constructor() {
    super('Gift');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    if (backdrop(this, 'bg_welcome')) {
      this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 0.6)
        .setOrigin(0)
        .setDepth(-50000);
    }
    this.addTitle('Fredagspaket');
    this.addBackButton();
    this.taps = 0;
    const waiting = waitingGifts();
    this.drawBox(waiting > 0);
    if (!waiting) {
      const days = daysToFriday();
      this.say(
        days === 7
          ? 'Nästa paket kommer\nnästa fredag! 🎁'
          : `Nästa paket kommer\nom ${days} ${days === 1 ? 'dag' : 'dagar'}! 🎁`,
      );
      return;
    }
    this.say(waiting > 1 ? `${waiting} paket väntar!\nTryck på paketet!` : 'Tryck på paketet!');
  }

  private say(text: string): Phaser.GameObjects.Text {
    return this.add
      .text(GAME_WIDTH / 2, 1000, text, {
        fontFamily: FONT,
        fontSize: '44px',
        color: COLORS.text,
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setName('say');
  }

  private drawBox(active: boolean): void {
    // Delivered art (ui_gift, swapped for ui_gift_open when it opens), else a drawn box.
    if (hasArt(this, 'ui_gift')) {
      this.boxArt = artImage(this, 0, 0, 'ui_gift', 380, 380);
      if (!active) this.boxArt.setTint(0x9a8fb0).setAlpha(0.8);
      this.lid = undefined;
      this.box = this.add.container(GAME_WIDTH / 2, BOX_Y, [this.boxArt]);
    } else {
      this.boxArt = undefined;
      this.drawnBox(active);
    }
    this.box!.setSize(380, 380).setInteractive({ useHandCursor: true });
    if (!active) return;
    this.tweens.add({
      targets: this.box,
      y: BOX_Y - 20,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.box!.on('pointerup', () => this.tapBox());
  }

  private drawnBox(active: boolean): void {
    const body = this.add.graphics();
    const colour = active ? 0xff6fae : 0x8a7aa5;
    body.fillStyle(0x000000, 0.2).fillRoundedRect(-150, -60, 300, 230, 24);
    body.fillStyle(colour, 1).fillRoundedRect(-160, -80, 320, 240, 24);
    body.fillStyle(0xffd84d, 1).fillRect(-25, -80, 50, 240);
    const lidG = this.add.graphics();
    lidG.fillStyle(colour, 1).fillRoundedRect(-180, -60, 360, 70, 20);
    lidG.fillStyle(0xffd84d, 1).fillRect(-25, -60, 50, 70);
    lidG.fillStyle(0xffd84d, 1).fillEllipse(-50, -75, 90, 50).fillEllipse(50, -75, 90, 50);
    lidG.fillStyle(0xffb000, 1).fillCircle(0, -70, 20);
    this.lid = this.add.container(0, -60, [lidG]);
    this.box = this.add.container(GAME_WIDTH / 2, BOX_Y, [body, this.lid]);
  }

  private tapBox(): void {
    if (!this.box || this.taps >= TAPS_TO_OPEN) return;
    this.taps++;
    this.tweens.add({
      targets: this.box,
      angle: { from: -8 * this.taps, to: 8 * this.taps },
      duration: 70,
      yoyo: true,
      repeat: 1,
      onComplete: () => this.box?.setAngle(0),
    });
    if (this.taps < TAPS_TO_OPEN) return;
    const manifest = this.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined;
    const reward = openGift(manifest);
    if (!reward) return;
    this.box.disableInteractive();
    this.tweens.killTweensOf(this.box);
    this.box.setAngle(0).setY(BOX_Y);
    this.time.delayedCall(300, () => this.reveal(reward));
  }

  private reveal(reward: GiftReward): void {
    (this.children.getByName('say') as Phaser.GameObjects.Text | null)?.destroy();
    if (this.boxArt) {
      // Same centre; the open box is a little wider (the lid sits to the right).
      const open = artImage(this, 0, 0, 'ui_gift_open', 420, 420);
      this.boxArt.destroy();
      this.box?.add(open);
      open.setScale(open.scale * 0.8);
      this.tweens.add({ targets: open, scale: open.scale * 1.25, duration: 300, ease: 'Back.out' });
    }
    if (this.lid)
      this.tweens.add({
        targets: this.lid,
        y: -420,
        angle: 30,
        alpha: 0,
        duration: 500,
        ease: 'Back.in',
      });
    this.confetti();
    const c = this.add.container(GAME_WIDTH / 2, BOX_Y - 230).setDepth(10);
    const glow = this.add.circle(0, 0, 170, 0xffffff, 0.35);
    c.add(glow);
    c.add(this.rewardPicture(reward.item));
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 500, delay: 250, ease: 'Back.out' });
    this.tweens.add({ targets: glow, scale: 1.15, duration: 700, yoyo: true, repeat: -1 });

    const name = reward.item ? `Du fick: ${reward.item.name}!` : 'Du fick medaljer!';
    const garden = FURNITURE.find((f) => f.id === reward.item?.id)?.room === 'garden';
    const where = garden
      ? 'Den ligger i trädgårdens förråd.'
      : reward.item
        ? WHERE[reward.item.kind]
        : '';
    this.add
      .text(GAME_WIDTH / 2, 940, `${name}\n${where}`, {
        fontFamily: FONT,
        fontSize: '42px',
        color: COLORS.text,
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    medalLabel(this, GAME_WIDTH / 2, 1040, `+${reward.medals}`, {
      fontFamily: FONT,
      fontSize: '44px',
      color: '#ffd84d',
      fontStyle: 'bold',
    });
    const more = waitingGifts() > 0;
    createButton(
      this,
      GAME_WIDTH / 2,
      1170,
      more ? 'Öppna nästa 🎁' : 'Klar',
      () => this.scene.start(more ? 'Gift' : 'MainMenu'),
      { width: 400, fontSize: 40 },
    );
  }

  private rewardPicture(item: ShopItem | undefined): Phaser.GameObjects.GameObject {
    if (!item) return this.add.text(0, 0, '🏅', { fontSize: '160px' }).setOrigin(0.5);
    const def = FURNITURE.find((f) => f.id === item.id);
    const key = item.art ?? (def ? (furnitureArtKey(this, def) ?? '') : item.id);
    if (hasArt(this, key)) return applyHue(artImage(this, 0, 0, key, 280, 280), item.hue);
    return this.add.text(0, 0, item.icon, { fontSize: '160px' }).setOrigin(0.5);
  }

  private confetti(): void {
    const colours = [0xff6fae, 0xffd84d, 0x7ec8ff, 0x9ad97a, 0xc9a2ff];
    for (let i = 0; i < 40; i++) {
      const p = this.add
        .rectangle(GAME_WIDTH / 2, BOX_Y - 60, 18, 10, colours[i % colours.length])
        .setDepth(20)
        .setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({
        targets: p,
        x: GAME_WIDTH / 2 + Phaser.Math.Between(-340, 340),
        y: BOX_Y - Phaser.Math.Between(150, 560),
        angle: p.angle + Phaser.Math.Between(-360, 360),
        duration: 700,
        ease: 'Cubic.out',
        onComplete: () =>
          this.tweens.add({
            targets: p,
            y: GAME_HEIGHT + 40,
            duration: Phaser.Math.Between(1200, 2000),
            ease: 'Sine.in',
            onComplete: () => p.destroy(),
          }),
      });
    }
  }
}
