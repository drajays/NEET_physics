#!/usr/bin/env python3
"""Merge Pearson Vol I + Vol II import JSON into one shared bank.json for the app."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def load_questions(path: Path) -> list:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return data.get("questions", [])


def merge_banks(paths: list[Path], output: Path) -> dict:
    merged: list = []
    seen: set[str] = set()
    duplicates = 0

    for path in paths:
        for item in load_questions(path):
            key = (item.get("question") or "").strip().lower()
            if not key or key in seen:
                duplicates += 1
                continue
            seen.add(key)
            merged.append(item)

    import time

    payload = {
        "app": "NEET MCQ Practice",
        "version": 1,
        "source": "Pearson Objective Biology Vol I + Vol II 2019",
        "updatedAt": int(time.time() * 1000),
        "questionCount": len(merged),
        "questions": merged,
    }
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "output": str(output),
        "questions": len(merged),
        "duplicates_removed": duplicates,
        "sources": [str(p) for p in paths],
    }


def main() -> int:
    root = Path(__file__).parent
    sources = [
        root / "pearson_biology_vol1.json",
        root / "pearson_biology_vol2.json",
    ]
    output = root / "bank.json"

    missing = [p for p in sources if not p.exists()]
    if missing:
        print("Missing source files:", ", ".join(str(p) for p in missing), file=sys.stderr)
        print("Run convert_pearson_md.py for each volume first.", file=sys.stderr)
        return 1

    report = merge_banks(sources, output)
    print(f"Built {report['output']}")
    print(f"Questions: {report['questions']}")
    print(f"Duplicates removed: {report['duplicates_removed']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
