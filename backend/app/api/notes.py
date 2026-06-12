"""Upload PDFs and ingest them into ChromaDB."""
from __future__ import annotations
import shutil
from pathlib import Path
from urllib.parse import urlencode

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.pdf_parser import ingest_pdf

router = APIRouter()

ALLOWED_TYPES = {"notes", "pyq", "internal"}


def _subject_dir(semester: int, subject_id: str) -> Path:
    if semester < 1 or semester > 8:
        raise HTTPException(400, "Invalid semester")
    if not subject_id.strip() or "/" in subject_id or "\\" in subject_id or ".." in subject_id:
        raise HTTPException(400, "Invalid subject")
    return Path(settings.data_dir) / f"sem{semester}" / subject_id


@router.get("/notes")
def list_notes(
    semester: int = Query(...),
    subject_id: str = Query(...),
):
    sem_dir = _subject_dir(semester, subject_id)
    if not sem_dir.exists():
        return {"files": []}

    files = []
    for path in sorted(sem_dir.glob("*.pdf")):
        query = urlencode(
            {
                "semester": semester,
                "subject_id": subject_id,
                "filename": path.name,
            }
        )
        files.append(
            {
                "name": path.name,
                "size_bytes": path.stat().st_size,
                "download_url": f"/api/notes/download?{query}",
            }
        )
    return {"files": files}


@router.get("/notes/download")
def download_note(
    semester: int = Query(...),
    subject_id: str = Query(...),
    filename: str = Query(...),
):
    sem_dir = _subject_dir(semester, subject_id).resolve()
    path = (sem_dir / filename).resolve()

    if sem_dir not in path.parents or path.suffix.lower() != ".pdf" or not path.exists():
        raise HTTPException(404, "Note not found")

    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=path.name,
    )


@router.post("/notes/upload")
async def upload_notes(
    semester: int = Form(...),
    subject_id: str = Form(...),
    doc_type: str = Form("notes"),
    file: UploadFile = File(...),
):
    if doc_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"doc_type must be one of {ALLOWED_TYPES}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    sem_dir = _subject_dir(semester, subject_id)
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
