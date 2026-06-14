"use client";

import { motion } from "framer-motion";

const STATS = [
  { value: "8", label: "Semesters" },
  { value: "100+", label: "Subjects" },
  { value: "10K+", label: "Notes indexed" },
  { value: "PYQ", label: "Intelligence" },
  { value: "AI", label: "Exam Preparation" },
];

export default function Stats() {
  return (
    <section className="relative py-24 px-6">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-6 text-center card-hover"
            >
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
                {s.value}
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-ink-300/80">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
