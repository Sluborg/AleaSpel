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
- Face pipeline started: `face_blank` template in `assets/source/face/` (eyes etc. queued in
  `docs/image-prompts.md`).

## Next actions (pick one)

1. More clothes: one ChatGPT prompt per garment (template in `docs/asset-spec.md`, section 9).
   Suggested: T-shirt, shorts, dress, track jacket, gymnastics slippers, ankle socks. [0.85]
2. Wardrobe scroll for many items per tab (needed after about 7 items). [0.8]
3. More gymnasts: "+" card in Mitt lag. [0.75]
4. Hair: the bun is baked into the master. Decide approach (hair mask image to split hair into
   its own layer). [0.7]
5. First gesture minigame (trampoline, swipe patterns). [0.7]

## Open questions

- Hair approach (see next action 4).
- Patterns on clothes (stars, stripes): second key colour as a `_detail` file.
- Sound: from the start or later?
