// Centralised API client. Talks to the FastAPI backend.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ---------- TYPES ----------

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AnswerType = "2marks" | "5marks" | "10marks" | "15marks" | "20marks";
export type Mode =
  | "normal"
  | "exam_tomorrow"
  | "pyq_intelligence"
  | "internal_analysis"
  | "viva";

export interface Subject {
  id: string;
  semester: Semester;
  code: string;
  name: string;
  syllabus_pdf_url?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { source: string; page?: number; score?: number }[];
  confidence?: { topic: string; score: number }[];
  mode?: Mode;
  marks?: AnswerType;
  created_at?: string;
}

export interface AskRequest {
  semester: Semester;
  subject_id: string;
  question: string;
  mode: Mode;
  marks: AnswerType;
  session_id: string;
}

export interface AskResponse {
  answer: string;
  sources: { source: string; page?: number; score?: number }[];
  confidence: { topic: string; score: number }[];
  session_id: string;
  message_id: string;
}

export interface SessionState {
  id: string;
  semester?: Semester;
  subject_id?: string;
  messages: ChatMessage[];
}

// ---------- ENDPOINTS ----------

export const api = {
  health: () => request<{ ok: boolean }>("/health"),

  listSubjects: (semester: Semester) =>
    request<Subject[]>(`/api/subjects?semester=${semester}`),

  getSyllabusUrl: (semester: Semester) =>
    `${BASE}/api/syllabus/${semester}/pdf`,

  ask: (body: AskRequest, token?: string) =>
    request<AskResponse>("/api/chat/ask", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  generatePdf: (session_id: string, subject_id: string, token?: string) =>
    request<{ pdf_url: string; filename: string }>(
      "/api/pdf/generate",
      {
        method: "POST",
        body: JSON.stringify({ session_id, subject_id }),
      },
      token
    ),

  uploadNotes: async (
    semester: Semester,
    subject_id: string,
    file: File,
    token?: string
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("semester", String(semester));
    form.append("subject_id", subject_id);
    const res = await fetch(`${BASE}/api/notes/upload`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<{ chunks: number; source: string }>;
  },
};
