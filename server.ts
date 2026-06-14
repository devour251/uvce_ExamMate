import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as pdfParseTmp from "pdf-parse";
const pdfParse = (pdfParseTmp as any).default || pdfParseTmp;
import { build_placeholder_syllabus, build_study_guide } from "./src/lib/pdf_builder";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize or reload Gemini Client lazily to detect runtime dotenv updates
let cachedAi: GoogleGenAI | null = null;
let lastApiKey: string | undefined = undefined;

function getGeminiClient(): GoogleGenAI | null {
  try {
    dotenv.config({ override: true });
  } catch (e) {
    console.warn("Could not dynamically reload .env:", e);
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    cachedAi = null;
    lastApiKey = undefined;
    return null;
  }
  if (!cachedAi || lastApiKey !== apiKey) {
    lastApiKey = apiKey;
    cachedAi = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return cachedAi;
}

// Paths and Directories
const DATA_DIR = path.join(process.cwd(), "data");
const NOTES_DIR = path.join(DATA_DIR, "notes");
const INDEX_FILE = path.join(DATA_DIR, "vector_index.json");

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(NOTES_DIR, { recursive: true });

// Configure Multer for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// Persistent Vector Memory DB Contract
interface Chunk {
  id: string;
  document: string;
  embedding: number[];
  metadata: {
    semester: number;
    subject_id: string;
    type: string;
    source: string;
    page: number;
  };
}

let vectorIndex: Chunk[] = [];

// Load existing index if present
if (fs.existsSync(INDEX_FILE)) {
  try {
    vectorIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
    console.log(`Loaded ${vectorIndex.length} vectors from persistent index.`);
  } catch (err) {
    console.error("Error loading vector index:", err);
    vectorIndex = [];
  }
}

function saveIndex() {
  try {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(vectorIndex, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist vector index:", err);
  }
}

// Session store for download guides
const sessionStore: Record<string, any[]> = {};

// TF-IDF style fallback if Gemini Embedding API fails
function generateBasicFallbackEmbedding(text: string): number[] {
  const words = (text.toLowerCase().match(/\w+/g) || []) as string[];
  const embedding = new Array(768).fill(0);
  words.forEach((w) => {
    let hash = 0;
    for (let i = 0; i < w.length; i++) {
      hash = (hash << 5) - hash + w.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 768;
    embedding[idx] += 1;
  });
  // L2 Norm
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < 768; i++) {
      embedding[i] /= norm;
    }
  }
  return embedding;
}

let embeddingApiBroken = false;

// Generate Embeddings using Gemini model
async function embedText(text: string): Promise<number[]> {
  const aiClient = getGeminiClient();
  if (!aiClient || embeddingApiBroken) {
    return generateBasicFallbackEmbedding(text);
  }
  try {
    const res = await aiClient.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: text,
    }) as any;
    if (res.embedding && res.embedding.values) {
      return res.embedding.values;
    }
    if (res.embeddings && res.embeddings.values) {
      return res.embeddings.values;
    }
    return generateBasicFallbackEmbedding(text);
  } catch (err) {
    console.error("Gemini embedding error, setting fast-fallback flag and using local representation:", err);
    embeddingApiBroken = true;
    return generateBasicFallbackEmbedding(text);
  }
}

