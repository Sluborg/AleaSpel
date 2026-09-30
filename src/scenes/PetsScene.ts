import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { PET_COLORS, PET_SPECIES, petSpecies } from '../data/pets';
import { applyDecay, care, wish } from '../services/PetCare';
import { SaveService, type Pet, type PetNeeds } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { openNameInput } from '../ui/NameInput';
import { PetView } from '../ui/PetView';
import { BaseScene } from './BaseScene';

const PET_X = GAME_WIDTH / 2;
const PET_Y = 560;
const PET_SIZE = 460;
const FLOOR_Y = 760;

const NEEDS: { key: keyof PetNeeds; label: string; color: number; wish: string }[] = [
  { key: 'food', label: 'Mat', color: 0xffa24c, wish: 'Jag är hungrig!' },
  { key: 'clean', label: 'Ren', color: 0x5aa9ff, wish: 'Borsta mig!' },
  { key: 'fun', label: 'Lek', color: 0x7ed957, wish: 'Vi leker!' },
];

type Mode = 'idle' | 'brush' | 'play';

// Lagets djur: the team's pets. Adopt, name, feed, brush, pet and play.
export class PetsScene extends BaseScene {
  private index = 0;
  private mode: Mode = 'idle';
  private layer?: Phaser.GameObjects.Container;
  private pet?: PetView;
  private bars: Phaser.GameObjects.Graphics[] = [];
  private bubble?: Phaser.GameObjects.Container;
  private busy = false;

  constructor() {
    super('Pets');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.mode = 'idle';
    this.addTitle('Lagets djur');
    this.addBackButton();
    const pets = SaveService.get().pets;
    SaveService.update(() => pets.forEach((p) => applyDecay(p)));
    this.index = Math.min(this.index, Math.max(0, pets.length - 1));
    this.build();
  }

  private pets(): Pet[] {
    return SaveService.get().pets;
  }

  private current(): Pet | undefined {
    return this.pets()[this.index];
  }

  // Rebuilds everything below the title.
  private build(): void {
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);
    this.bars = [];
    this.busy = false;
    const pet = this.current();

    const room = this.add.graphics();
    room.fillStyle(0xf6e7d2, 1).fillRoundedRect(20, 170, GAME_WIDTH - 40, FLOOR_Y - 140, 36);
    room.fillStyle(0xd9b48c, 1).fillRoundedRect(20, FLOOR_Y - 90, GAME_WIDTH - 40, 140, 36);
    this.layer.add(room);

    if (!pet) {
      this.layer.add(this.text(GAME_WIDTH / 2, 420, 'Laget har inget djur än', 44, '#6b4a55'));
      this.layer.add(
        createButton(this, GAME_WIDTH / 2, 1000, 'Hämta ett djur', () => this.openAdopt()),
      );
      return;
    }

    this.pet = new PetView(this, PET_X, PET_Y, PET_SIZE, pet.species, pet.color);
    this.pet.setInteractive({ useHandCursor: true });
    this.pet.on('pointerdown', () => this.onPetTap());
    this.layer.add(this.pet);
    this.idleBounce();

    if (this.pets().length > 1) {
      const n = this.pets().length;
      const go = (d: number) => {
        this.index = (this.index + d + n) % n;
        this.build();
      };
      this.layer.add(createButton(this, 85, PET_Y, '◀', () => go(-1), { width: MIN_TOUCH }));
      this.layer.add(
        createButton(this, GAME_WIDTH - 85, PET_Y, '▶', () => go(1), { width: MIN_TOUCH }),
      );
    }

    const name = this.text(GAME_WIDTH / 2, 865, `${pet.name} ✎`, 48, COLORS.text);
    name.setInteractive({ useHandCursor: true }).on('pointerup', () =>
      openNameInput(this, pet.name, (n) => this.save(() => (pet.name = n), true), {
        title: 'Vad heter djuret?',
      }),
    );
    this.layer.add(name);

    NEEDS.forEach((need, i) => {
      const x = 130 + i * 230;
      this.layer!.add(this.text(x - 60, 930, need.label, 30, COLORS.textMuted).setOrigin(0, 0.5));
      const bar = this.add.graphics();
      bar.setData({ x: x - 60, key: need.key, color: need.color });
      this.bars.push(bar);
      this.layer!.add(bar);
    });
    this.drawBars();

