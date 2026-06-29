# Skill: Build a Glass-Box Physics Solver App

## Purpose
This skill file guides an AI model to create a **physics learning and solver app** for **any physics topic**.

The actual topic content, formulas, and question details will be provided separately.
This skill should guide the AI about **everything except the topic itself**.

That means this file focuses on:
- app structure,
- educational UX,
- solver architecture,
- question system,
- answer checking,
- auto-solving,
- step-by-step explanation,
- rendering design,
- implementation style,
- extensibility.

It should work for topics such as:
- vectors,
- kinematics,
- laws of motion,
- work-energy,
- gravitation,
- rotational motion,
- electrostatics,
- current electricity,
- optics,
- modern physics,
- thermodynamics,
- waves,
- or any other physics chapter.

---

## Main Design Principle
The app must behave like a **glass-box educational solver**.

A glass-box solver does not only output answers.
It must also show:
1. what data is given,
2. what physical principle is used,
3. what formula is selected,
4. how values are substituted,
5. how intermediate calculations are done,
6. what the final answer means,
7. what units are used,
8. and any assumptions involved.

The user should be able to learn from the app, not just use it as a calculator.

---

## Scope of This Skill
This skill is **topic-agnostic**.
It does **not** define the actual physics topic.
Instead, it defines the reusable system for building the app.

The topic-specific layer should be inserted separately, including:
- formulas,
- question bank,
- constants,
- chapter-specific logic,
- diagrams if needed,
- and solver computation details.

---

# Functional Requirements

## 1. App Type
The AI should build a **standalone HTML app** or small HTML/CSS/JS app that runs directly in a browser.

Preferred default:
- one `.html` file,
- inline CSS,
- inline JavaScript,
- no external libraries,
- no CDN dependencies,
- no network requirement.

This is important because sandboxed previews may not allow external resources.

---

## 2. Interface Style
The app should be visually clean, modern, and educational.

Preferred UI style:
- glassmorphism,
- gradient background,
- soft glow/highlight accents,
- rounded cards,
- subtle borders,
- readable typography,
- responsive layout,
- strong contrast between text and background.

The app should feel polished but remain lightweight.

---

## 3. Core User Flows
The app should support the following learning flow:

1. user opens the app,
2. user sees a question or selects one,
3. user enters answers,
4. app checks answers,
5. user can request hint,
6. user can request full step-by-step solving,
7. user can auto-solve,
8. app displays final result clearly,
9. user can move to another question.

---

## 4. Required Buttons / Controls
Unless the user specifies otherwise, include controls such as:
- Generate Random Question
- Select Question
- Topic/Category Filter
- Show Hint
- Show Steps
- Show Full Solution
- Auto Solve
- Check My Answer
- Clear Answer

Optional additions:
- Previous Question
- Next Question
- Practice Mode
- Test Mode
- Reset Session

---

## 5. Required Display Sections
The interface should generally include:
- page title / app header,
- chapter or mode summary,
- toolbar,
- status bar,
- active question panel,
- answer input area,
- hint section,
- answer-check result section,
- step-by-step solution section,
- final solution summary section,
- sidebar or panel for question bank.

---

# Educational Solver Behavior

## 6. Question Presentation Rules
Each question should be displayed clearly.

The app should support:
- text questions,
- numerical problems,
- conceptual questions,
- proof-style questions,
- assertion/reason style if needed,
- figure-based questions where possible,
- multi-part questions.

For each question, display:
- title,
- topic tag,
- problem text,
- required answer fields.

---

## 7. Solver Structure
Each question should be represented as an object with a standard structure.

Recommended shape:

```js
{
  id,
  topic,
  title,
  text,
  answerFields,
  solver
}
```

Where:
- `id` = unique identifier,
- `topic` = category label,
- `title` = question title,
- `text` = full problem statement,
- `answerFields` = list of required input fields,
- `solver()` = function that computes and explains the solution.

---

## 8. Required `solver()` Output
Each `solver()` function should return an object like:

```js
{
  answers: {...},
  solution: 'short final answer summary',
  steps: [
    ['Step title', 'Detailed explanation'],
    ['Step title', 'Detailed explanation']
  ]
}
```

### Meaning
- `answers`: exact expected answers for checking/autofill,
- `solution`: short final output,
- `steps`: ordered sequence of reasoning blocks.

---

## 9. Step-by-Step Solving Standard
This is the most important part.

Every solvable physics question should produce detailed steps that include:
1. given data,
2. required quantity,
3. chosen concept or law,
4. formula used,
5. substitution of values,
6. simplification,
7. unit handling,
8. final conclusion.

