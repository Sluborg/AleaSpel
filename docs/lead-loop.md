# Lead loop (rounds while Stefan is away)

Lead works in rounds of about 40 minutes. Goal: features that make the game more fun for a
9-year-old, tested on a phone-size browser, without breaking what exists.

## Keep-alive

- **First thing in every round:** schedule the next round (`send_later`, about 40 minutes). A
  round that crashes or times out still leaves the next one scheduled, so the loop never stops.
- **Wake bell:** PR #3 "AleaSpel Lead wake". Visuals (or Stefan) comments there to wake Lead now.

## Each round

1. **Sync:** fetch `main`, read new entries in `docs/art-discussion.md`, answer Visuals.
2. **Work:** the top open item of the backlog, small enough for one round.
3. **Branch and PR:** features go on a branch with a pull request (CI runs lint, format,
   `validate:art` and build on it). Ask Codex for a review (`@codex review`) on bigger changes.
4. **Test:** lint, format, typecheck, build, then Playwright (Pixel 7) on every touched screen,
   screenshots looked at. Routine test runs can go to a smaller model (Agent, `sonnet`/`haiku`).
5. **Review:** re-read the diff (skills: `code-review`, `simplify`, `verify` for acceptance).
6. **Merge** to `main` when green, reviewed and tested; update `docs/game-design.md` and
   `project-status.md`.
7. **Log** one line per round below (with the release name the deploy got).

## Safety rules

- Save changes: bump `SAVE_VERSION`, add a migration, announce in `docs/art-discussion.md`.
- Never touch Visuals' files; ask in the discussion.
- A change that fails its tests twice is reverted and logged, not pushed half-done.

## Backlog (top first)

| Order | Item                                                                                        | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------ |
| 10    | CI on pull requests (lint, format, validate:art, build) and a Codex review test             | Done   |
| 20    | Trophies: Tävlingsdag places give cups (gold, silver, bronze) shown in Prisskåp (save v14)  | Done   |
| 30    | Leaner UI in Lead's screens (Mitt lag, Tävlingar, Butiken, Lagets djur): smaller buttons    | Done   |
| 40    | Lagfest: a party in Klubbstugan (Fest look, disco light, dancing pets), unlocked by a win   | Done   |
| 50    | Gym upgrades in Butiken (new apparatus colours and extra mats as data rows)                 | Done   |
| 60    | House exterior editor with the delivered `ext_*` and `garden_*` art                         | Done   |
| 70    | Tap reactions: tapping furniture plays a small reaction (emoji, bounce), data per row       | Done   |
| 80    | Fredagspaket: a weekly gift with new cute things (needs a save version, ask Visuals first)  | Done   |
| 90    | Garden extras when art arrives (art request 100): dog house, trampoline, pond, swing        | Open   |
| 100   | Para ihop: a memory pairs warm-up (challenge + data row)                                    | Done   |
| 110   | Samlarboken: sticker album filled by games, gifts and secrets (save v17, after Visuals v16) | Open   |
| 120   | Pet minigame polish: check the pet games against Alea's wishes, add one new pet game        | Done   |

## Round log

| Time (UTC) | Release   | What happened                                                                                                                                                                |
| ---------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21:35      | (next)    | Round 1: PR CI (#5, #9 after Codex review), trophies (#6, save v14, Codex found a UTC date bug, fixed), main menu tiles (#8, part of backlog 30). Codex reviews work.        |
| 22:45      | (next)    | Round 2: leaner UI in Butiken, Tävlingar and room buttons (#10), Lagfest in Klubbstugan (#11, Codex found leaking disco tweens, fixed).                                      |
| 23:05      | (next)    | Round 3: Gym tab in Butiken with colour variants of apparatus and mats (#12).                                                                                                |
| 23:24      | (next)    | Round 4: Trädgården, house exterior builder and garden (no save change, v15 stays with Visuals).                                                                             |
| 00:07      | Kiki (97) | Round 5: Trädgården live (#13, Codex found a starter-garden bug, fixed). New backlog 70-90. Asked Visuals about save v15/v16.                                                |
| 00:49      | (next)    | Round 6: tap reactions (#14), Fredagspaket with save v15 (#15; Visuals takes v16). Codex hit its usage limit; the local code-review skill found a gift-box angle bug, fixed. |
| 01:30      | (next)    | Round 7: Para ihop memory warm-up (#16); /code-review found a card-flip race, fixed. Codex still at its usage limit.                                                         |
| 02:11      | (next)    | Round 8: Bubblor pet game and round-button labels (#17, Visuals' note); /code-review caught that the first label fix missed the layer bar, fixed.                            |
