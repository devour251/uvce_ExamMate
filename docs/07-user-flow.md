# 07 — User Flow Diagrams

## Primary flow: ask a question and get an answer

```
   ┌──────┐
   │ Open │ / (landing)
   └──┬───┘
      │ clicks "Let's Start"
      ▼
   ┌──────────┐
   │  Pick    │ (one of 8 semesters)
   │ semester │
   └────┬─────┘
        │ selects Semester 4
        ▼
   ┌──────────────┐
   │  Chat page   │ (subject picker defaults to BCS401)
   │  + syllabus  │
   │  + mode/marks│
   └────┬─────────┘
        │ types "Explain deadlocks" + 10marks
        │ presses ➤
        ▼
   ┌─────────────────────┐
   │  POST /api/chat/ask │  ── RAG (notes+pyq+internal)
   └────┬────────────────┘  ── Gemini 1.5
        │
        ▼
   ┌─────────────┐
   │ Render AI   │ markdown + sources + confidence bars
   │  response   │
   └────┬────────┘
        │ continues chatting…
        │
        │ clicks "Generate PDF"
        ▼
   ┌────────────────────────┐
   │ POST /api/pdf/generate │  → Subject_Preparation_Guide.pdf
   └────────────────────────┘
```

## Mode switch flow

```
Current: Normal / 10 marks
   │ user clicks [PYQ Intelligence]
   ▼
Mode = pyq_intelligence
   │ next question
   ▼
Prompt template swaps to PYQ block:
   "Return a Markdown table: | Topic | Frequency | Confidence |"
```

## Authentication flow

```
Landing (no auth required)
   │
   │ tries to click Upload / Generate PDF
   ▼
Soft gate → modal "Sign in to save your PDFs & notes"
   │  → /login
   ▼
Sign in with Google OR email+password
   │  Supabase returns JWT
   ▼
JWT stored in supabase-js httpOnly cookie
   │  → /  (already authenticated)
   ▼
All future API calls attach `Authorization: Bearer <jwt>`
```

## PDF generation flow

```
session_id: sess_xyz
   │
   │ user clicks "Generate PDF"
   ▼
POST /api/pdf/generate { session_id, subject_id }
   │
   │ 1. session_store.get(sess_xyz) → list of messages
   │ 2. build_study_guide(subject, messages) → bytes
   │ 3. save to data/pdfs/generated/Subject_Preparation_Guide_BCS401.pdf
   ▼
JSON { pdf_url: "/api/pdf/download/...", filename, size_bytes }
   │
   │ frontend opens pdf_url in new tab OR triggers download
   ▼
User downloads Subject_Preparation_Guide_BCS401.pdf
```

## "Exam Tomorrow" flow

```
User selects: Mode = Exam Tomorrow
   │
   │ types "My OS exam is tomorrow"
   ▼
Backend builds prompt with MODE = EXAM_TOMORROW block
   │ → important topics
   │ → definitions
   │ → key concepts
   │ → 5 long-answer outlines
   │ → 5 short-answer questions
   │ → revision tips
   ▼
Response rendered as structured Markdown
   │
   │ user clicks "Generate PDF" → cheat-sheet PDF
```
