# 03 — ChromaDB Structure

## Single collection

```
collection name: uvce_notes
distance:        cosine
embedding dim:   768  (text-embedding-004)  or  384 (all-MiniLM-L6-v2 fallback)
```

## Documents and metadata

Each chunk added to ChromaDB looks like:

```python
{
  "id":       "uuid-v4",
  "document": "Operating systems manage hardware resources and provide
               services to application software. Process scheduling…",
  "embedding": [0.012, -0.044, ...],   # 768 / 384 dims
  "metadata": {
    "semester":   4,
    "subject_id": "BCS401",
    "type":       "notes",            # notes | pyq | internal
    "source":     "OS_Unit3.pdf",
    "page":       12
  }
}
```

## Search strategy

```python
notes     = collection.query(query_embeddings=[q],
                             where={"semester": 4, "subject_id": "BCS401", "type": "notes"},
                             n_results=4)
pyqs      = collection.query(query_embeddings=[q],
                             where={"semester": 4, "subject_id": "BCS401", "type": "pyq"},
                             n_results=3)
internals = collection.query(query_embeddings=[q],
                             where={"semester": 4, "subject_id": "BCS401", "type": "internal"},
                             n_results=2)
```

Final hits = `notes + pyqs + internals` (priority-ordered merge).
We over-fetch from notes because they are the primary source.

## Why one collection, not many

- 8 semesters × 5–6 subjects = ~50 partitions; one collection with
  metadata filters is faster to maintain.
- ChromaDB's metadata filter index handles `where` clauses efficiently
  for tens of thousands of chunks.
- Re-indexing a single semester = delete-where-semester=5, re-add.

## Persistent storage

- **Dev:** `./chroma_db` on local disk.
- **Render:** `/opt/render/project/src/chroma_db` (Render free tier
  gives a persistent disk; we mount it via the dashboard).
- **Production:** swap to ChromaDB Cloud or a self-hosted server in 1
  file (`vector_store.py`).

## Ingestion pipeline

```
PDF file
   │  PyPDF
   ▼
text per page
   │  chunk_text(chunk_size=800, overlap=120)
   ▼
chunks (text only, no formatting)
   │  embed_texts()  ←  Gemini text-embedding-004
   ▼
list[dict] ready for collection.add()
```

## Index lifecycle

| Action | Trigger |
|---|---|
| Create | First ingest per subject |
| Append | New notes / PYQ uploaded by user |
| Re-index | Semester rollover / new syllabus version |
| Delete | GDPR / user request |
