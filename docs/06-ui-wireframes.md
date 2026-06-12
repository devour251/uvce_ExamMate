# 06 — UI Wireframes

ASCII wireframes. Real visuals are in the React code.

---

## 1. Landing Page

```
┌──────────────────────────────────────────────────────────────────┐
│  [★  UVCE × Gemini × RAG]                          [ Login ]    │ ← sticky pill
│                                                                  │
│  ╔═══════════════════════════════╗   ←  3D background scene:     │
│  ║                               ║       stars, floating books,  │
│  ║   Your UVCE.                  ║       gold & crimson glow,     │
│  ║   Your Exams.                 ║       mouse-tracked orb,       │
│  ║   Your AI.                    ║       giant UVCE wordmark      │
│  ║                               ║                                │
│  ║   [ Let's Start → ]           ║                                │
│  ║   [ See features ]            ║                                │
│  ║                               ║                                │
│  ║   ┌─────────────────────────┐ ║                                │
│  ║   │ > Explain Deadlocks…    │ ║   ← typing-effect preview      │
│  ║   └─────────────────────────┘ ║                                │
│  ╚═══════════════════════════════╝                                │
│                       scroll ↓                                    │
├──────────────────────────────────────────────────────────────────┤
│   [8 Sem]   [100+ Sub]  [10K+ Notes]  [PYQ]   [AI]                │ ← stats
├──────────────────────────────────────────────────────────────────┤
│  Built for UVCE                                                   │
│  Everything you need to crack the paper.                          │
│                                                                   │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                                              │ ← feature grid
│  │🧠│ │⏰│ │📊│ │📄│                                              │
│  └──┘ └──┘ └──┘ └──┘                                              │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                                              │
│  │🎤│ │📚│ │✨│ │📥│                                              │
│  └──┘ └──┘ └──┘ └──┘                                              │
├──────────────────────────────────────────────────────────────────┤
│  How it works                                                     │
│  01 ▸ 02 ▸ 03 ▸ 04      (vertical timeline with glowing nodes)     │
├──────────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════╗                                │
│  ║   Your next exam deserves a   ║                                │
│  ║   sharper brain.              ║                                │
│  ║                               ║                                │
│  ║      [ Let's Start ]          ║                                │
│  ╚═══════════════════════════════╝                                │
├──────────────────────────────────────────────────────────────────┤
│   UVCE ExamMate AI · v0.1 · made with ♥ at UVCE                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Semester Grid (after "Let's Start")

```
┌──────────────────────────────────────────────────────────────────┐
│   [ ← Back to home ]                                              │
│                                                                   │
│   Step 1                                                          │
│   Choose your SEMESTER                                             │
│   Tap a semester to load the syllabus PDF and open the AI chat.  │
│                                                                   │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                  │
│   │ SEM 01 │  │ SEM 02 │  │ SEM 03 │  │ SEM 04 │                  │
│   │ 1st yr │  │ 1st yr │  │ Core CS│  │ Core CS│                  │
│   │  Open →│  │  Open →│  │  Open →│  │  Open →│                  │
│   └────────┘  └────────┘  └────────┘  └────────┘                  │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                  │
│   │ SEM 05 │  │ SEM 06 │  │ SEM 07 │  │ SEM 08 │                  │
│   └────────┘  └────────┘  └────────┘  └────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Subject + Chat

```
┌──────────────────────────────────────────────────────────────────┐
│ [ ← Change semester ]                  Sem 4 · AI tutor active ● │
├──────────────────────┬───────────────────────────────────────────┤
│ Sem 4 · CS           │  ● ● ●  exammate.ai  sess_abc…           │
│                      ├───────────────────────────────────────────┤
│ Subject  [BCS401▾]  │                                           │
│ [Open Syllabus PDF]  │   ✨ Ask anything about Operating Sys…    │
│                      │                                           │
│ MODE                 │                                           │
│ [Normal][Exam Tomor] │  ┌────────────────────┐                  │
│ [PYQ  ][Internal][Vi]│  │ Explain deadlock    │  user            │
│                      │  │ detection in 10 mks │  gradient gold   │
│ Answer Type          │  └────────────────────┘                  │
│ (2)(5)(10)(15)(20)  │  ┌────────────────────┐                  │
│                      │  │  **Deadlock detec- │                  │
│ [Upload notes / PYQ] │  │  tion** is the…    │  bot             │
│ [ Generate PDF    ]  │  │  • step 1 …        │                  │
│ Subject_Preparation… │  │  • step 2 …        │                  │
│                      │  │  Predicted:        │                  │
│                      │  │  Deadlocks  ▓▓▓ 92%│                  │
│                      │  │  Paging     ▓▓▓ 85%│                  │
│                      │  │  ⌄ Sources (3)    │                  │
│                      │  └────────────────────┘                  │
│                      ├───────────────────────────────────────────┤
│                      │ ┌────────────────────────────┐ ┌────┐    │
│                      │ │ Ask about OS…  (Shift+Enter│ │ ➤  │    │
│                      │ └────────────────────────────┘ └────┘    │
│                      │ mode: normal · marks: 10marks · RAG active│
└──────────────────────┴───────────────────────────────────────────┘
```

---

## 4. Login

```
              ┌──────────────────────────┐
              │    UVCE ExamMate         │
              │    Sign in to continue   │
              │                          │
              │  [ G  Continue w/ Google] │
              │  ─── OR ───              │
              │  📧  you@uvce.ac.in      │
              │  🔒  ••••••••            │
              │  [   Sign in        →  ] │
              │  No account? Sign up     │
              └──────────────────────────┘
```
