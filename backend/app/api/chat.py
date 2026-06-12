"""Main chat endpoint — orchestrates RAG + Gemini + session store."""
from __future__ import annotations
import uuid

from fastapi import APIRouter, HTTPException

from app.models.schemas import AskRequest, AskResponse, Confidence, Source
from app.services.embeddings import embed_query
from app.services.vector_store import query as rag_query
from app.services.prompts import BASE_SYSTEM, build_prompt
from app.services.llm import generate, extract_confidence
from app.services.session_store import store

router = APIRouter()


def _format_context(hits: list[dict]) -> str:
    if not hits:
        return ""
    blocks: list[str] = []
    for i, h in enumerate(hits, start=1):
        meta = h.get("metadata", {})
        tag = f"[{i}] {meta.get('source','?')} (p.{meta.get('page','?')}, {meta.get('type','?')})"
        blocks.append(f"{tag}\n{h.get('document','').strip()}")
    return "\n\n".join(blocks)


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(400, "Empty question")

    # 1. embed + retrieve (priority order: notes > pdf > pyq > internal)
    q_emb = embed_query(req.question)
    where = {"semester": req.semester, "subject_id": req.subject_id}

    notes = rag_query(query_embedding=q_emb, where={**where, "type": "notes"}, n_results=4)
    pyqs = rag_query(query_embedding=q_emb, where={**where, "type": "pyq"}, n_results=3)
    internals = rag_query(query_embedding=q_emb, where={**where, "type": "internal"}, n_results=2)

    # priority order
    hits = notes + pyqs + internals

    context = _format_context(hits)

    # 2. build prompt
    system = BASE_SYSTEM
    user_prompt = build_prompt(
        question=req.question,
        context=context,
        mode=req.mode,
        marks=req.marks,
        subject=req.subject_id,
    )

    # 3. record user message
    store.append(req.session_id, {
        "role": "user",
        "content": req.question,
        "mode": req.mode,
        "marks": req.marks,
    })

    # 4. generate answer
    answer = await generate(system, user_prompt)

    # 5. record assistant message
    store.append(req.session_id, {
        "role": "assistant",
        "content": answer,
        "sources": [h.get("metadata", {}) for h in hits],
    })

    sources = [
        Source(
            source=h.get("metadata", {}).get("source", "unknown"),
            page=h.get("metadata", {}).get("page"),
            score=round(h.get("score", 0.0), 3),
        )
        for h in hits
    ]
    confidence = [Confidence(**c) for c in extract_confidence(answer)]

    return AskResponse(
        answer=answer,
        sources=sources,
        confidence=confidence,
        session_id=req.session_id,
        message_id=str(uuid.uuid4()),
    )
