# UVCE ExamMate AI — Backend

FastAPI service exposing RAG, chat, PDF generation, and notes upload.

## Quick Start

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # add GOOGLE_API_KEY
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the OpenAPI explorer.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/api/subjects?semester=N` | List UVCE subjects for a semester |
| GET | `/api/syllabus/{n}/pdf` | Stream the syllabus PDF |
| POST | `/api/chat/ask` | Ask a question (RAG + Gemini) |
| POST | `/api/notes/upload` | Upload a PDF (notes/PYQ/internal) |
| POST | `/api/pdf/generate` | Build the study guide PDF |
| GET | `/api/pdf/download/{file}` | Download the generated PDF |

## Architecture

```
app/
  main.py            ← FastAPI app + CORS + router mounting
  core/config.py     ← Pydantic settings (env-driven)
  api/               ← Route handlers
  models/schemas.py  ← Pydantic request/response models
  services/
    vector_store.py  ← ChromaDB wrapper
    embeddings.py    ← Gemini / SBERT embeddings
    prompts.py       ← All prompt templates
    llm.py           ← Gemini wrapper + offline fallback
    pdf_parser.py    ← PyPDF → chunk → embed → add
    pdf_builder.py   ← ReportLab study guide builder
    session_store.py ← In-process session buffer (no permanent history)
```

## Deploying to Render

`render.yaml` is included. The service uses:

- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