// Cosine Similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Local Chunking Function
function chunkText(text: string, chunkSize = 800, overlap = 120): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let start = 0;
  const n = clean.length;

  while (start < n) {
    const end = Math.min(start + chunkSize, n);
    chunks.push(clean.substring(start, end));
    if (end === n) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

// Offline fallback text generator
function _extractContext(prompt: string): string {
  const match = /--- CONTEXT START ---\s*([\s\S]*?)\s*--- CONTEXT END ---/.exec(prompt);
  if (match) {
    const content = match[1].trim();
    if (content.toLowerCase().includes("no context retrieved")) {
      return "";
    }
    return content;
  }
  return "";
}

function _extractLabel(prompt: string, label: string): string {
  const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?:\\n\\n|$)`, "i");
  const match = regex.exec(prompt);
  return match ? match[1].trim() : "";
}

function smartFallback(userPrompt: string): string {
  const context = _extractContext(userPrompt);
  const question = _extractLabel(userPrompt, "QUESTION") || "your question";
  const subject = _extractLabel(userPrompt, "SUBJECT") || "the subject";

  if (context) {
    return `## Answer from Local Revision Notes — *${subject}*\n\n${context}\n\n---\n> **⚠️ Connected to Sandboxed Local Storage**  \n> This reply was retrieved directly from your uploaded revision notes via the in-memory RAG pipeline. To experience live, state-allocated AI answers, please add a valid **Gemini API Key** in the platform Settings.`;
  }
  return `## ⚠️ AI Key Required — *${subject}*\n\n**Your question:** ${question}\n\nThere is no matching text in your uploaded files, and no valid Gemini API key was found in the environment. Please add your key in the **Settings > Secrets** workflow.`;
}

// extract topics for confidence scores
const TOPIC_HINTS = new Set([
  "deadlocks", "paging", "scheduling", "virtual memory", "thrashing",
  "semaphores", "mutex", "process synchronization", "file systems",
  "normalization", "indexing", "transactions", "sql", "joins",
  "deadlock", "compiler", "parsing", "lexical analysis", "syntax tree",
  "interrupts", "memory management", "cache", "tcp", "udp", "routing",
  "encryption", "authentication", "neural networks", "gradient descent",
  "backpropagation", "clustering", "regression", "linked list", "tree",
  "graph", "sorting", "searching", "hashing", "recursion", "dp",
  "dynamic programming", "greedy", "information technology",
  "information security", "confidentiality", "integrity", "availability",
  "osi model", "ip address", "dns", "lan", "wan", "switch", "router",
  "hub", "bridge", "subnet", "firewall", "http", "https", "ftp", "smtp",
  "network", "protocol", "bandwidth", "latency", "packet", "frame",
]);

function extractConfidence(answer: string): { topic: string; score: number }[] {
  const text = answer.toLowerCase();
  const found: { topic: string; score: number }[] = [];
  for (const t of TOPIC_HINTS) {
    if (text.includes(t)) {
      found.push({
        topic: t.charAt(0).toUpperCase() + t.slice(1),
        score: 90 - found.length * 7,
      });
    }
  }
  return found.slice(0, 8);
}

// Prompts mapping
const BASE_SYSTEM = `You are UVCE ExamMate AI — an exam tutor for students of University Visvesvaraya College of Engineering (UVCE), Bangalore.

You will be given:
  • CONTEXT — relevant passages retrieved from UVCE notes, PYQs and internal papers via RAG.
  • QUESTION — the student's question.
  • MODE — how to answer.
  • MARKS — target answer length (2 / 5 / 10 / 15 / 20 marks).

Hard rules:
  1. ANSWER ONLY WHAT IS ASKED. Don't add tangential content.
  2. Prefer content from CONTEXT. If CONTEXT is empty or sparse, seamlessly fuse and enrich the answer using your comprehensive, highly authoritative general academic and technical knowledge. Keep the response completely professional, fluid, and unified. NEITHER write nor print warnings like "(general knowledge, not from UVCE notes)" or other similar notes anywhere in your response.
  3. Do not invent fake page numbers, files, or specific quotes/references that are not present in CONTEXT. However, you SHOULD write standard, highly accurate academic formulas, mathematical equations, step-by-step algorithms, and clear explanation structures that correspond to the subject's curriculum.  4. NEVER generate images / diagrams / ASCII art. If a diagram is required, instead return:
       <DIAGRAM>topic name</DIAGRAM>
     and tell the student to refer to the textbook or uploaded notes.
   5. Use UVCE exam style:
       - Clear, bold headings
       - Structured numbered or bulleted points
       - Formal definitions in one line
       - Academic or practical examples when relevant
       - Complete, informative sentences
  6. Secure high academic scores by answering with rich details suitable for the selected marks budget:
       - 2 marks  : 60–100 words (direct crisp definition, formula, or key core points)
       - 5 marks  : 180–280 words (detailed coverage with bullet points, subtopics, or simple comparison)
       - 10 marks : 450–650 words (comprehensive essay style, rich multi-part headers, elaborate detail points, and examples)
       - 15 marks : 800–1100 words (extremely thorough, multi-section deep-dive with details, structured components, and step-by-step points)
       - 20 marks : 1200–1800 words (exhaustive academic masterclass, complete theoretical coverage, full definitions, comparative tables, algorithms, and thorough explanations)
  7. Output valid Markdown only.`;

