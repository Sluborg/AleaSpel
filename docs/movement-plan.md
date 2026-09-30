# Movement plan (poses and animation)

Owner: Visuals (character system: `GymnastView`, rig, art). Lead uses the moves in scenes and
minigames. Goal: the gymnast moves and poses while every custom item (clothes, face, accessories)
keeps working, without redrawing items per pose.

## Principle

Items stay drawn once, in the standing master pose. Movement comes from moving the layers, not
from new pictures. Only special hero moments get separate images.

## Stage 1: whole-body moves (no new art)

`GymnastView.play(move)` animates the whole layered gymnast as one object (Phaser tweens on the
container): position, scale (squash and stretch), rotation, flip.

| Move     | What it looks like                               | Used for                      |
| -------- | ------------------------------------------------ | ----------------------------- |
| `idle`   | slow breathing bob (1-2 % scale), loops          | everywhere she stands         |
| `happy`  | small hop with squash on landing                 | wearing a new item, rewards   |
| `jump`   | crouch, stretch up, fall, squash                 | trampoline, vault run-up      |
| `spin`   | full turn around the vertical axis (scaleX flip) | wardrobe "twirl", celebration |
| `flip`   | full rotation in the air                         | trampoline trick, landing     |
| `wobble` | side-to-side tilt                                | beam balance, near-fall       |
| `bow`    | short forward lean and back                      | end of routine, medals        |

Moves are data rows (`src/data/moves.ts`: keyframes of y, scaleX, scaleY, angle, duration,
ease), so new moves are rows, not code.

## Stage 2: body-part rig (cut-out animation)

1. Split the master into parts with masks: head+neck, torso+hips, upper arm L/R, lower arm+hand
   L/R, upper leg L/R, lower leg+foot L/R. Joints = the measured anchors (shoulders, elbows =
   midpoint shoulder-wrist, hips, knees, ankles).
2. Every layer image (clothes, face, accessories) is split with the same masks by a script, so a
   sleeve moves with its arm automatically. Face parts and hair belong to the head part.
3. Parts overlap slightly at joints (rounded caps) so bends show no gaps.
4. Poses = joint angles as data rows (`arms_up`, `wave`, `star`, `lunge`, `landing`, `run` frames).
   Tweening between poses gives animation.
5. Limits: bends past about 60 degrees at elbows/knees stretch visibly; very bent poses go to
   stage 3.

New art needed: a small set of "joint caps" if seams show (ChatGPT, faces track style). Nothing
else; existing items keep working.

## Stage 3: hero poses (separate images, only where needed)

Handstand, split, bridge, cartwheel mid-frame: one image per pose from ChatGPT on the master
style, with the leotard in key pink so its colour follows her outfit. Other items are not shown
in these moments. Used only for short minigame highlights.

## Order and effort

1. Stage 1 now (Visuals, small). Lead can call `play()` right away.
2. Stage 2 after hair is decided (hair splits across head/back), about one focused session.
3. Stage 3 per minigame need, via art requests.
