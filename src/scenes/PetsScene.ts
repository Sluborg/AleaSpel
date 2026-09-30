import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { PET_FOODS, PET_GAMES, type PetFood, type PetGame } from '../data/petActivities';
import { PET_COLORS, PET_SPECIES, petSpecies } from '../data/pets';
import { applyDecay, care, react, rollTraits, wish } from '../services/PetCare';
import { SaveService, type Pet, type PetNeeds } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { openNameInput } from '../ui/NameInput';
import { PetView } from '../ui/PetView';
import { BaseScene } from './BaseScene';
import { PET_GAME_RUNNERS } from './pets/petGames';

const PET_X = GAME_WIDTH / 2;
const PET_Y = 540;
const PET_SIZE = 460;
const FLOOR_Y = 760;
const PANEL = 0x3a2752;

const NEEDS: { key: keyof PetNeeds; label: string; color: number; wish: string }[] = [
  { key: 'food', label: 'Mat', color: 0xffa24c, wish: 'Jag är hungrig!' },
  { key: 'clean', label: 'Ren', color: 0x5aa9ff, wish: 'Borsta mig!' },
  { key: 'fun', label: 'Lek', color: 0x7ed957, wish: 'Vi leker!' },
];

// How a pet reacts to a game or food it loves (1), likes (0) or does not like (-1).
const REACTIONS: Record<number, { text: string; symbol: string; game: number; food: number }> = {
  1: { text: 'Älskar det!', symbol: '❤', game: 30, food: 45 },
  0: { text: 'Kul!', symbol: '⭐', game: 15, food: 30 },
  [-1]: { text: 'Nja...', symbol: '💤', game: 5, food: 15 },
};
const FOOD_TEXT: Record<number, string> = { 1: 'Mums!', 0: 'Gott!', [-1]: 'Nja...' };
const MARK: Record<number, string> = { 1: '❤', 0: '🙂', [-1]: '✗' };

type Mode = 'idle' | 'brush' | 'game';

// Lagets djur: the team's pets. Adopt, name, feed, brush, cuddle and play games.
// Every pet has a secret personality: it loves, likes or dislikes each game and food.
export class PetsScene extends BaseScene {
  private index = 0;
  private mode: Mode = 'idle';
  private layer?: Phaser.GameObjects.Container;
  private pet?: PetView;
  private bars: Phaser.GameObjects.Graphics[] = [];
  private bubble?: Phaser.GameObjects.Container;
  private busy = false;
  private cleanup?: () => void;

  constructor() {
    super('Pets');
  }

  create(data: { petId?: string } = {}): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.mode = 'idle';
    this.addTitle('Lagets djur');
    this.addBackButton();
    const pets = SaveService.get().pets;
    SaveService.update(() => pets.forEach((p) => applyDecay(p)));
    const wanted = pets.findIndex((p) => p.id === data.petId);
    if (wanted >= 0) this.index = wanted;
    this.index = Math.min(this.index, Math.max(0, pets.length - 1));
    this.events.once('shutdown', () => this.cleanup?.());
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
    this.cleanup?.();
    this.cleanup = undefined;
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
    if (this.mode === 'idle') this.idleBounce();

    if (this.mode !== 'idle') return;

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

    const action = (
      x: number,
      y: number,
      label: string,
      fn: () => void,
      width = 200,
      color?: number,
    ) => this.layer!.add(createButton(this, x, y, label, fn, { width, fontSize: 36, color }));
    action(130, 1070, 'Mata', () => this.openFoods());
    action(360, 1070, 'Borsta', () => this.startBrush());
    action(590, 1070, 'Leka', () => this.openGames());
    action(215, 1200, 'Om mig', () => this.openAbout(), 290, 0x6b5a85);
    action(505, 1200, '+ Nytt djur', () => this.openAdopt(), 290, 0x6b5a85);
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
      bar.fillStyle(PANEL, 1).fillRoundedRect(x, 960, 180, 28, 14);
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

