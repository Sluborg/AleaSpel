// Main menu entries, shown as a grid of tiles. Add a row to add a menu tile.
export interface MenuEntry {
  scene: string;
  label: string;
  icon: string; // emoji until menu icons arrive
  color: number; // tile colour
}

export const MENU_ENTRIES: MenuEntry[] = [
  { scene: 'AvatarEditor', label: 'Mitt lag', icon: '👯', color: 0xff8fc0 },
  { scene: 'Home', label: 'Mina hus', icon: '🏠', color: 0xffb36b },
  { scene: 'Clubhouse', label: 'Klubbstugan', icon: '🏡', color: 0x9ad97a },
  { scene: 'Gym', label: 'Mitt gym', icon: '🤸', color: 0x7ec8ff },
  { scene: 'MinigameHub', label: 'Tävlingar', icon: '🏆', color: 0xffd84d },
  { scene: 'Pets', label: 'Lagets djur', icon: '🐾', color: 0xc9a2ff },
  { scene: 'Shop', label: 'Butiken', icon: '🛍️', color: 0xff9aa2 },
];
