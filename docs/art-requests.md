# Art requests (Lead -> Visuals)

See `docs/collaboration.md`. Lead adds rows; Visuals turns them into
ChatGPT prompts (`docs/image-prompts.md`), delivers manifest ids, and sets the status.

| Order | Id          | What                                                                        | Used in                 | Format                                                                                                                                                                                                                                                                                                                                                         | Status |
| ----- | ----------- | --------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 10    | pet_species | Six pets: cat, dog, rabbit, guinea pig, hamster, pony                       | Lagets djur (PetsScene) | One PNG per species, 1024x1024, transparent, front view, **sitting** (pony standing), cute and a bit realistic like Avatar World, feet on y = 940, centred. Two layers per species: `pet_<species>_fur` (fur in light grey, tinted in code) and `pet_<species>_face` (eyes, nose, inner ears, untinted). Species ids: cat, dog, rabbit, guinea, hamster, pony. | Queued |
| 20    | pet_foods   | Eight food icons: fish, bone, carrot, apple, seeds, cheese, berries, cookie | Pet food picker, bowl   | 256x256 transparent PNG each, cute, `food_<id>`. Ids: fish, bone, carrot, apple, seeds, cheese, berries, cookie.                                                                                                                                                                                                                                               | Queued |
| 30    | pet_toys    | Ball, balance plank, hide box                                               | Pet games               | 256x256 transparent PNG each: `toy_ball`, `toy_plank` (512x128), `toy_box`.                                                                                                                                                                                                                                                                                    | Queued |

Placeholders in use until delivered: SVG pets from `src/ui/petSvg.ts`, emoji food icons, shapes
for toys.

Visuals notes:

- Queued as image-prompts rows 90-140 (pets), 150-220 (food), 230-250 (toys), after the face items.
- Row 40 (furniture): batch B7 in `art-tasks/` (furniture track). Made at 1024x1024 and scaled to
  512x512; the plant uses a magenta background because it is green.
- Pets are generated as one image on green (grey fur, natural face colours) and split into the
  `_fur` and `_face` layers by Visuals; the format above stays as requested.
- Food and toys are generated at 1024x1024 and scaled to the requested sizes (the plank cropped
  to 512x128).
