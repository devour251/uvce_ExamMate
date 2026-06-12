"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileDown, ExternalLink, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SEMESTER_LABELS, SUBJECTS } from "@/lib/subjects";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function SyllabusPage() {
  const params = useParams();
  const router = useRouter();
  const semester = Number(params?.semester);
  const [pdfError, setPdfError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(semester) || semester < 1 || semester > 8) {
      router.replace("/");
      return;
    }
    setPdfUrl(`${API_BASE}/api/syllabus/${semester}/pdf`);
    // small delay so the iframe can try to load
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [semester, router]);

  const subjects = SUBJECTS[semester as 1] ?? [];
  const label = SEMESTER_LABELS[semester as 1] ?? `Semester ${semester}`;

  return (
    <main className="relative min-h-screen px-6 py-10">
      <div className="container max-w-5xl">
        <Link href="/" className="btn-ghost text-sm mb-8 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">
            {label}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text italic">Syllabus</span>
          </h1>
          <p className="text-ink-200/70 mb-8 max-w-2xl">
            The full UVCE syllabus for this semester, plus a quick reference
            list of subjects. Click any subject to open the AI chat.
          </p>

          {/* PDF embed card */}
          <div className="glass rounded-2xl overflow-hidden mb-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-accent" />
                <span>Syllabus PDF · Semester {semester}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
                <a href={pdfUrl} download className="btn-primary text-xs">
                  <FileDown className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </div>

            <div className="relative bg-ink-900/50" style={{ height: "70vh" }}>
              {pdfError ? (
                <SyllabusFallback semester={semester} />
              ) : (
                <iframe
                  key={pdfUrl}
                  src={pdfUrl}
                  className="w-full h-full"
                  title={`Syllabus Semester ${semester}`}
                  onError={() => setPdfError(true)}
                  onLoad={(e) => {
                    // If backend returns 404 HTML instead of PDF, this fires onError
                    const iframe = e.target as HTMLIFrameElement;
                    try {
                      // iframes from another origin usually block this; we fallback below
                    } catch {
                      setPdfError(true);
                    }
                  }}
                />
              )}
              {loading && !pdfError && (
                <div className="absolute inset-0 flex items-center justify-center text-ink-300/60 text-sm">
                  Loading syllabus…
                </div>
              )}
            </div>
          </div>

          {/* Subjects list */}
          <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">
            Subjects
          </div>
          <h2 className="font-display text-2xl font-bold mb-5">
            What's in this semester
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {subjects.map((s) => (
              <Link
                key={s.code}
                href={`/?start=${semester}`}
                className="glass rounded-xl p-4 card-hover flex items-center justify-between group"
              >
                <div>
                  <div className="font-mono text-xs text-accent/80">{s.code}</div>
                  <div className="font-medium">{s.name}</div>
                </div>
                <ArrowLeft className="h-4 w-4 rotate-180 text-ink-300 group-hover:text-accent transition" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function SyllabusFallback({ semester }: { semester: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
      <AlertCircle className="h-8 w-8 text-accent" />
      <div className="font-display text-xl">No syllabus PDF uploaded yet</div>
      <p className="text-sm text-ink-200/70 max-w-md">
        The admin hasn't uploaded a syllabus PDF for Semester {semester} yet.
        You can still browse the subjects below and start chatting with the AI.
      </p>
      <Link href="/" className="btn-primary mt-3 text-sm">
        Back to semester picker
      </Link>
    </div>
  );
}
