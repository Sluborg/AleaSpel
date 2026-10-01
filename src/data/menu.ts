// Main menu entries, shown as a grid of tiles. Add a row to add a menu tile.
export interface MenuEntry {
  scene: string;
  label: string;
  icon: string; // emoji fallback
  art: string; // icon manifest id
  color: number; // tile colour
}

export const MENU_ENTRIES: MenuEntry[] = [
  { scene: 'AvatarEditor', art: 'icon_menu_team', label: 'Mitt lag', icon: '👯', color: 0xff8fc0 },
  { scene: 'Home', art: 'icon_menu_house', label: 'Mina hus', icon: '🏠', color: 0xffb36b },
  { scene: 'Clubhouse', art: 'icon_menu_club', label: 'Klubbstugan', icon: '🏡', color: 0x9ad97a },
  { scene: 'Gym', art: 'icon_menu_gym', label: 'Mitt gym', icon: '🤸', color: 0x7ec8ff },
  {
    scene: 'MinigameHub',
    art: 'icon_menu_compete',
    label: 'Tävlingar',
    icon: '🏆',
    color: 0xffd84d,
  },
  { scene: 'Pets', art: 'icon_menu_pets', label: 'Lagets djur', icon: '🐾', color: 0xc9a2ff },
  { scene: 'Shop', art: 'icon_menu_shop', label: 'Butiken', icon: '🛍️', color: 0xff9aa2 },
];
