"""Upload PDFs and ingest them into ChromaDB."""
from __future__ import annotations
import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.services.pdf_parser import ingest_pdf

router = APIRouter()

ALLOWED_TYPES = {"notes", "pyq", "internal"}


@router.post("/notes/upload")
async def upload_notes(
    semester: int = Form(...),
    subject_id: str = Form(...),
    doc_type: str = Form("notes"),
    file: UploadFile = File(...),
):
    if semester < 1 or semester > 8:
        raise HTTPException(400, "Invalid semester")
    if doc_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"doc_type must be one of {ALLOWED_TYPES}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    sem_dir = Path(settings.data_dir) / f"sem{semester}" / subject_id
    sem_dir.mkdir(parents=True, exist_ok=True)
    dest = sem_dir / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    chunks = ingest_pdf(
        dest,
        semester=semester,
        subject_id=subject_id,
        doc_type=doc_type,
    )
    return {"chunks": chunks, "source": file.filename}