function buildPrompt(question: string, context: string, mode: string, marks: string, subjectName: string): string {
  const questionLower = question.toLowerCase();
  let requestedCount = 8; // default predicted questions count in PYQ Intelligence
  let repeatedCount = 5; // default repeated questions count in Internal Analysis
  let vivaCount = 12; // default viva Q&A count
  let tomorrowCount = 5; // default long/short count in exam tomorrow

  // Detect explicit request for question counts (e.g. 10 questions, 20 questions)
  const matchesCount = questionLower.match(/(\d+)\s*(?:questions|q&as|q&a|predicted|items|topics)/);
  if (matchesCount) {
    const parsedNum = parseInt(matchesCount[1], 10);
    if (parsedNum > 0 && parsedNum <= 100) {
      requestedCount = parsedNum;
      repeatedCount = Math.max(3, Math.ceil(parsedNum / 2));
      vivaCount = parsedNum;
      tomorrowCount = Math.max(3, Math.ceil(parsedNum / 4));
    }
  }

  // If the user explicitly asks to make 10 or 20 questions, bypass marks limitations and provide deep explanations
  const forceLongExplains = matchesCount ? "\nNOTE: Since the student requested a specific count of questions/items to be made, IGNORE any word limits or brief limits on total response size. Ensure ALL questions are listed and fully answered with exhaustive explanations." : "";
  const modesBlock: Record<string, string> = {
    normal: `MODE: NORMAL\nAnswer the question directly, exam-style, at the requested marks budget length. If the student has asked you to produce, make, or list items/questions, provide a meticulous and comprehensive set of exactly ${requestedCount} items.`,
    exam_tomorrow: `MODE: EXAM TOMORROW\nThe student's exam is TOMORROW. Produce a high-yield, comprehensive cheat-sheet:\n  • Important topics (with weightage guess)\n  • Important definitions (1 line each)\n  • Key concepts (bullet list)\n  • Exactly ${tomorrowCount} likely long-answer exam questions with detailed brief outlines and answers\n  • Exactly ${tomorrowCount} likely short-answer exam questions\n  • Last-minute revision tips`,
    pyq_intelligence: `MODE: PYQ INTELLIGENCE\nUse CONTEXT (which contains PYQs + syllabus) to predict the most important topics. Return a Markdown table:\n  | Topic | Predicted Frequency | Confidence (0-100) | Why |\n  |-------|---------------------|--------------------|-----|\nAfter the table, list exactly ${requestedCount} predicted exam questions grouped by marks, and provide highly detailed, thorough, complete academic answers/outlines for each.`,
    internal_analysis: `MODE: INTERNAL ANALYSIS\nCONTEXT contains internal question papers. Identify:\n  • Repeated concepts (with count and years)\n  • Likely important topics\n  • Exam trends (theory vs numerical vs diagram-heavy)\nThen list exactly ${requestedCount} most-likely questions for the upcoming exam with comprehensive explanations or answers for each.`,
    viva: `MODE: VIVA\nProduce a list of exactly ${vivaCount} short Q&A pairs (question in 1 line, answer in 1–2 lines). Cover definitions, comparisons, advantages/disadvantages, and one 'tricky' question at the end.`,
  };


  const lengths: Record<string, string> = {
    "2marks": "at least 60-100 words",
    "5marks": "at least 180-280 words",
    "10marks": "at least 450-650 words",
    "15marks": "at least 800-1100 words",
    "20marks": "at least 1200-1800 words",
  };

  return `SUBJECT: ${subjectName}

${modesBlock[mode] || modesBlock.normal}${forceLongExplains}

MARKS BUDGET: ${marks} — target length ${lengths[marks] || "at least 450-650 words"}.

--- CONTEXT START ---
 ${context || "( context was directly found in the local uploaded notes database — answer comprehensively using your full technical knowledge based on the official guidelines for this subject)"}
--- CONTEXT END ---

QUESTION:
${question}`;
}

