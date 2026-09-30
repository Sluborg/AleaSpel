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

| Order | Item                                                                                       | Status |
| ----- | ------------------------------------------------------------------------------------------ | ------ |
| 10    | CI on pull requests (lint, format, validate:art, build) and a Codex review test            | Done   |
| 20    | Trophies: Tävlingsdag places give cups (gold, silver, bronze) shown in Prisskåp (save v14) | Done   |
| 30    | Leaner UI in Lead's screens (Mitt lag, Tävlingar, Butiken, Lagets djur): smaller buttons   | Done   |
| 40    | Lagfest: a party in Klubbstugan (Fest look, disco light, dancing pets), unlocked by a win  | Done   |
| 50    | Gym upgrades in Butiken (new apparatus colours and extra mats as data rows)                | Done   |
| 60    | House exterior editor with the delivered `ext_*` and `garden_*` art                        | Done   |

## Round log

| Time (UTC) | Release | What happened                                                                                                                                                         |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21:35      | (next)  | Round 1: PR CI (#5, #9 after Codex review), trophies (#6, save v14, Codex found a UTC date bug, fixed), main menu tiles (#8, part of backlog 30). Codex reviews work. |
| 22:45      | (next)  | Round 2: leaner UI in Butiken, Tävlingar and room buttons (#10), Lagfest in Klubbstugan (#11, Codex found leaking disco tweens, fixed).                               |
| 23:05      | (next)  | Round 3: Gym tab in Butiken with colour variants of apparatus and mats (#12).                                                                                         |
| 23:24      | (next)  | Round 4: Trädgården, house exterior builder and garden (no save change, v15 stays with Visuals).                                                                      |
