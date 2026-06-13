"""Community upload endpoint — receives a PDF, stores it in Supabase
Storage (or local disk fallback), records metadata in Postgres, and
indexes it into ChromaDB.

POST /api/community/upload  (multipart form)
  - file            : PDF
  - semester        : 1..8
  - subject_id      : free-form text (since UVCE is autonomous)
  - doc_type        : notes | pyq | internal
  - uploader_name   : optional
  - uploader_email  : optional
"""
from __future__ import annotations
import logging
import re
import traceback
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from supabase import create_client, Client

from app.core.config import settings
from app.services.pdf_parser import ingest_pdf

log = logging.getLogger("uvce.community")

router = APIRouter()

BUCKET = "community-uploads"
ALLOWED_TYPES = {"notes", "pyq", "internal"}
_subslug = re.compile(r"[^a-zA-Z0-9_-]+")


def _safe_subject(s: str) -> str:
    """Normalize subject name to a path-safe slug."""
    s = (s or "").strip()
    if not s:
        return "general"
    return _subslug.sub("_", s)[:64] or "general"


_supabase: Client | None = None


def get_supabase() -> Client | None:
    """Return a Supabase client if credentials are configured, else None."""
    global _supabase
    if _supabase is not None:
        return _supabase
    url = settings.supabase_url
    key = settings.supabase_service_key
    if not url or not key or key.startswith("#") or "secret" in key.lower() or "your_" in key.lower() or "anon_key" in key.lower():
        return None
    try:
        _supabase = create_client(url, key)
        return _supabase
    except Exception as e:
        log.error("supabase client init failed: %s", e)
        return None



@router.post("/community/upload")
async def community_upload(
    file: UploadFile = File(...),
    semester: int = Form(...),
    subject_id: str = Form(...),
    doc_type: str = Form(...),
    uploader_name: str = Form("Anonymous"),
    uploader_email: str = Form(""),
):
    log.info(
        "[upload] semester=%s subject=%s doc_type=%s file=%s",
        semester, subject_id, doc_type, file.filename,
    )

    # ---- validate ----
    if semester < 1 or semester > 8:
        raise HTTPException(400, "Semester must be 1-8")
    if doc_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"doc_type must be one of {sorted(ALLOWED_TYPES)}")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    subject_slug = _safe_subject(subject_id)

    supabase = get_supabase()
    use_supabase = supabase is not None
    log.info("[upload] storage mode: %s", "supabase" if use_supabase else "local")

    safe_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    storage_path = f"sem{semester}/{subject_slug}/{doc_type}/{safe_name}"

    file_bytes = await file.read()
    size_bytes = len(file_bytes)
    log.info("[upload] file size: %d bytes", size_bytes)

    if use_supabase:
        # ---- upload to Supabase Storage ----
        try:
            supabase.storage.from_(BUCKET).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": "application/pdf"},
            )
            log.info("[upload] ✓ supabase storage upload ok")
        except Exception as e:
            log.error("supabase storage upload failed: %s\n%s", e, traceback.format_exc())
            raise HTTPException(500, f"Storage upload failed: {e}")

        # ---- record metadata in Postgres ----
        try:
            supabase.table("community_uploads").insert({
                "uploader_name": uploader_name or "Anonymous",
                "uploader_email": uploader_email or "",
                "semester": semester,
                "subject_id": subject_slug,
                "doc_type": doc_type,
                "file_name": file.filename,
                "storage_path": storage_path,
                "file_size": size_bytes,
            }).execute()
            log.info("[upload] ✓ supabase metadata insert ok")
        except Exception as e:
            # non-fatal — log and continue
            log.warning("[upload] metadata insert failed: %s", e)
    else:
        log.info("[upload] using local-disk fallback (no Supabase creds)")

    # ---- always index into ChromaDB (use local copy) ----
    index_dir = Path(settings.data_dir) / "community" / f"sem{semester}" / subject_slug / doc_type
    index_dir.mkdir(parents=True, exist_ok=True)
    index_path = index_dir / safe_name
    if not index_path.exists():
        index_path.write_bytes(file_bytes)

    try:
        chunks = ingest_pdf(
            index_path,
            semester=semester,
            subject_id=subject_slug,
            doc_type=doc_type,
        )
        log.info("[upload] ✓ indexed %d chunks", chunks)
    except Exception as e:
        log.error("ingest_pdf failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(500, f"Indexing failed: {e}")

    return {
        "ok": True,
        "file_name": file.filename,
        "subject_slug": subject_slug,
        "storage_path": storage_path,
        "chunks_indexed": chunks,
        "size_bytes": size_bytes,
        "mode": "supabase" if use_supabase else "local",
    }


@router.get("/community/uploads")
def list_uploads(
    semester: int | None = None,
    subject_id: str | None = None,
    limit: int = 50,
):
    """List recent community uploads. Optional filters."""
    supabase = get_supabase()
    if supabase is None:
        root = Path(settings.data_dir) / "community"
        if not root.exists():
            return []
        out = []
        for path in sorted(root.rglob("*.pdf"), reverse=True)[:limit]:
            rel = path.relative_to(root)
            parts = rel.parts
            try:
                sem = int(parts[0].replace("sem", "")) if parts[0].startswith("sem") else None
                subj = parts[1] if len(parts) > 1 else None
                dtype = parts[2] if len(parts) > 2 else None
            except Exception:
                sem = subj = dtype = None
            out.append({
                "file_name": path.name,
                "semester": sem,
                "subject_id": subj,
                "doc_type": dtype,
                "storage_path": str(rel),
                "created_at": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
            })
        return [u for u in out
                if (semester is None or u["semester"] == semester)
                and (subject_id is None or u["subject_id"] == subject_id)]

    q = supabase.table("community_uploads").select("*").order("created_at", desc=True).limit(limit)
    if semester is not None:
        q = q.eq("semester", semester)
    if subject_id is not None:
        q = q.eq("subject_id", subject_id)
    res = q.execute()
    return res.data or []
