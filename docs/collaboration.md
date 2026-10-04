# How the Claude sessions work together

Two Claude Code sessions build AleaSpel at the same time: **Lead** (features, game design, coordination) and **Art** (art and the character systems; called "Visuals" before 2026-10-01). Stefan (the parent) relays between them
and ChatGPT. Every session reads this file at start and follows it.

## Roles

| Session          | Owns                                                                                | Talks to            |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------- |
| Lead             | Game features: pets, houses and club house, gym, minigames, medals and shop, menus  | Stefan              |
| Art              | All image assets, the art pipeline, the character systems (wardrobe, face, preview) | Stefan, via ChatGPT |
| ChatGPT (images) | Generates images from prompts Art writes                                            | Stefan              |

Art writes the ChatGPT prompts itself. Stefan only pastes prompts into ChatGPT and
pastes the images back to Art with their id.

## File ownership

Only the owner edits these. The other session asks through `docs/art-requests.md` or Stefan.

- **Art:** `assets/`, `public/assets/`, `scripts/art/`, `docs/asset-spec.md`,
  `docs/image-prompts.md`, `src/data/wardrobe.ts`, `src/data/wardrobe.json`,
  `src/scenes/WardrobeScene.ts`, `src/ui/GymnastView.ts`, `src/ui/itemBounds.ts`,
  `src/preview/`, `preview/`.
- **Lead:** `src/scenes/Pets*`, `src/scenes/pets/`, `src/scenes/Home*`,
  `src/scenes/Gym*`, `src/scenes/MinigameHub*`, `src/data/pets*`, `src/data/furniture.ts`,
  `src/data/menu.ts`, `src/services/PetCare.ts`, `src/ui/PetView.ts`, `src/ui/petSvg.ts`,
  `docs/game-design.md`, `research/`.
- **Shared, small careful commits:** `src/services/SaveService.ts`, `src/main.ts`,
  `src/scenes/PreloadScene.ts`, `src/scenes/AvatarEditorScene.ts`, `src/ui/Button.ts`,
  `src/ui/NameInput.ts`, `src/config.ts`, `CLAUDE.md`, `project-status.md`, `docs/art-requests.md`,
  `docs/art-discussion.md` (append-only), `art-tasks/` is Art's (ChatGPT fetches it).

## Talking to each other: `docs/art-discussion.md`

Questions, proposals and answers between the sessions go into `docs/art-discussion.md`
(append-only entries, `Lead:` / `Art:` with date, `[closed]` when settled). Pull before
reading and before writing. Decisions that change a file still go into that file.

**Every wake and every round starts by reading the new entries in `docs/art-discussion.md`**
(and the art request rows). Each new request or question is handled the same round: answered in
the discussion, done, or turned into a row in `docs/art-requests.md` / the own backlog. "No work"
is only true when the discussion has no unanswered entry for you. Lead never asks for art only in
the discussion: every art need also gets a row in `docs/art-requests.md`.

## Waking each other: GitHub wake bells

Each session has a draft pull request it is subscribed to (never merged). A comment on it wakes
that session within about a minute, even when it is idle:

| Session | Wake bell                                |
| ------- | ---------------------------------------- |
| Lead    | PR #3 "AleaSpel Lead wake"               |
| Art     | PR #4 "AleaSpel Art wake"                |
| ChatGPT | PR #2 "AleaSpel art wake" (Art rings it) |

**Comments on these PRs do not wake anyone** (all sessions post as the same GitHub account, so
the harness filters them as self-echo). Ring with a one-shot `create_trigger` into the session
instead (`persistent_session_id`, `run_once_at` a minute ahead, prompt `wake <name>: <why>`), and
keep the PR comment as the written record. Session ids: Lead `session_01XFc1h6xcno9eKzt7nhpEGs`,
Art `session_01T2RPzmrwk1maGKgdCJNgty`, Helper `session_018N565cwXhLebHdc4tWJ1F7`.

First line of the comment: `wake lead: <why>` or `wake art: <why>` (`wake visuals:` still works). The details stay in
`docs/art-discussion.md`; the comment only rings the bell. Ring when the other side must act
before its next round (blocked, a push that needs a check, a question that cannot wait).

## Asking for art: `docs/art-requests.md`

1. Lead adds a row to `docs/art-requests.md`: id, what it is, where it is used,
   and the technical format it needs (canvas, pose, layers, tint or full colour). The game keeps
   working with placeholders until the art arrives.
2. Art turns the request into ChatGPT prompts, adds them to the queue in
   `docs/image-prompts.md`, and gives Stefan the next prompt when he asks ("ny prompt").
3. When the image arrives, Art checks it, extracts it, adds it to
   `public/assets/manifest.json`, validates, pushes, and sets the request to Done with the
   manifest ids.
4. Lead switches from the placeholder to the manifest ids. Code must fall back to
   the placeholder when an id is missing, so the game never breaks.

## Contract between the sessions

- **Manifest ids are the interface.** Lead never reads art files directly; it uses
  texture keys = manifest ids, loaded by `PreloadScene`.
- **Formats** are defined in `docs/asset-spec.md` (characters and wardrobe) and in each request
  (pets, furniture, icons). Art may improve a format; it tells Lead
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

`project-status.md` has one section per session ("Lead", "Art") with "In
progress" and "Next". Each session edits only its own section, plus the shared "Done" list.
