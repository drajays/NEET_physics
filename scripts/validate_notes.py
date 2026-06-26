#!/usr/bin/env python3
"""
validate_notes.py — sanity-check the generated notes layer against bank.json.

Checks: valid JSON, unique note ids, every questionId resolves to a real
question, every note has >=1 linked question, the bundle parses, and reports
formula coverage. Exit code 1 on any hard failure.

Usage:  python3 scripts/validate_notes.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, "bank.json")
NOTES_DIR = os.path.join(ROOT, "data", "notes")
BUNDLE = os.path.join(ROOT, "notes-bundle.js")


def main():
    errors, warnings = [], []
    bank = json.load(open(BANK, encoding="utf-8"))
    q_ids = {q["id"] for q in bank.get("questions", []) if q.get("id")}

    seen_ids = set()
    notes = []
    for path in sorted(glob.glob(os.path.join(NOTES_DIR, "*.json"))):
        try:
            data = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            errors.append(f"{os.path.basename(path)}: invalid JSON — {e}")
            continue
        for n in data:
            notes.append(n)
            nid = n.get("id")
            if not nid:
                errors.append(f"{path}: note missing id")
                continue
            if nid in seen_ids:
                errors.append(f"duplicate note id: {nid}")
            seen_ids.add(nid)
            qids = n.get("questionIds") or []
            missing = [qid for qid in qids if qid not in q_ids]
            if missing:
                errors.append(f"{nid}: {len(missing)} questionIds not in bank (e.g. {missing[0]})")
            if not qids:
                warnings.append(f"{nid}: no linked questions")
            for key in ("chapter", "subtopic", "summary"):
                if not (n.get(key) or "").strip():
                    warnings.append(f"{nid}: empty {key}")

    # bundle parses and matches note count
    if not os.path.exists(BUNDLE):
        errors.append("notes-bundle.js missing — run build_notes.py")
    else:
        raw = open(BUNDLE, encoding="utf-8").read()
        m = re.search(r"window\.NEET_NOTES\s*=\s*(\[[\s\S]*\]);", raw)
        if not m:
            errors.append("notes-bundle.js: could not find window.NEET_NOTES array")
        else:
            try:
                bundle_notes = json.loads(m.group(1))
                if len(bundle_notes) != len(notes):
                    warnings.append(f"bundle has {len(bundle_notes)} notes, data/ has {len(notes)}")
            except Exception as e:
                errors.append(f"notes-bundle.js: NEET_NOTES not valid JSON — {e}")

    with_formula = sum(1 for n in notes if n.get("formulas"))
    linked_q = len({qid for n in notes for qid in (n.get("questionIds") or [])})

    print(f"notes: {len(notes)} | unique ids: {len(seen_ids)} | "
          f"with formulas: {with_formula} | questions linked: {linked_q}/{len(q_ids)}")
    for w in warnings[:20]:
        print(f"  ⚠ {w}")
    if len(warnings) > 20:
        print(f"  … +{len(warnings) - 20} more warnings")
    if errors:
        print(f"\n✗ {len(errors)} error(s):")
        for e in errors[:30]:
            print(f"  ✗ {e}")
        sys.exit(1)
    print("✓ validation passed")


if __name__ == "__main__":
    main()
