# Toca Boca World, research for AleaSpel

Research date: 2026-09-30. Purpose: understand what makes Toca Boca World (TBW) fun for a 9-year-old
and turn it into concrete, buildable ideas for AleaSpel (gymnastics theme, Phaser 3, placeholder
graphics). See also `research/interview-alea-2026-09-30.md`.

Note on sources: the Fandom wikis (toca-life-world.fandom.com) blocked automated fetching (HTTP 402),
so wiki claims come only from search-result snippets and are marked as such. Primary sources used
are the official Toca Boca Help Center, the official site, the App Store listing, Common Sense
Media, Screenwise, Bitdefender, GeekDad, Motionographer and Wikipedia. Claims marked
**(unverified)** could not be confirmed from a primary or reputable source.

## Background

- Made by Toca Boca, a Swedish studio founded 2010 (Emil Ovemar, Björn Jeffery), owned by Spin Master
  since 2016. [Wikipedia](https://en.wikipedia.org/wiki/Toca_Boca)
- Toca Life: World was announced 21 Nov 2018 as a single free-to-play app merging all Toca Life apps;
  new playsets became in-app purchases. iPhone App of the Year 2021, Kidscreen Award 2022.
  [Wikipedia](https://en.wikipedia.org/wiki/Toca_Boca)
- Renamed Toca Boca World, around 2024 (the fan wiki rebranded on 24 May 2024; exact rename date
  **unverified**). [Fandom snippet](https://toca-life-world.fandom.com/wiki/Toca_Boca_World)
- Official claims: 90+ locations, 500+ characters, 60+ million players.
  [tocaboca.com](https://www.tocaboca.com/toca-boca-world)
- App Store: rated 4+, about 4.3/5 from roughly 890K ratings, Editor's Choice.
  [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685)

## 1. Core loop and open-ended play

- No goals, no levels, no score, no winning or losing, no time limits. The App Store listing
  stresses "no rules, time limits or high scores".
  [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685),
  [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/is-your-child-playing-toca-boca-world-heres-what-you-should-know)
- It works as a "digital dollhouse where the whole point is making up stories". A typical session:
  40 minutes on character backstories, then switching to running a clinic.
  [Screenwise](https://screenwiseapp.com/toca-boca)
- Actual loop in practice:
  1. Pick or create characters.
  2. Go to a location (home, salon, school, hospital, mall).
  3. Drag characters and objects around, dress them, feed them, put them in beds, act out a story.
  4. Collect new stuff (weekly gift, events, secrets, purchases) and fold it into the next story.
- Designers call themselves "play designers", not game designers, and design "from a kid's
  perspective". Everyday settings with small imperfect details ("dirt in the corners") and quirky
  surprises. [Motionographer](https://motionographer.com/2016/04/27/the-design-process-behind-toca-bocas-infectious-apps/)
- Game vs playground: the value is a framework where the child invents meaning; in one example a
  shopping trip turned into a picnic, then camping, then moonlight swimming.
  [Game Developer](https://www.gamedeveloper.com/design/learning-about-playfulness-from-toca-boca-and-my-kids)
- Weakness: kids who want goals or progression can bounce off.
  [Screenwise](https://screenwiseapp.com/toca-boca)

## 2. Character Creator

How it works:

- Open from a character icon in the top right corner, tap "+" to start a new character, tap the
  checkmark to save; characters can be edited later.
  [thetocabocalife.com](https://thetocabocalife.com/how-to-create-a-character-in-toca-boca-world/)
- Options: age (toddler, kid, adult, and so on), skin color, hair style and color, facial features
  (eyes, eyebrows, nose, mouth, dimples, freckles, blush), outfits (tops, bottoms, dresses, shoes),
  accessories (glasses, hats, earrings, necklaces, hair accessories). Prosthetic arms and legs are
  available. [Shorty Awards](https://shortyawards.com/4th-socialgood/character-creator-tool),
  [thetocabocalife.com](https://thetocabocalife.com/how-to-create-a-character-in-toca-boca-world/)
- Color UI: pick a premade swatch, then drag a slider under it for nearby shades
  ([Fandom snippet](https://toca-life-world.fandom.com/wiki/Character_Creator), wiki not fetched,
  treat details as **unverified**). A later update replaced this with a curated palette so "skin
  tones and hair colors actually look great together".
  [Help Center, glow-up](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/379-character-creator-improvements-are-here-it-s-time-for-a-glow-up-1779808294/)
- Randomize button: the glow-up update tuned the randomizer to produce fewer "accidents" (cohesive
  combos). Same update refreshed 61 hairstyles, 56 outfits, 10 facial details.
  [Help Center, glow-up](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/379-character-creator-improvements-are-here-it-s-time-for-a-glow-up-1779808294/)
- Gender-free: no gender choice; every clothing and hair option is available to every character.
  [Shorty Awards](https://shortyawards.com/4th-socialgood/character-creator-tool)
- Slots: free version makes 3 characters; the paid upgrade unlocks 27 characters and 2,000+
  options. Style Packs add themed hair, faces, outfits, accessories.
  [Help Center, purchases](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/135-what-type-of-content-is-available-for-purchase-on-toca-boca-world/)
- Outfit Designer (separate mannequin tool): mix and match pieces into up to 30 saved outfits, which
  then appear in a "wardrobe" (hanger) category in the Character Creator.
  [Help Center, Outfit Designer](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/241-introducing-outfit-designer-your-new-tool-to-style-outfits/?p=ios)
- Character Movements: 30 animations/expressions triggered from an expressions menu (select
  character, pick a move); can be toggled off.
  [Help Center, movements](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/253-introducing-character-movements/)

Why kids rate it highly:

- Huge option count and identity play ("be whoever they want to be").
  [tocaboca.com](https://www.tocaboca.com/toca-boca-world)
- Instant visual feedback and a randomizer that gives a good-looking starting point.
- Created characters are not stuck in a menu: they walk into every location and story.
- Alea explicitly names it "a better avatar maker" than Avatar World.

## 3. Home Designer and decorating

- Home Designer districts on the map have a blue "build hammer"; tap it, choose a house type, and
  the house is placed on a plot. [Help Center, Style Selector](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/259-introducing-the-style-selector/?p=ios)
- Style Selector: build "Ready to decorate" (empty) or "Ready to play" (pre-furnished preset), then
  change anything.
  [Help Center, Style Selector](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/259-introducing-the-style-selector/?p=ios)
- Multiple homes: several districts and plots, and house types are separate products (Modern
  Mansion, Bonsai Building, Maple Avenue Building, Neon Rainbow Apartment).
  [Help Center, purchases](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/135-what-type-of-content-is-available-for-purchase-on-toca-boca-world/)
- Decoration menu: blue chair button top right opens categories Bedroom, Bathroom, Kitchen, Living
  room, Surface designs (wallpaper, floors), Hobbies, Outdoor, plus a Star (shop) tab, each with
  subcategories (curtains, drinks, pet items, small and big decorations). You scroll a list of
  owned items. [Help Center, decoration menu](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/138-what-s-new-in-the-home-designer-decoration-menu/)
- Placement: drag from the inventory into the room; placed items can be dragged again and flipped
  horizontally ([Fandom snippet](https://toca-life-world.fandom.com/wiki/Home_Designer)).
- Walls, floors and colors can be changed. [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685)
  Per-item furniture recoloring exists for some items according to videos
  ([YouTube](https://www.youtube.com/watch?v=6OplpBfvnt4)); scope **unverified**.
- Exterior: changing the house exterior, roof or garden in detail could not be confirmed
  (**unverified**). App Store reviewers ask for "expanded house customization", which suggests
  exterior control is limited. This matches Alea's wish for more control over outside and garden.
- Storage/inventory: the item list is a permanent catalog (you never run out of a sofa). Loose
  items can also be packed in storage boxes or backpacks and carried between locations
  ([Fandom snippet, Storage](https://toca-life-world.fandom.com/wiki/Storage); **unverified** in
  detail). Common Sense notes precise placement "sometimes takes a few tries".
  [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories)

## 4. Events, gifts, updates, secrets, collectibles

- Weekly gift: every Friday, worldwide at the same time, at the Post Office in Bop City. Tap the gift
  button, a box arrives on a conveyor belt, double-tap to open. Each gift is available one week.
  Contents: furniture, outfits, decorations, pets.
  [Help Center, weekly gift](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/4-how-can-i-claim-my-free-weekly-gift-in-toca-boca-world/?p=ios),
  [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685)
- Collected gifts are kept on shelves in a storage area of the Post Office.
  [Fandom snippet](https://toca-life-world.fandom.com/wiki/Post_Office)
- Gift Bonanza: once or twice a year, old gifts (up to about two years back) are put back on the
  Post Office shelves permanently, including seasonal Halloween, winter and summer items
  ([Help Center title](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/283-gift-bonanza-explained/?p=ios),
  frequency from a fan guide, **unverified**).
- Frequent updates: roughly monthly new locations, style packs, brand collabs (adidas, Pusheen,
  Wicked). Some formerly paid locations (Hospital, Movie Studio, OK Street High) were later made free
  for all. [Help Center section](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/section/7-toca-boca-world/),
  [Screenwise](https://screenwiseapp.com/toca-boca)
- Event Calendar (in testing) to show gift drops and events, so players "never miss" anything.
  [Help Center, Event calendar](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/387-event-calendar---never-miss-a-beat-in-toca-boca-world/)
- Hidden secrets: tap everything; secret rooms behind posters, a safe with a code, hidden outfits
  (for example tapping a poster reveals a sloth outfit), hidden pets. These spread by word of mouth
  and YouTube/TikTok. ([Fandom snippet, Bop City secrets](https://toca-life-world.fandom.com/wiki/Bop_City/Secrets);
  specific secrets **unverified**)
- Collectibles: "Crumpets", small odd creatures hidden behind plants or in vending machines. Finding
  one saves a photo in a Crumpet Collection with a found/remaining count.
  [Help Center, Collectibles](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/386-introducing-collectibles-out-now-can-you-find-them-all/)
- Retention drivers: a fixed weekly ritual (Friday), fear of missing a one-week gift, surprise
  unboxing, completion counters, and a steady stream of new content. Alea: "events give lots of cute
  things".

## 5. Art style, cuteness, feedback

- Flat, graphic look (flat-shaded 3D styled to look 2D), bright colors, quirky characters, everyday
  scenes with small "imperfect" details.
  [Motionographer](https://motionographer.com/2016/04/27/the-design-process-behind-toca-bocas-infectious-apps/)
- Almost everything reacts: doors and cabinets open, faucets run, characters sit on chairs and lie in
  beds when dropped there, food can be eaten, clothes are put on by dragging onto a character.
  [GeekDad](https://geekdad.com/2018/01/explore-world-toca-boca/)
- Delight for its own sake (the studio's site used a floating yellow balloon to scroll back up).
  [Game Developer](https://www.gamedeveloper.com/design/learning-about-playfulness-from-toca-boca-and-my-kids)
- Background music and sound effects on every interaction (music can be turned off in settings).
  [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories)
- Alea finds Avatar World cuter than Toca Boca, so for AleaSpel cuteness should be pushed further
  (round shapes, big eyes, pastel palette).

## 6. UI/UX for young kids

- Text-free, visual interaction; no narrator telling the "right" way to play.
  [GeekDad](https://geekdad.com/2018/01/explore-world-toca-boca/),
  [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/is-your-child-playing-toca-boca-world-heres-what-you-should-know)
- Map: tap a location to zoom in; the world is split into themed districts.
  [GeekDad](https://geekdad.com/2018/01/explore-world-toca-boca/)
- Character "sidewalk"/pocket at the bottom of the screen: all characters are available there and
  can be dragged into the current scene, even if they are elsewhere. Characters keep held items when
  travelling. [GeekDad](https://geekdad.com/2018/01/explore-world-toca-boca/)
- Icon buttons in fixed corners (creator tools top right, expressions bottom left, decorate chair
  top right). [Help Center articles above]
- Save is automatic; the world simply stays as you left it (behaviour observed widely; exact
  cloud-save mechanics **unverified**).
- Works offline, single-player, no chat, no third-party ads, COPPA-compliant.
  [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685),
  [Screenwise](https://screenwiseapp.com/toca-boca)

## 7. Monetization and what to avoid

- Free app with 8 free locations and 39 characters at the time of the Common Sense review (the free
  set has grown since). Paid content: locations, Home Designer houses and buildings, furniture
  packs, Character Creator upgrade, style packs. IAPs about $0.99 to $13.99, bundles higher.
  [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories),
  [Help Center, purchases](https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/135-what-type-of-content-is-available-for-purchase-on-toca-boca-world/)
- Model: "here's a taste, now buy expansion"; not predatory in the loot-box or energy-timer sense.
  [Screenwise](https://screenwiseapp.com/toca-boca)
- Shopping cart icon is shown at all times, and store items appear inside the decorate menu (Star
  tab). [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories)
- Kids may not tell free from paid content. [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/is-your-child-playing-toca-boca-world-heres-what-you-should-know)

A parent-made game should avoid:

- Any locked or greyed-out item that the child cannot get. Show only what she owns, or make
  everything earnable in play.
- Missable timed rewards (one-week gifts) that create fear of missing out. Gifts should wait until
  claimed.
- Shop icons, ads, analytics, accounts, chat.
- Randomized paid rewards of any kind.

## 8. Criticisms from players and parents

- Persistent push to buy; "a push to buy, buy, buy".
  [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories)
- Bugs, crashes on launch, lost purchases and lost progress.
  [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories),
  [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685)
- Wanting more free content; requests for colorable clothing, jewelry, more house customization.
  [App Store](https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685)
- Fiddly precise placement of small items.
  [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories)
- No natural stopping points (screen time); pressure from polished YouTube builds; third-party
  analytics. [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/is-your-child-playing-toca-boca-world-heres-what-you-should-know)
- No goals, so kids who want challenge get bored.
  [Screenwise](https://screenwiseapp.com/toca-boca)

## 9. Ideas for AleaSpel

Priority: P1 = build next, P2 = soon, P3 = later. "Cheap" = doable in Phaser 3 with shapes and
colors in code, mostly data rows plus a small generic system.

| #   | Pri | Idea                                                                                                                                                           | Rationale                                                                                              | Cheap?                       |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1   | P1  | **Gymnast team roster**: save a list of gymnasts (start 3, e.g. up to 6), a bottom "bench" bar to drag any gymnast into Home or Gym.                           | Alea's explicit wish, mirrors TBW's character sidewalk; needs a `SaveData` migration once.             | Yes                          |
| 2   | P1  | **Avatar editor with tabs** (Kropp, Ansikte, Hår, Kläder, Tillbehör) and swatch-row colors from a curated palette.                                             | TBW's editor is her benchmark; curated palettes make any combo look good.                              | Yes                          |
| 3   | P1  | **"Slumpa" (randomize) button** that picks from harmonious combos.                                                                                             | Instant gratification and a good starting point, as in TBW's glow-up.                                  | Yes                          |
| 4   | P1  | **Leotard designer**: body color, pattern (stripes, dots, stars, glitter shapes), sleeve type, as data rows.                                                   | Gymnastics-specific "outfit designer"; many combos from few rows gives the "lots of stuff" feel.       | Yes                          |
| 5   | P1  | **Gesture minigames**: draw a shape (circle = salto, zigzag = handspring, line up = jump, V = split) during a beam/floor routine; score by shape match.        | Alea's explicit minigame wish; a simple point-direction recognizer (e.g. $1 recognizer) is small code. | Mostly                       |
| 6   | P1  | **Tap-anything reactions**: every placed object wiggles, squashes or plays a sound on tap; gymnasts do a small pose when tapped.                               | TBW's core delight; cheap tweens make placeholder art feel alive.                                      | Yes                          |
| 7   | P1  | **Friday gift box ("Fredagspaket")** in the house: a present box appears every Friday, double-tap to open with confetti; gifts wait until claimed (no expiry). | Captures TBW's weekly ritual and Alea's "events give cute things", without FOMO.                       | Yes                          |
| 8   | P2  | **Multiple houses on a street map** with exterior options: wall color, roof shape/color, door, windows, fence.                                                 | Alea's wish for several houses and changeable exterior; TBW is weak here.                              | Yes                          |
| 9   | P2  | **Garden editor**: grass/path tiles, flowers, trees, trampoline, pool, drag-and-drop like indoors.                                                             | Alea wants more garden control; reuse the same drag system and furniture data format.                  | Yes                          |
| 10  | P2  | **Decorate menu with categories** (Sovrum, Kök, Vardagsrum, Gym, Trädgård, Väggar/Golv), recolor button on selected item, flip, delete by dragging to a bin.   | TBW's proven pattern plus the recolor players ask for.                                                 | Yes                          |
| 11  | P2  | **Big snap targets and "sit/lie" slots**: gymnasts snap onto beds, chairs, beam, bars when dropped near.                                                       | Fixes TBW's fiddly placement and gives meaningful drops.                                               | Yes                          |
| 12  | P2  | **Personal best board in the gym** (per gymnast, per apparatus) with a medal or star animation on a new best.                                                  | Adds the light goal TBW lacks; "beat your best" is in the design brief.                                | Yes                          |
| 13  | P2  | **Pose/emote menu**: 8-12 gymnastics poses (split, bridge, handstand, wave, cheer) triggered on a selected gymnast.                                            | Like TBW Character Movements, supports storytelling and team play.                                     | Yes, with simple shape limbs |
| 14  | P2  | **Hidden collectibles**: small hidden "glitter stars" or cute critters behind furniture and in the gym, with a found/total album.                              | TBW Crumpets and secrets drive exploration and repeat play.                                            | Yes                          |
| 15  | P3  | **Seasonal events**: date-based item sets (Halloween, Lucia/jul, midsommar, sommar) unlocked in the gift box during that season and kept forever.              | Events are Alea's favorite TBW feature; keep items permanently.                                        | Yes                          |
| 16  | P3  | **Style presets for houses** ("Tom" or "Klar att leka") when building a new house.                                                                             | TBW Style Selector makes a new house fun immediately.                                                  | Yes                          |
| 17  | P3  | **Team competition show**: pick 3 gymnasts, each performs a gesture routine, simple judge scores and a podium.                                                 | Combines team wish and minigames into a mini story.                                                    | Medium                       |
| 18  | P3  | **Photo mode**: freeze scene, hide UI, save a PNG to the device.                                                                                               | Kids love showing their builds; Phaser can snapshot the canvas.                                        | Yes                          |

Build notes:

- Keep everything data-driven: avatar parts, leotard patterns, furniture, exterior parts, garden
  items, gestures, gifts and collectibles as rows in `src/data/*.ts`.
- Save schema changes (team list, houses, owned items, claimed gifts, collectibles) need a
  `SAVE_VERSION` bump and migration.
- All UI text in Swedish, icon-first so little reading is needed. No shop, no ads, no timers that
  punish absence.

## Sources

- https://en.wikipedia.org/wiki/Toca_Boca
- https://www.tocaboca.com/toca-boca-world
- https://apps.apple.com/us/app/toca-boca-world-game-play/id1208138685
- https://www.commonsensemedia.org/app-reviews/toca-life-world-build-stories
- https://screenwiseapp.com/toca-boca
- https://www.bitdefender.com/en-us/blog/hotforsecurity/is-your-child-playing-toca-boca-world-heres-what-you-should-know
- https://geekdad.com/2018/01/explore-world-toca-boca/
- https://motionographer.com/2016/04/27/the-design-process-behind-toca-bocas-infectious-apps/
- https://www.gamedeveloper.com/design/learning-about-playfulness-from-toca-boca-and-my-kids
- https://shortyawards.com/4th-socialgood/character-creator-tool
- https://thetocabocalife.com/how-to-create-a-character-in-toca-boca-world/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/379-character-creator-improvements-are-here-it-s-time-for-a-glow-up-1779808294/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/241-introducing-outfit-designer-your-new-tool-to-style-outfits/?p=ios
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/253-introducing-character-movements/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/259-introducing-the-style-selector/?p=ios
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/138-what-s-new-in-the-home-designer-decoration-menu/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/135-what-type-of-content-is-available-for-purchase-on-toca-boca-world/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/4-how-can-i-claim-my-free-weekly-gift-in-toca-boca-world/?p=ios
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/283-gift-bonanza-explained/?p=ios
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/386-introducing-collectibles-out-now-can-you-find-them-all/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/faq/387-event-calendar---never-miss-a-beat-in-toca-boca-world/
- https://tocaboca.helpshift.com/hc/en/3-toca-boca-world/section/7-toca-boca-world/
- Fandom wiki pages (search snippets only, not fetched): https://toca-life-world.fandom.com/wiki/Character_Creator,
  https://toca-life-world.fandom.com/wiki/Home_Designer, https://toca-life-world.fandom.com/wiki/Post_Office,
  https://toca-life-world.fandom.com/wiki/Storage, https://toca-life-world.fandom.com/wiki/Bop_City/Secrets,
  https://toca-life-world.fandom.com/wiki/Toca_Boca_World
- https://www.youtube.com/watch?v=6OplpBfvnt4 (furniture color video, not watched)
