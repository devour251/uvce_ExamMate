import PDFDocument from "pdfkit";

function sanitizePdfText(text: string): string {
  if (!text) return "";
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        return char;
      }
      if (char === "“" || char === "”") return '"';
      if (char === "‘" || char === "’") return "'";
      if (char === "—" || char === "–") return "-";
      if (char === "…") return "...";
      if (code === 10 || code === 13) return char; // preserve newlines
      return " ";
    })
    .join("")
    .replace(/[ ]+/g, " ");
}

export function build_study_guide({
  subjectName,
  subjectCode,
  messages,
}: {
  subjectName: string;
  subjectCode: string;
  messages: any[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // COVER PAGE
      doc.fillColor("#0a0a0b");
      doc.fontSize(28).font("Helvetica-Bold").text("UVCE ExamMate AI", { align: "center" });
      doc.moveDown(1.5);

      doc.fillColor("#dc2626");
      doc.fontSize(22).font("Helvetica-Bold").text(sanitizePdfText(`${subjectCode} - ${subjectName}`), { align: "center" });
      doc.moveDown(0.5);

      doc.fillColor("#f5b800");
      doc.fontSize(16).font("Helvetica-Bold").text("Subject Preparation Guide", { align: "center" });
      doc.moveDown(2);

      doc.fillColor("#4b5563");
      doc.fontSize(10).font("Helvetica-Oblique").text(`Generated on ${new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`, { align: "center" });
      doc.moveDown(3);

      doc.fillColor("#111827");
      doc.fontSize(12).font("Helvetica").text(
        "This guide was auto-generated from your study session. It contains every question you asked and the AI's exam-oriented answer, plus a consolidated revision section at the end.",
        { align: "left", lineGap: 4 }
      );

      // Contents page
      doc.addPage();
      doc.fillColor("#dc2626");
      doc.fontSize(18).font("Helvetica-Bold").text("Contents");
      doc.moveDown(1);

      let questionNumber = 1;
      messages.forEach((m) => {
        if (m.role === "user") {
          doc.fillColor("#111827");
          const snippet = m.content.length > 70 ? m.content.substring(0, 70) + "..." : m.content;
          doc.fontSize(10).font("Helvetica").text(sanitizePdfText(`${questionNumber}. ${snippet} (${m.mode || "normal"} - ${m.marks || "10marks"})`));
          doc.moveDown(0.5);
          questionNumber++;
        }
      });

      // Detailed Q&A Pages
      doc.addPage();
      doc.fillColor("#dc2626");
      doc.fontSize(18).font("Helvetica-Bold").text("Detailed Q&A");
      doc.moveDown(1);

      let lastUserMsg: any = null;
      messages.forEach((m) => {
        if (m.role === "user") {
          lastUserMsg = m;
        } else if (m.role === "assistant" && lastUserMsg) {
          doc.fillColor("#f5b800");
          doc.fontSize(12).font("Helvetica-Bold").text(sanitizePdfText(`Q (${lastUserMsg.mode || "normal"} - ${lastUserMsg.marks || "10marks"}): ${lastUserMsg.content}`));
          doc.moveDown(0.5);

          // Convert Markdown-like body to simple pdf text
          const lines = m.content.split("\n");
          lines.forEach((line: string) => {
            const cleanLine = line.trim();
            if (!cleanLine) {
              doc.moveDown(0.3);
              return;
            }

            if (cleanLine.startsWith("# ")) {
              doc.fillColor("#dc2626").fontSize(13).font("Helvetica-Bold").text(sanitizePdfText(cleanLine.replace("# ", "")));
              doc.moveDown(0.4);
            } else if (cleanLine.startsWith("## ")) {
              doc.fillColor("#f5b800").fontSize(11).font("Helvetica-Bold").text(sanitizePdfText(cleanLine.replace("## ", "")));
              doc.moveDown(0.3);
            } else if (cleanLine.startsWith("### ")) {
              doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text(sanitizePdfText(cleanLine.replace("### ", "")));
              doc.moveDown(0.2);
            } else if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
              doc.fillColor("#1f2937").fontSize(10).font("Helvetica").text(sanitizePdfText(`  -  ${cleanLine.substring(2)}`));
              doc.moveDown(0.2);
            } else {
              doc.fillColor("#111827").fontSize(10).font("Helvetica").text(sanitizePdfText(cleanLine));
              doc.moveDown(0.2);
            }
          });

          doc.moveDown(1);
          lastUserMsg = null;
        }
      });

      // Concluding Quick Revision Page
      doc.addPage();
      doc.fillColor("#dc2626");
      doc.fontSize(18).font("Helvetica-Bold").text("Quick Revision Guidance");
      doc.moveDown(1);

      doc.fillColor("#111827");
      doc.fontSize(11).font("Helvetica").text(sanitizePdfText("- Re-read each Q&A in this guide end-to-end once."));
      doc.moveDown(0.4);
      doc.text(sanitizePdfText("- Pay extra attention to 10/15/20-mark answers - these are the most likely long-answer questions in the exam."));
      doc.moveDown(0.4);
      doc.text(sanitizePdfText("- Use the 'Exam Tomorrow' and 'PYQ Intelligence' modes in the app to drill predicted questions again."));
      doc.moveDown(0.4);
      doc.text(sanitizePdfText("- For diagrams, refer to your uploaded UVCE notes (the app won't invent them)."));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function build_placeholder_syllabus(semester: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      doc.fillColor("#0a0a0b");
      doc.fontSize(24).font("Helvetica-Bold").text(`UVCE — Semester ${semester} Syllabus`, { align: "center" });
      doc.moveDown(1);

      doc.fillColor("#48484a");
      doc.fontSize(10).font("Helvetica-Oblique").text(`Auto-generated placeholder syllabus · ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}`, { align: "center" });
      doc.moveDown(2);

      doc.fillColor("#111827");
      doc.fontSize(11).font("Helvetica").text(
        "This is a placeholder PDF generated by the UVCE ExamMate AI backend. You can replace it by uploading the real syllabus PDF via the Community Knowledge Base panel or notes uploader.",
        { lineGap: 4 }
      );
      doc.moveDown(1.5);

      doc.fillColor("#f5b800");
      doc.fontSize(14).font("Helvetica-Bold").text("Subjects in this semester:");
      doc.moveDown(1);

      const subjects = SUBJECTS_MAP[semester] ?? [];
      subjects.forEach(([code, name]) => {
        doc.fillColor("#111827");
        doc.fontSize(11).font("Helvetica-Bold").text(sanitizePdfText(`-  ${code}`), { continued: true });
        doc.font("Helvetica").text(sanitizePdfText(` - ${name}`));
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

const SUBJECTS_MAP: Record<number, [string, string][]> = {
  1: [
    ["BSC101", "Engineering Mathematics-I"],
    ["BSC102", "Engineering Physics"],
    ["ESC101", "Problem Solving with C"],
    ["ESC102", "Basic Electrical Engineering"],
  ],
  2: [
    ["BSC201", "Engineering Mathematics-II"],
    ["BSC202", "Engineering Chemistry"],
    ["ESC201", "Python Programming"],
    ["ESC202", "Basic Electronics"],
  ],
  3: [
    ["BCS301", "Data Structures"],
    ["BCS302", "Discrete Mathematical Structures"],
    ["BCS303", "Digital Computer Organization"],
    ["BCS304", "OOP with Java"],
  ],
  4: [
    ["BCS401", "Operating Systems"],
    ["BCS402", "Design and Analysis of Algorithms"],
    ["BCS403", "Database Management Systems"],
    ["BCS404", "Microprocessor and Microcontroller"],
  ],
  5: [
    ["BCS501", "Computer Networks"],
    ["BCS502", "Theory of Computation"],
    ["BCS503", "Software Engineering"],
    ["BCS504", "Machine Learning"],
  ],
  6: [
    ["BCS601", "Cloud Computing"],
    ["BCS602", "Compiler Design"],
    ["BCS603", "Information Security"],
    ["BCS604", "Web Technologies"],
  ],
  7: [
    ["BCS701", "Artificial Intelligence"],
    ["BCS702", "Distributed Systems"],
    ["BCS703", "Deep Learning"],
    ["BCS704", "Project Phase-I"],
  ],
  8: [
    ["BCS801", "Internet of Things"],
    ["BCS802", "Blockchain Technology"],
    ["BCS803", "Project Work Phase-II"],
    ["BCS804", "Internship"],
  ],
};
