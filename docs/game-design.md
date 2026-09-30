# AleaSpel, game design

Living document. Graphics-independent design: systems, data model, screens and roadmap.
Art style is decided separately; everything here works with placeholder shapes.

Inputs: `research/interview-alea-2026-09-30.md`, `research/avatar-world.md`,
`research/toca-boca-world.md`.

## 1. Pillars

1. **Cute and cozy.** Nothing can fail badly, nothing is lost, no timers that punish absence.
2. **Lots of stuff.** Many items from few rows: shapes x colours x patterns (combinatorial data).
3. **Make it yours.** Gymnasts, pets, houses, gardens and the gym are all editable.
4. **Gymnastics with a light goal.** Practice moves by finger patterns, beat your own best.
5. **Free and safe.** No real money, no ads, no accounts, no network features. Basic items are free;
   nicer items are bought in the in-game shop with medals won in competitions (Alea's wish).
6. **Swedish, icon-first.** Short Swedish labels, but every action is readable from its icon.

## 2. World map (screens)

| Order | Scene (code) | Swedish name | Purpose                                                |
| ----- | ------------ | ------------ | ------------------------------------------------------ |
| 10    | MainMenu     | Start        | Entry, version, (later) a street/map view              |
| 20    | AvatarEditor | Mitt lag     | Team roster plus the gymnast editor                    |
| 30    | Home         | Mina hus     | Houses: interior rooms, exterior, garden               |
| 40    | Gym          | Mitt gym     | Build the gym, tap equipment to practice               |
| 50    | MinigameHub  | Tävlingar    | All minigames, personal bests, competition day         |
| 60    | Pets         | Lagets djur  | Pet roster plus the pet editor, pet care and pet games |
| 70    | Collection   | Samlarboken  | Stickers, medals, found secrets (later)                |

Shared UI: a **bench bar** at the bottom of Home and Gym holding all gymnasts and pets. Drag one
out to place it in the scene, drag it back to put it away (Toca Boca's character bar pattern).

## 3. Gymnastics team (Mitt lag)

- A list of gymnasts, no cap in code (UI starts with 3 slots, add more with a "+" card).
- Each gymnast: name, look, personal bests per move, unlocked moves.
- **Gymnast editor** with icon tabs: Kropp, Ansikte, Hår, Dräkt (leotard), Tillbehör, Skor.
  - Each tab is a row of swatches; tap to apply. Colour dots under the selected part.
  - **Slumpa** (randomize) picks from curated palettes so every result looks good.
  - **Dräktdesigner**: leotard base colour, pattern (ränder, prickar, stjärnor, glitter), sleeves.
- Avatar is layered: each part has a `layer` (body, face, hair-back, leotard, hair-front, ...).
  Layers are data, so art can later replace placeholder shapes part by part.

## 4. Houses (Mina hus)

Decided with Alea (2026-09-30):

- **Klubbstugan** (the club house) belongs to the team and is built together with the gym. The
  team's pets live there.
- **Each gymnast has her own house.** A new gymnast gets a house.

- Every house has:
  - **Exterior**: wall colour, roof shape and colour, door, windows, fence. Parts are data rows.
  - **Rooms**: 1 to N rooms, each with wallpaper, floor and placed items.
  - **Garden**: a placement area like a room, with garden items (flowers, trees, trampoline, pool,
    fence pieces, pet house).
- **New house** starts either empty ("Tom") or furnished ("Klar att leka") from a preset.
- **Design mode** (pencil button): in play mode, tapping items triggers reactions; in design mode,
  items can be dragged, flipped, recoloured and deleted (drag to the bin). Avoids accidental moves.
- **Decorate menu**: category tabs (Sovrum, Kök, Vardagsrum, Badrum, Trädgård, Väggar och golv),
  drag an item from the menu into the room.
- **Snap slots**: beds, chairs, sofas and equipment have slots; a gymnast or pet dropped near a slot
  snaps to it (sit, lie, stand on beam).

## 5. Gym (Mitt gym)

- Built with the same placement system as rooms. Equipment is furniture with a `minigame` field.
- Tap placed equipment in play mode to start its minigame with the selected gymnast.
- **Rekordtavla**: a board showing each gymnast's personal best per apparatus.

## 6. Minigames (Tävlingar)

Core mechanic: **finger patterns**. Each move is a data row with a gesture template; the player
draws the gesture during a routine and is scored on shape match and timing.

| Gesture                  | Example move (sv) | Apparatus       |
| ------------------------ | ----------------- | --------------- |
| Swipe up                 | Upphopp           | Trampolin, golv |
| Circle                   | Volt / salto      | Trampolin, golv |
| Zigzag                   | Flickis           | Golv            |
| V shape                  | Spagat            | Bom, golv       |
| Tap rhythm               | Balans            | Bom             |
| Hold two fingers + swipe | Kip / jättesväng  | Barr            |
| Swipe down then up       | Hopp över bocken  | Hopp (vault)    |

- Recognizer: a small point-cloud or direction-sequence matcher (for example the $1 unistroke
  recognizer idea), no dependencies. Gestures are data, so new moves are new rows.
- Scoring: 1 to 3 stars per move plus a total. Personal bests saved per gymnast per minigame.
- Unlocks: practising a move unlocks the next one in that apparatus track.
- **Tävlingsdag** (later): pick 3 gymnasts, each performs a short routine, judges show scores,
  podium with medals that go into Samlarboken.

## 7. Pets (Mina djur)

Requested by the parent; Alea (2026-09-30): she wants to play with the pets and take care of
them, and **the pets belong to the team**, not to single gymnasts. They live in Klubbstugan.

Built:

- Step 1: adoption (species + colour + name), care (Mata, Borsta, Klappa, Leka), gentle needs.
- Step 2 (Alea's feedback): sitting placeholder pets; six games, each with a small interaction
  (Boll: throw; Hopplek: tap fast; Trick: swipe the arrows; Balans: hold; Magkli: rub circles;
  Kurragömma: find the box); eight foods; a **secret personality** per pet (loves, likes or
  dislikes each game and food, species favourite foods always loved), discovered by trying and
  shown in "Om <namn>". Games and foods are data rows in `src/data/petActivities.ts`.
- Placeholder art is SVG generated in code (`src/ui/petSvg.ts`); real art comes with the art pass.

- **Species** as data rows: katt, hund, kanin, marsvin, hamster, ponny (more later).
- **Pet editor**: species, colour, pattern (fläckar, ränder, tabby), ears/tail variants, name,
  accessories (rosett, halsband, täcke). Same tab-and-swatch UI as the gymnast editor.
- **Pet furniture**: bed, bowl, toy, cat tree, rabbit hutch, stable. Normal furniture rows with a
  `petSlot` so a pet snaps to them.
- **Care without guilt**: feed, brush, pet and play give happy reactions and hearts. Needs (Mat,
  Ren, Lek) drop slowly over real time but never below 20%; a low need only shows a small thought
  bubble, never sadness or illness (cozy pillar).
- **Following**: a pet can be set as a gymnast's buddy and follows her between scenes.
- **Pet minigames**, same gesture engine as gymnastics:
  - **Agility (hundagility)**: draw the path through a course of jumps, tunnels and slalom poles.
  - **Hoppning (ponny)**: time taps or swipes to clear fences.
  - **Kaninhoppning**: rabbit show jumping, rhythm taps.
  - **Trick school**: draw a gesture to teach tricks (circle = rulla runt, swipe up = sitt vackert).
- Pets can join Tävlingsdag as team mascots (cosmetic).
- Pet courses are placeable in the garden or gym, so the same builder is reused.

## 8. Economy: medals and the shop

Alea's wish: nicer furniture and clothes are bought with prizes from winning competitions.

- **Medaljer** (currency): won in Tävlingar (more for more stars) and in pet shows.
- **Butiken**: nicer furniture, clothes, pet accessories. Every item row gets an optional `price`;
  no price = free from the start. Bought items are kept forever.
- No real money, no timers, no loot boxes. Prices tuned so a new item comes every few games.

## 9. Retention without pressure

- **Fredagspaket**: a gift box appears in the active house every Friday. Double-tap to open with
  confetti. Unclaimed gifts stack and never expire.
- **Seasonal sets** by date: Halloween, Lucia och jul, påsk, midsommar, sommarlov. Items are kept
  forever once received.
- **Hidden secrets**: tap an object three times, move a mat, and find a sticker, rare leotard pattern
  or a new pet colour. Rows: object id, trigger, reward.
- **Samlarboken**: pages with silhouettes to fill (stickers, medals, secrets, seasonal items).

## 10. Data model

All content is catalog data in `src/data/`. Player state is in `SaveData` (SaveService).

Catalogs (read-only data rows):

| Catalog          | Key fields                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| avatarParts      | id, slot, layer, name, colours[], unlock                                |
| petSpecies       | id, name, parts slots, minigames[]                                      |
| petParts         | id, species[], slot, layer, colours[]                                   |
| furniture        | id, name, category, size, colours[], slots (sit/lie/pet), placeableIn[] |
| gymEquipment     | furniture row + minigame id                                             |
| exteriorParts    | id, slot (walls, roof, door, windows, fence), colours[]                 |
| moves            | id, name, apparatus, gesture id, difficulty, unlockAfter                |
| gestures         | id, template points or direction sequence                               |
| minigames        | id, name, apparatus or pet species, moves[]                             |
| gifts / seasonal | id, date rule, rewards[]                                                |
| secrets          | id, scene, object id, trigger, reward                                   |

Player state (SaveData v2):

```
SaveData {
  version: 2
  gymnasts: Gymnast[]        { id, name, look: {slot -> {partId, colour}}, bests: {minigameId -> score} }
  pets: Pet[]                { id, name, speciesId, look, buddyOf?: gymnastId }
  houses: House[]            { id, name, exterior: {slot -> {partId, colour}},
                               rooms: Room[] { id, wall, floor, items: PlacedItem[] },
                               garden: { items: PlacedItem[] } }
  activeHouseId: string
  gym: { items: PlacedItem[] }
  unlocked: string[]         item ids unlocked beyond the defaults (gifts, secrets, seasons)
  collection: string[]       found stickers, medals, secrets
  gifts: { lastClaimedWeek: string, pending: number }
}
PlacedItem { uid, defId, x, y, flip, colour? }
```

- `uid` lets the same furniture appear many times.
- Everything unlocked by default except rewards, so "lots of stuff" is there from day one.

## 11. Roadmap (graphics-independent first)

| Order | Step                                                                         | Needs art? |
| ----- | ---------------------------------------------------------------------------- | ---------- |
| 10    | Data model v2: team, pets, houses, rooms, gym in SaveData, migration from v1 | No         |
| 20    | Decorate menu + design mode + bin + flip + recolour in Home                  | No         |
| 30    | Gesture recognizer + one gymnastics minigame (trampoline) with stars         | No         |
| 40    | Team roster + gymnast editor with tabs, swatches, Slumpa (shape avatar)      | No         |
| 50    | Gym builder with equipment that starts minigames, Rekordtavla                | No         |
| 60    | Pets roster + pet editor + one pet minigame (agility)                        | No         |
| 70    | Several houses + exterior editor + garden                                    | No         |
| 80    | Bench bar + snap slots + tap reactions                                       | No         |
| 90    | Fredagspaket, secrets, Samlarboken                                           | No         |
| 100   | Art pass: replace placeholder shapes via assets/manifest.json                | Yes        |
| 110   | Sound pass                                                                   | Yes        |

## 12. Open questions

- Art style and asset source (decided in a separate discussion).
- Sound and music: wanted from the start or later?
- Names: does Alea want to name the game something else than AleaSpel?
- How many gymnasts in the team UI by default (3 suggested)?
