import { COLORS, FONT, GAME_WIDTH } from '../config';
import { SaveService } from '../services/SaveService';
import { createButton } from '../ui/Button';
import { GymnastView } from '../ui/GymnastView';
import { openNameInput } from '../ui/NameInput';
import { BaseScene } from './BaseScene';

// "Mitt lag": the team. For now one card per gymnast (starts with Gymnast 1).
export class AvatarEditorScene extends BaseScene {
  constructor() {
    super('AvatarEditor');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.addTitle('Mitt lag');
    this.addBackButton();

    const gymnast = SaveService.get().gymnasts[0];
    const card = this.add.graphics();
    card.fillStyle(0x3a2752, 1);
    card.fillRoundedRect(60, 180, GAME_WIDTH - 120, 1000, 40);

    const view = new GymnastView(this, GAME_WIDTH / 2, 560, 700, gymnast);
    view.setSize(420, 640).setInteractive({ useHandCursor: true });
    view.on('pointerup', () => this.openWardrobe(gymnast.id));

    const name = this.add
      .text(GAME_WIDTH / 2, 950, gymnast.name, {
        fontFamily: FONT,
        fontSize: '52px',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    createButton(
      this,
      GAME_WIDTH / 2 - 150,
      1080,
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
    );
    createButton(
      this,
      GAME_WIDTH / 2 + 150,
      1080,
      'Garderob',
      () => this.openWardrobe(gymnast.id),
      {
        width: 280,
        fontSize: 38,
      },
    );
  }

  private openWardrobe(gymnastId: string): void {
    this.scene.start('Wardrobe', { gymnastId });
  }
}
