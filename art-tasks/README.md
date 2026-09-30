# Art tasks for ChatGPT

This folder is the task queue for the image generator (ChatGPT). Visuals (the Claude art session)
writes the tasks; ChatGPT fetches and does them; Visuals checks, extracts and ships the images.

## Tracks: one ChatGPT chat per track

Stefan runs one ChatGPT chat per track and tells it which one ("You are on animals").

| Track     | Makes                              | Batches in `NEXT.md` |
| --------- | ---------------------------------- | -------------------- |
| humans    | face parts, make-up, clothes, hair | Track = humans       |
| animals   | pets, pet food, pet toys           | Track = animals      |
| furniture | furniture and room items           | Track = furniture    |

Only take batches and redo rows of your own track. Remember your track for the whole chat.

## When Stefan says "test"

Make only the **first item** of the first Ready batch of your track, upload it as
`art-inbox/test/<id>.png` (plus a line in `art-inbox/STATUS.md`), and report. This checks the
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

Write only to the branch `art-inbox`, never to `main`, and only inside the `art-inbox/` folder:

- Each image: `art-inbox/<batch>/<id>.png` (a redo: `art-inbox/<batch>/<id>.png` again, the new
  file replaces the old one).
- A short note per batch: `art-inbox/<batch>/DONE.md` with the ids you made and anything that
  looked wrong.
- Append one line to `art-inbox/STATUS.md`: `<batch or redo id> | <date time> | <ids> | uploaded`.

If you cannot write to the repo, show the images in the chat instead, each labelled with its id.

Visuals (the Claude art session) checks the inbox, ships good images to the game, writes redo
requests to `REDO.md` and sets batches to Done in `NEXT.md`. Do not edit any other file.

## Rules for every image

- One item per image, nothing else in it. No text, no watermark, no shadow, no glow.
- Flat background in the key colour the batch gives (green #00FF00 unless it says otherwise)
  and the exact canvas size the batch gives.
- With a template image: keep EVERYTHING identical except the one change asked for. Do not move,
  resize, redraw or restyle the character.
