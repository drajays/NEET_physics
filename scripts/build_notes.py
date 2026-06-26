#!/usr/bin/env python3
"""
build_notes.py — seed/build the NEET Physics Notes layer.

Reads bank.json, groups questions by (chapter, subtopic) along the NCERT XI/XII
syllabus tree (mirrors js/curriculum.js), and emits ONE seed note per group with:
  - a distilled summary + de-duplicated explanation body
  - extracted formulas (display math, or inline math containing '=')
  - the linked questionIds (the note <-> question contract)

Outputs:
  data/notes/<chapter-slug>.json   one file per chapter (array of notes)
  notes-bundle.js                  window.NEET_NOTES = [...all notes...]

Re-runnable and SAFE: notes with "source":"authored" in an existing chapter file
are preserved verbatim; only "source":"seed" notes are regenerated. So hand
authored expert notes are never clobbered.

Usage:
  python3 scripts/build_notes.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, "bank.json")
NOTES_DIR = os.path.join(ROOT, "data", "notes")
BUNDLE = os.path.join(ROOT, "notes-bundle.js")

# --- Curriculum map (mirror of js/curriculum.js) ----------------------------
CHAPTER_ALIASES = {
    "waves": "Waves",
    "Semiconductor Electronics Materials, Devices and Simple Circuits": "Semiconductor Electronics",
    "Systems of Particles and Rotational Motion": "System of Particles and Rotational Motion",
    # HC Verma (Concepts of Physics) chapter names -> NCERT NEET chapters
    "Chapter 1: Introduction to Physics": "Units and Measurement",
    "Chapter 2: Physics and Mathematics": "Units and Measurement",
    "Chapter 3: Rest and Motion: Kinematics": "Motion in a Straight Line",
    "Chapter 4: The Forces": "Laws of Motion",
    "Chapter 5: Newton's Laws of Motion": "Laws of Motion",
    "Chapter 6: Friction": "Laws of Motion",
    "Chapter 7: Circular Motion": "Motion in a Plane",
    "Chapter 8: Work and Energy": "Work, Energy and Power",
    "Chapter 9: Centre of Mass, Linear Momentum, Collision": "System of Particles and Rotational Motion",
    "Chapter 10: Rotational Mechanics": "System of Particles and Rotational Motion",
    "Chapter 11: Gravitation": "Gravitation",
    "Chapter 12: Simple Harmonic Motion": "Oscillations",
    "Chapter 13: Fluid Mechanics": "Mechanical Properties of Fluids",
    "Chapter 14: Some Mechanical Properties of Matter": "Mechanical Properties of Solids",
    "Chapter 15: Wave Motion and Waves on a String": "Waves",
    "Chapter 16: Sound Waves": "Waves",
    "Chapter 17: Light Waves": "Wave Optics",
    "Chapter 18: Geometrical Optics": "Ray Optics and Optical Instruments",
    "Chapter 19: Optical Instruments": "Ray Optics and Optical Instruments",
    "Chapter 20: Dispersion and Spectra": "Ray Optics and Optical Instruments",
    "Chapter 21: Speed of Light": "Electromagnetic Waves",
    "Chapter 22: Photometry": "Ray Optics and Optical Instruments",
    "Chapter 23: Heat and Temperature": "Thermal Properties of Matter",
    "Chapter 24: Kinetic Theory of Gases": "Kinetic Theory",
    "Chapter 25: Calorimetry": "Thermal Properties of Matter",
    "Chapter 26: Laws of Thermodynamics": "Thermodynamics",
    "Chapter 27: Specific Heat Capacities of Gases": "Kinetic Theory",
    "Chapter 28: Heat Transfer": "Thermal Properties of Matter",
    "Chapter 29: Electric Field and Potential": "Electric Charges and Fields",
    "Chapter 30: Gauss's Law": "Electric Charges and Fields",
    "Chapter 31: Capacitors": "Electrostatic Potential and Capacitance",
    "Chapter 32: Electric Current in Conductors": "Current Electricity",
    "Chapter 33: Thermal and Chemical Effects of Electric Current": "Current Electricity",
    "Chapter 34: Magnetic Field": "Moving Charges and Magnetism",
    "Chapter 35: Magnetic Field due to a Current": "Moving Charges and Magnetism",
    "Chapter 36: Permanent Magnets": "Magnetism and Matter",
    "Chapter 37: Magnetic Properties of Matter": "Magnetism and Matter",
    "Chapter 38: Electromagnetic Induction": "Electromagnetic Induction",
    "Chapter 39: Alternating Current": "Alternating Current",
    "Chapter 40: Electromagnetic Waves": "Electromagnetic Waves",
    "Chapter 41: Electric Current through Gases": "Current Electricity",
    "Chapter 42: Photoelectric Effect and Wave-Particle Duality": "Dual Nature of Radiation and Matter",
    "Chapter 43: Bohr's Model and Physics of the Atom": "Atoms",
    "Chapter 44: X-rays": "Atoms",
    "Chapter 45: Semiconductors and Semiconductor Devices": "Semiconductor Electronics",
    "Chapter 46: The Nucleus": "Nuclei",
}

CURRICULUM = [
    ("XI", "Class XI", [
        ("xi-units", "Unit I — Physical World & Measurement", ["Units and Measurement"]),
        ("xi-kinematics", "Unit II — Kinematics", ["Motion in a Straight Line", "Motion in a Plane"]),
        ("xi-laws", "Unit III — Laws of Motion", ["Laws of Motion"]),
        ("xi-work", "Unit IV — Work, Energy & Power", ["Work, Energy and Power"]),
        ("xi-rotation", "Unit V — Systems & Rigid Bodies",
         ["System of Particles and Rotational Motion", "Gravitation"]),
        ("xi-properties", "Units VI & VII — Properties of Bulk Matter",
         ["Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter"]),
        ("xi-thermo", "Unit VIII — Thermodynamics", ["Thermodynamics"]),
        ("xi-kinetic", "Unit IX — Behaviour of Perfect Gas", ["Kinetic Theory"]),
        ("xi-waves", "Unit X — Oscillations & Waves", ["Oscillations", "Waves"]),
    ]),
    ("XII", "Class XII", [
        ("xii-electrostatics", "Unit I — Electrostatics",
         ["Electric Charges and Fields", "Electrostatic Potential and Capacitance"]),
        ("xii-current", "Unit II — Current Electricity", ["Current Electricity"]),
        ("xii-magnetism", "Units III & IV — Magnetic Effects & Magnetism",
         ["Moving Charges and Magnetism", "Magnetism and Matter"]),
        ("xii-emi", "Unit V — Electromagnetic Induction & AC",
         ["Electromagnetic Induction", "Alternating Current"]),
        ("xii-em-waves", "Unit VI — Electromagnetic Waves", ["Electromagnetic Waves"]),
        ("xii-optics", "Unit VII — Optics", ["Ray Optics and Optical Instruments", "Wave Optics"]),
        ("xii-dual", "Unit VIII — Dual Nature of Radiation", ["Dual Nature of Radiation and Matter"]),
        ("xii-atoms", "Unit IX — Atoms & Nuclei", ["Atoms", "Nuclei"]),
        ("xii-semi", "Unit X — Semiconductor Electronics", ["Semiconductor Electronics"]),
        ("xii-exp", "Unit XI — Experimental Skills", ["Experimental Skills"]),
    ]),
]

# chapter name -> {class, unitId, unitLabel, order}
CHAPTER_INFO = {}
_order = 0
for cls, _cls_label, units in CURRICULUM:
    for unit_id, unit_label, chapters in units:
        for ch in chapters:
            CHAPTER_INFO[ch] = {"class": cls, "unitId": unit_id, "unitLabel": unit_label, "order": _order}
            _order += 1


def normalize_chapter(topic):
    value = (topic or "").strip()
    return CHAPTER_ALIASES.get(value, value)


def slug(text):
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s or "general"


# --- Formula extraction -----------------------------------------------------
DISPLAY_RE = re.compile(r"\$\$([\s\S]+?)\$\$")
INLINE_RE = re.compile(r"\$([^$\n]+?)\$")


def extract_formulas(text):
    """Return list of LaTeX strings: all display math, plus inline math with '='."""
    out = []
    for m in DISPLAY_RE.finditer(text or ""):
        out.append(m.group(1).strip())
    stripped = DISPLAY_RE.sub(" ", text or "")
    for m in INLINE_RE.finditer(stripped):
        frag = m.group(1).strip()
        if "=" in frag and len(frag) >= 5:
            out.append(frag)
    return out


def first_sentence(text, limit=220):
    t = re.sub(r"\s+", " ", text or "").strip()
    if not t:
        return ""
    # cut at first sentence boundary that isn't a decimal / abbreviation
    m = re.search(r"(.+?[.!?])(\s|$)", t)
    cand = m.group(1) if m else t
    if len(cand) > limit:
        cand = cand[:limit].rsplit(" ", 1)[0] + "…"
    return cand.strip()


def dedupe(seq):
    seen, out = set(), []
    for x in seq:
        key = re.sub(r"\s+", " ", x).strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(x.strip())
    return out


def build():
    if not os.path.exists(BANK):
        sys.exit(f"bank.json not found at {BANK}")
    bank = json.load(open(BANK, encoding="utf-8"))
    questions = bank.get("questions", [])

    # group questions by (chapter, subtopic)
    groups = {}  # (chapter, subtopic) -> list[q]
    for q in questions:
        if (q.get("subject") or "Physics") != "Physics":
            continue
        chapter = normalize_chapter(q.get("topic"))
        if not chapter:
            continue
        subtopic = (q.get("subtopic") or "").strip() or "Overview"
        groups.setdefault((chapter, subtopic), []).append(q)

    # bucket seed notes by chapter
    by_chapter = {}  # chapter -> list[note]
    for (chapter, subtopic), qs in groups.items():
        info = CHAPTER_INFO.get(chapter, {"class": "—", "unitId": "", "unitLabel": "", "order": 999})
        explanations = [clean for clean in (q.get("explanation") or "" for q in qs)]
        explanations = [e for e in explanations if e.strip()]
        # summary = first sentence of the longest explanation
        longest = max(explanations, key=len) if explanations else ""
        summary = first_sentence(longest) or f"{len(qs)} NEET questions on “{subtopic}”."

        # body = de-duplicated explanation bullets
        bullets = dedupe([re.sub(r"\s+", " ", e).strip() for e in explanations])
        body_parts = []
        if bullets:
            body_parts.append("**Key points from solved questions**\n" +
                              "\n".join(f"- {b}" for b in bullets[:14]))
        body = "\n\n".join(body_parts)

        # formulas across all explanations
        formulas = dedupe([f for e in explanations for f in extract_formulas(e)])
        formula_objs = [{"latex": f, "meaning": ""} for f in formulas[:24]]

        tags = dedupe([t for q in qs for t in (q.get("tags") or [])])

        note = {
            "id": f"note-{slug(chapter)}-{slug(subtopic)}",
            "chapter": chapter,
            "subtopic": subtopic,
            "class": info["class"],
            "unitId": info["unitId"],
            "unitLabel": info["unitLabel"],
            "order": info["order"],
            "title": subtopic,
            "summary": summary,
            "body": body,
            "formulas": formula_objs,
            "questionIds": [q["id"] for q in qs if q.get("id")],
            "tags": tags,
            "source": "seed",
        }
        by_chapter.setdefault(chapter, []).append(note)

    os.makedirs(NOTES_DIR, exist_ok=True)

    all_notes = []
    seed_count = 0
    preserved = 0
    for chapter, notes in by_chapter.items():
        path = os.path.join(NOTES_DIR, f"{slug(chapter)}.json")
        # preserve authored notes from any existing file
        authored = []
        if os.path.exists(path):
            try:
                existing = json.load(open(path, encoding="utf-8"))
                authored = [n for n in existing if n.get("source") == "authored"]
            except Exception:
                authored = []
        authored_ids = {n["id"] for n in authored}
        seeds = [n for n in notes if n["id"] not in authored_ids]
        merged = authored + seeds
        merged.sort(key=lambda n: (n.get("subtopic") or ""))
        json.dump(merged, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        all_notes.extend(merged)
        seed_count += len(seeds)
        preserved += len(authored)

    all_notes.sort(key=lambda n: (n.get("order", 999), n.get("subtopic") or ""))

    header = (
        "// notes-bundle.js — GENERATED by scripts/build_notes.py. Do not edit by hand.\n"
        f"// {len(all_notes)} notes ({seed_count} seed, {preserved} authored) "
        f"across {len(by_chapter)} chapters.\n"
        "// Edit data/notes/<chapter>.json (authored notes) then rebuild.\n"
    )
    with open(BUNDLE, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("window.NEET_NOTES = ")
        json.dump(all_notes, f, ensure_ascii=False, indent=0)
        f.write(";\n")

    n_formulas = sum(len(n["formulas"]) for n in all_notes)
    print(f"✓ {len(all_notes)} notes ({seed_count} seed + {preserved} authored), "
          f"{n_formulas} formulas, {len(by_chapter)} chapters")
    print(f"  → {BUNDLE}")
    print(f"  → {NOTES_DIR}/*.json")


if __name__ == "__main__":
    build()
