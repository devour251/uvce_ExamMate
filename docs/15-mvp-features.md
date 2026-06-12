# 15 — MVP vs Nice-to-Have

## MVP — must work for the demo (Hour 18 checkpoint)

| # | Feature | Why MVP |
|---|---|---|
| 1 | Cinematic landing page with 3D scene | First impression is everything |
| 2 | "Let's Start" CTA → 8 semester cards | Core navigation |
| 3 | Subject selector + syllabus PDF link | Per spec |
| 4 | Chat interface (send/receive markdown) | The product |
| 5 | **All 5 modes**: Normal, Exam Tomorrow, PYQ, Internal, Viva | Spec-mandated |
| 6 | **All 5 marks budgets**: 2/5/10/15/20 | Spec-mandated |
| 7 | RAG over at least 1 demo subject (BCS401 OS) | Proves the pipeline |
| 8 | PDF study guide generation + download | Spec-mandated |
| 9 | Sources + confidence in chat response | Differentiator |
| 10 | Google + email auth | Spec-mandated |
| 11 | Soft gate (no auth → no upload/PDF) | Spec-mandated |
| 12 | Mobile responsive | Looks good in any browser |
| 13 | Deploy to Vercel + Render | Spec-mandated |
| 14 | Diagram-safety (no hallucination) | Spec-mandated |

## Nice-to-have — build only after MVP is green

- ❌ Streaming responses (SSE)
- ❌ Real-time voice input
- ❌ User dashboard (history of uploaded notes / PDFs)
- ❌ Public sharing of generated study guides
- ❌ Multi-language answers (Kannada)
- ❌ Personalized revision schedule
- ❌ Browser extension
- ❌ Telegram/WhatsApp bot mirror
- ❌ Fine-grained RBAC for "UVCE-only"
- ❌ Per-student analytics dashboard
- ❌ Admin panel for adding subjects/PYQs
- ❌ Dark/light theme toggle
- ❌ PWA install
- ❌ i18n
- ❌ Image OCR for handwritten notes

## Deferred to v2 (post-hackathon)

- Multi-college support
- Permanent chat history
- Long-term study progress tracking
- Quiz/test generator (auto-grade)
- Peer study groups
