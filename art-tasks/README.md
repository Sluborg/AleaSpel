# Art tasks for ChatGPT

This folder is the task queue for the image generator (ChatGPT). Visuals (the Claude art session)
writes the tasks; ChatGPT fetches and does them; Visuals checks, extracts and ships the images.

## Tracks: one ChatGPT chat per track

Stefan runs one ChatGPT chat per track and tells it which one ("You are on animals").

| Track     | Makes                                 | Batches in `NEXT.md` |
| --------- | ------------------------------------- | -------------------- |
| humans    | face parts, make-up, clothes, hair    | Track = humans       |
| animals   | pets, pet food, pet toys              | Track = animals      |
| furniture | furniture, gym equipment, house parts | Track = furniture    |
| scenes    | backdrops and environments            | Track = scenes       |
| ui        | icons and UI pieces                   | Track = ui           |

Only take batches and redo rows of your own track. Remember your track for the whole chat.
Every chat also follows the shared house style in `art-tasks/STYLE.md` (read it once).

## When Stefan says "test"

Make only the **first item** of the first Ready batch of your track, upload it as
``test--<id>.png` in the Drive folder` (plus a line in `art-inbox/STATUS.md`), and report. This checks the
format and the upload before a full batch. It does not count as making the batch.

## When Stefan says "next"

1. Fetch `https://raw.githubusercontent.com/Sluborg/AleaSpel/main/art-tasks/REDO.md` and `https://raw.githubusercontent.com/Sluborg/AleaSpel/main/art-tasks/NEXT.md` (add `?t=<time>` so you get
   the latest version).
2. Also read `art-inbox/STATUS.md` on the branch `art-inbox` (your own log, see below).
3. Pick the work, in this order:
   - rows of your track in `REDO.md` with status **Open** that are not in your STATUS log as redone;
   - otherwise the first batch of your track in `NEXT.md` with status **Ready** that is not in your STATUS
     log.
4. Fetch the batch file (for example `art-tasks/B2.md`) and the template image it names. If you
   cannot fetch the template, stop and ask Stefan to attach it. Never work from memory or from
   an image you edited earlier.
5. Make every item as its own separate image, following the batch text exactly.
6. Deliver (below), then reply with a short report: batch, ids uploaded, anything that looked
   wrong to you.

## When Stefan says "run all"

Do "next" again and again without waiting, until `REDO.md` has no open rows for you and
`NEXT.md` has no Ready batch left that is not in your STATUS log. Then report once. If an upload
fails, stop and report.

## Delivering the images

**Images go to Google Drive** (full size, unchanged PNG, proven 2026-09-30):

- Folder: **AleaSpel art-inbox** (https://drive.google.com/drive/folders/108WT-CO5kNPCo8yfW-zOHM2QO3DQtiAl).
- File name: `<batch>--<id>.png`, for example `B2--mouth_smile.png`, `test--pet_cat.png`. A redo
  uses the same name again (upload the new file; Visuals takes the newest).
- Never resize, crop, convert to JPEG or recompress.

**Notes go to GitHub**, branch `art-inbox` only (never `main`), text files only:

- Append one line to `art-inbox/STATUS.md`: `<batch or redo id> | <date time> | <ids> | uploaded`.
- Optional note per batch: `art-inbox/<batch>/DONE.md` (anything that looked wrong).

Fallbacks if Drive fails: upload the PNG to GitHub `art-inbox/<batch>/<id>.png`; if that is too
large, as base64 text `art-inbox/<batch>/<id>.png.b64` (split into `.b64.001`, `.002`, ... if
needed). Last resort: show the images in the chat, each labelled with its id.

**Template images:** your GitHub tool may not be able to read PNGs. If you cannot fetch a
template, ask Stefan to attach it once in the chat and reuse that attachment for the whole
batch.

Visuals (the Claude art session) copies the Drive images into `art-inbox`, reviews them, ships
good ones to the game, writes redo requests to `REDO.md` and sets batches to Done in `NEXT.md`.
Do not edit any other file.

## Rules for every image

- One item per image, nothing else in it. No text, no watermark, no shadow, no glow.
- Flat background in the key colour the batch gives (green #00FF00 unless it says otherwise)
  and the exact canvas size the batch gives.
- With a template image: keep EVERYTHING identical except the one change asked for. Do not move,
  resize, redraw or restyle the character.
