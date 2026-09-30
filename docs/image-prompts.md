# Image prompts for ChatGPT (AleaSpel)

Instructions for the image generator. The person working with ChatGPT says, for example:
"Read docs/image-prompts.md in Sluborg/AleaSpel and make the next image in the queue."

## Rules for every image

- **Template image:** always start from the green master:
  https://raw.githubusercontent.com/Sluborg/AleaSpel/main/assets/source/base/master-raw.png
  For face parts and make-up use the blank-face template instead:
  https://raw.githubusercontent.com/Sluborg/AleaSpel/main/assets/source/face/face_blank-raw.png If the image is not attached in the
  chat, ask for it; do not work from memory or from a later edited image.
- Keep EVERYTHING identical except the one change asked for: same girl, face, hair, skin, grey
  unitard, pose, size, position on the canvas, framing, lighting and flat green background.
  Do not move, resize, redraw or restyle the character.
- Canvas exactly 1024x1536 pixels. Flat green background #00FF00, no shadow, no glow, no text.
- One item per image.
- Key colours, so the game code can cut the item out:
  - Clothes, shoes, accessories: solid bright pink **#FF4FA3**, no pattern.
  - Make-up and face paint: solid bright blue **#2F6BFF**.
  - Face parts (eyes, eyebrows, mouth): natural colours, drawn on the blank-face template.

## Prompt template: clothes

```
Use the attached image as an exact template. Keep EVERYTHING identical: the same girl, face, hair,
skin, grey unitard, pose, size, position on the canvas, framing, lighting and the flat green
background. Do not move, resize, redraw or restyle the character.

Only change: add <ITEM>. The item is solid bright pink (#FF4FA3) with no pattern. It fits the body
like real clothing. The grey unitard stays visible where the item does not cover it.

Canvas exactly 1024x1536 pixels. Flat green background #00FF00, no shadow, no glow, no text.
```

## Prompt template: make-up (on the blank-face template)

```
Use the attached image as an exact template. Keep EVERYTHING identical. Do not move, resize,
redraw or restyle anything.

Only change: add <MAKE-UP> in solid bright blue (#2F6BFF), soft edges, cute and subtle, suitable
for a children's dress-up game.

Canvas exactly 1024x1536 pixels. Flat green background #00FF00, no shadow, no glow, no text.
```

## Prompt template: face parts (on the blank-face template)

```
Use the attached image as an exact template. Keep EVERYTHING identical. Do not move, resize,
redraw or restyle anything.

Only change: add <FACE PART> in the same cute art style as the original character, in the natural
position on the face. Nothing else on the face changes.

Canvas exactly 1024x1536 pixels. Flat green background #00FF00, no shadow, no glow, no text.
```

## Queue (next first)

| Order | Id           | Template     | What to ask for                                                                                                                                             | Status |
| ----- | ------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 10    | face_blank   | green master | Remove the eyebrows, eyes (with lashes) and mouth; fill with smooth matching skin and soft shading. Keep nose and ears exactly. No blush, lines or shadows. | Done   |
| 20    | eyes_round   | blank face   | Face part: big round cute eyes with brown irises, white highlights and short lashes                                                                         | Next   |
| 30    | brows_soft   | blank face   | Face part: soft rounded light-brown eyebrows                                                                                                                | Queued |
| 40    | mouth_smile  | blank face   | Face part: small closed happy smile                                                                                                                         | Queued |
| 50    | blush_round  | blank face   | Make-up: round blush on both cheeks                                                                                                                         | Queued |
| 60    | lips_gloss   | blank face   | Make-up: lip gloss on the lips                                                                                                                              | Queued |
| 70    | shadow_soft  | blank face   | Make-up: soft eyeshadow on both eyelids                                                                                                                     | Queued |
| 80    | paint_hearts | blank face   | Make-up: two small hearts face paint on one cheek                                                                                                           | Queued |
| 90    | tshirt_basic | green master | Clothes: a short-sleeved loose T-shirt                                                                                                                      | Queued |
| 100   | shorts_gym   | green master | Clothes: short gymnastics shorts                                                                                                                            | Queued |

When an image is done, send it to Claude Code with its id. Claude Code extracts it, adds it to the
game, and updates this queue.
