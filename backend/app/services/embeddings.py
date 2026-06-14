"""Embedding service.

Order of preference (decided at runtime, not import time):
  1. Google Gemini `text-embedding-004` (best quality) — if GOOGLE_API_KEY is
     set and not in offline mode.
  2. Local sentence-transformers (`all-MiniLM-L6-v2`, 384-d) — if the
     package and its native DLLs (torch / onnxruntime) load cleanly.
  3. Deterministic hashing fallback (256-d) — used when sentence-transformers
     fails to import (e.g. Windows Defender Application Control blocks
     a native DLL with "DLL load failed while importing _base").

All three implement the same interface, so the rest of the app doesn't care
which one is active. The fallback is good enough to demo the RAG pipeline
end-to-end during development; for production set GOOGLE_API_KEY.
"""
from __future__ import annotations

import hashlib
import logging
import math
import re
from functools import lru_cache

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import settings

log = logging.getLogger("uvce.embeddings")

# Sticky "active backend" name so we only try to import heavy libs once.
_active_backend: str | None = None


# ---------------------------------------------------------------------------
# Google (Gemini)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _google():
    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=settings.google_api_key,
    )


def _use_google() -> bool:
    return bool(settings.google_api_key) and not settings.offline_mode


# ---------------------------------------------------------------------------
# Local sentence-transformers (lazy)
# ---------------------------------------------------------------------------
_st_model = None
_st_loaded = False
_st_failed = False


def _local_st():
    """Lazy import — only runs when called (not at server startup)."""
    global _st_model, _st_loaded, _st_failed
    if _st_loaded:
        return _st_model
    if _st_failed:
        return None
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore

        _st_model = SentenceTransformer("all-MiniLM-L6-v2")
        _st_loaded = True
        log.info("✓ sentence-transformers loaded (all-MiniLM-L6-v2, 384-d)")
    except Exception as e:
        _st_failed = True
        log.warning(
            "⚠ sentence-transformers unavailable (%s) — falling back to hash embeddings. "
            "This is usually a native-DLL block (e.g. Windows Defender Application Control).",
            type(e).__name__,
        )
    return _st_model


# ---------------------------------------------------------------------------
# Deterministic hash fallback (always works, no native deps)
# ---------------------------------------------------------------------------
_HASH_DIM = 256


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def _hash_embed(text: str) -> list[float]:
    """Bag-of-words hashed into a fixed-dim vector, L2-normalized."""
    vec = [0.0] * _HASH_DIM
    for tok in _tokenize(text):
        h = hashlib.md5(tok.encode("utf-8")).digest()
        idx = int.from_bytes(h[:4], "little") % _HASH_DIM
        sign = 1.0 if (h[4] & 1) else -1.0
        vec[idx] += sign
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def _hash_embed_batch(texts: list[str]) -> list[list[float]]:
    return [_hash_embed(t) for t in texts]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def _resolve_backend() -> str:
    """Pick an embedding backend. Tries each in order, sticks with the winner."""
    global _active_backend
    if _active_backend is not None:
        return _active_backend

    if _use_google():
        try:
            # quick sanity ping — most failures are auth/quota, surface them
            _google().embed_query("ping")
            _active_backend = "google"
            log.info("✓ using Google text-embedding-004 (768-d)")
            return _active_backend
        except Exception as e:
            log.warning("Google embeddings unavailable: %s", e)

    model = _local_st()
    if model is not None:
        _active_backend = "sentence-transformers"
        return _active_backend

    _active_backend = "hash"
    log.warning(
        "→ using deterministic hash embeddings (256-d). Set GOOGLE_API_KEY "
        "for production-quality retrieval."
    )
    return _active_backend


def embed_texts(texts: list[str]) -> list[list[float]]:
    backend = _resolve_backend()
    if backend == "google":
        return _google().embed_documents(texts)
    if backend == "sentence-transformers":
        return _local_st().encode(texts, normalize_embeddings=True).tolist()
    return _hash_embed_batch(texts)


def embed_query(q: str) -> list[float]:
    backend = _resolve_backend()
    if backend == "google":
        return _google().embed_query(q)
    if backend == "sentence-transformers":
        return _local_st().encode([q], normalize_embeddings=True).tolist()[0]
    return _hash_embed(q)


def active_backend() -> str:
    """For debugging / health endpoint."""
    return _active_backend or "unresolved"