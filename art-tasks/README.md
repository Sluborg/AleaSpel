# Art tasks for ChatGPT

This folder is the task queue for the image generator (ChatGPT). Visuals (the Claude art session)
writes the tasks; ChatGPT fetches and does them; Visuals checks, extracts and ships the images.

## When Stefan says "next"

1. Fetch `https://raw.githubusercontent.com/Sluborg/AleaSpel/main/art-tasks/NEXT.md` (add `?t=<anything>` if it looks stale).
2. Take the first batch with status **Ready** that you have not already made in this
   conversation. Fetch its file (for example `art-tasks/B2.md`).
3. Fetch the template image named in the batch, if any. If you cannot fetch it, ask Stefan to
   attach it. Never work from memory or from an image you edited earlier.
4. Make every item in the batch as its own separate image, in order, each labelled with its id.
   Follow the batch text exactly.
5. Deliver (see below), then reply with a short report: batch id, which ids are done, which
   failed or look wrong.

## Delivering the images

- **If you can write to the repo:** commit each image as `art-inbox/<batch>/<id>.png` on the
  branch `art-inbox` (never on `main`), then say "uploaded".
- **If you cannot:** show the images in the chat, each labelled with its id. Stefan passes them to
  Visuals.
- Do not edit any other file in the repo. Visuals updates `NEXT.md` and the batch status.

## Rules for every image

- One item per image, nothing else in it. No text, no watermark, no shadow, no glow.
- Flat green background #00FF00 and the exact canvas size the batch gives.
- With a template image: keep EVERYTHING identical except the one change asked for. Do not move,
  resize, redraw or restyle the character.
