# 13 — Step-by-Step Development Plan

> Built for a 30-hour hackathon with a 4-person team. Read together
> with `14-30h-timeline.md` for the hour-by-hour schedule.

## Phase 0 — Preparation (T-2h to T-0)
- All four members clone the repo, install Node 20 + Python 3.11.
- Decide API keys (Gemini, Supabase) and put them in `.env` files.
- Create the Supabase project, run the schema migration, enable
  Google + email providers.

## Phase 1 — Foundations (Hour 0–4)

| # | Task | Owner | Output |
|---|---|---|---|
| 1.1 | Scaffold Next.js + Tailwind + Framer Motion | FE lead | `npm run dev` shows blank page |
| 1.2 | Scaffold FastAPI + Pydantic + uvicorn | BE lead | `/health` returns 200 |
| 1.3 | Wire Supabase client + login page | Auth/Dev | Google + email sign-in works |
| 1.4 | `subjects` static catalog | AI/Backend | `/api/subjects?semester=4` returns list |

**Done when:** Frontend can list subjects and `curl /health` is green.

## Phase 2 — RAG skeleton (Hour 4–10)

| # | Task | Owner | Output |
|---|---|---|---|
| 2.1 | ChromaDB wrapper + first ingest of 1 PDF | AI/Backend | `python -m seed_data` indexes 50+ chunks |
| 2.2 | `embeddings.py` (Gemini + SBERT) | AI/Backend | unit test embeds a string |
| 2.3 | `pdf_parser.py` (PyPDF + chunk) | AI/Backend | ingest works end-to-end |
| 2.4 | `prompts.py` (BASE_SYSTEM + 5 mode blocks) | AI/Backend | prompts importable, lint-clean |
| 2.5 | `llm.py` (Gemini + offline stub) | AI/Backend | `generate("sys", "usr")` returns text |

**Done when:** A notebook script can ask a question and get a
non-empty answer.

## Phase 3 — Chat experience (Hour 10–18)

| # | Task | Owner | Output |
|---|---|---|---|
| 3.1 | `/api/chat/ask` endpoint wiring all services | BE lead | `curl` returns `{answer, sources, confidence}` |
| 3.2 | Frontend `ChatInterface` layout (3-pane) | FE lead | Sidebar + chat + composer |
| 3.3 | Send / receive / render markdown | FE lead | End-to-end Q&A in browser |
| 3.4 | Mode + marks controls | FE lead | Switching modes visibly changes prompt |
| 3.5 | Source / confidence UI | Design | Sources collapse, bars animate |
| 3.6 | Syllabus PDF download button | BE lead | Click → opens syllabus PDF |

**Done when:** Demo flow #1 works end-to-end in the browser.

## Phase 4 — PDF generator + auth gate (Hour 18–24)

| # | Task | Owner | Output |
|---|---|---|---|
| 4.1 | `pdf_builder.py` (cover, ToC, Q&A, revision) | BE lead | Generates a 5-page PDF locally |
| 4.2 | `/api/pdf/generate` + `/download/{file}` | BE lead | Click in UI downloads PDF |
| 4.3 | Upload-notes button + `/api/notes/upload` | Auth/Dev + BE | User can upload a PDF, see chunk count |
| 4.4 | Soft auth gate (modal) | Auth/Dev | Unauth → prompt to sign in |

**Done when:** Demo flow #2 (ask → generate PDF → download) works.

## Phase 5 — Landing page polish (Hour 24–30)

| # | Task | Owner | Output |
|---|---|---|---|
| 5.1 | R3F scene (books, stars, UVCE wordmark, mouse orb) | FE lead | Cinematic backdrop on landing |
| 5.2 | Hero, stats, features, how-it-works, CTA, footer | FE lead + Design | All 5 sections + Let's Start CTA |
| 5.3 | Smooth scroll + GSAP intro | FE lead | 60fps on a MacBook Air |
| 5.4 | Mobile responsive pass | Design | Looks good on iPhone SE |
| 5.5 | Bug bash + 1-page README polish | All | |

**Done when:** Demo flow #3 (landing → start → pick semester → chat
→ upload → generate PDF) is a single 3-minute walkthrough.

## Cross-cutting

- **Git strategy**: `main` is always deployable. Each feature in a
  branch + PR. Squash-merge.
- **Code review**: any change touching RAG, prompts, or auth needs
  a second pair of eyes.
- **Demo data**: keep `backend/data/pdfs/demo/` populated with
  3–5 real UVCE notes/PYQs so the on-stage demo always works even
  if the live upload breaks.
- **Backup plan**: `OFFLINE_MODE=True` keeps the UI working even if
  Gemini is down.
