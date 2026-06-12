# 11 — Frontend Component Structure

## Tree

```
<RootLayout>                                  app/layout.tsx
  ├── <Toaster/>                              sonner
  └── <HomePage>                              app/page.tsx
        ├── (state: started = false)
        │     ├── <Scene3D/>                  components/landing/Scene3D.tsx
        │     ├── <Hero/>                     components/landing/Hero.tsx
        │     │     └── <TypingEffect/>
        │     ├── <Stats/>
        │     ├── <Features/>
        │     ├── <HowItWorks/>
        │     ├── <CTA/>
        │     └── <Footer/>
        │
        └── (state: started = true)
              └── <SemesterSection/>          components/semester/SemesterSection.tsx
                    ├── (no semester)
                    │     └── 8 <SemesterCard/>   (inline)
                    │
                    └── (semester selected)
                          └── <ChatInterface/>  components/chat/ChatInterface.tsx
                                ├── <SubjectPanel/>
                                ├── <ModePicker/>
                                ├── <MarksPicker/>
                                ├── <UploadButton/>
                                ├── <GeneratePdfButton/>
                                └── <ChatWindow/>
                                      ├── <Message/> × N
                                      └── <Composer/>
```

## Component contracts

### `<Scene3D/>` (`components/landing/Scene3D.tsx`)
- R3F canvas, `ssr: false`.
- Mounts: ambient + 2 directional lights, Stars, Sparkles, a 3D
  `UVCE` wordmark (Text3D), a Circuit ring, 4 FloatingBooks, a
  MouseOrb with a Trail.
- Receives no props.
- Pointer-events: `none` (the canvas is decorative; canvas DOM
  captures the mouse, so we listen on `window` to keep the orb
  responsive without blocking clicks).

### `<Hero/>` (`components/landing/Hero.tsx`)
- Props: `onStart: () => void`
- GSAP intro: `hero-line` rows fade up, subline fades up, CTA pops
  in.
- Renders the **"Let's Start"** button (the central CTA per spec).
- Renders `<TypingEffect/>` underneath.

### `<TypingEffect/>` (`components/landing/TypingEffect.tsx`)
- Cycles through an array of strings, typing → pausing → deleting.
- Uses AnimatePresence for the cursor blink.

### `<Stats/>` (`components/landing/Stats.tsx`)
- 5 glass cards: 8, 100+, 10K+, PYQ, AI.
- `whileInView` reveal, 0.08s stagger.

### `<Features/>` (`components/landing/Features.tsx`)
- 8 feature cards in a 4-col grid, each with an icon, gradient
  glow, hover lift.

### `<HowItWorks/>` (`components/landing/HowItWorks.tsx`)
- 4 numbered steps with a vertical gradient line on the left.

### `<CTA/>` (`components/landing/CTA.tsx`)
- Big glass card with two glow orbs, copy, and another "Let's
  Start" button (anchor to the same handler).

### `<SemesterSection/>` (`components/semester/SemesterSection.tsx`)
- Props: `onBack: () => void`
- Two states, swapped with AnimatePresence:
  - **Grid**: 8 cards, tap → set selected
  - **Chat**: mounts `<ChatInterface/>`

### `<ChatInterface/>` (`components/chat/ChatInterface.tsx`)
- Props: `semester: 1|2|...|8`
- Manages: subjectId, mode, marks, messages, busy, generating
- Uses `getOrCreateSessionId()` (sessionStorage) for `session_id`.
- Sends `POST /api/chat/ask`, renders markdown via
  `react-markdown` + `remark-gfm`.
- Shows confidence bars + collapsible Sources.
- Generates PDF via `POST /api/pdf/generate`.

## State management

- Local component state with `useState` for UI flags.
- `sessionStorage` for `session_id` (per spec — no permanent
  history).
- No global store. The semester/chat split is a single boolean in
  the root page.

## Styling

- Tailwind utility classes + a small set of design-token components
  (`.btn-primary`, `.btn-ghost`, `.glass`, `.gradient-text`).
- `lucide-react` for all icons.

## Animation

| Library | Used for |
|---|---|
| Framer Motion | Page transitions, AnimatePresence, whileInView reveals |
| GSAP + ScrollTrigger | Hero intro, scroll-pinned section (one-shot) |
| Three.js (R3F) | Landing 3D scene |
| CSS keyframes | Cursor blink, float, glow, shimmer |

## Accessibility

- All interactive elements are real `<button>` / `<a>`.
- Color contrast ≥ AA on all text (ink-200+ on ink-950).
- Keyboard: tab order is left-to-right, top-to-bottom.
- The 3D scene has `aria-hidden=true` and `pointer-events: none`.

## Performance

- `dynamic(() => import("Scene3D"), { ssr: false })` — keeps R3F out
  of SSR bundle.
- `experimental.optimizePackageImports: ["lucide-react",
  "framer-motion"]` — tree-shakes.
- Markdown is rendered message-by-message (no virtualization needed
  for typical 10-30 message sessions).
