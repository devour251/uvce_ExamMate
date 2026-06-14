# 🎓 UVCE ExamMate AI

> **AI-Powered Exam Preparation Platform for UVCE Students**

UVCE ExamMate AI is a college-specific, AI-powered exam preparation platform built for University Visvesvaraya College of Engineering (UVCE) students. It combines **UVCE notes**, **previous year question papers (PYQs)**, **internal question papers**, **subject syllabus**, and **Gemini-powered RAG** to give students exam-ready answers in seconds.

> 🚀 **Hackathon MVP** — Designed and built in 30 hours by a 4-person team.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Question Answering** | Get exam-oriented answers powered by Gemini + RAG over UVCE notes |
| ⏰ **Exam Tomorrow Mode** | One-click important topics, definitions, and last-minute revision |
| 📊 **PYQ Intelligence** | Predicts important questions using PYQs + syllabus + AI reasoning |
| 📄 **Internal Paper Analysis** | Detects repeated concepts and exam trends from internal papers |
| 📚 **PDF Study Guide** | Auto-generates a downloadable `Subject_Preparation_Guide.pdf` |
| 🎤 **Viva Mode** | Quick Q&A pairs for viva preparation |
| 🧾 **Smart Revision Notes** | Structured revision notes from the entire chat session |

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, Framer Motion, GSAP, Three.js (R3F)
**Backend:** FastAPI, Python 3.11
**Database:** Supabase (Postgres + Auth + Storage)
**AI:** Google Gemini 1.5 Pro / Flash
**RAG:** LangChain + ChromaDB
**PDF:** PyPDF (parsing) + ReportLab (generation)
**Deployment:** Vercel (frontend) + Render (backend)

---

## 🏗️ Project Structure

```
uvce-exammate-ai/
├── frontend/         # Next.js app
├── backend/          # FastAPI app
├── docs/             # Architecture, plan, diagrams
└── README.md
```

See [`docs/`](./docs) for the full system design.

---

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Environment Variables
Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in keys.

---

## 📚 Documentation

- [01 — System Architecture](./docs/01-system-architecture.md)
- [02 — Database Schema (Supabase)](./docs/02-database-schema.md)
- [03 — ChromaDB Structure](./docs/03-chromadb-structure.md)
- [04 — Folder Structure](./docs/04-folder-structure.md)
- [05 — API Design](./docs/05-api-design.md)
- [06 — UI Wireframes](./docs/06-ui-wireframes.md)
- [07 — User Flow Diagrams](./docs/07-user-flow.md)
- [08 — Authentication Flow](./docs/08-authentication-flow.md)
- [09 — RAG Architecture](./docs/09-rag-architecture.md)
- [10 — Gemini Prompt Engineering](./docs/10-prompt-engineering.md)
- [11 — Frontend Components](./docs/11-frontend-components.md)
- [12 — Backend Services](./docs/12-backend-services.md)
- [13 — Development Plan](./docs/13-development-plan.md)
- [14 — 30-Hour Timeline & Team Roles](./docs/14-30h-timeline.md)
- [15 — MVP vs Nice-to-Have](./docs/15-mvp-features.md)
- [16 — UI Design Recommendations](./docs/16-ui-design.md)
- [17 — Challenges & Solutions](./docs/17-challenges.md)

---

## 👥 Team

| Role | Member | Responsibility |
|---|---|---|
| Frontend Lead | TBD | Landing page, chat UI, animations |
| Backend Lead | TBD | FastAPI, RAG, Gemini integration |
| AI/RAG Lead | TBD | ChromaDB, LangChain, prompt design |
| Design + Auth | TBD | UI polish, Supabase auth, deployment |

---

## 📝 License

MIT — built for the UVCE student community.
