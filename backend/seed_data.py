"""Seed script: ingests a small set of demo notes / PYQs into ChromaDB
so the RAG pipeline has something to retrieve on first run.

Run with:
    python -m seed_data
"""
from __future__ import annotations
import os
from pathlib import Path

from app.services.pdf_parser import ingest_pdf
from app.core.config import settings


DEMO_FILES = [
    ("data/pdfs/demo/BCS401_OS_Notes.pdf",  4, "BCS401", "notes"),
    ("data/pdfs/demo/BCS401_PYQ_2022.pdf",  4, "BCS401", "pyq"),
    ("data/pdfs/demo/BCS401_Internal1.pdf", 4, "BCS401", "internal"),
]


def main():
    Path(settings.data_dir).mkdir(parents=True, exist_ok=True)
    for rel, sem, subj, t in DEMO_FILES:
        p = Path(rel)
        if not p.exists():
            print(f"⚠️  Skipping (not found): {p}")
            continue
        n = ingest_pdf(p, semester=sem, subject_id=subj, doc_type=t)
        print(f"✓ {p.name}  →  {n} chunks indexed under sem{sem}/{subj} [{t}]")


if __name__ == "__main__":
    main()
