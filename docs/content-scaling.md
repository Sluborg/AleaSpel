# Growing to hundreds of items

Alea wants hundreds of items. This is the plan for keeping the game fast on a phone.

## Where we are (2026-09-30)

- About 115 assets, 16 MB in `public/assets/`. Every asset is preloaded at start, and the service
  worker precaches all of it on install.
- Wardrobe and face layers are full 1024x1536 canvases: small files, but each loaded one takes
  about 6 MB of GPU memory.
- Rough limit with the current approach: about 200-300 items (50+ MB download, slow start, GPU
  memory pressure on older phones).

## What to do, in order (each step is independent)

| Order | Step                    | Effect                                                                                                 | When                       |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| 10    | Load on demand          | Preload only the base, UI, icons and what is worn; load a tab's items when it opens                    | Before ~200 assets         |
| 20    | Thumbnails              | 128 px catalog images per item; full art loads on wear                                                 | With step 10               |
| 30    | Cropped layers + offset | Store only the item's bounding box and its x/y in the manifest; files and GPU memory drop 70-95 %      | Before ~200 assets         |
| 40    | Runtime caching         | Service worker precaches only the core; art is cached when first used (still works offline afterwards) | With step 10               |
| 50    | WebP                    | 50-70 % smaller files than PNG, same look                                                              | When download size matters |
| 60    | Texture atlases         | Pack small icons/objects into a few sheets (fewer requests)                                            | 100+ small icons           |
| 70    | Catalog UX              | Categories, scrolling, "new" badges, unlocks in Butiken, favourites, search by colour                  | As the catalog grows       |

## Content rules that keep it manageable

- Every item is a manifest row with category, tags (colour, theme, event) and unlock rule, so
  filters and events are data, not code.
- Tintable items multiply variety without files: one leotard in 12 colours is 1 file.
- Themed drops (events) add 10-20 items at a time, which fits the batch workflow.
