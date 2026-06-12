"""Embedding service.

Uses Google Gemini `text-embedding-004` via langchain-google-genai.
If GOOGLE_API_KEY is missing, falls back to a deterministic
local sentence-transformers model.

The local fallback is imported LAZILY so the server boots even when
sklearn/sentence-transformers can't load (common on Windows where
Defender blocks compiled DLLs).
"""
from functools import lru_cache

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import settings


@lru_cache(maxsize=1)
def _google():
    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=settings.google_api_key,
    )


def _local():
    """Lazy import — only runs when called (not at server startup)."""
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("all-MiniLM-L6-v2")


def _use_google() -> bool:
    return bool(settings.google_api_key) and not settings.offline_mode


def embed_texts(texts: list[str]) -> list[list[float]]:
    if _use_google():
        return _google().embed_documents(texts)
    return _local().encode(texts, normalize_embeddings=True).tolist()


def embed_query(q: str) -> list[float]:
    if _use_google():
        return _google().embed_query(q)
    return _local().encode([q], normalize_embeddings=True).tolist()[0]
