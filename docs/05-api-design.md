# 05 — API Design

Base URL (dev): `http://localhost:8000`
Base URL (prod): `https://uvce-exammate-ai.onrender.com`

All responses are JSON unless `application/pdf` is specified.

---

## `GET /health`
Liveness probe.

```json
{ "ok": true, "offline_mode": false, "gemini_model": "gemini-1.5-flash" }
```

---

## `GET /api/subjects?semester={1..8}`
Returns UVCE subjects for the semester.

```json
[
  { "id": "BCS401", "semester": 4, "code": "BCS401", "name": "Operating Systems", "syllabus_pdf_url": null }
]
```

---

## `GET /api/syllabus/{semester}/pdf`
Streams the syllabus PDF for the given semester.

Response: `application/pdf` (binary).

---

## `POST /api/chat/ask`
The main RAG endpoint.

### Request
```json
{
  "semester": 4,
  "subject_id": "BCS401",
  "question": "Explain deadlock detection and recovery.",
  "mode": "normal",
  "marks": "10marks",
  "session_id": "sess_abc123"
}
```

### Response
```json
{
  "answer": "**Deadlock detection** is the process of...",
  "sources": [
    { "source": "OS_Unit3.pdf", "page": 12, "score": 0.87 },
    { "source": "PYQ_2022.pdf", "page": 3,  "score": 0.71 }
  ],
  "confidence": [
    { "topic": "Deadlocks", "score": 92 },
    { "topic": "Paging",    "score": 85 }
  ],
  "session_id": "sess_abc123",
  "message_id": "uuid"
}
```

### Status codes
- `200` — OK
- `400` — empty question
- `401` — invalid / missing JWT
- `429` — rate limit (we use a basic in-process token bucket)
- `500` — upstream Gemini error after retries

---

## `POST /api/notes/upload`
Multipart form. Used by the "Upload notes / PYQ" button.

| field | type | notes |
|---|---|---|
| semester | int | 1-8 |
| subject_id | string | e.g. `BCS401` |
| doc_type | string | `notes` / `pyq` / `internal` |
| file | file | PDF, ≤ 20 MB |

Response:
```json
{ "chunks": 142, "source": "OS_Unit3.pdf" }
```

---

## `POST /api/pdf/generate`
Builds the study guide PDF from the session's Q&A.

### Request
```json
{ "session_id": "sess_abc123", "subject_id": "BCS401" }
```

### Response
```json
{
  "pdf_url": "/api/pdf/download/Subject_Preparation_Guide_BCS401.pdf",
  "filename": "Subject_Preparation_Guide_BCS401.pdf",
  "size_bytes": 84123
}
```

---

## `GET /api/pdf/download/{filename}`
Streams the generated PDF. Same filename the response promised.

---

## Auth

All authenticated endpoints expect:

```
Authorization: Bearer <supabase_jwt>
```

The FastAPI middleware decodes the JWT (HS256 with
`SUPABASE_JWT_SECRET`) and attaches the user to the request.

Endpoints that don't require auth:
- `GET /health`
- `GET /api/subjects`
- `GET /api/syllabus/{n}/pdf`
- `POST /api/chat/ask` *(soft-auth in MVP — you get a session, but no
  notes saved; hard-auth kicks in for upload + PDF)*

---

## Error shape

All errors return:
```json
{ "detail": "Human-readable error message" }
```
