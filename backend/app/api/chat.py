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
from app.api.subjects import get_subject_name

router = APIRouter()


def _format_context(hits: list[dict]) -> str:
    if not hits:
        return ""

    blocks: list[str] = []

    for i, h in enumerate(hits, start=1):
        meta = h.get("metadata", {})
        tag = (
            f"[{i}] "
            f"{meta.get('source', '?')} "
            f"(p.{meta.get('page', '?')}, "
            f"{meta.get('type', '?')})"
        )

        blocks.append(
            f"{tag}\n{h.get('document', '').strip()}"
        )

    return "\n\n".join(blocks)


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    try:
        # Validate question
        if not req.question or not req.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Empty question"
            )

        # --------------------------------------------------
        # 1. Embed query
        # --------------------------------------------------
        q_emb = None
        try:
            q_emb = embed_query(req.question)
        except Exception:
            q_emb = None

        # --------------------------------------------------
        # 2. Retrieve context
        # --------------------------------------------------
        where = {
            "semester": req.semester,
            "subject_id": req.subject_id,
        }

        notes: list[dict] = []
        pyqs: list[dict] = []
        internals: list[dict] = []

        if q_emb is not None:
            try:
                notes = rag_query(
                    query_embedding=q_emb,
                    where={**where, "type": "notes"},
                    n_results=4,
                )

                pyqs = rag_query(
                    query_embedding=q_emb,
                    where={**where, "type": "pyq"},
                    n_results=3,
                )

                internals = rag_query(
                    query_embedding=q_emb,
                    where={**where, "type": "internal"},
                    n_results=2,
                )

            except Exception:
                notes = []
                pyqs = []
                internals = []

        hits = notes + pyqs + internals

        context = _format_context(hits)

        # --------------------------------------------------
        # 3. Build prompt
        # --------------------------------------------------
        system = BASE_SYSTEM

        subject_name = get_subject_name(req.subject_id)
        user_prompt = build_prompt(
            question=req.question,
            context=context,
            mode=req.mode,
            marks=req.marks,
            subject=subject_name,
        )

        # --------------------------------------------------
        # 4. Store user message
        # --------------------------------------------------
        store.append(
            req.session_id,
            {
                "role": "user",
                "content": req.question,
                "mode": req.mode,
                "marks": req.marks,
            },
        )

        # --------------------------------------------------
        # 5. Generate answer
        # --------------------------------------------------
        try:
            answer = await generate(system, user_prompt)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"LLM generation failed: {str(e)}"
            )

        # --------------------------------------------------
        # 6. Store assistant message
        # --------------------------------------------------
        store.append(
            req.session_id,
            {
                "role": "assistant",
                "content": answer,
                "sources": [
                    h.get("metadata", {})
                    for h in hits
                ],
            },
        )

        # --------------------------------------------------
        # 7. Build response
        # --------------------------------------------------
        sources = [
            Source(
                source=h.get("metadata", {}).get(
                    "source",
                    "unknown",
                ),
                page=h.get("metadata", {}).get("page"),
                score=round(
                    h.get("score", 0.0),
                    3,
                ),
            )
            for h in hits
        ]

        confidence = [
            Confidence(**c)
            for c in extract_confidence(answer)
        ]

        return AskResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            session_id=req.session_id,
            message_id=str(uuid.uuid4()),
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected chat error: {str(e)}"
        )
