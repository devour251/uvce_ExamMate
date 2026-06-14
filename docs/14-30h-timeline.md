# 14 — 30-Hour Timeline & Team Responsibilities

## Team (4 students)

| Initials | Role | Strength |
|---|---|---|
| **A** (FE-Lead) | Frontend & 3D | Next.js, R3F, GSAP, animations |
| **B** (BE-Lead) | Backend & infra | FastAPI, deploy, DB |
| **C** (AI-Lead) | RAG & prompts | LangChain, Chroma, Gemini |
| **D** (Design + Auth) | UI/UX + Auth | Supabase, Tailwind, polish |

## Hour-by-hour

| Hour | A (FE) | B (BE) | C (AI) | D (Auth/Design) |
|---:|---|---|---|---|
| **0–1** | Scaffold Next.js + Tailwind | Scaffold FastAPI + `/health` | Stand up Chroma + embed a sentence | Create Supabase project, schema, Google OAuth |
| **1–2** | Tailwind tokens, glass card, button | Pydantic schemas | `embeddings.py` (Gemini + SBERT fallback) | Login page UI + Supabase client |
| **2–3** | Landing skeleton (Hero, CTA) | `/api/subjects` | `pdf_parser.py` chunking | Login flow end-to-end |
| **3–4** | 3D scene (R3F canvas) | `/api/syllabus/{n}/pdf` | `vector_store.py` wrapper | Auth middleware on BE (optional) |
| **4–5** | Hero animations (GSAP) | First deployment of BE on Render | Ingest 1 demo PDF | Design tokens, gradients, type |
| **5–6** | Stats, Features cards | `/api/notes/upload` | First RAG Q&A via script | Landing visual polish |
| **6–7** | How-it-works, CTA, Footer | CORS, env, error handling | `prompts.py` v1 (BASE_SYSTEM) | How-it-works icons, illustrations |
| **7–8** | Semester grid (8 cards) | `/api/chat/ask` skeleton | `llm.py` (Gemini + offline stub) | Subject selector styling |
| **8–9** | **DEMO CHECKPOINT 1** — landing + 8 cards clickable | `/api/chat/ask` real | RAG retrieval working | Spinner, loading states |
| **9–10** | Chat layout (3-pane) | Wire RAG into `/api/chat/ask` | End-to-end ask → answer in notebook | Composer (textarea + send) |
| **10–11** | Send / receive / render markdown | Sources in response | `extract_confidence` v1 | Markdown styling |
| **11–12** | Mode + marks controls | Mode-conditional prompts | Tune `prompts.py` v2 | Confidence bars, source chips |
| **12–13** | Typing preview, smooth scroll | PyYAML test fixtures | Eval 5 sample Qs vs hand-written | Color/contrast pass |
| **13–14** | **LUNCH BREAK** | | | |
| **14–15** | Landing page final pass | `pdf_builder.py` (ReportLab) | Bug bash on RAG | Generate PDF button |
| **15–16** | Mobile responsive | `/api/pdf/generate` + download | PYQ Intelligence mode test | PDF preview modal |
| **16–17** | Upload UI + drag-drop | `/api/notes/upload` test in UI | Confidence tuning | Toast notifications (sonner) |
| **17–18** | Sign-in modal soft-gate | Auth middleware on `/notes`, `/pdf` | Exam Tomorrow mode test | Login polish |
| **18–19** | **DEMO CHECKPOINT 2** — full happy path | Render deployment | Chroma persistence check | End-to-end smoke |
| **19–20** | Loading states, error UI | /docs polish, deploy hooks | Prompt v3 (hallucination tests) | Empty-state design |
| **20–21** | Polish animations | Health check endpoint | RAG latency benchmark | 404 page, 500 page |
| **21–22** | Bug bash A | Bug bash B | Bug bash C | Bug bash D |
| **22–23** | 60fps check, Lighthouse | CORS, env, prod build | Offline mode test | README + screenshots |
| **23–24** | **DEMO REHEARSAL #1** | | | |
| **24–25** | Fixes from rehearsal | Fixes from rehearsal | Fixes from rehearsal | Slide deck draft |
| **25–26** | Polish | Polish | Polish | Slide deck final |
| **26–27** | 5-min demo script | Deploy to prod | Demo Q&A | Stage demo |
| **27–28** | Backup video | Backup video | Backup video | Backup video |
| **28–29** | **FINAL REHEARSAL** | | | |
| **29–30** | Submit 🏁 | Submit 🏁 | Submit 🏁 | Submit 🏁 |

## Hard rules during the build

- **No new tech.** If it isn't in the README, don't add it.
- **No scope creep.** If it's not in the MVP table, it's "nice to
  have" — write it down, do it after the demo works.
- **2-min rule.** If a teammate is stuck for > 2 min, ask. Don't
  hero-debug.
- **Main is green.** Every PR passes `pytest` and `next build`.
