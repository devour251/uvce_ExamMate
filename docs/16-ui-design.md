# 16 — UI Design Recommendations

> A dark, cinematic, gold-accented system. Built to make UVCE
> students feel like they're using a "real" tool, not a college
> project.

## Design tokens

```
ink-950  #050507   page background
ink-900  #0a0a0b   cards
ink-700  #2c2c2e   secondary
ink-200  #e5e5ea   body text on dark
ink-100  #c7c7cc   muted
accent   #f5b800   UVCE gold (primary CTA)
crimson  #dc2626   secondary accent
```

## Typography

- **Display**: Playfair Display (serif, italic for emphasis)
- **Body**: Inter (300–700)
- **Mono**: JetBrains Mono (code, session IDs, marks budget tags)

Why a serif display? UVCE is a 100-year-old institution — a serif
gives the landing page gravitas. Inter keeps the body neutral so
the AI answers feel like a tutor, not a marketing page.

## Layout principles

1. **Asymmetric grid** — 12-col on desktop, 4-col on mobile. Cards
   are never all the same size; small cards paired with one big
   card give rhythm.
2. **Lots of negative space** — every section breathes. Padding
   inside cards ≥ 1.5rem.
3. **One accent per view** — gold on landing, gold in chat header,
   gold button. Crimson is reserved for destructive actions or
   important warnings.
4. **Glass morphism** — every panel uses
   `bg-white/[0.03] backdrop-blur-xl` so the 3D scene bleeds
   through subtly.

## Motion principles

- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth, fast-end).
- **Duration**: 0.3s for hovers, 0.6s for reveals, never > 1s
  except on the hero intro.
- **Stagger**: 60–80ms between siblings.
- **No bounce** — except the primary CTA's `animate-glow` (pulse).

## Iconography

- `lucide-react` (consistent, 1.5px stroke, 24px default).
- Icons in feature cards sit inside a 10×10 gradient square.

## Empty / loading / error states

- **Empty chat**: "✨ Ask anything about Operating Systems." with a
  faint sparkles icon.
- **Loading**: 1.5px spinner + "RAG → Gemini is drafting an
  answer…".
- **Error**: Sonner toast (top-right) + inline message bubble that
  says "⚠️ The backend isn't reachable…".
- **No results**: friendly message + "Try rephrasing or upload
  more notes".

## Accessibility

- Color contrast ≥ 4.5:1 on all text.
- `prefers-reduced-motion` should disable the 3D scene and most
  animations (TODO: add media query in `globals.css`).
- Keyboard: tab order = visual order; `Enter` sends, `Shift+Enter`
  inserts newline.
- All controls have visible focus rings (2px accent).

## Mobile

- Landing 3D scene renders at lower DPR (`dpr={[1, 1.5]}`).
- 8 semester cards become a 2-col grid.
- Chat layout stacks: controls above the chat window.
- Touch targets ≥ 44×44 px.

## What to copy from the Death Note reference

The reference uses a dark cinematic 3D scene with floating books
and a glowing wordmark. We've adopted:

- Dark ink palette
- Floating 3D books
- Glowing gold + crimson accents
- GSAP intro on the hero
- Stars + sparkles for depth
- Mouse-tracked orb
- Cinematic full-screen hero

What we've **changed** for our brand:

- Removed the "Death Note" theme (we are exam prep, not horror).
- Added gold (UVCE) instead of black/red only.
- Replaced the book with our own UVCE-themed books.
- Added a giant 3D "UVCE" wordmark as the brand center.
- Added a typing-effect preview (more relevant to a chatbot).
