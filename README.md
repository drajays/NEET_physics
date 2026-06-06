# NEET MCQ Practice

A personal browser app for NEET self-practice. Build your own question bank, organize MCQs by subject, topic, subtopic and tags, then run random practice sessions filtered by what you want to revise.

Questions are cached in your browser (IndexedDB) and can sync from one shared `bank.json` file across 3–4 devices.

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

## Multi-device setup (recommended)

Use **one admin device** (your laptop) to upload questions. Other phones/tablets only practice and sync.

### Architecture

```
Admin laptop  →  import JSON  →  Download bank.json  →  host online (GitHub)
Phone / tablet / other PC  →  open same app URL  →  Sync questions  →  Practice
```

### Step 1 — Configure once

Edit `config.js`:

```javascript
window.APP_CONFIG = {
  remoteBankUrl: 'https://raw.githubusercontent.com/drajays/NEET_pingal/main/bank.json',
  adminPin: 'your-private-pin',
  autoSyncOnLoad: true
};
```

Change `adminPin` to something only you know.

### Step 2 — Host the app and bank

1. Push this project to GitHub (you already have `NEET_pingal`).
2. Enable **GitHub Pages** for the repo (Settings → Pages → deploy from `main`).
3. Open the app on every device at: `https://drajays.github.io/NEET_pingal/`

### Shared bank (encrypted + sanitized)

The hosted file is **`bank.enc.json`** — encrypted, with copyright metadata removed:

- No `Pearson` tags, publisher `source` fields, or OCR image URLs
- Useless to others without your private passphrase

**One-time setup on each device:**

```bash
cp config.private.js.example config.private.js
# Edit config.private.js — set bankPassphrase (same on all 4 devices)
```

**Rebuild and publish (admin laptop only):**

```bash
python3 -m venv .venv && .venv/bin/pip install cryptography
python3 convert_pearson_md.py --volume 1
python3 convert_pearson_md.py --volume 2 --input Objective-Biology-for-NEET2.md --paddle-json Objective-Biology-for-NEET2.json
cp config.private.js.example config.private.js   # set bankPassphrase here
BANK_PASSPHRASE='same-passphrase-as-config.private.js' .venv/bin/python build_bank.py --encrypt
git add bank.enc.json && git commit -m "Update encrypted question bank" && git push
```

Plain `bank.json` stays local only (gitignored).

### Protecting the bank on GitHub

GitHub cannot encrypt or password-lock a single file. Use **both**:

1. **Encrypted `bank.enc.json`** — public blob, unreadable without passphrase  
2. **Private repository** (recommended):

```bash
gh repo edit drajays/NEET_pingal --visibility private
```

Then only you (and invited collaborators) can access the repo and GitHub Pages site.

### Step 4 — Student devices (your other 3 devices)

1. Open the same GitHub Pages URL.
2. Do **not** unlock admin.
3. Tap **Sync questions** (or reload — auto-sync runs when the remote bank is newer).
4. Use **Practice** and **Question Bank** (read-only).

### Roles

| Action | Admin | Student devices |
|--------|-------|-----------------|
| Practice | Yes | Yes |
| Browse bank | Yes | Yes |
| Import / add / edit / delete | Yes | No |
| Publish `bank.json` | Yes | No |
| Sync from server | Yes | Yes |

### Storage tips

- Avoid images on large Pearson imports (text-only banks are ~3–7 MB).
- IndexedDB supports much larger banks than old localStorage.
- Keep a backup: admin **Export JSON** after each import.

## Pearson OCR import (optional, local)

Place the PaddleOCR `.md` and `.json` files in the project folder (not committed to git — they are large), then run the converter:

**Volume I**

```bash
python3 convert_pearson_md.py --volume 1
```

**Volume II**

```bash
python3 convert_pearson_md.py --volume 2 \
  --input Objective-Biology-for-NEET2.md \
  --paddle-json Objective-Biology-for-NEET2.json
```

Outputs `pearson_biology_vol1.json` (~4.3k MCQs) or `pearson_biology_vol2.json` (~3k MCQs) for import via **Import / Export**.

## Tips

- Leave filter groups empty during practice to include all values in that group
- Use tags like `PYQ`, `NCERT`, `Weak area` for flexible revision sets
- Export JSON regularly as a backup before clearing browser data
