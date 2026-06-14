"""LLM service — wraps Gemini with retries + smart offline fallback.

Pipeline priority:
  1. Gemini (google_api_key must start with 'AIzaSy' to be treated as valid)
  2. If Gemini unavailable → return RAG context from uploaded notes (if any)
  3. If no RAG context → return a clearly labelled "no API key" message
"""
from __future__ import annotations

import logging
import re

from tenacity import retry, stop_after_attempt, wait_exponential

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings

log = logging.getLogger("uvce.llm")


# ─────────────────────────────────────────────────────────────────────────────
# Key validation
# ─────────────────────────────────────────────────────────────────────────────

def _is_valid_google_key(key: str) -> bool:
    """Google AI / Gemini API keys always start with 'AIzaSy'."""
    return bool(key and key.startswith("AIzaSy"))


# ─────────────────────────────────────────────────────────────────────────────
# Gemini call
# ─────────────────────────────────────────────────────────────────────────────

def _build_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.4,
        top_p=0.95,
        max_output_tokens=2048,
        convert_system_message_to_human=True,
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def _generate_with_gemini(system: str, user: str) -> str:
    llm = _build_llm()
    res = await llm.ainvoke(
        [SystemMessage(content=system), HumanMessage(content=user)]
    )
    return res.content or ""


async def generate(system: str, user: str) -> str:
    """Main entry point — tries Gemini, falls back gracefully."""
    key = settings.google_api_key or ""

    if settings.offline_mode:
        log.warning("OFFLINE_MODE is True — skipping Gemini")
        return _smart_fallback(user)

    if not _is_valid_google_key(key):
        log.error(
            "GOOGLE_API_KEY looks invalid (got %r, expected to start with 'AIzaSy'). "
            "Please set a real key in backend/.env",
            key[:12] + "..." if key else "(empty)",
        )
        return _smart_fallback(user)

    try:
        return await _generate_with_gemini(system, user)
    except Exception as exc:
        log.error("Gemini call failed: %s", exc)
        return _smart_fallback(user)


# ─────────────────────────────────────────────────────────────────────────────
# Smart offline fallback
# ─────────────────────────────────────────────────────────────────────────────

def _extract_context(prompt: str) -> str:
    """Pull the RAG context block out of the assembled prompt."""
    match = re.search(
        r"--- CONTEXT START ---\s*(.*?)\s*--- CONTEXT END ---",
        prompt,
        re.DOTALL,
    )
    if match:
        content = match.group(1).strip()
        if "no context retrieved" in content.lower():
            return ""
        return content
    return ""


def _extract_prompt_value(prompt: str, label: str) -> str:
    pattern = rf"{re.escape(label)}:\s*(.*?)(?:\n\n|$)"
    match = re.search(pattern, prompt, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def _smart_fallback(user_prompt: str) -> str:
    """Return the best answer we can without a live LLM.

    Priority:
      1. RAG context retrieved from uploaded PDFs  → show it with a note
      2. No context                                → explain the missing key
    """
    context = _extract_context(user_prompt)
    question = _extract_prompt_value(user_prompt, "QUESTION") or "your question"
    subject = _extract_prompt_value(user_prompt, "SUBJECT") or "the subject"
    marks_raw = _extract_prompt_value(user_prompt, "MARKS BUDGET") or ""

    if context:
        # We have real content from the student's uploaded notes — display it
        return (
            f"## Answer from Uploaded Notes — *{subject}*\n\n"
            f"{context}\n\n"
            "---\n"
            "> **⚠️ AI Synthesis Unavailable**  \n"
            "> The above text was retrieved directly from your uploaded PDF notes via the RAG pipeline.  \n"
            "> To get a fully synthesised, marks-budgeted AI answer, please set a valid  \n"
            "> **`GOOGLE_API_KEY`** (starts with `AIzaSy...`) in `backend/.env` and restart the backend.\n"
        )

    # No context, no key — give a clear actionable message
    return (
        f"## ⚠️ AI Not Configured — *{subject}*\n\n"
        f"**Your question:** {question}\n\n"
        "The AI could not answer because:\n\n"
        "1. **No valid Gemini API key** is set in `backend/.env`.  \n"
        "   Your current key starts with `AQ.` — that is **not** a valid Google AI key.  \n"
        "   Valid keys start with `AIzaSy...`.  \n"
        "   Get a free key at 👉 **https://aistudio.google.com/app/apikey**\n\n"
        "2. **No matching notes** were found in ChromaDB for this question.  \n"
        "   Upload a PDF from the **Community Knowledge Base** section first.\n\n"
        "**How to fix:**\n"
        "```\n"
        "# backend/.env\n"
        "GOOGLE_API_KEY=AIzaSy...your-real-key-here\n"
        "```\n"
        "Then restart the backend (`uvicorn app.main:app --reload`)."
    )


# ─────────────────────────────────────────────────────────────────────────────
# Confidence extraction (unchanged)
# ─────────────────────────────────────────────────────────────────────────────

_TOPIC_HINTS = {
    "deadlocks", "paging", "scheduling", "virtual memory", "thrashing",
    "semaphores", "mutex", "process synchronization", "file systems",
    "normalization", "indexing", "transactions", "sql", "joins",
    "deadlock", "compiler", "parsing", "lexical analysis", "syntax tree",
    "interrupts", "memory management", "cache", "tcp", "udp", "routing",
    "encryption", "authentication", "neural networks", "gradient descent",
    "backpropagation", "clustering", "regression", "linked list", "tree",
    "graph", "sorting", "searching", "hashing", "recursion", "dp",
    "dynamic programming", "greedy", "information technology",
    "information security", "confidentiality", "integrity", "availability",
    "osi model", "ip address", "dns", "lan", "wan", "switch", "router",
    "hub", "bridge", "subnet", "firewall", "http", "https", "ftp", "smtp",
    "network", "protocol", "bandwidth", "latency", "packet", "frame",
}


def extract_confidence(answer: str) -> list[dict]:
    text = answer.lower()
    found = []
    for t in _TOPIC_HINTS:
        if t in text:
            found.append({"topic": t.title(), "score": 90 - len(found) * 7})
    return found[:8]
