import Phaser from 'phaser';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { createButton } from './Button';

const MAX_LENGTH = 16;

// Modal with a text field for naming. Calls onDone with the trimmed name, or nothing on cancel.
export function openNameInput(
  scene: Phaser.Scene,
  current: string,
  onDone: (name: string) => void,
): void {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const close = () => parts.forEach((p) => p.destroy());

  const dim = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
    .setOrigin(0)
    .setInteractive()
    .setDepth(2000);
  const panel = scene.add.graphics().setDepth(2001);
  panel.fillStyle(COLORS.background, 1);
  panel.fillRoundedRect(40, 380, GAME_WIDTH - 80, 460, 36);
  const title = scene.add
    .text(GAME_WIDTH / 2, 450, 'Vad heter hon?', {
      fontFamily: FONT,
      fontSize: '48px',
      color: COLORS.text,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(2001);

  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.maxLength = MAX_LENGTH;
  input.enterKeyHint = 'done';
  input.autocomplete = 'off';
  Object.assign(input.style, {
    width: '560px',
    height: '100px',
    fontSize: '48px',
    fontFamily: FONT,
    padding: '0 24px',
    border: '4px solid #ff6fae',
    borderRadius: '24px',
    boxSizing: 'border-box',
    userSelect: 'text',
    webkitUserSelect: 'text',
    textAlign: 'center',
  });
  const dom = scene.add.dom(GAME_WIDTH / 2, 580, input).setDepth(2002);

  const confirm = () => {
    const name = input.value.trim().slice(0, MAX_LENGTH);
    close();
    if (name) onDone(name);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirm();
  });
  const ok = createButton(scene, GAME_WIDTH / 2 + 140, 740, 'Klar', confirm, { width: 240 });
  const cancel = createButton(scene, GAME_WIDTH / 2 - 140, 740, 'Avbryt', close, {
    width: 240,
    color: 0x6b5a85,
  });
  ok.setDepth(2002);
  cancel.setDepth(2002);
  parts.push(dim, panel, title, dom, ok, cancel);
  setTimeout(() => input.focus(), 50);
}
