# Interview with Alea, 2026-09-30

Alea is 9 years old and the player the game is made for. The game must be in Swedish.
Answers are recorded as she said them (Swedish), with an English note for each section.

## Bra saker med Avatar World

- Många föremål
- Gulliga gubbar
- Gulligare än Toca Boca

_English: lots of items, cute characters, cuter than Toca Boca._

## Bra saker med Toca Boca

- Fler grejer
- Bättre avatarmakare
- Events ger många gulliga grejer

_English: more stuff, a better avatar maker, events give lots of cute things._

## Kul saker i spel (önskemål till AleaSpel)

- Ha flera hus där man kan byta lite saker, hur utsidan ser ut, mer kontroll över trädgård och insida.
- Man ska kunna ha ett litet gymnastlag.

_English: several houses, with the option to change the exterior and more control over garden and
interior. She wants to have a small gymnastics team (several gymnasts, not just one avatar)._

## Minispel

- Man kanske rör fingrarna i särskilda mönster för särskilda moves eller liknande.

_English: minigames where you move your fingers in specific patterns (gestures) to perform specific
moves._

## Takeaways for the design

- **Cuteness is the top priority** for graphics (Avatar World wins on this). Input for the graphics
  discussion.
- **Quantity of items** matters: many furniture and clothing items. Supports the data-driven rule.
- **Avatar maker quality** matters: Toca Boca's editor is the benchmark.
- **Events / new cute things over time** are motivating. Possible later feature: seasonal or
  "surprise" item drops, no real money.
- **Multiple houses** with editable exterior, garden and interior.
- **Gymnastics team**: several avatars, which affects the save schema (list of gymnasts, not one).
- **Gesture-based minigames**: draw patterns / swipe sequences to perform moves.

## Follow-up after testing Mitt lag and Garderob (same day)

She tested on her phone: the gymnast shows, renaming works, changing clothes and colours works.

Her next wishes:

- Olika delar av ansiktet (different face parts: eyes, eyebrows, mouth and so on).
- Smink (make-up).

_Design note: facial features are baked into the master. Plan in `docs/asset-spec.md`, "Face"._

## Follow-up: pets, houses and prizes (same day)

- Hon vill kunna leka med djuren och ta hand om dem.
- Laget har husdjuren, inte gymnasterna.
- Ett hus är för laget: en klubbstuga som sitter ihop med gymmet.
- Sedan kan varje gymnast bo i ett eget hus.
- Man måste köpa finare möbler och kläder genom att vinna tävlingar.

_English: she wants to play with and care for the pets. Pets belong to the team. The team has a
club house joined to the gym; each gymnast can live in her own house. Nicer furniture and clothes
are bought with prizes from winning competitions. Recorded in `docs/game-design.md` (sections 4,
7 and 8)._

## Feedback on Lagets djur (same day)

- Djuren ska se mer riktiga ut: djur som sitter där och är gulliga. (Real art comes with the art
  pass; placeholder changed to a sitting pose.)
- Bollen var bra. Fler lekar.
- Hemlig personlighet: djuren gillar olika lekar, och man lär sig det, till exempel
  "Azmodeus: + bolllek, - balanslek, + magkli".
- Leken ska kräva en enkel interaktion: ett mönster eller klicka snabbt några gånger.
- Olika sorters mat.

## Feedback on Tävlingar / Studsmatta (same day, from Stefan)

- Gillade att rita mönster. Gillade inte "svep höger/vänster": pilen såg ut som ett mönster att
  rita, men en medioker böj räckte.
- Satsa på mönster, och ge olika poäng beroende på hur "rätt" mönstret ritades.
