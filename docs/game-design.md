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

- A list of gymnasts (built: up to 8, "+ Ny gymnast" in Mitt lag, browse with arrows; the shown
  gymnast is the active one, `SaveData.activeGymnastId` v7, used in Tävlingar).
- Each gymnast: name, look, personal bests per move, unlocked moves.
- **Gymnast editor** with icon tabs: Kropp, Ansikte, Hår, Dräkt (leotard), Tillbehör, Skor.
  - Each tab is a row of swatches; tap to apply. Colour dots under the selected part.
  - **Slumpa** (randomize) picks from curated palettes so every result looks good.
  - **Dräktdesigner**: leotard base colour, pattern (ränder, prickar, stjärnor, glitter), sleeves.
- Avatar is layered: each part has a `layer` (body, face, hair-back, leotard, hair-front, ...).
  Layers are data, so art can later replace placeholder shapes part by part.
- **Clothing occasions** (built, Stefan 2026-09-30): Vardag, Träning, Tävling, Fest, Chill
  (`src/data/occasions.ts`). Face and hair are shared; clothes, shoes, make-up and accessories
  are one look per occasion (`Gymnast.looks`, save v11, the old outfit became Vardag). Chips in
  Garderob pick which look is dressed; a new look starts as a copy of Vardag. Scenes choose the
  look: Klubbstugan = Chill, practice in Mitt gym = Träning, Tävlingar and Tävlingsdag =
  Tävling, Mitt lag and Mina hus = Vardag, Fest is for events.

## 4. Houses (Mina hus)

Decided with Alea (2026-09-30):

- **Klubbstugan** (the club house) belongs to the team and is built together with the gym. The
  team's pets live there. Built: `scenes/ClubhouseScene.ts` on the shared `RoomScene` base
  (drag-and-drop, tap, depth, saved positions, also used by Mina hus and Mitt gym): club
  furniture rows (`room: 'clubhouse'` in `data/furniture.ts`, two of them for sale), the pets
  sit in the room (drag them, tap to care), the active gymnast stands there (tap for Mitt lag),
  and a door leads to the gym. Positions in `SaveData.clubhouse` (v9).
  **Lagfest** (built): a 🎉 Fest button, unlocked by the team's first cup from Tävlingsdag, turns
  the room into a party (lights down, disco spots, confetti); the gymnast switches to her Fest look
  and dances, the pets hop. Tap Fest again to stop.
