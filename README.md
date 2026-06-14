# 🎓 UVCE ExamMate AI

> **AI-Powered Exam Preparation Platform for UVCE Students**

UVCE ExamMate AI is a college-specific, AI-powered exam preparation platform built for University Visvesvaraya College of Engineering (UVCE) students. It combines **UVCE notes**, **previous year question papers (PYQs)**, **internal question papers**, **subject syllabus**, and **Gemini-powered RAG** to give students exam-ready answers in seconds.

> 🚀 **Hackathon MVP** — Designed and built in 30 hours by a 4-person team.

---

## ✨ Features

| Feature                        | Description                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| 🧠 **AI Question Answering**   | Get exam-oriented answers powered by Gemini + RAG over UVCE notes |
| ⏰ **Exam Tomorrow Mode**       | One-click important topics, definitions, and last-minute revision |
| 📊 **PYQ Intelligence**        | Predicts important questions using PYQs + syllabus + AI reasoning |
| 📄 **Internal Paper Analysis** | Detects repeated concepts and exam trends from internal papers    |
| 📚 **PDF Study Guide**         | Auto-generates a downloadable `Subject_Preparation_Guide.pdf`     |
| 🎤 **Viva Mode**               | Quick Q&A pairs for viva preparation                              |
| 🧾 **Smart Revision Notes**    | Structured revision notes from the entire chat session            |

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

```text
uvce-exammate-ai/
├── frontend/         # Next.js app
├── backend/          # FastAPI app
├── docs/             # Architecture, plan, diagrams
└── README.md
```

See `docs/` for the full system design.

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

* 01 — System Architecture
* 02 — Database Schema (Supabase)
* 03 — ChromaDB Structure
* 04 — Folder Structure
* 05 — API Design
* 06 — UI Wireframes
* 07 — User Flow Diagrams
* 08 — Authentication Flow
* 09 — RAG Architecture
* 10 — Gemini Prompt Engineering
* 11 — Frontend Components
* 12 — Backend Services
* 13 — Development Plan
* 14 — 30-Hour Timeline & Team Roles
* 15 — MVP vs Nice-to-Have
* 16 — UI Design Recommendations
* 17 — Challenges & Solutions

---

## 📝 License

MIT — built for the UVCE student community.