If needed, include:
- sign convention,
- coordinate system,
- assumptions,
- conversions,
- diagram interpretation,
- reasoning notes.

The explanation should be educational, not cryptic.

---

## 10. Auto Solve Behavior
The Auto Solve button should:
- call the solver,
- fill all answer fields,
- reveal steps,
- reveal final solution,
- run answer check automatically,
- update solver status.

This should work in one click.

---

## 11. Hint Behavior
Hints should be useful but not reveal everything instantly.

Hints should guide the student by indicating:
- which formula family to use,
- what quantity to calculate first,
- what principle applies,
- whether unit conversion is required,
- whether a diagram or component breakdown is needed.

Hints should remain topic-agnostic in structure, while topic-specific hint content can be inserted later.

---

## 12. Answer Checking Rules
The app should support different answer types.

### Numeric answers
- use tolerance,
- allow rounded answers,
- compare with floating-point safety.

### Unit-aware answers
If needed, the app may support:
- number only,
- number + unit,
- checking units separately.

### Vector/component/list answers
- parse comma-separated values,
- trim spaces,
- compare element by element.

### Text/conceptual answers
- normalize case,
- remove excess spaces,
- allow approximate phrase matching.

### Multi-part answers
- grade each field separately,
- show per-field correctness,
- show total score.

---

## 13. Field Feedback
For answer checking, the app should visibly mark fields:
- correct = green,
- incorrect = red,
- optional neutral = default.

Also show:
- total score,
- expected values when appropriate,
- encouragement or correction messaging.

---

# Technical Implementation Guidance

## 14. Browser Compatibility Strategy
Prefer plain HTML/CSS/JS.
Avoid dependencies unless explicitly requested.

The app should work in:
- desktop browser,
- mobile browser,
- sandboxed preview environment.

Avoid relying on:
- server backends,
- external fonts,
- external icons,
- API calls,
- imported frameworks.

---

## 15. CSS Guidance
Use CSS variables for consistency.

Recommended design tokens:
- page background colors,
- glass card background,
- accent colors,
- text colors,
- muted text,
- success/error/warning colors,
- border colors,
- shadow.

Recommended styling patterns:
- `backdrop-filter: blur(...)`,
- `border-radius`,
- transparent panels,
- subtle gradients,
- responsive grids,
- hover feedback,
- clear spacing.

---

## 16. Layout Guidance
Recommended layout:
- main grid with two panels on desktop,
- single-column stack on mobile.

Typical split:
- left = active solving workspace,
- right = question bank / controls / summary.

Use media queries so the app remains usable on smaller screens.

---

## 17. JavaScript Utility Layer
The AI should create reusable helper functions for:
- rounding,
- tolerance comparison,
- parsing comma-separated values,
- normalization of text answers,
- rendering steps,
- question loading,
- random selection,
- answer checking,
- auto solving,
- clearing/resetting.

These helper functions should stay generic so they can work across topics.

---

## 18. Suggested Generic Helpers
Example patterns:

```js
function round(n, d = 3) {
  return Number(n.toFixed(d));
}

function closeEnough(a, b, t = 0.15) {
  return Math.abs(Number(a) - Number(b)) <= t;
}

function normalizeText(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNums(str) {
  return String(str)
    .split(',')
    .map(s => Number(s.trim()))
    .filter(v => !Number.isNaN(v));
}
```

---

## 19. Step Rendering Format
Render steps as separate visual blocks.

Each step block should have:
- step number,
- step title,
- detailed explanation.

Recommended rendering pattern:

```js
function renderSteps(steps) {
  stepsBox.innerHTML = steps.map((s, i) => `
    <div class="step">
      <div class="step-title">Step ${i + 1}: ${s[0]}</div>
      <div>${s[1].replace(/\n/g, '<br>')}</div>
    </div>
  `).join('');
}
```

---

## 20. Status Bar Recommendations
Include a small status bar that may show:
- currently loaded question,
- solver state,
- reviewed question count,
- last score,
- mode if relevant.

This improves usability and gives the app a polished feel.

---

# Content Handling Strategy

## 21. Topic Injection Model
Since topic content is provided separately, the AI should keep the app architecture modular.

The topic-specific data should plug into the generic framework using:
- question bank entries,
- chapter-specific formulas,
- solver logic,
- hints,
- constants.

The framework should not need major rewrites when the topic changes.

---

## 22. Multi-Part Question Support
Physics questions often have parts like:
- (a), (b), (c)
- magnitude and direction
- derivation + numerical answer
- explanation + value