const INTEGRAL_SUBJECTS_MAP: Record<string, string> = {
  BSC101: "Engineering Mathematics-I",
  BSC102: "Engineering Physics",
  ESC101: "Problem Solving with C",
  ESC102: "Basic Electrical Engineering",
  BSC201: "Engineering Mathematics-II",
  BSC202: "Engineering Chemistry",
  ESC201: "Python Programming",
  ESC202: "Basic Electronics",
  BCS301: "Data Structures",
  BCS302: "Discrete Mathematical Structures",
  BCS303: "Digital Computer Organization",
  BCS304: "OOP with Java",
  BCS401: "Operating Systems",
  BCS402: "Design and Analysis of Algorithms",
  BCS403: "Database Management Systems",
  BCS404: "Microprocessor and Microcontroller",
  BCS501: "Computer Networks",
  BCS502: "Theory of Computation",
  BCS503: "Software Engineering",
  BCS504: "Machine Learning",
  BCS601: "Cloud Computing",
  BCS602: "Compiler Design",
  BCS603: "Information Security",
  BCS604: "Web Technologies",
  BCS701: "Artificial Intelligence",
  BCS702: "Distributed Systems",
  BCS703: "Deep Learning",
  BCS704: "Project Phase-I",
  BCS801: "Internet of Things",
  BCS802: "Blockchain Technology",
  BCS803: "Project Phase-II",
  BCS804: "Internship",
};

// API Endpoint Routers
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// GET list of subjects matches /api/subjects?semester=X
app.get("/api/subjects", (req, res) => {
  const semester = Number(req.query.semester);
  if (!semester) {
    return res.status(400).json({ error: "semester number query parameter required" });
  }

  const subjects = Object.entries(INTEGRAL_SUBJECTS_MAP).filter(([code]) => {
    if (semester === 1) return ["BSC101", "BSC102", "ESC101", "ESC102"].includes(code);
    if (semester === 2) return ["BSC201", "BSC202", "ESC201", "ESC202"].includes(code);
    if (semester === 3) return ["BCS301", "BCS302", "BCS303", "BCS304"].includes(code);
    if (semester === 4) return ["BCS401", "BCS402", "BCS403", "BCS404"].includes(code);
    if (semester === 5) return ["BCS501", "BCS502", "BCS503", "BCS504"].includes(code);
    if (semester === 6) return ["BCS601", "BCS602", "BCS603", "BCS604"].includes(code);
    if (semester === 7) return ["BCS701", "BCS702", "BCS703", "BCS704"].includes(code);
    if (semester === 8) return ["BCS801", "BCS802", "BCS803", "BCS804"].includes(code);
    return false;
  }).map(([code, name]) => ({
    id: code,
    semester: semester as any,
    code,
    name,
  }));

  res.json(subjects);
});