  private sparkle(x: number, y: number, symbol = '❤', count = 4): void {
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

  private say(text: string): void {
    const t = this.text(GAME_WIDTH / 2, 300, text, 52, '#6b4a55').setDepth(60);
    this.tweens.add({
      targets: t,
      y: 260,
      alpha: 0,
      duration: 1600,
      delay: 600,
      onComplete: () => t.destroy(),
    });
  }

  private hop(onDone?: () => void, height = 60): void {
    if (!this.pet) return;
    this.tweens.add({
      targets: this.pet,
      y: PET_Y - height,
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
    const bubble = this.add.container(GAME_WIDTH / 2 + 150, 250).setDepth(40);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillRoundedRect(-150, -45, 300, 90, 40);
    g.fillCircle(-90, 60, 14).fillCircle(-115, 85, 8);
    bubble.add([g, this.text(0, 0, text, 32, '#6b4a55')]);
    this.bubble = bubble;
    this.layer?.add(bubble);
  }

  // --- care --------------------------------------------------------------

  private onPetTap(): void {
    const pet = this.current();
    if (!pet || this.mode !== 'idle') return;
    this.sparkle(PET_X, PET_Y - 120, '❤', 3);
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

  private feed(food: PetFood): void {
    const pet = this.current();
    if (!pet || this.busy) return;
    this.busy = true;
    const bowl = this.add
      .container(PET_X + 70, FLOOR_Y + 10)
      .setDepth(30)
      .setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0xff6fae, 1).fillEllipse(0, 0, 150, 50);
    bowl.add([g, this.add.text(0, -30, food.icon, { fontSize: '56px' }).setOrigin(0.5)]);
    this.tweens.add({ targets: bowl, alpha: 1, duration: 200 });
    const liking = react(pet, food.id);
    const r = REACTIONS[liking];
    this.time.delayedCall(300, () =>
      this.hop(
        () =>
          this.hop(() => {
            this.say(FOOD_TEXT[liking]);
            this.sparkle(PET_X, PET_Y - 120, liking === 1 ? '😋' : r.symbol, liking === 1 ? 6 : 3);
            this.tweens.add({
              targets: bowl,
              alpha: 0,
              duration: 400,
              delay: 500,
              onComplete: () => bowl.destroy(),
            });
            this.busy = false;
            this.save(() => care(pet, 'food', r.food));
          }, 30),
        30,
      ),
    );
  }

  private startBrush(): void {
    const pet = this.current();
    if (!pet) return;
    this.mode = 'brush';
    this.build();
    this.layer!.add(this.text(GAME_WIDTH / 2, 230, 'Dra fingret över djuret', 34, '#6b4a55'));
    this.layer!.add(
      createButton(this, GAME_WIDTH / 2, 1070, 'Klar', () => this.backToIdle(), { width: 240 }),
    );
    let last: Phaser.Math.Vector2 | null = null;
    let dist = 0;
    const move = (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return (last = null);
      if (Phaser.Math.Distance.Between(p.x, p.y, PET_X, PET_Y) > PET_SIZE * 0.42) return;
      if (last) dist += Phaser.Math.Distance.Between(p.x, p.y, last.x, last.y);
      last = new Phaser.Math.Vector2(p.x, p.y);
      if (dist > 60) {
        dist = 0;
        this.sparkle(p.x, p.y, '✨', 1);
        SaveService.update(() => care(pet, 'clean', 4));
        if (pet.needs.clean >= 100) {
          this.sparkle(PET_X, PET_Y - 120, '❤', 5);
          this.say('Så fin!');
          this.time.delayedCall(700, () => this.backToIdle());
        }
      }
    };
    this.input.on('pointermove', move);
    this.cleanup = () => this.input.off('pointermove', move);
  }

  private startGame(game: PetGame): void {
    const pet = this.current();
    if (!pet) return;
    this.mode = 'game';
    this.build();
    const hint = this.text(GAME_WIDTH / 2, 215, '', 34, '#6b4a55');
    this.layer!.add(hint);
    this.layer!.add(this.text(GAME_WIDTH / 2, 900, `${game.icon} ${game.name}`, 48, COLORS.text));
    this.layer!.add(
      createButton(this, GAME_WIDTH / 2, 1200, 'Sluta', () => this.backToIdle(), {
        width: 240,
        color: 0x6b5a85,
      }),
    );
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      const liking = react(pet, game.id);
      const r = REACTIONS[liking];
      this.say(r.text);
      this.sparkle(PET_X, PET_Y - 120, r.symbol, liking === 1 ? 6 : 3);
      SaveService.update(() => care(pet, 'fun', r.game));
      this.time.delayedCall(1400, () => this.backToIdle());
    };
    this.cleanup = PET_GAME_RUNNERS[game.kind]({
      scene: this,
      pet: this.pet!,
      home: { x: PET_X, y: PET_Y },
      floorY: FLOOR_Y,
      width: GAME_WIDTH,
      add: (obj) => this.layer?.add(obj),
      hint: (t) => hint.setText(t),
      sparkle: (x, y, symbol, count) => this.sparkle(x, y, symbol, count),
      finish,
    });
  }

  private backToIdle(): void {
    this.mode = 'idle';
    this.build();
  }

  // --- pickers -----------------------------------------------------------

  private modal(title: string): Phaser.GameObjects.Container {
    const modal = this.add.container(0, 0).setDepth(1500);
    const dim = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setOrigin(0)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.background, 1).fillRoundedRect(30, 150, GAME_WIDTH - 60, 1000, 36);
    modal.add([dim, panel, this.text(GAME_WIDTH / 2, 220, title, 50, COLORS.text)]);
    modal.add(
      createButton(this, GAME_WIDTH / 2, 1060, 'Stäng', () => modal.destroy(), {
        width: 280,
        color: 0x6b5a85,
      }),
    );
    return modal;
  }

  // Grid of icon tiles; known likes are marked so the player learns the personality.
  private tiles(
    modal: Phaser.GameObjects.Container,
    rows: { id: string; icon: string; name: string }[],
    perRow: number,
    onPick: (id: string) => void,
  ): void {
    const pet = this.current()!;
    const w = perRow === 2 ? 280 : 150;
    const h = perRow === 2 ? 220 : 180;
    rows.forEach((row, i) => {
      const x = GAME_WIDTH / 2 + ((i % perRow) - (perRow - 1) / 2) * (w + 20);
      const y = 390 + Math.floor(i / perRow) * (h + 20);
      const g = this.add.graphics();
      g.fillStyle(0xf6e7d2, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 26);
      const icon = this.add.text(x, y - 25, row.icon, { fontSize: '72px' }).setOrigin(0.5);
      const label = this.text(x, y + h / 2 - 32, row.name, 28, '#6b4a55');
      modal.add([g, icon, label]);
      if (pet.known.includes(row.id)) {
        modal.add(
          this.text(x + w / 2 - 28, y - h / 2 + 28, MARK[pet.traits[row.id] ?? 0], 32, '#ff4f7b'),
        );
      }
      const hit = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        modal.destroy();
        onPick(row.id);
      });
      modal.add(hit);
    });
  }

  private openFoods(): void {
    const modal = this.modal('Vad vill du ge?');
    this.tiles(modal, PET_FOODS, 4, (id) => this.feed(PET_FOODS.find((f) => f.id === id)!));
  }

  private openGames(): void {
    const modal = this.modal('Vilken lek?');
    this.tiles(modal, PET_GAMES, 2, (id) => this.startGame(PET_GAMES.find((g) => g.id === id)!));
  }

  private openAbout(): void {
    const pet = this.current();
    if (!pet) return;
    const modal = this.modal(`Om ${pet.name}`);
    const all = [...PET_GAMES, ...PET_FOODS];
    const known = all.filter((a) => pet.known.includes(a.id));
    const groups: { label: string; value: number }[] = [
      { label: 'Älskar', value: 1 },
      { label: 'Gillar', value: 0 },
      { label: 'Gillar inte', value: -1 },
    ];
    let y = 320;
    for (const grp of groups) {
      const items = known.filter((a) => (pet.traits[a.id] ?? 0) === grp.value);
      modal.add(
        this.text(80, y, `${MARK[grp.value]} ${grp.label}`, 36, COLORS.text).setOrigin(0, 0.5),
      );
      y += 40;
      const line = items.length ? items.map((a) => `${a.icon} ${a.name}`).join('   ') : '...';
      const t = this.add
        .text(80, y, line, {
          fontFamily: FONT,
          fontSize: '32px',
          color: COLORS.textMuted,
          wordWrap: { width: GAME_WIDTH - 160 },
        })
        .setOrigin(0, 0);
      modal.add(t);
      y += Math.max(90, t.height + 60);
    }
    const secrets = all.length - known.length;
    modal.add(
      this.text(
        GAME_WIDTH / 2,
        960,
        secrets ? `🤫 ${secrets} hemligheter kvar att upptäcka` : '🎉 Du känner djuret helt!',
        32,
        COLORS.text,
      ),
    );
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
              traits: rollTraits(species),
              known: [],
            });
            this.index = pets.length - 1;
          }, true);
          this.sparkle(PET_X, PET_Y - 120, '❤', 6);
        };
        openNameInput(this, sp.defaultName, adopt, {
          title: 'Vad heter djuret?',
          onCancel: () => adopt(sp.defaultName),
        });
      }),
    );
  }
}
