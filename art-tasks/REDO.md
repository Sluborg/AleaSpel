# Redo requests

Visuals adds a row when an image fails the review. ChatGPT does open rows before new batches,
uploads the new image to the same path in `art-inbox/`, and logs it in `art-inbox/STATUS.md`.
Visuals sets the row to Done when the new image passes.

| Batch | Id           | What is wrong                                                          | What to change                                            | Status |
| ----- | ------------ | ---------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| B11   | ext_wall_2   | Mint bricks lose their colour when the green background is removed     | Same wall, but on a flat **magenta #FF00FF** background   | Open   |
| B11   | ext_window_2 | The green leaves in the flower box disappear with the green background | Same window, but on a flat **magenta #FF00FF** background | Open   |
