# 12 — Backend Service Structure

## Modules at a glance

```
app/
├── main.py                ← FastAPI app, CORS, router mounting
├── core/
│   └── config.py          ← Pydantic settings (env-driven)
├── api/
│   ├── health.py          ← GET /health
│   ├── subjects.py        ← GET /api/subjects?semester=
│   ├── syllabus.py        ← GET /api/syllabus/{n}/pdf
│   ├── chat.py            ← POST /api/chat/ask
│   ├── notes.py           ← POST /api/notes/upload
│   └── pdf.py             ← POST /api/pdf/generate, GET /download/{file}
├── models/
│   └── schemas.py         ← Pydantic request/response models
├── services/
│   ├── vector_store.py    ← ChromaDB wrapper (1 collection, metadata filter)
│   ├── embeddings.py      ← Gemini embedding + SBERT fallback
│   ├── prompts.py         ← All Gemini prompt templates
│   ├── llm.py             ← Gemini wrapper + offline fallback + extract_confidence
│   ├── pdf_parser.py      ← PyPDF → chunks → embed → add
│   ├── pdf_builder.py     ← ReportLab study guide builder
│   └── session_store.py   ← In-memory session buffer
└── utils/
```

## Each service in one paragraph

### `services/vector_store.py`
- Owns a single `chromadb.PersistentClient` and one collection
  `uvce_notes`.
- `add_chunks(...)` writes id/doc/embedding/metadata in one call.
- `query(...)` returns a normalized list of
  `{document, metadata, score}`. Score = `1 - cosine_distance`.

### `services/embeddings.py`
- Two implementations behind a single interface.
- Default: `langchain_google_genai.GoogleGenerativeAIEmbeddings`
  using `text-embedding-004`.
- Fallback: local `sentence-transformers` model.
- Decision is automatic: if `GOOGLE_API_KEY` is set and
  `OFFLINE_MODE=False` → Gemini, else SBERT.

### `services/prompts.py`
- Holds two strings: the immutable `BASE_SYSTEM` and a function
  `build_prompt(...)` that assembles the user message from
  mode/marks/context/question.
- Five mode blocks defined in a dict; one is selected by `mode`.

### `services/llm.py`
- Wraps `ChatGoogleGenerativeAI` with retries (`tenacity`,
  `stop_after_attempt(3)`).
- Falls back to a deterministic stub if `OFFLINE_MODE=True` or no
  key.
- `extract_confidence(answer)` — regex-free topic matcher for
  known CS topics; returns predicted-importance list.

### `services/pdf_parser.py`
- `PyPDF.PdfReader` per page → `extract_text()` → `chunk_text()`
  with 800/120 overlap → `embed_texts()` → `vector_store.add_chunks()`.
- Returns chunk count for the API response.

### `services/pdf_builder.py`
- `build_study_guide(subject, messages) → bytes` — builds a PDF
  with cover, contents table, detailed Q&A, and a quick-revision
  page. Uses ReportLab's `SimpleDocTemplate`.
- `save_study_guide(filename, bytes)` — writes under
  `data/pdfs/generated/`.

### `services/session_store.py`
- Thread-safe `dict[session_id, list[message]]`.
- TTL: 4 hours. Old sessions are GC'd on read.
- No persistent storage (per spec).

## API → service mapping

| Endpoint | Services used |
|---|---|
| `POST /api/chat/ask` | `embeddings` → `vector_store` (3 calls) → `prompts` → `llm` → `session_store` |
| `POST /api/notes/upload` | `pdf_parser` (PyPDF, chunking, embedding, add) |
| `POST /api/pdf/generate` | `session_store` → `pdf_builder` (ReportLab) |
| `GET /api/syllabus/{n}/pdf` | file streaming |
| `GET /api/subjects` | static catalog (in `subjects.py`) |

## Dependency injection

We don't use FastAPI's DI for services — they're singletons with
module-level initialization (Chroma client, SentenceTransformer
model). LRU-cache decorators on `_local()` / `_google()` keep the
loaders from re-running.

## Error handling

- Upstream LLM errors → `tenacity` retries, then 500 with a
  friendly detail.
- Chroma errors → bubble up; logged server-side.
- PDF parse errors per page → caught, page skipped, chunking
  continues for the rest of the doc.

## Configuration

All env via `pydantic-settings` (`app/core/config.py`). No
hardcoded secrets.
