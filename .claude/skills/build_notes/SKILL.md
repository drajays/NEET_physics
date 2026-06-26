---
name: build_notes
description: Rebuild the NEET Physics notes layer for the app at /Users/dr.ajayshukla/NEET_physics — seed/refresh notes from bank.json, extract formulas, regenerate notes-bundle.js, and validate. Use whenever notes data is out of sync with bank.json, after adding/importing questions, after editing data/notes/*.json, or when the user says "rebuild notes", "regenerate the notes bundle", or "validate notes".
---

# Build / refresh the NEET Physics notes layer

The notes layer is generated from `bank.json` and lives in `data/notes/*.json`
(source) + `notes-bundle.js` (the `window.NEET_NOTES` artifact the app loads).
This skill runs the pipeline and verifies it.

## Steps

1. **Rebuild** (re-runnable and safe — `source:"authored"` notes are preserved,
   only `source:"seed"` notes are regenerated):
   ```bash
   cd /Users/dr.ajayshukla/NEET_physics
   python3 scripts/build_notes.py
   ```
   Expect output like `✓ N notes (… seed + … authored), … formulas, … chapters`.

2. **Validate** (hard-fails on broken links):
   ```bash
   python3 scripts/validate_notes.py
   ```
   Must end with `✓ validation passed`. It checks: unique note ids, every
   `questionId` resolves to a real question in `bank.json`, the bundle parses and
   matches the data/ note count, and reports formula coverage + any note with no
   linked questions.

3. **Smoke-render (optional but recommended)** — confirm every note/cheatsheet
   renders without a JS error using the headless harness pattern (stub
   `window`/`document`, load `js/curriculum.js` + `notes-bundle.js` +
   `js/notes.js`, call `NeetNotes.render()` across all notes).

4. **Commit** only the regenerated files, then push to the `physics` remote:
   ```bash
   git add notes-bundle.js data/notes/
   git commit -m "Rebuild notes bundle (N notes, M formulas)
   
   Co-Authored-By: Claude <model> <noreply@anthropic.com>"
   git push physics main
   ```

## Rules

- The HC-Verma→NCERT `CHAPTER_ALIASES` map exists in **two** places that must
  stay identical: `scripts/build_notes.py` and `js/curriculum.js`. If you change
  one, change the other and rebuild.
- Never hand-edit `notes-bundle.js` — it is generated. Edit `data/notes/*.json`
  (for authored notes) or `bank.json` (for seed source), then rebuild.
- Bump the `?v=` cache-bust for `notes-bundle.js` in `index.html` and the
  `sw.js` `SHELL`/`CACHE` when shipping a rebuild.
