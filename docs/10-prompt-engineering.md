# 10 — Gemini Prompt Engineering Strategy

> All prompts live in `backend/app/services/prompts.py`.

## Three-layer prompt

Every chat call sends **two messages**:

1. **System** — fixed identity, hard rules, marks budget.
2. **User** — assembled per-request: mode block + context + question.

## The system prompt (verbatim)

```
You are UVCE ExamMate AI — an exam tutor for students of University
Visvesvaraya College of Engineering (UVCE), Bangalore.

You will be given:
  • CONTEXT — relevant passages retrieved from UVCE notes, PYQs and
    internal papers via RAG.
  • QUESTION — the student's question.
  • MODE — how to answer.
  • MARKS — target answer length (2 / 5 / 10 / 15 / 20 marks).

Hard rules:
  1. ANSWER ONLY WHAT IS ASKED. Don't add tangential content.
  2. Prefer content from CONTEXT. If CONTEXT is empty, you may fall
     back to your own knowledge BUT mark the section with
     "(general knowledge, not from UVCE notes)".
  3. NEVER invent page numbers, formulas, or references that aren't
     in CONTEXT.
  4. NEVER generate images / diagrams / ASCII art. If a diagram is
     required, instead return:
       <DIAGRAM>topic name</DIAGRAM>
     and tell the student to refer to the textbook or uploaded notes.
  5. Use UVCE exam style:
       - Clear headings
       - Numbered or bulleted points
       - Definitions in one line
       - Examples when relevant
       - Short, exam-friendly sentences
  6. Stay within the marks budget:
       - 2 marks  : 30–50 words
       - 5 marks  : 80–120 words
       - 10 marks : 200–280 words
       - 15 marks : 350–450 words
       - 20 marks : 500–650 words
  7. Output valid Markdown only.
```

### Why these exact rules?

| Rule | Reason |
|---|---|
| #1 | Hallucination guard — most common failure mode in exam tools |
| #2 | Forces the model to be honest about its source |
| #3 | Students *will* quote page numbers in viva |
| #4 | Diagrammatic hallucination is the #1 useless-AI tell |
| #5 | UVCE papers have a recognizable structure; mimic it |
| #6 | Marks-bounded length is what makes this an *exam* tool |
| #7 | Frontend renders markdown; we can't parse free text |

## Mode-specific blocks

| Mode | Behavior |
|---|---|
| `normal` | Direct exam-style answer at marks budget. |
| `exam_tomorrow` | Topics + definitions + 5 long + 5 short + tips. |
| `pyq_intelligence` | Markdown table \| Topic \| Frequency \| Confidence \| + 8 predicted Qs grouped by marks. |
| `internal_analysis` | Repeated concepts (count, years), trends, 5 likely Qs. |
| `viva` | 12 short Q&A pairs; one "tricky" question at the end. |

## Context formatting

```
[1] OS_Unit3.pdf (p.12, notes)
Operating systems manage hardware resources…

[2] PYQ_2022.pdf (p.3, pyq)
Q5. Explain deadlock detection. (10 marks)
```

Numbered `[n]` tags let the post-processor link source ↔ chunk
for the Sources panel in the UI.

## Marks-budget hint

The user prompt includes a `target length about N words` hint
derived from the marks slider. This is the single most effective
length-control signal we found in testing.

## Anti-hallucination technique: "if you don't know, say so"

The system prompt's rule #2 is a small thing with huge impact — it
drops the model's hallucination rate on the UVCE catalog
significantly because it's been told to admit gaps.

## Streaming (future)

`ChatGoogleGenerativeAI` supports streaming. We can swap
`llm.ainvoke` → `llm.astream` and pipe chunks to the frontend via
SSE. Skipped in MVP for simplicity (full responses in 1–3s are
acceptable).

## Evaluating the prompts

Hackathon-time eval plan:
1. Take 5 sample questions × 5 marks budgets.
2. Run each with the same context, two prompt versions.
3. Have a UVCE senior student blind-score for: factual accuracy,
   exam-style, length-bounded.
