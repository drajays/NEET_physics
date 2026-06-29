---
name: glassbox_physics_solver
description: Build a standalone "Glass Box" physics solver tool (one self-contained HTML file with a glassmorphism UI that shows every solving step) and register it in the NEET Physics app's Glass Box gallery at /Users/dr.ajayshukla/NEET_physics. Use when the user asks to "build a glass box solver", "make a physics solver app/tool", "add a Glass Box tool", or names a chapter/topic to turn into an interactive step-by-step solver.
---

# Build a Glass-Box Physics Solver tool

A **glass-box solver** never just prints an answer — it shows given data, the
principle used, the formula chosen, value substitution, intermediate working,
units, and the final interpretation. The student should *learn the method*.

`REFERENCE.md` in this folder is the full topic-agnostic spec (functional
requirements, solver contract, UX standards, helper patterns). **Read it before
authoring** — this SKILL.md only adds how to wire the result into *this* repo.

## Output contract (non-negotiable)

- **One standalone `.html` file**, inline CSS + JS, **no build step**.
- Self-contained and offline-capable where possible (no CDN). The vector solver
  is fully inline; if a tool must use a CDN it still works online but won't be
  offline-cached — prefer inlining.
- Glassmorphism UI: gradient background, translucent blurred cards, soft glow,
  rounded corners, strong text contrast, responsive (2-pane desktop → 1 column
  mobile).
- Every question is an object `{ id, topic, title, text, answerFields, solver }`
  and `solver()` returns `{ answers, solution, steps: [[title, detail], …] }`.
- Controls: Generate Random, Select/Next, Show Hint, Show Steps, Show Full
  Solution, Auto Solve, Check My Answer, Clear. Answer checking uses numeric
  tolerance, comma-split for vectors, normalized text for concepts; mark fields
  green/red and show a score.

## Steps

1. **Read** `REFERENCE.md` (full spec) and confirm the topic + question set with
   the user if not supplied.
2. **Author** the HTML file. Save it to `glassbox/<topic>_solver.html` in the
   repo root.
3. **Register it in the gallery** — add one entry to the `TOOLS` array in
   `js/glassbox.js`:
   ```js
   { id: 'kebab-id', title: 'Title', desc: '…', file: 'glassbox/<topic>_solver.html',
     icon: '🧪', tags: ['Topic', 'Chapter'], cls: 'XI' }
   ```
   Tags drive the gallery's filter chips; `cls` is `XI`/`XII`.
4. **Cache + offline:** add `'./glassbox/<topic>_solver.html'` to the `SHELL`
   list in `sw.js` (only if the file is self-contained), and bump the cache-bust
   versions: `sw.js` `CACHE` const, and the `?v=YYYYMMDD` on `js/glassbox.js` in
   both `index.html` and `sw.js`.
5. **Verify** locally: `python3 -m http.server 8000`, open the app → Glass Box
   tab → the new card appears, opens in a new tab, and Auto Solve fills fields +
   reveals steps.
6. **Commit** only the touched files (the new HTML, `js/glassbox.js`,
   `index.html`, `sw.js`). End the message with the Co-Authored-By trailer.

## Quality bar

Transparent steps over terse answers; preserve units in every step; state
assumptions when a figure/data is incomplete; keep solver logic inside the
question object; keep generic helpers (round, tolerance, parse) reusable. See
REFERENCE.md §§7–13, 21–35 for the full standard.