- **Each gymnast has her own house.** A new gymnast gets a house.
- **Rooms, built (Stefan's feedback 2026-09-30):** every room (Mina hus, Klubbstugan, Mitt gym)
  is two screens wide; drag the floor to look around, dragging an item to the screen edge
  scrolls along (‹ › arrows show there is more). Depth follows where things stand (lower on
  screen = in front); flat things (rug, mat, pet bed, wall items: `flat: true`) are always
  behind. Tap a piece of furniture for layer buttons (Närmast, Närmare, Längre bort, Längst
  bort) and Förråd; a manual layer holds until the piece is dragged again. Furniture is a list
  of pieces (`SaveData.furniture`, v12): several of a kind, each placed or stored. The 📦
  Förråd button lists stored pieces of that room; tap one to put it in the middle of the view.

- **Tap reactions (built):** tapping a piece of furniture selects it and, when its row has a
  `reaction` emoji, the piece wobbles and a few emojis float up (bed 💤, lamp 💡, tree 🍎...).

- **Trädgården (built, first version):** the house from outside, reached with 🌳 Ute in Mina hus
  (the door leads back in). The house is put together from one part per slot: Vägg, Tak, Dörr,
  Fönster (`src/data/exterior.ts`: art rows times `HOUSE_HUES` colour shifts). 🎨 Bygg opens the
  part picker. The choice is saved as one piece per slot in `SaveData.furniture` (no schema
  change). Garden things (tree, path, flowers free; bush and fence in Butiken) are furniture
  rows with `room: 'garden'`, so drag, layers and the Förråd work as in the rooms.

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

- Built: `scenes/GymScene.ts`, rows in `data/gymEquipment.ts` (trampoline, beam, bars, vault,
  mat). Drag to move (positions in `SaveData.gym.equipment`, v8), tap to practise the apparatus'
  minigame in practice mode: same game, no medals, records untouched, "Bra tränat!".
- **Rekordtavla**: a board showing each gymnast's personal best per apparatus.

## 6. Minigames (Tävlingar)

Core mechanic: **finger patterns**. Each move is a data row with a gesture template; the player
draws the gesture during a routine and is scored on shape match and timing.

| Pattern (drawn) | Move (sv)  | Stars |
| --------------- | ---------- | ----- |
| Triangel        | Raka hopp  | 1     |
| Cirkel          | Kroppa     | 1     |
| Fyrkant         | Sittfall   | 1     |
| V               | Pik        | 2     |
| Sicksack        | Grenhopp   | 2     |
| S               | Halv skruv | 2     |
| Hjärta          | Volt       | 3     |
| Stjärna         | Stjärnhopp | 3     |

Decision (Alea's feedback 2026-09-30): no swipes, only drawn patterns, scored by how accurately
they were drawn (percent shown, stars by accuracy bands per difficulty).

- Recognizer: `src/services/Gesture.ts`, template matching (resample, centre, scale, average
  point distance; direction and start point free, rotation not), accuracy 0..1, no dependencies.
  Shapes are point lists in `src/data/gestureShapes.ts` (drawn on the move card with a start
  dot); moves and minigames are rows in `src/data/minigames.ts`.
- Built: `scenes/minigames/PatternGameScene.ts` is the shared engine (card, drawing, accuracy,
  stars, medals, records, result panel); each game adds its world and round animation.
  - **Studsmatta**: 5 jumps, draw while she is in the air, pose at the apex.
  - **Bom**: she walks to 5 stations on the beam and wobbles while you draw (3.8 s window); a
    miss makes her slip and catch herself; the last station is the dismount onto the mat.
  - **Barr**: she swings under the high bar while you draw (3.6 s); a good pattern becomes a full
    swing, a release move or a giant; the last round is a dismount onto the mat.
  - **Hopp**: run-up, springboard, flight over the table; draw during the run and flight; stuck
    landing on 2+ stars, a stumble otherwise.
  - Tävlingar hub lists all four games with the active gymnast's records, then the
    **Uppvärmning** quick games (built after Stefan's feedback 2026-09-30) on
    `scenes/minigames/QuickGameScene.ts` (intro, 5 rounds of 0-3 stars, medals, record):
    Sifferhopp and Bokstavsjakt (`OrderGameScene`, tap 1, 2, 3 … or A, B, C … in order, Å Ä Ö
    included), Pricka rätt (`TimingGameScene`, stop the sliding marker on the line), Färgminne
    (`ColorMemoryScene`, repeat the blinking colours, one more each round), Para ihop
    (`OrderGameScene` with `variant: 'pairs'`, a memory card game; 3 to 8 pairs by level and
    round, levels 1-2 show all cards for a moment first). They are rows in
    `data/minigames.ts` with `kind: 'warmup'`; Tävlingsdag uses the apparatus games only.
  - 16 symbols to draw (added Topp, U, L, M, Våg, Diamant, Hus, Åtta) and new moves using them
    (Ryggfall, Barani, Språng, Bukrullning, Flyaway, Rondat, Jurtjenko).
  - **Mixed rounds** (Stefan 2026-09-30): each apparatus has a `mix` of round kinds in
    `data/minigames.ts`; every round picks one at random (draw the move, or its challenge:
    Studsmatta timing and colours, Bom colours and timing, Barr numbers and timing, Hopp timing
    and letters; never the same challenge twice in a row). In a challenge round the gymnast waits,
    then does her move well or badly by the stars. Challenges live in
    `scenes/minigames/challenges.ts`, shared with the Uppvärmning games.
  - **Levels** (`services/Difficulty.ts`, `Gymnast.levels`, save v13): each gymnast has a level
    1-5 per game, starting at 1. 75 % of the stars or more moves her up, under 40 % down, so she
    mostly wins but is challenged. Apparatus: lower levels play slower (time scale 0.7-1.1) and use
    easier moves; Uppvärmning: longer rows, faster markers, longer colour rows. Practice in Mitt
    gym does not change the level. Level shows on the cards, the intro and the result.
  - Drawing: a stroke may start as soon as the card shows; stray taps (under 60 px) do not count
    as an attempt.
- Scoring: 1 to 3 stars per move plus a total. Personal bests saved per gymnast per minigame.
- Unlocks: practising a move unlocks the next one in that apparatus track.
- **Tävlingsdag** (built): every gymnast in the team performs one routine (apparatus rotate
  through the lineup) in team mode of the same minigame scenes (stars go to the team, no medals
  per routine). The total meets three rival clubs (`src/data/competition.ts`, random share of the
  same maximum), placement gives 12/8/5/2 medals. Wins and podiums are saved (`team`).
  Every top-three place adds a cup (gold, silver, bronze) to `team.trophies` (save v14); the
  Prisskåp in Klubbstugan shows the count and, when tapped, "🏆 Visa pokaler" opens the shelf.
  Later: pets as mascots.

## 7. Pets (Mina djur)

Requested by the parent; Alea (2026-09-30): she wants to play with the pets and take care of
them, and **the pets belong to the team**, not to single gymnasts. They live in Klubbstugan.

Built:

- Step 1: adoption (species + colour + name), care (Mata, Borsta, Klappa, Leka), gentle needs.
- Step 2 (Alea's feedback): sitting placeholder pets; six games, each with a small interaction
  (Boll: throw; Hopplek: tap fast; Trick: swipe the arrows; Balans: hold; Magkli: rub circles;
  Kurragömma: find the box; later Fånga musen: tap the running mouse; Frisbee: tap to throw);
  eight foods; a **secret personality** per pet (loves, likes or
  dislikes each game and food, species favourite foods always loved), discovered by trying and
  shown in "Om <namn>". Games and foods are data rows in `src/data/petActivities.ts`.
- Art: `pet_<species>_fur` (tinted with the pet colour) + `pet_<species>_face` from the manifest,
  drawn by `src/ui/PetView.ts`; SVG placeholder (`src/ui/petSvg.ts`) when the ids are missing.

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
  no price = free from the start. Bought items are kept forever. Furniture can be bought again
  and again (goes to the Förråd, tiles show ×N); clothes once.
- Built: **Gym tab** in Butiken: extra apparatus and mats (`price` rows in `data/gymEquipment.ts`),
  bought once, they appear in Mitt gym. Colour variants reuse the apparatus art with a hue shift
  (`hue` in the row): Rosa and Lila matta, Mintbom, Minitramp, Guldbock.
- No real money, no timers, no loot boxes. Prices tuned so a new item comes every few games.
- Built: **Butiken** (`scenes/ShopScene.ts`, data in `data/shop.ts`): tabs Möbler and Kläder,
  tiles with price, "Köp" when affordable, "Köpt" when owned, "N till" otherwise. Furniture rows
  with a `price` in `data/furniture.ts` are for sale and appear in Mina hus once bought. Clothes
  for sale are manifest ids in `CLOTHES_PRICES` (empty until Visuals adds priced clothes; the
  wardrobe must hide them until owned). Owned ids in `SaveData.owned` (v6).

## 9. Retention without pressure

- **Fredagspaket** (built, save v15): every Friday (local calendar) a gift waits; the 🎁 button
  in the main menu wiggles with a count. Tap the box three times, it opens with confetti and gives
  one random thing from Butiken (clothes and apparatus only if not owned) plus 5 medals. The first
  gift waits from the start. Up to 3 unopened gifts stack (`gifts.claimed` = last opened Friday).
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
