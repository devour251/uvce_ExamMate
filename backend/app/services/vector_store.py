"""ChromaDB wrapper.

Single collection `uvce_notes` partitioned by metadata filters:
    collection.add(...,
        metadatas=[{"semester": 4, "subject_id": "BCS401",
                    "type": "notes"|"pyq"|"internal", "source": "OS_Unit3.pdf"}]
    )

Search:
    collection.query(query_embeddings=..., where={"semester": 4, "subject_id": "BCS401"})
"""
from __future__ import annotations
import os
from pathlib import Path
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings


_client = None
_collection = None
COLLECTION_NAME = "uvce_notes"


def get_chroma():
    global _client
    if _client is None:
        Path(settings.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def reset_collection():
    """Used in tests."""
    client = get_chroma()
    client.delete_collection(COLLECTION_NAME)
    global _collection
    _collection = None


def add_chunks(
    *,
    ids: list[str],
    documents: list[str],
    embeddings: list[list[float]] | None,
    metadatas: list[dict[str, Any]],
):
    coll = get_collection()
    coll.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def query(
    *,
    query_embedding: list[float],
    where: dict[str, Any] | None = None,
    n_results: int = 6,
) -> list[dict[str, Any]]:
    coll = get_collection()
    res = coll.query(
        query_embeddings=[query_embedding],
        where=where,
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    out: list[dict[str, Any]] = []
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]
    for doc, meta, dist in zip(docs, metas, dists):
        # cosine distance in [0,2], convert to similarity
        score = max(0.0, 1.0 - dist)
        out.append(
            {
                "document": doc,
                "metadata": meta or {},
                "score": score,
            }
        )
    return out
