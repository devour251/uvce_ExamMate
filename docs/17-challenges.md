# 17 — Potential Challenges & Solutions

## C1 — Gemini hallucinates UVCE-specific facts
**Symptom**: AI invents page numbers, makes up unit titles, quotes
textbooks UVCE doesn't use.
**Cause**: Model's training data is generic; UVCE materials are niche.
**Fix**:
- Strict system prompt (rule #2, #3 in `prompts.py`).
- Force model to mark gaps with "(general knowledge, not from UVCE
  notes)".
- Always retrieve RAG context first; if empty, mark accordingly.
- Eval with 5 hand-curated questions; any hallucination = prompt
  regression.

## C2 — ChromaDB is empty / cold start
**Symptom**: First user of the day gets slow answers.
**Cause**: Free Render instance sleeps; Chroma is persisted but cold.
**Fix**:
- Keep a `demo/` set of pre-indexed PDFs in the repo.
- `seed_data.py` runs at container start (Render `startCommand` runs
  it once, idempotent).
- The first `/api/chat/ask` after cold-start includes a
  "warming up" toast (handled client-side with a longer spinner).

## C3 — PDF parsing fails on scanned notes
**Symptom**: `pypdf.extract_text()` returns empty for image-only
PDFs (very common in Indian college notes).
**Cause**: Scanned notes need OCR.
**Fix (MVP)**: Show a friendly warning "This PDF appears to be
scanned; only its filename is indexed. Use a text-based PDF for best
results."
**Fix (v2)**: Add Tesseract OCR via `pytesseract` + `pdf2image` to
the ingestion pipeline.

## C4 — Marks-budget drift
**Symptom**: AI returns 600 words for a 2-mark question.
**Cause**: Model doesn't have a hard length cap by default.
**Fix**: System prompt rule #6 enforces an explicit word range per
marks budget. Plus a post-process: if `len(words)` > 1.5× target,
truncate and add "(continued in PDF)".

## C5 — Long context overflows Gemini's window
**Symptom**: 429 / "context too large" errors on big questions.
**Cause**: A user pastes a 5,000-word question.
**Fix**:
- Cap question length at 1,500 chars on the frontend (textarea
  `maxLength`).
- Cap context at top 4 chunks × ~800 chars = 3.2k chars, well
  within 1M token Flash window.
- `tenacity` retries with backoff; if still failing, return 503
  with a friendly message.

## C6 — Auth breaks RAG
**Symptom**: After adding auth, chat starts returning 401.
**Cause**: Frontend not attaching JWT to `/api/chat/ask`.
**Fix**: Soft-auth in MVP — `/api/chat/ask` doesn't require JWT.
Only `/api/notes/upload` and `/api/pdf/generate` do. This keeps
the demo flow frictionless.

## C7 — Render free-tier disk is ephemeral
**Symptom**: Chroma wipes every deploy.
**Cause**: Render free tier's `/opt/render/project/src/` is
ephemeral by default.
**Fix**:
- Provision a Render disk, mount it at `/data`, point
  `CHROMA_PERSIST_DIR=/data/chroma_db`.
- Document this in `render.yaml` notes (manual step in dashboard).
- For the hackathon, also seed a tiny pre-indexed DB into the
  image so the demo always works.

## C8 — R3F crashes on low-end laptops
**Symptom**: Landing page is a black screen on a 4-year-old
Chromebook.
**Cause**: WebGL is slow / disabled.
**Fix**:
- Wrap the canvas in an `ErrorBoundary`; on crash, replace with a
  static gradient background (CSS only).
- `dpr={[1, 2]}` adapts to screen.
- Provide a `?static=1` query param that forces the static version
  for old hardware.

## C9 — Concurrent uploads race condition
**Symptom**: User uploads 3 PDFs in quick succession, only 1 ends
up in Chroma.
**Cause**: We use a single global Chroma client; concurrent `.add()`
calls collide on a `max_batch_size`.
**Fix**: Wrap the entire ingest in a `threading.Lock` keyed on
`{semester}/{subject_id}`.

## C10 — Session store loses data on BE restart
**Symptom**: After a Render redeploy, the user can't generate a PDF
because the session is empty.
**Cause**: In-process `dict` is gone.
**Fix (MVP)**: Document this; demo deployments don't restart
mid-demo.
**Fix (v2)**: Move to Supabase table `chat_sessions` with TTL
cleanup. Note: this conflicts with the "no permanent chat history"
spec, so it's opt-in per user.

## C11 — "Exam Tomorrow" mode generates too much
**Symptom**: AI dumps an 8-page answer for "my exam is tomorrow".
**Cause**: We asked for 5 long + 5 short + definitions + tips, but
the marks budget is unset.
**Fix**: When mode = `exam_tomorrow`, force marks = `20marks` and
let the user pick a sub-budget if needed (future).

## C12 — "Generate PDF" hangs
**Symptom**: Click → spinner forever.
**Cause**: ReportLab choking on a 5,000-message session.
**Fix**:
- Cap session length at 50 Q&A pairs in `session_store` GC.
- Stream the PDF build with a 30s timeout; if exceeded, return a
  503 with "session too large, please generate sections separately".

## C13 — Diagram detection is hard
**Symptom**: AI tries to ASCII-draw a circuit diagram.
**Cause**: System prompt rule #4 is sometimes ignored.
**Fix**:
- Post-process the response: regex-replace any block containing
  "```" (code block) with `<DIAGRAM>see your notes</DIAGRAM>`.
- Add a small `<DiagramPlaceholder/>` component on the frontend
  that shows a clean "Refer to your uploaded notes" card.

## C14 — Cross-browser QA at 4am
**Symptom**: Works in Chrome, breaks in Safari, murders Firefox.
**Fix**: Test on Chrome (primary), Safari (iPhone), and a Linux
Firefox if time permits. Don't try to fix everything — prioritize
the demo machine.
