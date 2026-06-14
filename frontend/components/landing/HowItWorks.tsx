"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Pick your semester & subject",
    body: "Eight semesters, every UVCE subject — your syllabus PDF is one click away.",
  },
  {
    n: "02",
    title: "Ask in your own way",
    body: "Normal, Exam Tomorrow, PYQ Intelligence, Internal Analysis or Viva — pick a mode and a marks budget.",
  },
  {
    n: "03",
    title: "Get exam-ready answers",
    body: "RAG pulls from UVCE notes → Gemini polishes the answer → structured, headlined, bullet-perfect.",
  },
  {
    n: "04",
    title: "Export a study guide",
    body: "Hit Generate PDF. Get Subject_Preparation_Guide.pdf with everything you discussed this session.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-28 px-6">
      <div className="container max-w-5xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-4">
            How it works
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            From <span className="italic gradient-text">confused</span> to <span className="italic gradient-text">confident</span>.
          </h2>
        </div>

        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent/0 via-accent/40 to-accent/0 hidden md:block" />

          <div className="space-y-10">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative md:pl-20"
              >
                <div className="hidden md:flex absolute left-0 top-1 h-12 w-12 items-center justify-center rounded-full bg-ink-900 border border-accent/40 text-accent font-mono shadow-[0_0_30px_-5px_rgba(245,184,0,0.5)]">
                  {s.n}
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-2xl font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-ink-200/70 leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
