"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Semester } from "@/lib/api";
import { SUBJECTS } from "@/lib/subjects";

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";

export default function CommunityUpload() {
  const [semester, setSemester] = useState<Semester>(1);
  const [subjectId, setSubjectId] = useState<string>("");
  const [docType, setDocType] = useState<"notes" | "pyq" | "internal">("notes");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ file_name: string; chunks: number; mode: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose a PDF file first");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }
    if (!subjectId.trim()) {
      toast.error("Please type the subject name");
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("semester", String(semester));
      form.append("subject_id", subjectId.trim());
      form.append("doc_type", docType);
      form.append("uploader_name", uploaderName || "Anonymous");
      form.append("uploader_email", uploaderEmail || "");

      console.log("[upload] posting to:", `${API_BASE}/api/community/upload`);

      const res = await fetch(`${API_BASE}/api/community/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          detail = j.detail || JSON.stringify(j);
        } catch {
          detail = await res.text();
        }
        throw new Error(detail);
      }
      const data = await res.json();
      console.log("[upload] success:", data);
      setResult({
        file_name: data.file_name,
        chunks: data.chunks_indexed,
        mode: data.mode,
      });
      toast.success(
        data.mode === "supabase"
          ? `Uploaded to Supabase + ${data.chunks_indexed} chunks indexed!`
          : `Saved locally + ${data.chunks_indexed} chunks indexed!`
      );
      setFile(null);
    } catch (err) {
      console.error("[upload] error:", err);
      const msg = err instanceof Error ? err.message : "Upload failed. Is the backend running on port 8000?";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      id="community-upload"
      className="mt-16"
    >
      <div className="relative overflow-hidden rounded-3xl glass-strong p-8 md:p-10">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-crimson/20 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-crimson flex items-center justify-center text-ink-950">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-accent/80">
                Community Knowledge Base
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                Contribute to <span className="gradient-text italic">UVCE</span> Knowledge Base
              </h2>
            </div>
          </div>
          <p className="text-ink-200/70 mb-8 max-w-2xl">
            Help your juniors! Drop a PDF — notes, PYQs, or internals. The AI
            will immediately start using it to answer questions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-300/80 mb-2">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => {
                    setSemester(Number(e.target.value) as Semester);
                    setSubjectId("");
                  }}
                  className="w-full rounded-xl bg-ink-900/80 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Semester {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-300/80 mb-2">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full rounded-xl bg-ink-900/80 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="notes">Notes</option>
                  <option value="pyq">PYQ (Previous Year Question)</option>
                  <option value="internal">Internal Paper</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-300/80 mb-2">
                Subject
              </label>

              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full rounded-xl bg-ink-900/80 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"

              >
                <option value="">Select Subject</option>

                {(SUBJECTS[semester] || []).map((subject) => (
                  <option
                    key={subject.code}
                    value={subject.code}
                  >
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-[10px] text-ink-300/60">
                Subjects are automatically filtered based on selected semester.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-300/80 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full rounded-xl bg-ink-900/80 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-300/80 mb-2">
                  Your Email (optional)
                </label>
                <input
                  type="email"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  placeholder="you@uvce.ac.in"
                  className="w-full rounded-xl bg-ink-900/80 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-300/80 mb-2">
                Choose PDF File
              </label>
              <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-ink-900/80 border-2 border-dashed border-white/15 hover:border-accent/40 transition px-4 py-5">
                <FileText className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm text-ink-200/80 flex-1 truncate">
                  {file ? file.name : "Click to select a PDF (max 20MB)"}
                </span>
                {file && (
                  <span className="text-xs text-ink-300/60">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {result && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-emerald-300">
                    Indexed <span className="font-mono">{result.file_name}</span>
                  </div>
                  <div className="text-xs text-ink-300/80">
                    {result.chunks} chunks added to ChromaDB · storage:{" "}
                    <span className="font-mono">{result.mode}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy || !file}
                className="btn-primary"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading & indexing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
              <p className="text-xs text-ink-300/60 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                No admin approval needed — goes live instantly
              </p>
            </div>
          </form>
        </div>
      </div>
    </motion.section>
  );
}
