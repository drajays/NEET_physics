# NEET Physics — MCQ Mastery + Notes/Revision app

A personal, static, **vanilla-JS** study app for NEET Physics. 2045 MCQs +
syllabus-organised **notes**, **formula sheets**, spaced-repetition
**flashcards**, and a NEET-style **CBT mock test**. No backend; deployed to
GitHub Pages. Questions/progress live in the browser (IndexedDB + localStorage);
notes ship as a generated JS bundle.

## Run / deploy

```bash
python3 -m http.server 8000      # open http://localhost:8000
```

- **Deploy:** static site, `.github/workflows/deploy.yml` uploads the repo root on
  push to `main` of the **`physics`** git remote (`github.com/drajays/NEET_physics`,
  NOT `origin` which is NEET_pingal). Live: `https://drajays.github.io/NEET_physics/`.
- **Cache-busting:** assets are loaded with `?v=YYYYMMDD` in `index.html`. Bump
  the version on every changed asset (and `sw.js`'s `CACHE` const + `SHELL` list)
  so clients re-fetch. Current: `20260627`.

## Architecture

Plain HTML/CSS/JS, no build step for the app. Each `js/*.js` is an IIFE that
attaches one global (`NeetCurriculum`, `NeetViews`, `NeetNotes`, `NeetRevise`,
`NeetExam`, …) and receives an injected `deps` object via `init(deps)` (see the
`learningDeps` block + `NeetViews.init` in `app.js`). `app.js` is the monolith:
state, IndexedDB/sync, practice engine, progress store, and the notes/SRS data
layer.

### Data — questions (`bank.json`)

The running app does **not** read local `bank.json`. `loadQuestionsAsync()` reads
IndexedDB (`neet-mcq-bank-v1`); a fresh device fetches the remote `bank.json`
(`config.js` `remoteBankUrl`). So **new questions go live only after committing &
pushing `bank.json` to the `physics` remote**. Local `bank.json` is the published
artifact + the seed source for notes.

Question schema: `id, subject, topic (=Chapter), subtopic (=Section), question,
optionA..D, answer (single letter A–D, or comma-joined multi-correct),
explanation, tags[]`. LaTeX renders via `renderMath()` (KaTeX). `topic` values
are normalised to NCERT chapters through `CHAPTER_ALIASES` in `js/curriculum.js`
(includes the HC-Verma `Chapter N: …` → NCERT mapping). **Keep that alias map in
sync with the identical one in `scripts/build_notes.py`.**

### Data — notes (`notes-bundle.js`, generated)

Notes are the teaching layer, one per `(chapter, subtopic)` group, organised on
the NCERT XI/XII syllabus tree (`CURRICULUM` / `CHAPTER_INFO` in
`js/curriculum.js`).

- **Source of truth:** `data/notes/<chapter-slug>.json` (array of notes per
  chapter). **Build artifact:** `notes-bundle.js` → `window.NEET_NOTES`.
- **Pipeline:**
  ```bash
  python3 scripts/build_notes.py      # seed from bank.json explanations + extract formulas
  python3 scripts/validate_notes.py   # ids unique, every questionId resolves, etc.
  ```
  `build_notes.py` is **re-runnable and safe**: notes with `"source":"authored"`
  are preserved; only `"source":"seed"` notes are regenerated (merge by `id`).
- **Note schema:** `id, chapter, subtopic, class (XI|XII), unitId, unitLabel,
  order, title, summary, body (markdown+LaTeX), formulas:[{latex,meaning}],
  questionIds:[…], tags:[], source:"seed"|"authored"`.

### Note ↔ question linking (the core contract)

- **Note → questions:** `note.questionIds[]`, filled at build time by matching
  chapter+subtopic. UI: "Practice N linked MCQs" (`practiceNoteQuestions`).
- **Question → note:** in-memory reverse index `state.noteByQuestionId`
  (built by `initNotesIndex()`), so `bank.json` is never modified. UI: the
  "📄 Read the note" button on practice + bank cards → `jumpToNote(noteId)`.

### Revision system (all client-side, additive to progress store)

Progress lives in `state.progress.students[id]` (`PROGRESS_KEY =
neet-student-progress-v1`, IndexedDB). The revamp adds, **per student** (never
touching the existing `questions` map):
- `srs` — SM-2-lite cards keyed `note:<id>` / `formula:<noteId>#<i>`
  (`reviewSrs`, ratings Again/Hard/Good/Easy → `due`). Drives the **Flashcards**
  tab (`NeetRevise`).
- `marks` — `bookmark` + `flag` (revise/doubt/confident) per `note:`/`q:` id.
- `mockTests[]` — saved CBT attempts (score/accuracy history).
- `history[]` (existing) also logs `review` events → streak + daily goal.
Derived, not stored: **mistakes notebook** & **leeches** (from the `questions`
map: `getMistakeQuestions` / `getLeechQuestions`).

### Mock test (`js/exam.js`, `NeetExam`)

NTA/NEET-style CBT (ported from `class_8_sci/exam-panel.js`): scope picker →
timed test with question palette (answered/marked/visited) → auto-grade
**+4 / −1 / 0** → result with score, review of wrong answers (each links to its
note), retry-from-mistakes. Adapt marking via `MARK_CORRECT`/`MARK_WRONG`.

### PWA / offline

`manifest.webmanifest` + `sw.js` (app-shell cache-first; cross-origin remote
bank passes through). Registered from `index.html`. Bump `sw.js` `CACHE` on asset
changes.

## Tabs (`data-tab` in `index.html` → `switchTab` in `app.js`)

`dashboard · chapters · notes · practice · exam · revise (Flashcards) ·
revision · audit · journey · bank` + admin (`add · flags · import`).

## Conventions

- **Adding/editing notes = edit `data/notes/<chapter>.json` (set
  `source:"authored"`) → `python3 scripts/build_notes.py` → commit the regenerated
  `notes-bundle.js` + the json.** No app rebuild needed.
- **Adding a JS bundle needs 3 edits:** `<script>` in `index.html`, the `SHELL`
  list in `sw.js`, and (if it needs app data) `learningDeps` + an `init` call in
  `app.js`.
- Match the existing module/IIFE + `deps` pattern; reuse `renderMath`,
  `escapeHtml`, `clean`, `NeetCurriculum`. Use the CSS tokens in `styles.css`
  (`--primary`, `--surface*`, `--ink*`, `panel-card`, `learn-badge`,
  `chip-toggle`, …) — don't hardcode colours.
- Commit only specific changed files (never `git add -A`; `.DS_Store` stays
  untracked). End commit messages with
  `Co-Authored-By: Claude <model> <noreply@anthropic.com>`.

## Authoring skills (`.claude/skills/`)

- **`build_notes/`** — run the seed/build/validate pipeline.
- **`author_physics_notes/`** — upgrade one chapter's seed notes to expert notes
  (summary + must-know + traps + formulas; ≥50% titles start "Why"/"How"),
  `source:"authored"`, then rebuild. One chapter per pass.
