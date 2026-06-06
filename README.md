# NEET MCQ Practice

A personal browser app for NEET self-practice. Build your own question bank, organize MCQs by subject, topic, subtopic and tags, then run random practice sessions filtered by what you want to revise.

All data is stored locally in your browser (localStorage).

## Open the app

Open `index.html` in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Features

- **Add MCQs** — Enter question, four options, correct answer, explanation, why wrong options are incorrect, subject, topic, subtopic and tags
- **Question bank** — Browse, search, edit and delete saved questions
- **Practice** — Filter by subject / topic / subtopic / tags, pick how many questions, get a random set
- **Import / Export** — Bulk import from CSV, JSON or Excel; export backups as JSON or CSV

## MCQ fields

| Field | Required | Example |
|-------|----------|---------|
| question | Yes | Which enzyme digests proteins in the duodenum? |
| option_a–d | Yes | Pepsin, Trypsin, Lipase, Amylase |
| answer | Yes | B (or full option text) |
| explanation | No | Why the correct answer is right |
| why_wrong_a–d | No | Why each wrong option is incorrect |
| question_image / explanation_image | No | Image data included in JSON export |
| subject | Yes | Biology |
| topic | Yes | Human Physiology |
| subtopic | No | Digestion |
| tags | No | NCERT, PYQ, Important |

## Import file columns

```text
id, question, option_a, option_b, option_c, option_d, answer, explanation, why_wrong_a, why_wrong_b, why_wrong_c, why_wrong_d, subject, topic, subtopic, tags, created_at, updated_at
```

`id`, timestamps and why-wrong columns are optional on import. Re-importing the same question text or id updates existing rows instead of skipping them.

## Export

- **JSON** exports the full bank envelope with every field, including ids, tags, explanations, why-wrong notes, **images**, and timestamps.
- **CSV** exports text fields only (images are not included because of size — use JSON for full backup with pictures).
- Exports always read the latest data saved in your browser, including front-end edits and uploads.
- Export is available from **Question Bank** and **Import / Export**.

## Pearson OCR import (optional, local)

To build a bulk import file from Pearson Vol I OCR exports, place these files in the project folder (not committed to git — they are large):

- `Objective-Biology-for-NEET-Vol-I-Pearson-Education-2019.pdf_by_PaddleOCR-VL-1.6.md`
- `Objective-Biology-for-NEET-Vol-I-Pearson-Education-2019.pdf_by_PaddleOCR-VL-1.6.json`

Then run:

```bash
python3 convert_pearson_md.py
```

This generates `pearson_biology_vol1.json` (~4k MCQs) for import via **Import / Export**.

## Tips

- Leave filter groups empty during practice to include all values in that group
- Use tags like `PYQ`, `NCERT`, `Weak area` for flexible revision sets
- Export JSON regularly as a backup before clearing browser data
