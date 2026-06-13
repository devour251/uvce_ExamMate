"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  FileDown,
  FileText,
  Loader2,
  Sparkles,
  BookOpen,
  Upload,
  User,
  Bot,
  AlertCircle,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { api, type AnswerType, type ChatMessage, type Mode, type NoteFile, type Semester } from "@/lib/api";
import { getOrCreateSessionId, resetSession } from "@/lib/session";
import { SEMESTER_LABELS, SEMESTER_SUBJECTS, SUBJECTS } from "@/lib/subjects";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const MARKS: { value: AnswerType; label: string }[] = [
  { value: "2marks", label: "2 Marks" },
  { value: "5marks", label: "5 Marks" },
  { value: "10marks", label: "10 Marks" },
  { value: "15marks", label: "15 Marks" },
  { value: "20marks", label: "20 Marks" },
];

const MODES: { value: Mode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "exam_tomorrow", label: "Exam Tomorrow" },
  { value: "pyq_intelligence", label: "PYQ Intelligence" },
  { value: "internal_analysis", label: "Internal Analysis" },
  { value: "viva", label: "Viva" },
];

export default function ChatInterface({ semester }: { semester: Semester }) {
  const subjects = SUBJECTS[semester] ?? [];
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.code ?? "");
  const [mode, setMode] = useState<Mode>("normal");
  const [marks, setMarks] = useState<AnswerType>("10marks");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentSubject = subjects.find((s) => s.code === subjectId);
  const subjectName = currentSubject ? currentSubject.name : (subjectId || "your subject");

  // Reset subject when semester changes
  useEffect(() => {
    const newSubjects = SUBJECTS[semester] ?? [];
    setSubjectId(newSubjects[0]?.code ?? "");
    setMessages([]);
    resetSession();
    setSessionId(getOrCreateSessionId());
  }, [semester]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const effectiveSubject = subjectId.trim() || "general";

  async function refreshNotes(nextSubject = effectiveSubject) {
    if (!nextSubject.trim()) {
      setNotes([]);
      return;
    }

    setNotesLoading(true);
    try {
      const res = await api.listNotes(semester, nextSubject);
      setNotes(res.files);
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }

  useEffect(() => {
    refreshNotes();
  }, [semester, subjectId]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      mode,
      marks,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await api.ask({
        semester,
        subject_id: effectiveSubject,
        question: text,
        mode,
        marks,
        session_id: sessionId,
      });
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        confidence: res.confidence,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚠️ The backend isn't reachable yet. In the MVP build, this is where Gemini's streamed answer will appear.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File) {
    try {
      toast.info(`Indexing ${file.name} into ChromaDB…`);
      const res = await api.uploadNotes(semester, effectiveSubject, file);
      toast.success(`Indexed ${res.chunks} chunks from ${file.name}`);
      refreshNotes();
    } catch {
      toast.success(`(Offline demo) Pretended to index ${file.name}`);
    }
  }

  async function generatePdf() {
    if (!subjectId.trim()) {
      toast.error("Select a subject first");
      return;
    }
    if (messages.length === 0) {
      toast.error("Ask at least one question before generating a PDF");
      return;
    }
    setGenerating(true);
    try {
      const res = await api.generatePdfFromMessages(sessionId, subjectId, messages);
      toast.success("PDF ready — opening download…");
      window.open(res.pdf_url, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      {/* LEFT — subject, syllabus, controls */}
      <aside className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink-300/70 mb-1">
            {SEMESTER_LABELS[semester]}
          </div>
          <div className="font-display text-xl mb-3">Subject</div>

          {/* ---- DROPDOWN instead of text input ---- */}
          <div className="relative">
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                resetSession();
                setSessionId(getOrCreateSessionId());
                setMessages([]);
              }}
              className="w-full appearance-none rounded-xl bg-ink-900/80 border border-white/10 px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
            >
              {subjects.length === 0 && (
                <option value="">No subjects listed</option>
              )}
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300/60" />
          </div>

          <Link
            href={`/syllabus/${semester}`}
            className="mt-3 btn-ghost w-full justify-center text-sm"
          >
            <BookOpen className="h-4 w-4" />
            Open Syllabus
          </Link>
        </div>

        {/* Subject notes */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-ink-300/70">
                Subject Notes
              </div>
              <div className="font-display text-lg">View & download</div>
            </div>
            <FileText className="h-5 w-5 text-accent" />
          </div>

          {notesLoading ? (
            <div className="flex items-center gap-2 text-xs text-ink-300/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading notes...
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => (
                <a
                  key={note.name}
                  href={note.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs hover:bg-white/[0.06] transition"
                >
                  <span className="truncate">{note.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-300/70">
              No notes uploaded for this subject yet. Upload a PDF below and it will appear here for everyone to view or download.
            </p>
          )}
        </div>

        {/* Mode selector */}
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink-300/70 mb-3">
            Mode
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`text-xs rounded-xl px-3 py-2 border transition ${
                  mode === m.value
                    ? "bg-accent text-ink-950 border-accent"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marks selector */}
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink-300/70 mb-3">
            Answer Type
          </div>
          <div className="flex flex-wrap gap-2">
            {MARKS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMarks(m.value)}
                className={`text-xs rounded-full px-3 py-1.5 border transition ${
                  marks === m.value
                    ? "bg-crimson text-white border-crimson"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload + PDF */}
        <div className="glass rounded-2xl p-5 space-y-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost w-full justify-center text-sm"
          >
            <Upload className="h-4 w-4" />
            Upload notes / PYQ
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <button
            onClick={generatePdf}
            disabled={generating}
            className="btn-primary w-full justify-center text-sm"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Generate PDF
          </button>
          <p className="text-[10px] text-ink-300/60 text-center">
            Subject_Preparation_Guide.pdf
          </p>
        </div>
      </aside>

      {/* RIGHT — chat */}
      <div className="glass-strong rounded-2xl flex flex-col h-[78vh] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-ink-200/80">UVCE ExamMate AI</span>
          </div>
          <div className="text-[10px] text-ink-300/60 font-mono">
            session: {sessionId.slice(0, 14)}…
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="h-8 w-8 text-accent mb-3" />
              <div className="font-display text-2xl">
                Ask anything about{" "}
                <span className="gradient-text italic">
                  {subjectName}
                </span>
                .
              </div>
              <p className="text-sm text-ink-200/60 mt-2 max-w-md">
                Try a mode above (Exam Tomorrow, PYQ Intelligence, Viva) and choose the marks budget.
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center text-ink-950">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-accent text-ink-950 rounded-br-sm"
                      : "bg-white/[0.04] border border-white/10 rounded-bl-sm"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-1 prose-strong:text-accent">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>

                      {m.sources && m.sources.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-[10px] uppercase tracking-widest text-ink-300/70 cursor-pointer">
                            Sources ({m.sources.length})
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-ink-300/80">
                            {m.sources.map((s, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-accent" />
                                <span className="font-mono">{s.source}</span>
                                {s.page && <span>· p.{s.page}</span>}
                                {s.score && (
                                  <span className="text-ink-300/60">
                                    · {Math.round(s.score * 100)}%
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {busy && (
            <div className="flex items-center gap-2 text-ink-300/60 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              RAG → Gemini is drafting an answer…
            </div>
          )}
        </div>

        {/* input */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`Ask about ${subjectName}…  (Shift+Enter for newline)`}
              className="flex-1 resize-none rounded-2xl bg-ink-900/80 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 max-h-40"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="btn-primary h-12 w-12 !p-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-ink-300/60">
            <span className="font-mono">mode: {mode}</span>
            <span>·</span>
            <span className="font-mono">marks: {marks}</span>
            <span>·</span>
            <span>UVCE notes → PYQs → internals → Gemini</span>
          </div>
        </div>
      </div>
    </div>
  );
}
