// Main menu entries. Add a row to add a menu button.
export interface MenuEntry {
  scene: string;
  label: string;
}

export const MENU_ENTRIES: MenuEntry[] = [
  { scene: 'AvatarEditor', label: 'Min gymnast' },
  { scene: 'Home', label: 'Mitt hus' },
  { scene: 'Gym', label: 'Mitt gym' },
  { scene: 'MinigameHub', label: 'Tävlingar' },
];
