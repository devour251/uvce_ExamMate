import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, ExternalLink, FileDown, AlertCircle, Loader2 } from "lucide-react";
import { SUBJECTS, SEMESTER_LABELS } from "../lib/subjects";

interface SyllabusModalProps {
  semester: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function SyllabusModal({ semester, isOpen, onClose }: SyllabusModalProps) {
  const [pdfError, setPdfError] = useState(false);
  const [loading, setLoading] = useState(true);

  const pdfUrl = `/api/syllabus/${semester}/pdf`;
  const label = SEMESTER_LABELS[semester as 1] ?? `Semester ${semester}`;
  const subjects = SUBJECTS[semester as 1] ?? [];

  useEffect(() => {
    if (isOpen) {
      setPdfError(false);
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 900);
      return () => clearTimeout(t);
    }
  }, [isOpen, semester]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* modal body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-5xl h-[85vh] rounded-3xl glass-strong border border-white/10 overflow-hidden flex flex-col z-10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-ink-900/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block">{label}</span>
                  <span className="font-display text-lg font-bold text-ink-50">Syllabus & Course Outline</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in New Tab
                </a>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-ink-300 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Split layout inside Modal */}
            <div className="flex-1 min-h-0 grid md:grid-cols-[280px_1fr] overflow-hidden">
              {/* Left Column: subjects reference list */}
              <div className="hidden md:block p-6 border-r border-white/5 overflow-y-auto bg-ink-900/20">
                <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold block mb-3">Course Modules</span>
                <div className="space-y-3">
                  {subjects.map((sub) => (
                    <div key={sub.code} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="font-mono text-[10px] text-accent block">{sub.code}</span>
                      <span className="text-xs font-semibold text-ink-100 line-clamp-2">{sub.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-3.5 rounded-xl bg-accent/5 border border-accent/15 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-[11px] text-ink-200/80 leading-relaxed font-mono">
                    All modules cataloged here are loaded into RAG to guarantee fully aligned preparation.
                  </p>
                </div>
              </div>

              {/* Right Column: PDF embedding / Fallback */}
              <div className="relative bg-black/40 flex flex-col justify-center items-center h-full">
                {pdfError ? (
                  <div className="p-6 text-center max-w-md flex flex-col items-center gap-3">
                    <AlertCircle className="h-10 w-10 text-accent" />
                    <h3 className="font-display text-lg font-bold text-ink-100">Syllabus PDF is being prepared</h3>
                    <p className="text-xs text-ink-300 leading-relaxed">
                      We are compiling the curriculum maps. In the meantime, you can ask the AI about any of the modules listed on the left!
                    </p>
                  </div>
                ) : (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title={`Syllabus PDF for Semester ${semester}`}
                    onError={() => setPdfError(true)}
                    onLoad={(e) => {
                      const iframe = e.target as HTMLIFrameElement;
                      try {
                        // Cross-origin checks
                      } catch {
                        // Keep loading silent fallback
                      }
                    }}
                  />
                )}

                {loading && !pdfError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/95 gap-3">
                    <Loader2 className="h-6 w-6 text-accent animate-spin" />
                    <span className="text-xs text-accent font-mono tracking-widest uppercase">Fetching curriculum PDF…</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
