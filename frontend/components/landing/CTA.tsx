"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative py-32 px-6">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-16 text-center"
        >
          {/* decorative orbs */}
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-crimson/30 blur-3xl" />

          <h2 className="relative font-display text-4xl md:text-6xl font-bold leading-tight">
            Your <span className="gradient-text italic">next exam</span><br />
            deserves a sharper brain.
          </h2>
          <p className="relative mt-5 text-ink-200/80 max-w-xl mx-auto">
            Built by UVCE students, for UVCE students. Sign in, pick a semester, and start preparing in 30 seconds.
          </p>

          <button
            onClick={onStart}
            className="relative mt-10 btn-primary text-lg px-12 py-5 animate-glow"
          >
            Let&apos;s Start
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
