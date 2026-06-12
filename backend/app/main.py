"""
UVCE ExamMate AI — FastAPI entrypoint.
"""
import logging
import os
import traceback

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("uvce")

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from app.core.config import settings
    from app.api.health import router as health_router
    from app.api.subjects import router as subjects_router
    from app.api.syllabus import router as syllabus_router
    from app.api.chat import router as chat_router
    from app.api.notes import router as notes_router
    from app.api.pdf import router as pdf_router
    from app.api.community import router as community_router
    log.info("✓ all routers imported")
except Exception as e:
    log.error("✗ router import failed:\n%s", traceback.format_exc())
    raise

app = FastAPI(
    title="UVCE ExamMate AI",
    version="0.1.0",
    description="AI-powered exam preparation for UVCE students.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(subjects_router, prefix="/api", tags=["subjects"])
app.include_router(syllabus_router, prefix="/api", tags=["syllabus"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(notes_router, prefix="/api", tags=["notes"])
app.include_router(pdf_router, prefix="/api/pdf", tags=["pdf"])
app.include_router(community_router, prefix="/api", tags=["community"])


@app.get("/")
def root():
    return {
        "name": "UVCE ExamMate AI",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.on_event("startup")
async def _startup_log():
    log.info("=" * 50)
    log.info("UVCE ExamMate AI backend started")
    log.info(f"  CORS allow_origins: {settings.cors_origins}")
    log.info(f"  Supabase configured: {bool(settings.supabase_url and settings.supabase_service_key)}")
    log.info(f"  Gemini configured:  {bool(settings.google_api_key)}")
    log.info(f"  Offline mode:       {settings.offline_mode}")
    log.info(f"  Data dir:           {os.path.abspath(settings.data_dir)}")
    log.info("=" * 50)
