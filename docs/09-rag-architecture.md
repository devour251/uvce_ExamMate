# 09 — RAG Architecture

## Why RAG here?

- UVCE notes are the **source of truth** for the answer style and
  syllabus alignment.
- Gemini's own knowledge is great at *polishing* an answer but
  hallucinates specifics (page numbers, UVCE-specific terminology,
  year of exam).
- A pure Gemini approach can't tell the student "this topic was
  asked 4 times in the last 5 years".

So: RAG retrieves the relevant chunks, Gemini reads them and writes
the exam-ready answer.

## Pipeline (one question in, one answer out)

```
question
   │
   │  embeddings.embed_query(q)        ← 768d or 384d vector
   ▼
┌──────────────────────────────────────────────────────────┐
│ vector_store.query(where={sem, subj, type})              │
│   three parallel queries:                                │
│     type="notes"     → n=4                              │
│     type="pyq"       → n=3                              │
│     type="internal"  → n=2                              │
│   priority-merge in that order                           │
└──────────────────────┬───────────────────────────────────┘
                       │  list[ {doc, meta, score} ]
                       ▼
┌──────────────────────────────────────────────────────────┐
│  prompt builder                                          │
│   BASE_SYSTEM (rules + marks-budget)                     │
│   + MODE block (normal | exam_tomorrow | pyq | ...)      │
│   + context (formatted chunks, "[1] source p.12 notes")  │
│   + question                                             │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  Gemini 1.5 Flash                                        │
│   system: BASE_SYSTEM                                    │
│   user  : built prompt                                  │
│   temperature 0.4, top_p 0.95, max 2048 tokens           │
│   retry ×3, exponential backoff                         │
└──────────────────────┬───────────────────────────────────┘
                       │  answer (markdown)
                       ▼
post-process:
  • extract_confidence(answer)        ← topic list
  • session_store.append(user, bot)
  • return { answer, sources, confidence, message_id }
```

## Chunking strategy

- `chunk_size = 800` chars, `overlap = 120` chars
- Why: average UVCE paragraph is 200–500 chars; 800 fits 2–3 paragraphs
  with enough context for an LLM to reason over.
- We collapse whitespace before chunking to avoid `\n\n\n` artifacts.

## Embedding choice

| Setting | Model | Why |
|---|---|---|
| Default | `text-embedding-004` (Gemini) | 768d, strong, free tier OK |
| Fallback | `all-MiniLM-L6-v2` (SBERT) | Runs offline, 384d, still strong |

We always measure **cosine similarity**. In ChromaDB we set
`hnsw:space=cosine`.

## Priority order

1. **UVCE notes** (primary — most weight, n=4)
2. **User-uploaded PDFs** (overlap with notes; type="notes" still)
3. **PYQs** (n=3)
4. **Internal papers** (n=2)
5. **External AI knowledge** (only as fallback, answer is marked
   "(general knowledge, not from UVCE notes)")

## Hallucination control

- System prompt explicitly forbids invented page numbers /
  formulas / references.
- "If CONTEXT is empty, mark the section."
- Diagram requests return `<DIAGRAM>topic</DIAGRAM>` tags that the
  frontend renders as "see your notes" cards.

## Latency budget

| Step | Typical |
|---|---|
| Embed query | 80–150 ms |
| Chroma query × 3 | 20–50 ms |
| Gemini 1.5 Flash | 1.2–2.5 s |
| Post-process | 10–20 ms |
| **Total** | **~1.5–3 s** |

## When the model fails

- Gemini 5xx → `tenacity` retries 3× with exponential backoff.
- If still failing → return a friendly message + log; session is
  preserved.
- If `OFFLINE_MODE=True` → deterministic stub (no API call) so demos
  and tests never break.
