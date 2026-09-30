import { COLORS, FONT, GAME_WIDTH, MIN_TOUCH } from '../config';
import { SaveService, createGymnast } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { openNameInput } from '../ui/NameInput';
import { BaseScene } from './BaseScene';

const MAX_GYMNASTS = 8;

// "Mitt lag": browse the team one gymnast at a time. The shown gymnast is the active one
// (used in Tävlingar). "+ Ny gymnast" adds one, "Byt namn" and "Garderob" edit her.
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

    const card = this.add.graphics();
    card.fillStyle(0x3a2752, 1);
    card.fillRoundedRect(60, 180, GAME_WIDTH - 120, 960, 40);
    layer.add(card);

    const view = new GymnastView(this, GAME_WIDTH / 2, 540, 660, gymnast);
    view.setSize(400, 620).setInteractive({ useHandCursor: true });
    view.on('pointerup', () => this.openWardrobe(gymnast.id));
    layer.add(view);

    layer.add(
      this.add
        .text(GAME_WIDTH / 2, 215, `${index + 1} av ${n}`, {
          fontFamily: FONT,
          fontSize: '30px',
          color: COLORS.textMuted,
        })
        .setOrigin(0.5),
    );

    if (n > 1) {
      const go = (d: number) => {
        const next = save.gymnasts[(index + d + n) % n];
        SaveService.update((data) => (data.activeGymnastId = next.id));
        this.build();
      };
      layer.add(createButton(this, 85, 540, '◀', () => go(-1), { width: MIN_TOUCH }));
      layer.add(createButton(this, GAME_WIDTH - 85, 540, '▶', () => go(1), { width: MIN_TOUCH }));
    }

    const name = this.add
      .text(GAME_WIDTH / 2, 910, gymnast.name, {
        fontFamily: FONT,
        fontSize: '52px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    layer.add(name);

    layer.add(
      createButton(
        this,
        GAME_WIDTH / 2 - 150,
        1040,
        'Byt namn',
        () =>
          openNameInput(this, gymnast.name, (newName) => {
            // gymnast is the object inside the save data.
            SaveService.update(() => {
              gymnast.name = newName;
            });
            name.setText(newName);
          }),
        { width: 280, fontSize: 38 },
      ),
    );
    layer.add(
      createButton(
        this,
        GAME_WIDTH / 2 + 150,
        1040,
        'Garderob',
        () => this.openWardrobe(gymnast.id),
        {
          width: 280,
          fontSize: 38,
        },
      ),
    );

    if (n < MAX_GYMNASTS) {
      layer.add(
        createButton(this, GAME_WIDTH / 2, 1200, '+ Ny gymnast', () => this.addGymnast(), {
          width: 360,
          fontSize: 36,
          color: 0x6b5a85,
        }),
      );
    }
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

  private openWardrobe(gymnastId: string): void {
    this.scene.start('Wardrobe', { gymnastId });
  }
}
