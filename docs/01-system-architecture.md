# 01 — System Architecture

## High-level diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   Next.js 14 (App Router)                              │  │
│  │   • Landing page  (Three.js + GSAP + Framer Motion)    │  │
│  │   • Semester grid (8 cards)                            │  │
│  │   • Chat interface (ChatGPT-style)                     │  │
│  │   • Mode / Marks controls                              │  │
│  │   • PDF generation trigger                            │  │
│  └──────────────────────┬─────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTPS / JSON
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  FastAPI (Render)                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ /api/chat/ask   │  │ /api/notes/      │  │ /api/pdf/    │ │
│  │                 │  │     upload       │  │   generate   │ │
│  └────────┬────────┘  └─────────┬────────┘  └──────┬───────┘ │
│           │                     │                  │         │
│           ▼                     ▼                  ▼         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   RAG Pipeline                                         │   │
│  │   1. embed(query)         ── Gemini / SBERT           │   │
│  │   2. chromadb.query()     ── top-k by type            │   │
│  │   3. priority merge       ── notes > pdf > pyq > int. │   │
│  │   4. prompt.build()       ── system + context + mode  │   │
│  │   5. llm.generate()       ── Gemini 1.5              │   │
│  │   6. parse & store                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌────────────────┐         ┌──────────────────┐            │
│  │  ChromaDB      │         │  In-process      │            │
│  │  (Persistent)  │         │  SessionStore    │            │
│  └────────────────┘         └──────────────────┘            │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
           ▼                                   ▼
   ┌──────────────────┐                ┌──────────────────┐
   │   Supabase       │                │  Google Gemini   │
   │  • Auth (Google) │                │  • Embeddings    │
   │  • Storage       │                │  • Generation    │
   │  • Postgres      │                └──────────────────┘
   └──────────────────┘
```

## Architectural principles

1. **SPA-style frontend.** Everything in one Next.js app — no tab
   switches, no redirects. The "Let's Start" CTA flips a state that
   reveals the semester grid via Framer Motion.
2. **Stateless backend + persistent storage.** All state lives in
   ChromaDB (vectors) and Supabase (auth, file storage). The FastAPI
   process itself is stateless; in-process session buffer exists only
   for current-session chat history (per spec).
3. **Priority-ordered RAG.** When a question comes in we always search
   notes first, then PYQs, then internals, then fall back to Gemini's
   own knowledge — never the other way around.
4. **One-way data flow for the chat.** Frontend posts `{question, mode,
   marks, session_id}` → backend runs RAG → returns `{answer, sources,
   confidence}` → frontend renders markdown + source chips.
5. **Modular services.** Each service is single-purpose and replaces
   cleanly: swap ChromaDB for FAISS, swap Gemini for OpenAI, swap
   ReportLab for WeasyPrint — one file each.

## Request lifecycle (chat)

```
Browser
  │  POST /api/chat/ask
  ▼
FastAPI
  │  embed_query(question)
  │  rag_query(type=notes, n=4)
  │  rag_query(type=pyq,   n=3)
  │  rag_query(type=internal, n=2)
  │  build_prompt(...)
  │  llm.generate(system, user)
  │  session_store.append(...)
  ▼
Response
  { answer, sources[], confidence[], session_id, message_id }
```

## Tech stack at a glance

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SPA + Vercel-native |
| UI | Tailwind, shadcn-style primitives, Framer Motion | Fast, beautiful |
| 3D | @react-three/fiber + drei + GSAP | Cinematic landing |
| Backend | FastAPI | Async, typed, fast to ship |
| RAG | LangChain + ChromaDB | Standard, well-documented |
| LLM | Gemini 1.5 Flash | Cheap, fast, strong enough |
| PDF parse | PyPDF | Pure-Python, no native deps |
| PDF build | ReportLab | Reliable, programmatic |
| Auth | Supabase (Google + email) | Free tier, no infra |
| Deploy FE | Vercel | One-click from GitHub |
| Deploy BE | Render | Free plan, persistent disk for Chroma |