The app should support multiple answer fields naturally.

---

## 23. Unit Handling Strategy
Physics topics often need units.

The solver should:
- preserve units in step explanations,
- use consistent units,
- explicitly convert units when needed,
- mention final unit in the conclusion.

If inputs are numerical only, units should still appear in the step explanation and final solution text.

---

## 24. Conversion Handling
For physics problems, the solver should explicitly show conversions such as:
- cm to m,
- km to m,
- g to kg,
- degree to radian if needed,
- time conversions,
- electrical unit conversions.

Conversions should be shown as separate steps when educationally relevant.

---

## 25. Diagram / Figure Handling
If a problem depends on a figure:
- do not silently guess geometry,
- explicitly state assumptions,
- define a coordinate system if useful,
- convert geometry into solvable quantities,
- note that the interpretation is based on provided text if the figure is unavailable.

Transparency is more important than pretending certainty.

---

## 26. Conceptual / Proof Question Handling
For theory or proof questions:
- still use the same `steps` structure,
- break the proof into logical chunks,
- state the physical principle clearly,
- give a concise final conclusion.

Even when no arithmetic exists, the app should still feel systematic.

---

# UX Quality Standards

## 27. Educational Tone
The app should sound:
- clear,
- calm,
- supportive,
- student-friendly,
- logically structured.

Avoid:
- abrupt unexplained answers,
- overly compressed derivations,
- vague wording,
- hidden assumptions.

---

## 28. Error Prevention
The AI should design the app to reduce confusion by:
- labeling fields clearly,
- grouping related outputs,
- showing topic labels,
- showing what each field means,
- making it obvious when the app is in hint mode vs solution mode.

---

## 29. Reset / Clear Behavior
The Clear button should:
- empty user inputs,
- remove correctness highlighting,
- optionally hide hint/steps/solution,
- reset score display,
- reset solver state text.

---

## 30. Randomization Strategy
If random question generation is requested, support one of two modes:

### Mode A: random pick from existing question bank
Choose one predefined question randomly.

### Mode B: randomize numeric parameters
Generate new values inside a question template.

The topic provider may define which mode is needed.
The framework should be ready for both.

---

# Quality Rules for the AI Model

## 31. Implementation Rules
When using this skill, the AI should:
- keep the code readable,
- keep the structure modular,
- avoid duplication where possible,
- keep solver logic inside question objects,
- use helper functions for generic tasks,
- make UI text understandable,
- ensure the app works offline.

---

## 32. Explanation Rules
Step-by-step explanations should:
- start from known data,
- justify formula choice,
- show substitutions,
- preserve units,
- give final interpretation.

The AI should prefer “show the logic” over “jump to answer”.

---

## 33. Assumption Rules
Whenever information is incomplete, the AI should:
- state the assumption,
- keep it visible in the steps,
- avoid pretending the data was exact.

---

## 34. Extensibility Rules
The app should be easy to extend with:
- more questions,
- more chapters,
- more answer types,
- diagrams,
- animations,
- score history,
- custom input mode,
- teacher mode,
- test mode.

---

## 35. Final Output Standard
A good output app should be:
- standalone,
- polished,
- responsive,
- educational,
- solver-driven,
- transparent,
- easy to modify,
- suitable for reuse across many physics topics.

---

# Recommended Prompt Template for AI Models
Use this when asking an AI model to build the app:

> Create a standalone HTML app with inline CSS and JavaScript using a glassmorphism educational UI. The app should be a reusable physics solver framework for any topic. Topic details, formulas, and question content will be supplied separately. Build the general system: question loading, answer fields, answer checking with tolerance, hints, detailed step-by-step solving, final solution rendering, auto-solve, clear/reset behavior, random question selection, status display, and responsive layout. Store questions in a JavaScript array where each question has `id`, `topic`, `title`, `text`, `answerFields`, and `solver()` returning `{ answers, solution, steps }`. Keep the app dependency-free and suitable for sandboxed preview with no network access.

---

# Optional Enhancements
The AI may optionally add:
- animated step reveal,
- canvas diagrams,
- formula sidebar,
- session score tracking,
- chapter navigation,
- custom user-entered questions,
- print/export support,
- teacher explanation mode,
- learn vs test modes.

---

# Final Rule
This skill is not about a specific chapter.
It is about how to build the **framework and behavior** of a high-quality physics solver app.

Whenever topic content is inserted later, the AI should preserve these principles:
- transparency,
- structure,
- step-by-step teaching,
- correct checking,
- polished UX,
- reusable architecture.

A strong physics solver app should not only answer questions.
It should teach the method.