// GET syllabus download or compilation placeholder
app.get("/api/syllabus/:semester/pdf", async (req, res) => {
  const semester = Number(req.params.semester);
  if (!semester || semester < 1 || semester > 8) {
    return res.status(404).send("Invalid semester (must be 1-8)");
  }

  try {
    const pdfBuf = await build_placeholder_syllabus(semester);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="syllabus_sem${semester}.pdf"`);
    res.send(pdfBuf);
  } catch (err) {
    res.status(500).send("Failed to compile syllabus PDF");
  }
});

// GET lists uploaded notes for a semester and subject
app.get("/api/notes", (req, res) => {
  const semester = req.query.semester;
  const subjectId = req.query.subject_id as string;

  if (!semester || !subjectId) {
    return res.status(400).json({ error: "semester and subject_id query strings are required" });
  }

  const targetDir = path.join(NOTES_DIR, `sem${semester}`, subjectId);
  if (!fs.existsSync(targetDir)) {
    return res.json({ files: [] });
  }

  try {
    const files = fs.readdirSync(targetDir).filter((file) => file.endsWith(".pdf")).map((file) => {
      const stats = fs.statSync(path.join(targetDir, file));
      return {
        name: file,
        size_bytes: stats.size,
        download_url: `/api/notes/download/${semester}/${subjectId}/${encodeURIComponent(file)}`,
      };
    });
    res.json({ files });
  } catch (err) {
    res.json({ files: [] });
  }
});

// Download actual file
app.get("/api/notes/download/:semester/:subjectId/:filename", (req, res) => {
  const { semester, subjectId, filename } = req.params;
  const targetFile = path.join(NOTES_DIR, `sem${semester}`, subjectId, filename);

  if (!fs.existsSync(targetFile)) {
    return res.status(404).send("Notes PDF not found locally.");
  }
  res.sendFile(targetFile);
});

// Ingest Uploaded notes PDF and generate vector index chunks
async function handlePdfIngestion(
  buffer: Buffer,
  filename: string,
  semester: number,
  subjectId: string,
  docType = "notes"
): Promise<number> {
  // Reset embedding api broken state for every new upload to try Gemini again
  embeddingApiBroken = false;

  // Parse PDF
  const pagesText: string[] = [];
  try {
    await pdfParse(buffer, {
      pagerender: (pageData) => {
        return pageData.getTextContent().then((token: any) => {
          let pageText = "";
          let lastY: any;
          if (token && Array.isArray(token.items)) {
            for (let item of token.items) {
              if (!item) continue;
              const str = item.str || "";
              const transform = item.transform;
              if (transform && Array.isArray(transform) && transform.length > 5) {
                const y = transform[5];
                if (lastY === y || !lastY) {
                  pageText += str;
                } else {
                  pageText += "\n" + str;
                }
                lastY = y;
              } else {
                pageText += " " + str;
              }
            }
          }
          pagesText.push(pageText);
          return pageText;
        });
      },
    });
  } catch (err) {
    console.error("Failed to parse PDF with custom page renderer, trying fallback default pdf-parse:", err);
    try {
      const parsed = await pdfParse(buffer);
      if (parsed && parsed.text) {
        pagesText.push(parsed.text);
      }
    } catch (err2) {
      console.error("Failed to parse PDF even with default render:", err2);
      const fallbackText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, "");
      pagesText.push(fallbackText);
    }
  }

  let chunkCount = 0;

  for (let idx = 0; idx < pagesText.length; idx++) {
    const pageText = pagesText[idx];
    const chunks = chunkText(pageText);
    for (const chunkStr of chunks) {
      const embedding = await embedText(chunkStr);
      const chunkObj: Chunk = {
        id: `chunk_${Math.random().toString(36).substring(2)}`,
        document: chunkStr,
        embedding,
        metadata: {
          semester,
          subject_id: subjectId,
          type: docType,
          source: filename,
          page: idx + 1,
        },
      };

      vectorIndex.push(chunkObj);
      chunkCount++;
    }
  }

  saveIndex();
  return chunkCount;
}

// POST upload notes & community uploads
const uploadHandler = async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file attached." });
    }

    const { originalname, buffer } = req.file;
    const semester = Number(req.body.semester || 1);
    const subjectId = req.body.subject_id || "general";
    const docType = req.body.doc_type || "notes";

    // Save actual file to disk
    const targetDir = path.join(NOTES_DIR, `sem${semester}`, subjectId);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, originalname), buffer);

    // Ingest chunks
    const chunkCount = await handlePdfIngestion(buffer, originalname, semester, subjectId, docType);

    res.json({
      success: true,
      file_name: originalname,
      chunks_indexed: chunkCount,
      mode: "local_sandbox",
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "PDF ingestion failed" });
  }
};

app.post("/api/notes/upload", upload.single("file"), uploadHandler);
app.post("/api/community/upload", upload.single("file"), uploadHandler);

// POST Ask RAG endpoint
app.post("/api/chat/ask", async (req, res) => {
  try {
    const { semester, subject_id, question, mode, marks, session_id } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Empty question" });
    }

    // 1. Get embedding for general search
    const queryEmb = await embedText(question);

    // 2. Query relative in-memory chunks
    const candidates = vectorIndex.filter(
      (chunk) =>
        chunk.metadata.semester === Number(semester) &&
        chunk.metadata.subject_id === subject_id
    );

    const scored = candidates.map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmb, chunk.embedding),
    }));

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Filter top chunks (similar to notes/pyqs/internals categories combined or overall top 9)
    const hits = scored.slice(0, 9);

    // Format Context
    const contextBlocks = hits.map((h, i) => {
      const meta = h.metadata;
      const tag = `[${i + 1}] ${meta.source || "unknown"} (p.${meta.page || "?"}, ${meta.type || "notes"})`;
      return `${tag}\n${h.document.trim()}`;
    });
    const context = contextBlocks.join("\n\n");

    const subjectName = INTEGRAL_SUBJECTS_MAP[subject_id] || subject_id;
    const systemPrompt = BASE_SYSTEM;
    const userPrompt = buildPrompt(question, context, mode, marks, subjectName);

    // 4. Save to session
    if (!sessionStore[session_id]) {
      sessionStore[session_id] = [];
    }
    sessionStore[session_id].push({
      role: "user",
      content: question,
      mode,
      marks,
    });

    // 5. Generate with Gemini SDK
    let answer = "";
    const aiClient = getGeminiClient();
    if (aiClient) {
      try {
        const completion = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        });
        answer = completion.text || "";
      } catch (err: any) {
        console.error("Gemini invocation error:", err);
        const errorMsg = err?.message || String(err);
        const fallback = smartFallback(userPrompt);
        answer = `⚠️ **Gemini API Key Error:** Standard Gemini response generation failed.

**Reason/Details:** \`${errorMsg}\`

*Falling back to offline Local Revision Notes RAG pipeline:*

${fallback}`;
      }
    } else {
      answer = smartFallback(userPrompt);
    }

    // Save AI output to session
    sessionStore[session_id].push({
      role: "assistant",
      content: answer,
    });

    // 7. Format sources and confidence output
    const sources = hits.map((h) => ({
      source: h.metadata.source || "unknown",
      page: h.metadata.page,
      score: Number(h.score.toFixed(3)),
    }));

    const confidence = extractConfidence(answer);

    res.json({
      answer,
      sources,
      confidence,
      session_id,
      message_id: `msg_${Math.random().toString(36).substring(2)}`,
    });
  } catch (err) {
    console.error("Answer prediction error:", err);
    res.status(500).json({ error: "Predicting answer answer failed" });
  }
});

// POST PDF Study revision guide generation
app.post("/api/pdf/generate", async (req, res) => {
  const { session_id, subject_id, messages } = req.body;

  if (!subject_id) {
    return res.status(400).json({ error: "subject_id is required" });
  }

  const subjectName = INTEGRAL_SUBJECTS_MAP[subject_id] || subject_id;
  const activeMessages = messages || sessionStore[session_id] || [];

  if (activeMessages.length === 0) {
    return res.status(400).json({ error: "Review chat log is currently empty" });
  }

  try {
    const pdfBuffer = await build_study_guide({
      subjectName,
      subjectCode: subject_id,
      messages: activeMessages,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${subject_id}_Study_Guide.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Study Guide generation error:", err);
    res.status(500).send("Study guide compile error");
  }
});

// Vite + Static Serving Pipeline
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched on port ${PORT}`);
  });
}

startServer();
