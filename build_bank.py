#!/usr/bin/env python3
"""Merge, sanitize, and optionally encrypt the shared question bank."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
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


def merge_and_sanitize(paths: list[Path]) -> tuple[list, int]:
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
            merged.append(sanitize_question(item))

    return merged, duplicates


def build_payload(questions: list) -> dict:
    return {
        "app": "NEET MCQ Practice",
        "version": 1,
        "updatedAt": int(time.time() * 1000),
        "questionCount": len(questions),
        "questions": questions,
    }


def encrypt_payload(payload: dict, passphrase: str) -> dict:
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        from cryptography.hazmat.primitives import hashes
    except ImportError as error:
        raise SystemExit(
            "Encryption requires the cryptography package. Install with: pip install cryptography"
        ) from error

    if len(passphrase) < 8:
        raise SystemExit("Passphrase must be at least 8 characters.")

    plain = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    salt = os.urandom(16)
    iv = os.urandom(12)
    iterations = 100_000

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
    )
    key = kdf.derive(passphrase.encode("utf-8"))
    ciphertext = AESGCM(key).encrypt(iv, plain, None)

    return {
        "v": 1,
        "alg": "AES-GCM",
        "iterations": iterations,
        "salt": base64.b64encode(salt).decode("ascii"),
        "iv": base64.b64encode(iv).decode("ascii"),
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build sanitized shared question bank.")
    parser.add_argument(
        "--encrypt",
        action="store_true",
        help="Write encrypted bank.enc.json for public hosting",
    )
    parser.add_argument(
        "--passphrase-env",
        default="BANK_PASSPHRASE",
        help="Environment variable that holds the encryption passphrase",
    )
    args = parser.parse_args()

    root = Path(__file__).parent
    sources = [
        root / "pearson_biology_vol1.json",
        root / "pearson_biology_vol2.json",
    ]
    plain_output = root / "bank.json"
    encrypted_output = root / "bank.enc.json"

    missing = [p for p in sources if not p.exists()]
    if missing:
        print("Missing source files:", ", ".join(str(p) for p in missing), file=sys.stderr)
        print("Run convert_pearson_md.py for each volume first.", file=sys.stderr)
        return 1

    questions, duplicates = merge_and_sanitize(sources)
    payload = build_payload(questions)

    plain_output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    report = {
        "questions": len(questions),
        "duplicates_removed": duplicates,
        "plain_output": str(plain_output),
    }

    if args.encrypt:
        passphrase = os.environ.get(args.passphrase_env, "").strip()
        if not passphrase:
            print(
                f"Set {args.passphrase_env} before building encrypted bank, e.g.\n"
                f'  {args.passphrase_env}="your-secret" python3 build_bank.py --encrypt',
                file=sys.stderr,
            )
            return 1
        encrypted = encrypt_payload(payload, passphrase)
        encrypted_output.write_text(json.dumps(encrypted), encoding="utf-8")
        report["encrypted_output"] = str(encrypted_output)

    print(f"Built sanitized {report['plain_output']}")
    print(f"Questions: {report['questions']}")
    print(f"Duplicates removed: {report['duplicates_removed']}")
    if "encrypted_output" in report:
        print(f"Encrypted {report['encrypted_output']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
