# AleaSpel, conventions

Mobile web game for a child. Gymnastics theme, inspired by Avatar World and Toca Boca World:
avatar editor (a gymnast), own house and own gym with drag-and-drop, gymnastics minigames
(beam, bars, vault, trampoline), practice in the gym and beat your best.

## Stack

- Phaser 3 + Vite + TypeScript (strict). Phaser is pinned to major 3.
- PWA via `vite-plugin-pwa`, `registerType: 'autoUpdate'` (installed app always loads latest).
- ESLint (flat config, typescript-eslint) + Prettier. Run `npm run lint` and `npm run format:check`
  before committing; CI runs both.
- Save data: `src/services/SaveService.ts` (localStorage, versioned schema).

## Folder layout

```
src/
  main.ts            Phaser game config, SW registration, zoom/scroll blocking
  config.ts          design resolution, colors, MIN_TOUCH
  scenes/            Boot, Preload, MainMenu, AvatarEditor, Home, Gym, MinigameHub
                     BaseScene (title, back button), PlaceholderScene (empty scenes)
  data/              game content as data (menu, furniture, asset manifest types)
  services/          SaveService and other non-visual services
  ui/                reusable UI widgets (Button)
public/
  assets/manifest.json   asset list, read by Preload
  icon*.png, icon.svg    placeholder app icons (scripts/gen-icons.mjs)
.github/workflows/deploy.yml
```

## Rules

- **Data-driven.** Avatar parts, furniture, gym equipment and minigames are defined as data in
  `src/data/*.ts` (or JSON). Adding one must be a data row, not new code. If a new item needs new
  code, generalize the code once, then keep adding rows.
- **Placeholder graphics only.** Graphics are not decided. Draw shapes and colors in code
  (Phaser Graphics/Shapes). Do not download or add art, sprites, fonts or asset libraries.
- **Assets, when they arrive:** put files in `public/assets/` and add an entry to
  `public/assets/manifest.json` with `id, category, layer, file, license, source`. Preload loads
  every entry. No asset without license and source.
- **Save schema.** Changing `SaveData` means: bump `SAVE_VERSION`, add a migration in
  `MIGRATIONS[oldVersion]`. Never break existing saves.

## Mobile

- Portrait, design resolution 720x1280, `Phaser.Scale.FIT`, centered.
- Touch first. Touch targets at least `MIN_TOUCH` (110 design units, about 55 CSS px on a 360px
  phone, above the 48px minimum).
- No pinch zoom, double-tap zoom or page scroll (viewport meta, `touch-action: none`, listeners
  in `main.ts`).
- Main menu shows the version: `package.json` version + short commit hash, injected at build time
  as `__APP_VERSION__`.
- UI text in Swedish (the player is Swedish). Code, comments and docs in English.

## Deploy flow

- Push to `main` triggers `.github/workflows/deploy.yml`: `npm ci`, lint, format check, build,
  upload `dist/` with `actions/upload-pages-artifact`, deploy with `actions/deploy-pages`.
  It can also be run by hand (workflow_dispatch).
- Vite `base` comes from the `BASE_PATH` env var, which the workflow derives from
  `GITHUB_REPOSITORY` (repo name casing preserved). Local builds default to `/`.
- Live URL: https://sluborg.github.io/AleaSpel/
