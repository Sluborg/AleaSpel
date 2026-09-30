# Image prompts for ChatGPT (AleaSpel)

Owned by the art session (see `docs/collaboration.md`). The art session writes each prompt from
the templates below. When Stefan says "ny prompt", it gives him the next queued prompt, ready to
paste into ChatGPT, together with the template image to attach (if any). Stefan pastes the image
back with its id; the art session extracts it and updates this queue and `docs/art-requests.md`.

## Rules for every image

- **Template image (character items):** start from the green master:
  https://raw.githubusercontent.com/Sluborg/AleaSpel/main/assets/source/base/master-raw.png
  For face parts and make-up use the blank-face template instead:
  https://raw.githubusercontent.com/Sluborg/AleaSpel/main/assets/source/face/face_blank-raw.png
  If the image is not attached in the chat, ask for it; do not work from memory or from a later
  edited image.
- Pets, food and toys have no template image (standalone objects, see their templates below).
- Keep EVERYTHING identical except the one change asked for: same girl, face, hair, skin, grey
  unitard, pose, size, position on the canvas, framing, lighting and flat green background.
  Do not move, resize, redraw or restyle the character.
- Canvas exactly 1024x1536 pixels for character items, 1024x1024 for pets, food and toys. Flat
  green background #00FF00, no shadow, no glow, no text.
- One item per image.
- Key colours, so the game code can cut the item out:
  - Clothes, shoes, accessories: solid bright pink **#FF4FA3**, no pattern.
  - Make-up and face paint: solid bright blue **#2F6BFF**.
  - Face parts (eyes, eyebrows, mouth): natural colours, drawn on the blank-face template.
  - Pets: fur in light grey/white (the game tints it), eyes, nose and inner ears in natural
    colours. The art session splits fur and face into two layers.
  - Food and toys: natural full colours, no green in the object.

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

## Prompt template: pet (no template image)

```
Create one cute pet for a children's dress-up and pet-care game, in a soft, cute, slightly
realistic 3D cartoon style like Avatar World: big shiny eyes, rounded shapes, soft fur.

The pet: <PET>, <POSE>, seen straight from the front, centred, whole body visible, filling about
70% of the canvas height, feet at about 92% of the canvas height.

Fur colour: plain light grey to white with soft shading only, no spots, no pattern, no tint
(the game colours the fur). Eyes, nose, mouth and inner ears in natural colours.

Canvas exactly 1024x1024 pixels. Flat green background #00FF00, no floor, no shadow, no glow,
no text, nothing green on the pet.
```

## Prompt template: food or toy (no template image)

```
Create one cute game icon for a children's pet-care game: <OBJECT>. Soft, cute 3D cartoon style
like Avatar World, bright natural colours, rounded shapes, slightly glossy.

Centred, seen from the front at a slight angle, filling about 80% of the canvas, whole object
visible.

Canvas exactly 1024x1024 pixels. Flat green background #00FF00, no shadow, no glow, no text,
nothing green on the object.
```

## Queue (next first)

| Order | Id           | Template     | What to ask for                                                                                                                                             | Status |
| ----- | ------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 10    | face_blank   | green master | Remove the eyebrows, eyes (with lashes) and mouth; fill with smooth matching skin and soft shading. Keep nose and ears exactly. No blush, lines or shadows. | Done   |
| 20    | eyes_round   | blank face   | Face part: big round cute eyes with brown irises, white highlights and short lashes                                                                         | Done   |
| 21    | eyes_almond  | blank face   | Face part: almond-shaped eyes with amber irises and a small wing                                                                                            | Done   |
| 22    | eyes_doe     | blank face   | Face part: big doe eyes with brown irises and lower lashes                                                                                                  | Done   |
| 23    | eyes_blue    | blank face   | Face part: big round eyes with blue irises                                                                                                                  | Done   |
| 24    | eyes_green   | blank face   | Face part: big round eyes with green irises                                                                                                                 | Done   |
| 25    | eyes_sleepy  | blank face   | Face part: sleepy half-closed eyes with brown irises                                                                                                        | Done   |
| 26    | eyes_wink    | blank face   | Face part: winking eyes (image-right eye closed in a curved line)                                                                                           | Done   |
| 30    | brows_soft   | blank face   | Face part: soft rounded light-brown eyebrows                                                                                                                | Next   |
| 40    | mouth_smile  | blank face   | Face part: small closed happy smile                                                                                                                         | Queued |
| 50    | blush_round  | blank face   | Make-up: round blush on both cheeks                                                                                                                         | Queued |
| 60    | lips_gloss   | blank face   | Make-up: lip gloss on the lips                                                                                                                              | Queued |
| 70    | shadow_soft  | blank face   | Make-up: soft eyeshadow on both eyelids                                                                                                                     | Queued |
| 80    | paint_hearts | blank face   | Make-up: two small hearts face paint on one cheek                                                                                                           | Queued |
| 90    | pet_cat      | none         | Pet (art request 10): a kitten, sitting                                                                                                                     | Queued |
| 100   | pet_dog      | none         | Pet (art request 10): a puppy, sitting                                                                                                                      | Queued |
| 110   | pet_rabbit   | none         | Pet (art request 10): a bunny with long ears, sitting                                                                                                       | Queued |
| 120   | pet_guinea   | none         | Pet (art request 10): a guinea pig, sitting                                                                                                                 | Queued |
| 130   | pet_hamster  | none         | Pet (art request 10): a hamster, sitting                                                                                                                    | Queued |
| 140   | pet_pony     | none         | Pet (art request 10): a pony, standing, all four hooves on the ground                                                                                       | Queued |
| 150   | food_fish    | none         | Food (art request 20): a small fish                                                                                                                         | Queued |
| 160   | food_bone    | none         | Food (art request 20): a dog bone                                                                                                                           | Queued |
| 170   | food_carrot  | none         | Food (art request 20): a carrot, no leaves                                                                                                                  | Queued |
| 180   | food_apple   | none         | Food (art request 20): a red apple, no leaf                                                                                                                 | Queued |
| 190   | food_seeds   | none         | Food (art request 20): a small pile of sunflower seeds                                                                                                      | Queued |
| 200   | food_cheese  | none         | Food (art request 20): a wedge of cheese with holes                                                                                                         | Queued |
| 210   | food_berries | none         | Food (art request 20): a small bunch of berries                                                                                                             | Queued |
| 220   | food_cookie  | none         | Food (art request 20): a round cookie                                                                                                                       | Queued |
| 230   | toy_ball     | none         | Toy (art request 30): a bouncy ball with a star                                                                                                             | Queued |
| 240   | toy_plank    | none         | Toy (art request 30): a long wooden balance plank, horizontal, seen from the front                                                                          | Queued |
| 250   | toy_box      | none         | Toy (art request 30): a cardboard hide box with a round door                                                                                                | Queued |
| 260   | tshirt_basic | green master | Clothes: a short-sleeved loose T-shirt                                                                                                                      | Queued |
| 270   | shorts_gym   | green master | Clothes: short gymnastics shorts                                                                                                                            | Queued |

When an image is done, send it to Claude Code with its id. Claude Code extracts it, adds it to the
game, and updates this queue. Face parts are extracted with `scripts/art/extract-face.mjs` (pixels
that differ from the blank-face template, plus a skin patch that hides the master's own feature).