    const action = (x: number, label: string, fn: () => void) =>
      this.layer!.add(createButton(this, x, 1070, label, fn, { width: 200, fontSize: 38 }));
    action(130, 'Mata', () => this.feed());
    action(360, this.mode === 'brush' ? 'Klar' : 'Borsta', () => this.toggleBrush());
    action(590, 'Leka', () => this.startPlay());
    this.layer.add(
      createButton(this, GAME_WIDTH / 2, 1200, '+ Nytt djur', () => this.openAdopt(), {
        width: 320,
        fontSize: 36,
        color: 0x6b5a85,
      }),
    );
    this.showWish();
  }

  private text(x: number, y: number, s: string, size: number, color: string) {
    return this.add
      .text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: 'bold' })
      .setOrigin(0.5);
  }

  private drawBars(): void {
    const pet = this.current();
    if (!pet) return;
    for (const bar of this.bars) {
      const x = bar.getData('x') as number;
      const v = pet.needs[bar.getData('key') as keyof PetNeeds];
      bar.clear();
      bar.fillStyle(0x3a2752, 1).fillRoundedRect(x, 960, 180, 28, 14);
      bar
        .fillStyle(bar.getData('color') as number, 1)
        .fillRoundedRect(x, 960, Math.max(28, 1.8 * v), 28, 14);
    }
  }

  private save(change: () => void, rebuild = false): void {
    SaveService.update(change);
    if (rebuild) this.build();
    else {
      this.drawBars();
      this.showWish();
    }
  }

  // --- reactions ---------------------------------------------------------

  private idleBounce(): void {
    if (!this.pet) return;
    this.tweens.add({
      targets: this.pet,
      scaleY: this.pet.scaleY * 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  private hearts(x: number, y: number, count = 4, symbol = '❤'): void {
    for (let i = 0; i < count; i++) {
      const h = this.add
        .text(x + Phaser.Math.Between(-80, 80), y, symbol, { fontSize: '44px', color: '#ff4f7b' })
        .setOrigin(0.5)
        .setDepth(50);
      this.tweens.add({
        targets: h,
        y: y - Phaser.Math.Between(120, 220),
        alpha: 0,
        duration: 1100,
        delay: i * 90,
        onComplete: () => h.destroy(),
      });
    }
  }

  private hop(onDone?: () => void, height = 60): void {
    if (!this.pet) return;
    this.tweens.add({
      targets: this.pet,
      y: this.pet.y - height,
      duration: 200,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => onDone?.(),
    });
  }

  private showWish(): void {
    this.bubble?.destroy();
    this.bubble = undefined;
    const pet = this.current();
    if (!pet || this.mode !== 'idle') return;
    const w = wish(pet);
    if (!w) return;
    const text = NEEDS.find((n) => n.key === w)!.wish;
    const bubble = this.add.container(GAME_WIDTH / 2 + 150, 270).setDepth(40);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillRoundedRect(-150, -45, 300, 90, 40);
    g.fillCircle(-90, 60, 14).fillCircle(-115, 85, 8);
    bubble.add([g, this.text(0, 0, text, 32, '#6b4a55')]);
    this.bubble = bubble;
    this.layer?.add(bubble);
  }

  // --- care actions ------------------------------------------------------

  private onPetTap(): void {
    const pet = this.current();
    if (!pet || this.mode !== 'idle') return;
    this.hearts(PET_X, PET_Y - 120, 3);
    this.tweens.add({
      targets: this.pet,
      angle: { from: -6, to: 6 },
      duration: 90,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.pet?.setAngle(0),
    });
    this.save(() => care(pet, 'fun', 4));
  }

  private feed(): void {
    const pet = this.current();
    if (!pet || this.busy || this.mode !== 'idle') return;
    this.busy = true;
    const bowl = this.add.graphics().setDepth(30);
    bowl.fillStyle(0xff6fae, 1).fillEllipse(0, 0, 150, 50);
    bowl.fillStyle(0xa8743f, 1).fillEllipse(0, -16, 110, 26);
    bowl.setPosition(PET_X + 60, FLOOR_Y + 10).setAlpha(0);
    this.tweens.add({ targets: bowl, alpha: 1, duration: 200 });
    this.time.delayedCall(250, () =>
      this.hop(
        () =>
          this.hop(
            () =>
              this.hop(() => {
                this.hearts(PET_X, PET_Y - 120, 4, '😋');
                this.tweens.add({
                  targets: bowl,
                  alpha: 0,
                  duration: 400,
                  delay: 400,
                  onComplete: () => bowl.destroy(),
                });
                this.busy = false;
                this.save(() => care(pet, 'food', 35));
              }, 30),
            30,
          ),
        30,
      ),
    );
  }

  private toggleBrush(): void {
    const pet = this.current();
    if (!pet) return;
    this.mode = this.mode === 'brush' ? 'idle' : 'brush';
    this.build();
    if (this.mode !== 'brush') return;
    this.layer!.add(this.text(GAME_WIDTH / 2, 230, 'Dra fingret över djuret', 34, '#6b4a55'));
    let last: Phaser.Math.Vector2 | null = null;
    let dist = 0;
    const move = (p: Phaser.Input.Pointer) => {
      if (!p.isDown || this.mode !== 'brush') return;
      const onPet = Phaser.Math.Distance.Between(p.x, p.y, PET_X, PET_Y) < PET_SIZE * 0.42;
      if (!onPet) return;
      if (last) dist += Phaser.Math.Distance.Between(p.x, p.y, last.x, last.y);
      last = new Phaser.Math.Vector2(p.x, p.y);
      if (dist > 60) {
        dist = 0;
        this.hearts(p.x, p.y, 1, '✨');
        this.save(() => care(pet, 'clean', 4));
        if (pet.needs.clean >= 100) {
          this.hearts(PET_X, PET_Y - 120, 5);
          this.mode = 'idle';
          this.input.off('pointermove', move);
          this.time.delayedCall(600, () => this.build());
        }
      }
    };
    this.input.on('pointermove', move);
    this.input.once('pointerup', () => (last = null));
    this.events.once('shutdown', () => this.input.off('pointermove', move));
  }

  private startPlay(): void {
    const pet = this.current();
    if (!pet || this.mode !== 'idle') return;
    this.mode = 'play';
    this.bubble?.destroy();
    const hint = this.text(GAME_WIDTH / 2, 230, 'Dra bollen och släpp', 34, '#6b4a55');
    this.layer!.add(hint);
    const ball = this.add
      .circle(150, FLOOR_Y - 20, 36, 0xff4f7b)
      .setStrokeStyle(6, 0xffffff)
      .setDepth(35);
    this.layer!.add(ball);
    ball.setInteractive({ draggable: true, useHandCursor: true });
    let throws = 0;
    ball.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => ball.setPosition(x, y));
    ball.on('dragend', () => {
      const tx = Phaser.Math.Clamp(ball.x, 120, GAME_WIDTH - 120);
      this.tweens.add({ targets: ball, x: tx, y: FLOOR_Y - 20, duration: 350, ease: 'Bounce.out' });
      this.tweens.add({
        targets: this.pet,
        x: tx,
        duration: 450,
        ease: 'Sine.inOut',
        onComplete: () =>
          this.hop(() => {
            this.hearts(this.pet!.x, PET_Y - 120, 3, '⭐');
            this.save(() => care(pet, 'fun', 15));
            throws++;
            this.tweens.add({ targets: this.pet, x: PET_X, duration: 450, delay: 200 });
            if (throws >= 3 || pet.needs.fun >= 100) {
              this.time.delayedCall(900, () => {
                this.mode = 'idle';
                this.build();
              });
            }
          }, 90),
      });
    });
  }

  // --- adoption ----------------------------------------------------------

  private openAdopt(): void {
    const modal = this.add.container(0, 0).setDepth(1500);
    const dim = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setOrigin(0)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.background, 1).fillRoundedRect(30, 150, GAME_WIDTH - 60, 1000, 36);
    modal.add([dim, panel, this.text(GAME_WIDTH / 2, 220, 'Välj ett djur', 50, COLORS.text)]);

    PET_SPECIES.forEach((sp, i) => {
      const x = 180 + (i % 3) * 180;
      const y = 400 + Math.floor(i / 3) * 290;
      const tile = this.add.graphics();
      tile.fillStyle(0xf6e7d2, 1).fillRoundedRect(x - 80, y - 110, 160, 220, 28);
      const view = new PetView(
        this,
        x,
        y - 20,
        170,
        sp.id,
        PET_COLORS[(i + 1) % PET_COLORS.length],
      );
      const label = this.text(x, y + 85, sp.name, 30, '#6b4a55');
      const hit = this.add.zone(x, y, 160, 220).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        modal.destroy();
        this.pickColor(sp.id);
      });
      modal.add([tile, view, label, hit]);
    });
    modal.add(
      createButton(this, GAME_WIDTH / 2, 1060, 'Avbryt', () => modal.destroy(), {
        width: 280,
        color: 0x6b5a85,
      }),
    );
  }

  private pickColor(species: string): void {
    const modal = this.add.container(0, 0).setDepth(1500);
    const dim = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setOrigin(0)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.background, 1).fillRoundedRect(30, 150, GAME_WIDTH - 60, 1000, 36);
    let color = PET_COLORS[1];
    const view = new PetView(this, GAME_WIDTH / 2, 470, 420, species, color);
    modal.add([dim, panel, this.text(GAME_WIDTH / 2, 220, 'Välj färg', 50, COLORS.text), view]);
    PET_COLORS.forEach((c, i) => {
      const x = GAME_WIDTH / 2 + ((i % 4) - 1.5) * 130;
      const y = 780 + Math.floor(i / 4) * 120;
      const dot = this.add
        .circle(x, y, 46, c)
        .setStrokeStyle(4, 0xffffff)
        .setInteractive({ useHandCursor: true });
      dot.on('pointerup', () => {
        color = c;
        view.setColor(c);
      });
      modal.add(dot);
    });
    modal.add(
      createButton(this, GAME_WIDTH / 2, 1060, 'Välj', () => {
        modal.destroy();
        const sp = petSpecies(species);
        const adopt = (name: string) => {
          const now = Date.now();
          this.save(() => {
            const pets = SaveService.get().pets;
            pets.push({
              id: `p${now}`,
              name,
              species,
              color,
              needs: { food: 70, clean: 70, fun: 70 },
              updatedAt: now,
            });
            this.index = pets.length - 1;
          }, true);
          this.hearts(PET_X, PET_Y - 120, 6);
        };
        openNameInput(this, sp.defaultName, adopt, {
          title: 'Vad heter djuret?',
          onCancel: () => adopt(sp.defaultName),
        });
      }),
    );
  }
}
