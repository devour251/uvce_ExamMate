import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import TypingEffect from "./TypingEffect";

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-ink-200 backdrop-blur-md font-mono"
      >
        <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
        UVCE × Gemini × RAG
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-display text-balance text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight text-ink-50"
      >
        <span className="block">Your UVCE.</span>
        <span className="block">Your Exams.</span>
        <span className="block gradient-text italic font-bold">Your AI.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-8 max-w-2xl text-lg sm:text-xl text-ink-100/80 text-pretty"
      >
        Notes, PYQs, internal papers and syllabus directories — combined with
        Gemini-powered RAG to compile exam-ready answers in seconds.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-12 flex flex-col sm:flex-row items-center gap-4"
      >
        <button
          onClick={onStart}
          className="btn-primary group text-lg px-10 py-4 cursor-pointer"
        >
          Let&apos;s Start
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        <a href="#features" className="btn-ghost">
          See features
        </a>
      </motion.div>

      {/* Typing effect preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-16 w-full max-w-2xl"
      >
        <TypingEffect
          texts={[
            "Explain Deadlocks with a banker's algorithm example.",
            "My OS exam is tomorrow. Give me the most important topics.",
            "Predict 10-mark questions from last 5 years of PYQs.",
            "Generate a PDF study guide for Database Management Systems.",
          ]}
        />
      </motion.div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-ink-300/50 text-xs uppercase tracking-widest animate-bounce font-mono">
        scroll down ↓
      </div>
    </section>
  );
}
