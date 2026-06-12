"""LLM service — wraps Gemini with retries + offline fallback."""
from __future__ import annotations
import asyncio
import re
from tenacity import retry, stop_after_attempt, wait_exponential

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings


def _build_llm():
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.4,
        top_p=0.95,
        max_output_tokens=2048,
        convert_system_message_to_human=True,
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def generate(system: str, user: str) -> str:
    if not settings.google_api_key or settings.offline_mode:
        return _offline_answer(user)

    llm = _build_llm()
    res = await llm.ainvoke(
        [SystemMessage(content=system), HumanMessage(content=user)]
    )
    return res.content or ""


def _offline_answer(user: str) -> str:
    """Cheap deterministic answer used when Gemini is unavailable.
    Parses the question out of the prompt and returns a stub.
    """
    m = re.search(r"QUESTION:\s*(.+)$", user, re.DOTALL)
    q = m.group(1).strip() if m else "your question"
    return (
        f"**Offline demo response** for: _{q}_\n\n"
        "Gemini is not configured. Set `GOOGLE_API_KEY` in `.env` to enable "
        "real answers. The RAG pipeline, prompts, and structure are wired up — "
        "this stub exists so the rest of the app keeps working during the "
        "hackathon build."
    )


# ---------------------------------------------------------------------------
# Confidence / topic extraction (lightweight, no extra LLM call)
# ---------------------------------------------------------------------------

_TOPIC_HINTS = {
    "deadlocks", "paging", "scheduling", "virtual memory", "thrashing",
    "semaphores", "mutex", "process synchronization", "file systems",
    "normalization", "indexing", "transactions", "sql", "joins",
    "deadlock", "compiler", "parsing", "lexical analysis", "syntax tree",
    "interrupts", "memory management", "cache", "tcp", "udp", "routing",
    "encryption", "authentication", "neural networks", "gradient descent",
    "backpropagation", "clustering", "regression", "linked list", "tree",
    "graph", "sorting", "searching", "hashing", "recursion", "dp",
    "dynamic programming", "greedy",
}


def extract_confidence(answer: str) -> list[dict]:
    text = answer.lower()
    found = []
    for t in _TOPIC_HINTS:
        if t in text:
            found.append({"topic": t.title(), "score": 90 - len(found) * 7})
    return found[:8]
