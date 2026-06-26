---
name: author_physics_notes
description: Upgrade one NEET Physics chapter's auto-seeded notes into expert teaching notes (executive summary, must-know points, exam traps, formulas with meanings) for the app at /Users/dr.ajayshukla/NEET_physics. Use when the user names a physics chapter and asks to "author notes", "write expert notes", "upgrade notes for chapter X", or "do the next chapter's notes". Do ONE chapter fully per pass.
---

# Author expert NEET Physics notes (one chapter)

Seed notes are auto-generated from question explanations (`source:"seed"`). This
skill turns a chapter's seed notes into proper expert notes (`source:"authored"`)
that teach the concept and are tuned for **revision**, then rebuilds the bundle.

**Standing rule: complete one chapter fully (author → build → validate →
commit), then report back before the next.** Don't batch chapters.

## 1. Read the chapter's current notes + linked questions

```bash
cd /Users/dr.ajayshukla/NEET_physics
ls data/notes/                       # find the chapter slug
```
Read `data/notes/<chapter-slug>.json` and skim the `questionIds` (look them up in
`bank.json`) so the notes match what is actually tested. Each note = one
`(chapter, subtopic)` group.

## 2. Quality spec (per note)

Set `"source": "authored"` and keep the existing `id`, `chapter`, `subtopic`,
`class`, `unitId`, `order`, and `questionIds` (the note↔question links). Author:

- **`title`** — a real teaching hook. **≥50% of a chapter's note titles must
  start with "Why" or "How"** (deep reasoning), e.g. "Why rolling without
  slipping fixes v = ωr", not just the subtopic name.
- **`summary`** — 1–2 sentence executive summary of the key idea.
- **`body`** — markdown + `$LaTeX$`. Include:
  - `**Must know**` — the few facts/results that unlock the MCQs.
  - The derivation/intuition in brief.
  - `**Exam traps**` — the specific mistakes NEET students make (sign errors,
    wrong axis, SI slips, limiting cases).
- **`formulas`** — `[{ "latex": "...", "meaning": "..." }]`. Give every formula a
  one-line `meaning` (seed formulas have empty meanings — fill them). These power
  the formula sheet + flashcards, so be precise and exam-relevant.

Physics must be correct and NCERT/NEET-aligned. Use proper LaTeX so KaTeX renders
(`\vec`, `\frac`, `\omega`, `^`, `_`, …). Anything genuinely off-syllabus or
contested: say so, don't assert it.

## 3. Build + validate

```bash
python3 scripts/build_notes.py      # preserves your authored notes, refreshes seeds
python3 scripts/validate_notes.py   # must print: ✓ validation passed
```

## 4. Commit + push (only the changed files)

```bash
git add data/notes/<chapter-slug>.json notes-bundle.js
git commit -m "Author expert notes: <Chapter> (K notes, % Why/How)

Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push physics main
```
Bump the `notes-bundle.js` `?v=` in `index.html` (and `sw.js`) if you want
existing clients to refetch immediately. Then report: chapter done, note count,
% Why/How titles, formulas added.
