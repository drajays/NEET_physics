#!/usr/bin/env python3
"""Merge Vol I + Vol II JSON into one sanitized bank.json for the app."""

from __future__ import annotations

import csv
import json
import sys
import time
import uuid
from pathlib import Path

COPYRIGHT_TAG_MARKERS = ("pearson",)
COPYRIGHT_FIELDS = (
    "source",
    "source_question_number",
    "source_section",
    "question_image_url",
    "explanation_image_url",
)


def load_questions(path: Path) -> list:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return data.get("questions", [])


def load_csv_questions(path: Path) -> list:
    questions: list = []
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            question = (row.get("question") or "").strip()
            if not question:
                continue
            tags = row.get("tags") or ""
            if isinstance(tags, str):
                tags = [part.strip() for part in tags.split(";") if part.strip()]
            questions.append(
                {
                    "id": row.get("id") or f"csv_{uuid.uuid4().hex[:10]}",
                    "question": question,
                    "option_a": (row.get("option_a") or "").strip(),
                    "option_b": (row.get("option_b") or "").strip(),
                    "option_c": (row.get("option_c") or "").strip(),
                    "option_d": (row.get("option_d") or "").strip(),
                    "answer": (row.get("answer") or "").strip().upper(),
                    "explanation": (row.get("explanation") or "").strip(),
                    "why_wrong_a": (row.get("why_wrong_a") or "").strip(),
                    "why_wrong_b": (row.get("why_wrong_b") or "").strip(),
                    "why_wrong_c": (row.get("why_wrong_c") or "").strip(),
                    "why_wrong_d": (row.get("why_wrong_d") or "").strip(),
                    "subject": (row.get("subject") or "Biology").strip(),
                    "topic": (row.get("topic") or "").strip(),
                    "subtopic": (row.get("subtopic") or "").strip(),
                    "tags": tags,
                }
            )
    return questions


def sanitize_question(item: dict) -> dict:
    cleaned = dict(item)
    for field in COPYRIGHT_FIELDS:
        cleaned.pop(field, None)

    tags = cleaned.get("tags") or []
    if isinstance(tags, str):
        tags = [part.strip() for part in tags.split(";") if part.strip()]
    cleaned["tags"] = [
        tag
        for tag in tags
        if tag and not any(marker in tag.lower() for marker in COPYRIGHT_TAG_MARKERS)
    ]
    return cleaned


def main() -> int:
    root = Path(__file__).parent
    sources = [
        root / "pearson_biology_vol1.json",
        root / "pearson_biology_vol2.json",
    ]
    extra_csv = root / "biology_the_living_world.csv"
    output = root / "bank.json"

    missing = [p for p in sources if not p.exists()]
    if missing:
        print("Missing source files:", ", ".join(str(p) for p in missing), file=sys.stderr)
        print("Run convert_pearson_md.py for each volume first.", file=sys.stderr)
        return 1

    merged: list = []
    seen: set[str] = set()
    duplicates = 0

    for path in sources:
        for item in load_questions(path):
            key = (item.get("question") or "").strip().lower()
            if not key or key in seen:
                duplicates += 1
                continue
            seen.add(key)
            merged.append(sanitize_question(item))

    if extra_csv.exists():
        csv_added = 0
        for item in load_csv_questions(extra_csv):
            key = (item.get("question") or "").strip().lower()
            if not key or key in seen:
                duplicates += 1
                continue
            seen.add(key)
            merged.append(sanitize_question(item))
            csv_added += 1
        if csv_added:
            print(f"Added {csv_added} unique questions from {extra_csv.name}")

    payload = {
        "app": "NEET MCQ Practice",
        "version": 1,
        "updatedAt": int(time.time() * 1000),
        "questionCount": len(merged),
        "questions": merged,
    }
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Built {output}")
    print(f"Questions: {len(merged)}")
    print(f"Duplicates skipped: {duplicates}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
