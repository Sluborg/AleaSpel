// Main menu entries. Add a row to add a menu button.
export interface MenuEntry {
  scene: string;
  label: string;
}

export const MENU_ENTRIES: MenuEntry[] = [
  { scene: 'AvatarEditor', label: 'Mitt lag' },
  { scene: 'Home', label: 'Mina hus' },
  { scene: 'Gym', label: 'Mitt gym' },
  { scene: 'MinigameHub', label: 'Tävlingar' },
  { scene: 'Pets', label: 'Mina djur' },
];
