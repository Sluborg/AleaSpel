# AleaSpel, project status

Updated 2026-09-30. Read this first when resuming ("continue from project-status.md").

## Live

- Game: https://sluborg.github.io/AleaSpel/ (installable PWA, auto-updates)
- Wardrobe preview (dev tool): https://sluborg.github.io/AleaSpel/preview/
- Deploy: every push to `main` (CI: lint, format, validate:art, build, Pages). Direct pushes to
  `main` are allowed for now.

## Done

- Scaffold: Phaser 3 + Vite + TS, PWA, GitHub Pages deploy, version on the menu.
- Main menu: Mitt lag, Mina hus, Mitt gym, Tävlingar, Mina djur.
- Mina hus: one room, 3 placeholder furniture shapes, touch drag, positions saved.
- Research: `research/` (Alea interview, Avatar World, Toca Boca World).
- Design: `docs/game-design.md` (pillars, team, houses, gym, gesture minigames, pets, roadmap).
- Character art pipeline (`docs/asset-spec.md`):
  - Master character from ChatGPT on green, keyed in code, anchors and mask derived.
  - `scripts/art/extract-item.mjs`: one ChatGPT prompt per garment (pink key colour), extracted
    and made tintable. Proven with `leotard_basic` (0 px shift).
  - `npm run validate:art` enforces the spec in CI.
- Mitt lag + Garderob: Gymnast 1, rename, wear/remove clothes per category, 12 colours.
  Save schema v2 (gymnasts + outfits), v1 saves migrate.
- Verified on Alea's phone 2026-09-30: gymnast shows, rename works, clothes and colours work.
- Lagets djur (pets belong to the team): adopt, name, feed 8 foods, brush, cuddle, 6 games with
  interactions, secret personality discovered by playing. Save schema v4.
- Tävlingar: pattern matcher (`services/Gesture.ts`, templates in `data/gestureShapes.ts`),
  Studsmatta minigame (5 jumps, draw the pattern shown on the card, accuracy percent and stars,
  poses), Bom (beam stations, wobble, dismount), Barr (swing, giants, dismount) and Hopp
  (run-up, table, landing) on the shared PatternGameScene engine; medals (1 per star) and
  personal bests. Save schema v5.
  Medal count on the main menu.
- Mitt lag: several gymnasts (up to 8), each with her own outfit and records; the shown one is
  active and competes. Save schema v7.
- Klubbstugan: the team's room joined to the gym; pets sit there (drag, tap to care), active
  gymnast, door to the gym, club furniture (2 for sale). Rooms share `scenes/RoomScene.ts`.
  Save schema v9.
- Mitt gym: drag the apparatus around, tap one to practise its game (no medals). Save schema v8.
- Tävlingsdag (from Tävlingar): the whole team competes, one routine each, against three rival
  clubs; placement gives medals; wins counted. Save schema v10.
- Delivered art in use: pets, food, toys, furniture, equipment, backdrops in every room and
  minigame, medal icon, pet bowl/brush/bed/house; two new pet games (Fånga musen, Frisbee).
- Butiken: buy furniture (7 priced rows) with medals, scrollable list (`ui/ScrollList.ts`),
  bought furniture appears in Mina hus. Save schema v6 (owned). Menu entry Butiken.
- Face pipeline: `face_blank` template, `scripts/art/extract-face.mjs`, 7 eye styles in the
  Garderob tab Ögon (`eyes_round, eyes_almond, eyes_doe, eyes_blue, eyes_green, eyes_sleepy,
eyes_wink`).

## Lead

- In progress: nothing. SaveData is at v10 on my branch (owned, activeGymnastId, gym, clubhouse,
  team).
- Done on my branch: delivered art in use (pets fur+face tinted, food icons, furniture in Mina
  hus/Klubbstugan/Butiken, equipment in Mitt gym) via `src/ui/art.ts` helpers with placeholder
  fallback.
- Next: trophy in Klubbstugan per Tävlingsdag win, gym equipment upgrades in Butiken, house
  exterior editor (art for row 80 is in), remaining icons (back, pencil, plus, lock) in the UI.
- Ask to Visuals: when a priced garment exists, list it in `src/data/shop.ts` `CLOTHES_PRICES`
  and hide unowned priced items in the wardrobe (`SaveService.get().owned`).

## Visuals

- In progress: automatic art pipeline. ChatGPT reads `art-tasks/` and uploads to branch
  `art-inbox`; Visuals reviews (`scripts/art/inbox.mjs` + visual check), ships to `main`, writes
  redos to `art-tasks/REDO.md`. Batches B2-B6 Ready; `brows_soft` sent by hand.
- Next: brows and mouth layers (same pipeline as eyes), make-up layers.

## Backlog (pick one)

1. More clothes: one ChatGPT prompt per garment (template in `docs/asset-spec.md`, section 9).
   Suggested: T-shirt, shorts, dress, track jacket, gymnastics slippers, ankle socks. [0.85]
2. Wardrobe scroll for many items per tab (needed after about 7 items). [0.8]
3. Hair: the bun is baked into the master. Decide approach (hair mask image to split hair into
   its own layer). [0.7]

## Open questions

- Hair approach (see next action 4).
- Patterns on clothes (stars, stripes): second key colour as a `_detail` file.
- Sound: from the start or later?
