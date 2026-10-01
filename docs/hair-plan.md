# Hair plan (Frisyrer)

Goal: hairstyles are wardrobe items like clothes. Alea can switch between many styles and colour
them. The fixed master (`assets/source/base/master.png`) keeps its painted hair; nothing about it
changes.

## The problem

The hair is painted into the master, so a new hairstyle drawn on top would show the old low bun
underneath. We need a base without hair.

## Steps

1. **Bald base (`base_bald`, batch B29, clothes track).** ChatGPT removes only the hair from the
   master template: same face, ears, head shape, body, unitard, pose, size and canvas. Shipped as
   a new base layer next to `base_body`; the master file itself is not touched.
2. **Default style from the master.** The difference between the master and `base_bald` is the
   current hair. `scripts/art/extract-hair.mjs` cuts it out as `hair_bun_back` / `hair_bun_front`,
   so every existing gymnast keeps exactly the hair she has today.
3. **Back and front split, automatic.** Hair pixels outside the bald body outline go to
   `hair_back` (layer order 10, behind the body and clothes: long hair, ponytails, buns); hair
   pixels over the head and body go to `hair_front` (order 100, over the face edge and
   shoulders). One ChatGPT image per hairstyle; the script makes both files.
4. **Tintable.** Hair is stored greyscale and tinted like clothes, with a hair palette (brown,
   blond, black, red, plus fun colours: pink, lilac, mint, blue).
5. **Rendering.** When a hairstyle is worn, the gymnast is drawn on `base_bald` instead of the
   master-derived base; with no hair item (old saves) she gets `hair_bun` automatically, so no
   save change is needed. The Hår tab has no "none" tile.
6. **Hairstyle batch (B30, clothes track).** Six styles on the bald template, medium brown:
   long straight, high ponytail, two space buns, two braids, short bob, curly long.
7. **Garderob:** Hår is a face tab (zoomed), plus the colour row.

## Risks

- ChatGPT may change the face or ears when removing the hair. The registration check
  (`extract-item.mjs` style IoU against the master outside the head) catches it; redo until clean.
- Hair edges against the skin: the split uses a soft mask (2 px feather) so no seam shows.
