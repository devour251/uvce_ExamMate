from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health():
    return {
        "ok": True,
        "offline_mode": settings.offline_mode,
        "gemini_model": settings.gemini_model,
    }
