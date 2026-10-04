# Alea plays the game, 2026-10-03

Alea played the live build (after PR #27) and told Stefan what she noticed. Her words, via
Stefan, in Swedish, with an English note and who acts on it.

| Order | What she said                                                                 | English                                                    | Owner | Status   |
| ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ----- | -------- |
| 10    | Det är svårt att förstå vilka föremål som hamnar var.                         | Hard to know where a bought item ends up (which room).     | Lead  | Doing    |
| 20    | Hon vill ha kläder i butiken.                                                 | She wants clothes to buy in the shop.                      | Art   | Asked    |
| 30    | Vissa växter verkar clippade.                                                 | Some plants look cut off.                                  | ?     | Need pic |
| 40    | En trädgårdsplatta är diagonal, mycket konstig.                               | The garden path tile is drawn tilted, looks odd.           | Art   | Asked    |
| 50    | Inga animationer på kroppsdelar ännu.                                         | No body-part animation yet (only whole-body moves).        | Art   | Asked    |
| 60    | Den säger "Perfekt" när man får 39 %.                                         | "Perfekt!" shows at 39 % (easy moves cap at one star).     | Lead  | Doing    |
| 70    | "Kör!" vid tävling har en ful studsmatta i knappen.                           | The trampoline icon on Tävlingsdag's Kör! does not fit.    | Lead  | Doing    |
| 80    | Hoppet gymnasten gör efter ett moment tar lång tid och blir ganska enformigt. | The reaction jump after each round is slow and repetitive. | Both  | Doing    |
| 90    | När hon snurrar är animationen inte smooth, den stutterar runt medurs.        | The flip rotation stutters.                                | Art   | Asked    |
| 100   | Pricka rätt har en fördröjning vid klick.                                     | Pricka rätt reacts late to a tap (fires on release).       | Lead  | Doing    |

## Follow-up 2026-10-04 (screenshots from Stefan)

- Klubbstugan: the door to the gym was a plain green rectangle ("konstig länk till gym"). Lead: real
  door art with a "Gymmet" sign.
- Some circles were not round (round buttons stretched to ovals). Lead: fixed in `buttonBackground`.
- The tilted stone tile is `garden_path` in Trädgården (art request 180).
- She wants many more clothes ("massa fler"): art request 170 raised to 20+.
- Few shoes and accessories ("skor och sånt det finns få av"); she wants them as gifts or in the shop: row 170 now weighted to shoes, socks and accessories, a third gift-only.
