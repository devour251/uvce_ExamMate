"""Generate the Subject Preparation Guide PDF."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.models.schemas import GeneratePdfRequest
from app.services.pdf_builder import build_study_guide, save_study_guide
from app.services.session_store import store

router = APIRouter()


@router.post("/generate")
def generate_pdf(req: GeneratePdfRequest):
    try:
        messages = req.messages or store.get(req.session_id)

        if not messages:
            raise HTTPException(
                status_code=400,
                detail="Empty session — ask at least one question first."
            )

        user_msgs = [m for m in messages if m.get("role") == "user"]

        if not user_msgs:
            raise HTTPException(
                status_code=400,
                detail="No questions asked in this session."
            )

        payload = build_study_guide(
            subject_name=req.subject_id,
            subject_code=req.subject_id,
            messages=messages,
        )

        filename = f"Subject_Preparation_Guide_{req.subject_id}.pdf"

        save_study_guide(filename, payload)

        return JSONResponse(
            content={
                "pdf_url": f"/api/pdf/download/{filename}",
                "filename": filename,
                "size_bytes": len(payload),
            }
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )


@router.get("/download/{filename}")
def download_pdf(filename: str):
    try:
        p = Path(settings.data_dir) / "generated" / filename

        if not p.exists():
            raise HTTPException(
                status_code=404,
                detail="PDF not found"
            )

        return FileResponse(
            path=str(p),
            media_type="application/pdf",
            filename=filename,
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF download failed: {str(e)}"
        )
