import { COLORS, FONT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { SaveService, createGymnast } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { openNameInput } from '../ui/NameInput';
import { DEFAULT_OCCASION, OCCASIONS } from '../data/occasions';
import { BaseScene } from './BaseScene';

const MAX_GYMNASTS = 8;
const VIEW_Y = 640;
const VIEW_H = 700;
const LOOKS_Y = 1065;
const BUTTONS_Y = 1190;

// The look shown last time, so coming back from Garderob keeps it.
let shownOccasion = DEFAULT_OCCASION;

// "Mitt lag": the team's selection screen. Choose a gymnast (◀ name ▶), browse her looks (one per
// occasion: Vardag, Träning, Tävling, Fest, Chill) by tapping a look or swiping her, and "Ändra"
// opens Garderob for that look. The shown gymnast is the active one (used in Tävlingar).
export class AvatarEditorScene extends BaseScene {
  private layer?: Phaser.GameObjects.Container;

  constructor() {
    super('AvatarEditor');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Mitt lag');
    this.addBackButton();
    this.build();
  }

  private build(): void {
    this.layer?.destroy();
    const layer = this.add.container(0, 0);
    this.layer = layer;
    const save = SaveService.get();
    const gymnast = SaveService.activeGymnast();
    const index = save.gymnasts.indexOf(gymnast);
    const n = save.gymnasts.length;

    // Gymnast switcher: ◀ name ▶
    const name = this.add
      .text(GAME_WIDTH / 2, 215, gymnast.name, {
        fontFamily: FONT,
        fontSize: '44px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    name.setScale(Math.min(1, 380 / name.width));
    layer.add(name);
    if (n > 1) {
      layer.add(
        this.add
          .text(GAME_WIDTH / 2, 262, `${index + 1} av ${n}`, {
            fontFamily: FONT,
            fontSize: '24px',
            color: COLORS.textMuted,
          })
          .setOrigin(0.5),
      );
      const go = (d: number) => {
        const next = save.gymnasts[(index + d + n) % n];
        SaveService.update((data) => (data.activeGymnastId = next.id));
        this.build();
      };
      layer.add(createButton(this, 90, 230, '◀', () => go(-1), { width: MIN_TOUCH }));
      layer.add(createButton(this, GAME_WIDTH - 90, 230, '▶', () => go(1), { width: MIN_TOUCH }));
    }

    // The gymnast, big, wearing the chosen look. Tap = Ändra; swipe = next/previous look.
    const glow = this.add.ellipse(
      GAME_WIDTH / 2,
      VIEW_Y + VIEW_H / 2 - 20,
      360,
      70,
      0x000000,
      0.18,
    );
    layer.add(glow);
    const view = new GymnastView(this, GAME_WIDTH / 2, VIEW_Y, VIEW_H, gymnast, shownOccasion);
    view.setSize(420, VIEW_H).setInteractive({ useHandCursor: true });
    let downX: number | undefined;
    view.on('pointerdown', (p: Phaser.Input.Pointer) => (downX = p.x));
    view.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx = downX === undefined ? 0 : p.x - downX;
      downX = undefined;
      if (Math.abs(dx) > 60) this.stepLook(dx < 0 ? 1 : -1);
      else this.openWardrobe(gymnast.id);
    });
    void view.play('happy').then(() => view.play('idle'));
    layer.add(view);

    // Look cards, one per occasion.
    const w = (GAME_WIDTH - 40) / OCCASIONS.length;
    OCCASIONS.forEach((o, i) => {
      const selected = o.id === shownOccasion;
      const x = 20 + w * (i + 0.5);
      const c = this.add.container(x, LOOKS_Y);
      const g = this.add.graphics();
      g.fillStyle(selected ? COLORS.primary : 0x3a2752, 1).fillRoundedRect(
        -w / 2 + 5,
        -60,
        w - 10,
        120,
        26,
      );
      if (selected)
        g.lineStyle(5, 0xffffff, 0.9).strokeRoundedRect(-w / 2 + 5, -60, w - 10, 120, 26);
      const icon = this.add.text(0, -18, o.icon, { fontSize: '40px' }).setOrigin(0.5);
      const label = this.add
        .text(0, 34, o.name, {
          fontFamily: FONT,
          fontSize: '24px',
          color: COLORS.text,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      label.setScale(Math.min(1, (w - 20) / label.width));
      c.add([g, icon, label]);
      c.setSize(w - 10, 120).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => {
        if (o.id === shownOccasion) return;
        shownOccasion = o.id;
        this.build();
      });
      layer.add(c);
    });

    // Actions.
    layer.add(
      createButton(
        this,
        135,
        BUTTONS_Y,
        'Byt namn',
        () =>
          openNameInput(this, gymnast.name, (newName) => {
            // gymnast is the object inside the save data.
            SaveService.update(() => {
              gymnast.name = newName;
            });
            this.build();
          }),
        { width: 230, fontSize: 30, color: 0x6b5a85 },
      ),
    );
    layer.add(
      createButton(this, GAME_WIDTH / 2, BUTTONS_Y, 'Ändra', () => this.openWardrobe(gymnast.id), {
        width: 200,
        fontSize: 40,
      }),
    );
    if (n < MAX_GYMNASTS) {
      layer.add(
        createButton(this, GAME_WIDTH - 135, BUTTONS_Y, '+ Ny', () => this.addGymnast(), {
          width: 230,
          fontSize: 30,
          color: 0x6b5a85,
        }),
      );
    }
  }

  private stepLook(d: number): void {
    const i = OCCASIONS.findIndex((o) => o.id === shownOccasion);
    shownOccasion = OCCASIONS[(i + d + OCCASIONS.length) % OCCASIONS.length].id;
    this.build();
  }

  private addGymnast(): void {
    const save = SaveService.get();
    const nextIndex =
      Math.max(0, ...save.gymnasts.map((g) => Number(g.id.replace(/\D/g, '')) || 0)) + 1;
    const gymnast = createGymnast(nextIndex);
    openNameInput(
      this,
      gymnast.name,
      (newName) => {
        gymnast.name = newName;
        this.saveNew(gymnast);
      },
      { title: 'Vad ska hon heta?', onCancel: () => this.saveNew(gymnast) },
    );
  }

  private saveNew(gymnast: ReturnType<typeof createGymnast>): void {
    SaveService.update((data) => {
      data.gymnasts.push(gymnast);
      data.activeGymnastId = gymnast.id;
    });
    this.build();
  }

  // Garderob opens on the look shown here (Art reads `occasion`; older builds ignore it).
  private openWardrobe(gymnastId: string): void {
    this.scene.start('Wardrobe', { gymnastId, occasion: shownOccasion });
  }
}
