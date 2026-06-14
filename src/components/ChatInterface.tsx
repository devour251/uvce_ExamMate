import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { api, type AnswerType, type ChatMessage, type Mode, type NoteFile, type Semester } from "../lib/api";
import { getOrCreateSessionId, resetSession } from "../lib/session";
import { SEMESTER_LABELS, SUBJECTS } from "../lib/subjects";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import SyllabusModal from "./SyllabusModal";

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
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
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
      setNotes(res.files || []);
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
      console.error("[Ask Error]:", err);
      const errMsg = err instanceof Error ? err.message : "Request failed";
      toast.error(errMsg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚠️ Error connecting to server or generating response. In UVCE ExamMate AI, please double-check that your server handles compiling chunks and has a valid Gemini key.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File) {
    try {
      toast.info(`Uploading ${file.name} to ExamMate server…`);
      const res = await api.uploadNotes(semester, effectiveSubject, file);
      toast.success(`Successfully uploaded & indexed ${res.chunks_indexed || 0} chunks from ${file.name}!`);
      refreshNotes();
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : "Upload failed";
      toast.error(`Ingestion error: ${errMsg}`);
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
      const blob = await api.generatePdfFromMessages(sessionId, subjectId, messages);
      toast.success("Study PDF is ready! Downloading…");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${subjectId}_Study_Guide.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
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
          <div className="text-xs uppercase tracking-widest text-ink-300/70 mb-1 font-mono">
            {SEMESTER_LABELS[semester]}
          </div>
          <div className="font-display text-xl mb-3 font-semibold">Subject</div>

          {/* ---- DROPDOWN ---- */}
          <div className="relative">
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                resetSession();
                setSessionId(getOrCreateSessionId());
                setMessages([]);
              }}
              className="w-full appearance-none rounded-xl bg-ink-900 border border-white/10 px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer text-ink-100"
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

          <button
            onClick={() => setIsSyllabusOpen(true)}
            className="mt-3 btn-ghost w-full justify-center text-sm cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-accent" />
            Open Syllabus
          </button>
        </div>

        {/* Subject notes */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-ink-300/70 font-mono">
                Subject Notes
              </div>
              <div className="font-display text-lg font-semibold">Revision files</div>
            </div>
            <FileText className="h-5 w-5 text-accent" />
          </div>

          {notesLoading ? (
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              Loading notes...
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.map((note) => (
                <a
                  key={note.name}
                  href={note.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs hover:bg-white/[0.06] transition"
                >
                  <span className="truncate text-ink-100">{note.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-300/70 leading-relaxed font-mono">
              No notes uploaded for this subject yet. Upload a PDF below and it will appear here instantly!
            </p>
          )}
        </div>

        {/* Mode selector */}
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink-300/70 mb-3 font-mono">
            Revision Mode
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`text-xs rounded-xl px-3 py-2.5 border transition font-mono ${
                  mode === m.value
                    ? "bg-accent text-ink-950 border-accent font-bold shadow-md"
                    : "border-white/10 hover:bg-white/5 text-ink-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marks selector */}
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink-300/70 mb-3 font-mono">
            Answer Depth
          </div>
          <div className="flex flex-wrap gap-2">
            {MARKS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMarks(m.value)}
                className={`text-xs rounded-full px-3.5 py-1.5 border transition font-mono ${
                  marks === m.value
                    ? "bg-crimson text-white border-crimson font-bold shadow-lg shadow-crimson/20"
                    : "border-white/10 hover:bg-white/5 text-ink-200"
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
            className="btn-ghost w-full justify-center text-sm cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Upload PDF Notes
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
            className="btn-primary w-full justify-center text-sm cursor-pointer"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Download Revision Guide
          </button>
          <p className="text-[10px] text-ink-300/60 text-center font-mono">
            Subject_Preparation_Guide.pdf
          </p>
        </div>
      </aside>

      {/* RIGHT — chat */}
      <div className="glass-strong rounded-3xl flex flex-col h-[78vh] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-ink-950/60">
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-ink-50 font-display font-semibold">UVCE ExamMate Tutor</span>
          </div>
          <div className="text-[10px] text-ink-400 font-mono">
            session: {sessionId.slice(0, 14)}…
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Sparkles className="h-9 w-9 text-accent mb-4 animate-float" />
              <div className="font-display text-2xl font-bold">
                Ask anything about{" "}
                <span className="gradient-text italic font-bold">
                  {subjectName}
                </span>
                .
              </div>
              <p className="text-sm text-ink-200/60 mt-2 max-w-sm font-mono">
                Try normal prep, exam tomorrow grids, or predict PYQ mark answers.
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
                      ? "bg-accent text-ink-950 rounded-br-sm font-medium"
                      : "bg-white/[0.04] border border-white/10 rounded-bl-sm text-ink-100"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-1 prose-strong:text-accent font-sans">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>

                      {m.sources && m.sources.length > 0 && (
                        <details className="mt-3 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                          <summary className="text-[10px] uppercase tracking-widest text-ink-300 cursor-pointer font-mono font-semibold">
                            Sources ({m.sources.length})
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-ink-300/80">
                            {m.sources.map((s, idx) => (
                              <li key={idx} className="flex items-center gap-2 font-mono text-[11px]">
                                <AlertCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                                <span className="font-mono text-ink-50 font-semibold">{s.source}</span>
                                {s.page && <span>· page {s.page}</span>}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-ink-100">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {busy && (
            <div className="flex items-center gap-2 text-accent text-xs font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading UVCE notes & mapping questions with Gemini…
            </div>
          )}
        </div>

        {/* input */}
        <div className="border-t border-white/5 p-4 bg-ink-950/40">
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
              placeholder={`Ask about ${subjectName}…  (Press Enter to send, Shift+Enter for newline)`}
              className="flex-1 resize-none rounded-2xl bg-ink-900 border border-white/10 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 max-h-40 text-ink-100 focus:bg-black/40 transition"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="btn-primary h-12 w-12 !p-0 shrink-0 cursor-pointer"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-ink-300/60 font-mono">
            <span className="bg-white/5 px-2 py-0.5 rounded text-accent font-semibold">{mode}</span>
            <span>·</span>
            <span className="bg-white/5 px-2 py-0.5 rounded text-crimson font-semibold">{marks}</span>
            <span>·</span>
            <span>Gemini RAG context is fully enabled</span>
          </div>
        </div>
      </div>

      {/* Embedded Syllabus light weight Iframe modal */}
      <SyllabusModal
        semester={semester}
        isOpen={isSyllabusOpen}
        onClose={() => setIsSyllabusOpen(false)}
      />
    </div>
  );
}
