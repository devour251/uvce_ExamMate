"use client";

import { motion } from "framer-motion";
import {
  Brain,
  AlarmClock,
  BarChart3,
  FileSearch,
  FileDown,
  Mic,
  NotebookPen,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Question Answering",
    body: "Get exam-oriented, syllabus-aligned answers powered by Gemini + RAG over UVCE notes.",
    accent: "from-accent to-accent-glow",
  },
  {
    icon: AlarmClock,
    title: "Exam Tomorrow Mode",
    body: "One tap → important topics, definitions, key concepts, and likely long answers.",
    accent: "from-crimson to-red-700",
  },
  {
    icon: BarChart3,
    title: "PYQ Intelligence",
    body: "AI reasons over PYQs + syllabus + internals to predict important questions with confidence scores.",
    accent: "from-amber-400 to-yellow-600",
  },
  {
    icon: FileSearch,
    title: "Internal Paper Analysis",
    body: "Detects repeated concepts, exam trends, and likely important topics from uploaded internals.",
    accent: "from-emerald-400 to-green-700",
  },
  {
    icon: FileDown,
    title: "PDF Study Guide",
    body: "One click → Subject_Preparation_Guide.pdf with all Q&A, revision notes and important questions.",
    accent: "from-sky-400 to-blue-700",
  },
  {
    icon: Mic,
    title: "Viva Preparation",
    body: "Quick-fire Q&A pairs tailored to your subject. Speak less. Impress more.",
    accent: "from-fuchsia-400 to-purple-700",
  },
  {
    icon: NotebookPen,
    title: "Smart Revision Notes",
    body: "Auto-built revision notes from the entire session — structured, concise, printable.",
    accent: "from-pink-400 to-rose-700",
  },
  {
    icon: Sparkles,
    title: "Diagram-aware",
    body: "Pulls diagrams from your notes; if missing, surfaces textbook references — never hallucinates.",
    accent: "from-orange-400 to-red-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-4">
            Built for UVCE
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Everything you need to <span className="gradient-text italic">crack</span> the paper.
          </h2>
          <p className="mt-5 text-ink-200/70">
            Every feature is designed around UVCE&apos;s exam pattern, syllabus, and grading scheme.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              whileHover={{ y: -6 }}
              className="group relative glass rounded-2xl p-6 card-hover overflow-hidden"
            >
              <div
                className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-20 blur-2xl group-hover:opacity-40 transition`}
              />
              <div
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-ink-950 shadow-lg`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-200/70 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
