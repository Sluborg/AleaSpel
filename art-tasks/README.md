# Art tasks for ChatGPT

This file is the complete manual for the image generator (ChatGPT). Everything you need is here
or linked from here; it changes over time, so always fetch the latest version. Visuals (the Claude
art session) writes the tasks; you generate and upload; Visuals reviews and ships to the game.

Fetch repo files as `https://raw.githubusercontent.com/Sluborg/AleaSpel/main/<path>?t=<current time>` (the `?t=` avoids stale copies).

## Where things are

| What                  | Where                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| This manual           | `art-tasks/README.md`                                                                                    |
| House style           | `art-tasks/STYLE.md` (every image, every chat)                                                           |
| Batch list            | `art-tasks/NEXT.md` (batch, track, file, status)                                                         |
| Redo requests         | `art-tasks/REDO.md` (do these first)                                                                     |
| Batch tasks           | `art-tasks/B<n>.md` (items, canvas, key colour, template)                                                |
| Upload folder (Drive) | "AleaSpel art-inbox": https://drive.google.com/drive/folders/108WT-CO5kNPCo8yfW-zOHM2QO3DQtiAl           |
| Templates (Drive)     | "AleaSpel art-inbox/templates": https://drive.google.com/drive/folders/1d4MRdBy1BtkN96LTQPo5obbuXt5wuOeq |
| Upload log (GitHub)   | `art-inbox/STATUS.md` on branch `art-inbox`                                                              |

## Tracks: one chat per track

| Track     | Makes                                 | Template (from Drive `templates/`) |
| --------- | ------------------------------------- | ---------------------------------- |
| faces     | eyes, brows, mouths, make-up          | `face_blank-raw.png`               |
| clothes   | clothes, shoes, accessories, hair     | `master-raw.png`                   |
| animals   | pets, pet food, pet toys              | none                               |
| furniture | furniture, gym equipment, house parts | none                               |
| scenes    | backdrops and environments            | none                               |
| ui        | icons and UI pieces                   | none                               |

A chat works on one track for its whole life. Only take batches and redo rows of that track.

## Wake-ups (automatic start)

A draft pull request titled **AleaSpel art wake** (branch `art-wake`) is the wake-up bell. Visuals
pushes a commit to it when there is new work; `art-wake/TRACKS.md` on that branch lists the tracks
that have work. A chat with a watch (Bevakning) on that pull request: when it fires, read
`art-wake/TRACKS.md` from the `art-wake` branch; if your track is listed, do "run all" for your
track. If not, do nothing.

**No double work:** when you start a batch, first append `<batch> | <date time> | started` to
`art-inbox/STATUS.md`. Skip any batch that has a `started` line from the last 90 minutes or an
`uploaded` line (another run is on it or it is done). If a wake arrives while you are already
working, finish what you are doing; "run all" re-reads `NEXT.md` before each batch, so new work
is picked up anyway.

## Commands from Stefan

- **"<track> start"** (for example "furniture start"):
  1. Remember the track for this chat.
  2. Read `STYLE.md`, `NEXT.md` and `REDO.md`; note the Ready batches and open redo rows of
     your track.
  3. If your track has a template, fetch it from the Drive `templates` folder and keep it for
     the whole chat. If you cannot, say so and ask Stefan to attach it.
  4. Check that you can upload to the Drive folder and write to branch `art-inbox`.
  5. Set up your wake-up watch (Bevakning), see "Wake-ups" above, unless this chat already has
     one: watch pull request "AleaSpel art wake" (#2) in Sluborg/AleaSpel for opened, reopened
     and new commits; when it fires, follow the "Wake-ups" section.
  6. Report in 3-5 lines (track, template ok, uploads ok, watch active, what comes next), then
     do "test".
- **"test"**: make only the first item of your next batch, upload it as `test--<id>.png`, add a
  line to the upload log, report. It does not count as making the batch.
- **"next"**: re-read `REDO.md`, `NEXT.md` and the upload log. Do open redo rows of your track
  first; otherwise the first **Ready** batch of your track that is not in the upload log. Fetch
  its batch file, make every item as its own image, deliver, report (batch, ids, anything that
  looked wrong).
- **"run all"**: repeat "next" without waiting until nothing is left for your track, then report
  once. Stop and report if an upload fails.
- **"status"**: what you made in this chat and what is left for your track.
- **"watch"**: set up the wake-up watch now (step 5 of "start"), if this chat has none.

## Delivering

- **Images:** unchanged PNG at the exact canvas size, uploaded to the Drive folder "AleaSpel
  art-inbox" (not `templates`), named `<batch>--<id>.png` (for example `B2--mouth_smile.png`).
  A redo uses the same name again. Never resize, crop, convert to JPEG or recompress.
- **Upload log:** after each batch append one line to `art-inbox/STATUS.md` on branch
  `art-inbox`: `<batch> | <date time> | <ids> | uploaded`. Optional note:
  `art-inbox/<batch>/DONE.md`. Never write to `main`; never edit any other file.
- **Fallbacks if Drive fails:** PNG to GitHub `art-inbox/<batch>/<id>.png`; if too large, base64
  text `art-inbox/<batch>/<id>.png.b64` (split into `.b64.001`, `.002`, ... if needed). Last
  resort: show the images in the chat, labelled with their ids.

## Rules for every image

- One item per image, nothing else in it. No text, no watermark, no shadow, no glow.
- Flat background in the key colour the batch gives (green #00FF00 unless it says otherwise).
  Your normal output is close enough (for example RGB 0,254,1); Visuals keys with a tolerance.
  Do not try to fix it afterwards.
- **Green or mint in the object** (leaves, plants, mint paint): use a flat magenta #FF00FF
  background instead of green, even if the batch says green. Otherwise those parts are lost.
- Canvas: with a template, exactly the template size (1024x1536). Without a template, the aspect
  ratio the batch gives at your normal output size (for example 1254x1254 for square is fine).
- With a template: keep EVERYTHING identical except the one change asked for. Never move, resize,
  redraw or restyle the character. Never work from memory or from an image you edited earlier.
- Follow `STYLE.md`.
- If an item is unclear or impossible, make the rest, skip it, and say why.

## What Visuals does

Copies the Drive images into `art-inbox`, checks them (canvas, background, nothing moved),
reviews them visually, ships good ones to the game, writes redo requests to `REDO.md` and sets
batches to Done in `NEXT.md`.
