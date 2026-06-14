"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, MessageSquare } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import CommunityUpload from "@/components/community/CommunityUpload";
import type { Semester } from "@/lib/api";

const SEMESTERS: { id: Semester; label: string; tagline: string }[] = [
  { id: 1, label: "Semester 1", tagline: "Foundation · First Year" },
  { id: 2, label: "Semester 2", tagline: "Foundation · First Year" },
  { id: 3, label: "Semester 3", tagline: "Core CS · Data & Logic" },
  { id: 4, label: "Semester 4", tagline: "Core CS · Systems" },
  { id: 5, label: "Semester 5", tagline: "Advanced CS · Networks & ML" },
  { id: 6, label: "Semester 6", tagline: "Advanced CS · Cloud & Web" },
  { id: 7, label: "Semester 7", tagline: "AI · Project Phase I" },
  { id: 8, label: "Semester 8", tagline: "Final · Project Phase II" },
];

export default function SemesterSection({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Semester | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen px-6 py-12"
    >
      <div className="container max-w-7xl">
        <button
          onClick={onBack}
          className="btn-ghost mb-8 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-12">
                <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">
                  Step 1
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-bold">
                  Choose your <span className="gradient-text italic">semester</span>
                </h1>
                <p className="mt-4 text-ink-200/70 max-w-xl mx-auto">
                  Tap a semester to load the syllabus PDF and open the AI chat.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SEMESTERS.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="group relative glass rounded-2xl p-6 text-left card-hover overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/0 group-hover:from-accent/10 group-hover:to-crimson/10 transition-all duration-500" />
                    <div className="relative">
                      <div className="font-mono text-xs text-accent/70 mb-2">
                        SEM {String(s.id).padStart(2, "0")}
                      </div>
                      <div className="font-display text-2xl font-semibold">
                        {s.label}
                      </div>
                      <div className="mt-2 text-xs text-ink-300/70">
                        {s.tagline}
                      </div>
                      <div className="mt-6 flex items-center gap-2 text-xs text-ink-300 group-hover:text-accent transition">
                        <BookOpen className="h-3.5 w-3.5" />
                        Open
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Community Upload — global, below all semester cards */}
              <CommunityUpload />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelected(null)}
                  className="btn-ghost text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change semester
                </button>
                <div className="inline-flex items-center gap-2 text-sm text-ink-200/80">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span>
                    Semester {selected} · AI tutor active
                  </span>
                </div>
              </div>
              <ChatInterface semester={selected} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
