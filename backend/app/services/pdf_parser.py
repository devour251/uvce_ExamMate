"""PDF → text chunking service."""
from __future__ import annotations
import re
import uuid
from pathlib import Path

from pypdf import PdfReader

from app.core.config import settings
from app.services.embeddings import embed_texts
from app.services.vector_store import add_chunks


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + chunk_size, n)
        chunks.append(text[start:end])
        if end == n:
            break
        start = max(end - overlap, start + 1)
    return chunks


def ingest_pdf(
    path: str | Path,
    *,
    semester: int,
    subject_id: str,
    doc_type: str = "notes",
) -> int:
    """Parse a PDF and push chunks into ChromaDB. Returns # chunks added."""
    path = Path(path)
    reader = PdfReader(str(path))
    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict] = []

    for page_idx, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        for chunk in chunk_text(text):
            ids.append(str(uuid.uuid4()))
            docs.append(chunk)
            metas.append(
                {
                    "semester": semester,
                    "subject_id": subject_id,
                    "type": doc_type,
                    "source": path.name,
                    "page": page_idx,
                }
            )

    if not docs:
        return 0

    embeddings = embed_texts(docs)
    add_chunks(
        ids=ids,
        documents=docs,
        embeddings=embeddings,
        metadatas=metas,
    )
    return len(docs)
