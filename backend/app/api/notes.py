"""Upload PDFs and ingest them into ChromaDB."""
from __future__ import annotations
import shutil
from pathlib import Path
from urllib.parse import urlencode

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, Response
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.pdf_parser import ingest_pdf
from app.api.community import get_supabase, _safe_subject

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
    files = []
    subject_slug = _safe_subject(subject_id)

    # 1. Direct local subject directory
    sem_dir = _subject_dir(semester, subject_id)
    if sem_dir.exists():
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

    # 2. Local community directory
    comm_dir = Path(settings.data_dir) / "community" / f"sem{semester}" / subject_slug
    if comm_dir.exists():
        for path in sorted(comm_dir.rglob("*.pdf")):
            if any(f["name"] == path.name for f in files):
                continue
            query = urlencode(
                {
                    "semester": semester,
                    "subject_id": subject_id,
                    "filename": path.name,
                    "is_community": "true",
                    "doc_type": path.parent.name,
                }
            )
            files.append(
                {
                    "name": path.name,
                    "size_bytes": path.stat().st_size,
                    "download_url": f"/api/notes/download?{query}",
                }
            )

    # 3. Supabase community_uploads table
    supabase = get_supabase()
    if supabase is not None:
        try:
            res = (
                supabase.table("community_uploads")
                .select("*")
                .eq("semester", semester)
                .eq("subject_id", subject_slug)
                .execute()
            )
            for row in res.data:
                if any(f["name"] == row["file_name"] for f in files):
                    continue
                query = urlencode(
                    {
                        "storage_path": row["storage_path"],
                        "filename": row["file_name"],
                    }
                )
                files.append(
                    {
                        "name": row["file_name"],
                        "size_bytes": row.get("file_size", 0),
                        "download_url": f"/api/notes/download/supabase?{query}",
                    }
                )
        except Exception as e:
            print(f"Error querying Supabase community uploads: {e}")

    return {"files": files}


@router.get("/notes/download")
def download_note(
    semester: int = Query(...),
    subject_id: str = Query(...),
    filename: str = Query(...),
    is_community: bool = Query(False),
    doc_type: str = Query("notes"),
):
    subject_slug = _safe_subject(subject_id)
    if is_community:
        comm_dir = (Path(settings.data_dir) / "community" / f"sem{semester}" / subject_slug / doc_type).resolve()
        path = (comm_dir / filename).resolve()
        if comm_dir not in path.parents or path.suffix.lower() != ".pdf" or not path.exists():
            raise HTTPException(404, "Note not found in community folder")
    else:
        sem_dir = _subject_dir(semester, subject_id).resolve()
        path = (sem_dir / filename).resolve()
        if sem_dir not in path.parents or path.suffix.lower() != ".pdf" or not path.exists():
            comm_dir = (Path(settings.data_dir) / "community" / f"sem{semester}" / subject_slug).resolve()
            found_paths = list(comm_dir.rglob(filename))
            if found_paths and comm_dir in found_paths[0].parents and found_paths[0].suffix.lower() == ".pdf":
                path = found_paths[0]
            else:
                raise HTTPException(404, "Note not found")

    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=path.name,
    )


@router.get("/notes/download/supabase")
def download_note_supabase(
    storage_path: str = Query(...),
    filename: str = Query(...),
):
    supabase = get_supabase()
    if supabase is None:
        raise HTTPException(500, "Supabase client not configured")
    try:
        res = supabase.storage.from_("community-uploads").download(storage_path)
        return Response(
            content=res,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to download from Supabase storage: {e}")


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
