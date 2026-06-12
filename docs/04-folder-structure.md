# 04 — Folder Structure

```
uvce-exammate-ai/
├── README.md
├── LICENSE
├── .gitignore
│
├── frontend/                       ← Next.js 14 (App Router)
│   ├── app/
│   │   ├── layout.tsx              ← root layout, fonts, toaster
│   │   ├── page.tsx                ← landing OR semester view (state-driven)
│   │   └── login/page.tsx          ← Google + email auth
│   │
│   ├── components/
│   │   ├── landing/                ← 3D hero, stats, features, how-it-works, CTA, footer
│   │   │   ├── Scene3D.tsx         ← R3F canvas — books, stars, UVCE wordmark
│   │   │   ├── Hero.tsx            ← headline + Let's Start
│   │   │   ├── TypingEffect.tsx
│   │   │   ├── Stats.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── CTA.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── semester/
│   │   │   └── SemesterSection.tsx ← 8 cards → ChatInterface
│   │   │
│   │   ├── chat/
│   │   │   └── ChatInterface.tsx   ← ChatGPT-style: marks, mode, send, PDF
│   │   │
│   │   └── ui/
│   │       └── Toaster.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                  ← typed API client
│   │   ├── supabase.ts             ← browser supabase client
│   │   ├── session.ts              ← sessionStorage helpers
│   │   ├── subjects.ts             ← seed catalog
│   │   └── utils.ts                ← cn(), formatters, downloadBlob()
│   │
│   ├── styles/
│   │   └── globals.css             ← tailwind + design tokens
│   │
│   ├── public/                     ← static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── next.config.mjs
│   └── .env.example
│
├── backend/                        ← FastAPI
│   ├── app/
│   │   ├── main.py                 ← FastAPI app + CORS + routers
│   │   ├── core/
│   │   │   └── config.py           ← pydantic-settings
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── subjects.py
│   │   │   ├── syllabus.py
│   │   │   ├── chat.py             ← RAG orchestration
│   │   │   ├── notes.py            ← upload + ingest
│   │   │   └── pdf.py              ← generate + download
│   │   ├── models/
│   │   │   └── schemas.py          ← Pydantic request/response
│   │   ├── services/
│   │   │   ├── vector_store.py     ← ChromaDB wrapper
│   │   │   ├── embeddings.py       ← Gemini / SBERT
│   │   │   ├── prompts.py          ← all Gemini prompts
│   │   │   ├── llm.py              ← Gemini wrapper + offline fallback
│   │   │   ├── pdf_parser.py       ← PyPDF → chunks → embed
│   │   │   ├── pdf_builder.py      ← ReportLab study guide
│   │   │   └── session_store.py    ← in-memory session buffer
│   │   └── utils/
│   │
│   ├── data/pdfs/                  ← uploaded + syllabus PDFs
│   │   └── .gitkeep
│   ├── chroma_db/                  ← persistent vector store
│   │
│   ├── tests/
│   │   └── test_chat.py            ← pytest smoke tests
│   │
│   ├── seed_data.py                ← one-shot ingestion script
│   ├── requirements.txt
│   ├── render.yaml                 ← Render deploy config
│   ├── Procfile
│   ├── README.md
│   └── .env.example
│
├── docs/                           ← you are here
│   ├── 01-system-architecture.md
│   ├── 02-database-schema.md
│   ├── 03-chromadb-structure.md
│   ├── 04-folder-structure.md
│   ├── 05-api-design.md
│   ├── 06-ui-wireframes.md
│   ├── 07-user-flow.md
│   ├── 08-authentication-flow.md
│   ├── 09-rag-architecture.md
│   ├── 10-prompt-engineering.md
│   ├── 11-frontend-components.md
│   ├── 12-backend-services.md
│   ├── 13-development-plan.md
│   ├── 14-30h-timeline.md
│   ├── 15-mvp-features.md
│   ├── 16-ui-design.md
│   └── 17-challenges.md
│
└── .github/
    └── workflows/
        └── ci.yml                 ← pytest + next build
```
