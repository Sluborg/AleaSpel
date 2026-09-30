# Redo requests

Visuals adds a row when an image fails the review. ChatGPT does open rows before new batches,
uploads the new image to the same path in `art-inbox/`, and logs it in `art-inbox/STATUS.md`.
Visuals sets the row to Done when the new image passes.

| Batch | Id  | What is wrong | What to change | Status |
| ----- | --- | ------------- | -------------- | ------ |
