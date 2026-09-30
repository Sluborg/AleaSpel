# How the Claude sessions work together

Two Claude Code sessions build AleaSpel at the same time. Stefan (the parent) relays between them
and ChatGPT. Every session reads this file at start and follows it.

## Roles

| Session          | Owns                                                                                | Talks to            |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------- |
| Feature session  | Game features: pets, houses and club house, gym, minigames, medals and shop, menus  | Stefan              |
| Art session      | All image assets, the art pipeline, the character systems (wardrobe, face, preview) | Stefan, via ChatGPT |
| ChatGPT (images) | Generates images from prompts the art session writes                                | Stefan              |

The art session writes the ChatGPT prompts itself. Stefan only pastes prompts into ChatGPT and
pastes the images back to the art session with their id.

## File ownership

Only the owner edits these. The other session asks through `docs/art-requests.md` or Stefan.

- **Art session:** `assets/`, `public/assets/`, `scripts/art/`, `docs/asset-spec.md`,
  `docs/image-prompts.md`, `src/data/wardrobe.ts`, `src/data/wardrobe.json`,
  `src/scenes/WardrobeScene.ts`, `src/ui/GymnastView.ts`, `src/ui/itemBounds.ts`,
  `src/preview/`, `preview/`.
- **Feature session:** `src/scenes/Pets*`, `src/scenes/pets/`, `src/scenes/Home*`,
  `src/scenes/Gym*`, `src/scenes/MinigameHub*`, `src/data/pets*`, `src/data/furniture.ts`,
  `src/data/menu.ts`, `src/services/PetCare.ts`, `src/ui/PetView.ts`, `src/ui/petSvg.ts`,
  `docs/game-design.md`, `research/`.
- **Shared, small careful commits:** `src/services/SaveService.ts`, `src/main.ts`,
  `src/scenes/PreloadScene.ts`, `src/scenes/AvatarEditorScene.ts`, `src/ui/Button.ts`,
  `src/ui/NameInput.ts`, `src/config.ts`, `CLAUDE.md`, `project-status.md`, `docs/art-requests.md`.

## Asking for art: `docs/art-requests.md`

1. The feature session adds a row to `docs/art-requests.md`: id, what it is, where it is used,
   and the technical format it needs (canvas, pose, layers, tint or full colour). The game keeps
   working with placeholders until the art arrives.
2. The art session turns the request into ChatGPT prompts, adds them to the queue in
   `docs/image-prompts.md`, and gives Stefan the next prompt when he asks ("ny prompt").
3. When the image arrives, the art session checks it, extracts it, adds it to
   `public/assets/manifest.json`, validates, pushes, and sets the request to Done with the
   manifest ids.
4. The feature session switches from the placeholder to the manifest ids. Code must fall back to
   the placeholder when an id is missing, so the game never breaks.

## Contract between the sessions

- **Manifest ids are the interface.** The feature session never reads art files directly; it uses
  texture keys = manifest ids, loaded by `PreloadScene`.
- **Formats** are defined in `docs/asset-spec.md` (characters and wardrobe) and in each request
  (pets, furniture, icons). The art session may improve a format; it tells the feature session
  through the request row.
- **Save schema:** whoever changes `SaveData` bumps `SAVE_VERSION`, adds a migration, and pulls
  first. Never two schema changes in parallel: announce it in `project-status.md` under
  "In progress" before starting.

## Git

- Push directly to `main` (allowed for now). `git pull --rebase origin main` before every push.
- Small commits, one feature or asset per commit. CI must stay green (lint, format, validate:art,
  build).
- After a push, test the live site with the headless browser (Playwright, Pixel 7) and show
  Stefan screenshots.

## Status

`project-status.md` has one section per session ("Feature session", "Art session") with "In
progress" and "Next". Each session edits only its own section, plus the shared "Done" list.
