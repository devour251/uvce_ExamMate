"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Sparkles } from "lucide-react";
import TypingEffect from "./TypingEffect";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-line", {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
      });
      gsap.from(".hero-sub", {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: "power3.out",
      });
      gsap.from(".hero-cta", {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        delay: 1,
        ease: "back.out(1.7)",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="hero-cta mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-ink-200 backdrop-blur-md"
      >
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        UVCE × Gemini × RAG
      </motion.div>

      <h1 className="font-display text-balance text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
        <span className="hero-line block">Your UVCE.</span>
        <span className="hero-line block">Your Exams.</span>
        <span className="hero-line block gradient-text italic">Your AI.</span>
      </h1>

      <p className="hero-sub mt-8 max-w-2xl text-lg sm:text-xl text-ink-200/80 text-pretty">
        Notes, PYQs, internal papers and the syllabus — combined with
        Gemini-powered RAG to give you exam-ready answers in seconds.
      </p>

      <div className="hero-cta mt-12 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onStart}
          className="btn-primary group text-lg px-10 py-4"
        >
          Let&apos;s Start
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        <a href="#features" className="btn-ghost">
          See features
        </a>
      </div>

      {/* Typing effect preview */}
      <div className="hero-cta mt-16 w-full max-w-2xl">
        <TypingEffect
          texts={[
            "Explain Deadlocks with a banker's algorithm example.",
            "My OS exam is tomorrow. Give me the most important topics.",
            "Predict 10-mark questions from last 5 years of PYQs.",
            "Generate a PDF study guide for Database Management Systems.",
          ]}
        />
      </div>

      {/* Scroll hint */}
      <div className="hero-cta absolute bottom-10 left-1/2 -translate-x-1/2 text-ink-300/60 text-xs uppercase tracking-widest animate-fade-in">
        scroll ↓
      </div>
    </section>
  );
}
