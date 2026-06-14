import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function CTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative py-32 px-6">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-16 text-center"
        >
          {/* decorative orbs */}
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-accent/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-crimson/30 blur-3xl pointer-events-none" />

          <h2 className="relative font-display text-4xl md:text-6xl font-bold leading-tight text-ink-50">
            Your <span className="gradient-text italic font-bold">next exam</span><br />
            deserves a sharper brain.
          </h2>
          <p className="relative mt-5 text-ink-200/80 max-w-xl mx-auto text-sm leading-relaxed">
            Built for UVCE semesters. Hit start, choose a semester, explore revision guides, and raise your performance instantly.
          </p>

          <button
            onClick={onStart}
            className="relative mt-10 btn-primary text-lg px-12 py-5 animate-glow cursor-pointer"
          >
            Let&apos;s Start
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
