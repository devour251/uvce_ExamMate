"""Build the Subject Preparation Guide PDF from the current session."""
from __future__ import annotations
import io
import re
from html import escape
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
)

from app.core.config import settings


def _markdown_to_flowables(md: str, styles):
    """Very small markdown → ReportLab flowables converter.
    Handles headings, bullets, bold, code, paragraphs.
    """
    flowables = []
    lines = md.splitlines()
    para: list[str] = []

    def flush():
        if not para:
            return
        text = " ".join(para).strip()
        if text:
            flowables.append(Paragraph(escape(text), styles["GuideBody"]))
        para.clear()

    for raw in lines:
        line = raw.rstrip()
        if not line:
            flush()
            flowables.append(Spacer(1, 0.2 * cm))
            continue
        if line.startswith("# "):
            flush()
            flowables.append(Paragraph(escape(line[2:].strip()), styles["H1"]))
            continue
        if line.startswith("## "):
            flush()
            flowables.append(Paragraph(escape(line[3:].strip()), styles["H2"]))
            continue
        if line.startswith("### "):
            flush()
            flowables.append(Paragraph(escape(line[4:].strip()), styles["H3"]))
            continue
        if re.match(r"^\s*[-*]\s+", line):
            flush()
            content = re.sub(r"^\s*[-*]\s+", "", line)
            flowables.append(Paragraph("- " + escape(content), styles["GuideBullet"]))
            continue
        if re.match(r"^\s*\d+\.\s+", line):
            flush()
            content = re.sub(r"^\s*\d+\.\s+", "", line)
            flowables.append(Paragraph(escape(content), styles["GuideNumbered"]))
            continue
        para.append(line)
    flush()
    return flowables


def build_study_guide(
    *,
    subject_name: str,
    subject_code: str,
    messages: list[dict],
) -> bytes:
    """messages: list of {role, content, mode?, marks?}"""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Subject Preparation Guide",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            "Cover",
            parent=styles["Title"],
            fontSize=32,
            leading=40,
            textColor=colors.HexColor("#0a0a0b"),
            spaceAfter=24,
        )
    )
    styles.add(
        ParagraphStyle(
            "H1", parent=styles["Heading1"], textColor=colors.HexColor("#dc2626"),
            spaceBefore=18, spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            "H2", parent=styles["Heading2"], textColor=colors.HexColor("#f5b800"),
            spaceBefore=12, spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            "H3", parent=styles["Heading3"], textColor=colors.HexColor("#1f2937"),
            spaceBefore=10, spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "GuideBody", parent=styles["BodyText"], fontSize=10.5, leading=14,
            textColor=colors.HexColor("#111827"), spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            "GuideBullet", parent=styles["GuideBody"], leftIndent=14, bulletIndent=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "GuideNumbered", parent=styles["GuideBody"], leftIndent=14, bulletIndent=4,
        )
    )

    story = []
    # cover
    story.append(Paragraph("UVCE ExamMate AI", styles["Cover"]))
    story.append(Paragraph(escape(f"{subject_code} - {subject_name}"), styles["H1"]))
    story.append(Paragraph("Subject Preparation Guide", styles["H2"]))
    story.append(Paragraph(
        f"Generated on {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
        styles["GuideBody"]
    ))
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph(
        "This guide was auto-generated from your study session. "
        "It contains every question you asked and the AI's exam-oriented "
        "answer, plus a consolidated revision section at the end.",
        styles["GuideBody"]
    ))
    story.append(PageBreak())

    # Q&A index
    story.append(Paragraph("Contents", styles["H1"]))
    table_data = [["#", "Question", "Mode", "Marks"]]
    question_number = 1
    for m in messages:
        if m["role"] != "user":
            continue
        q = m["content"][:60] + ("..." if len(m["content"]) > 60 else "")
        table_data.append([str(question_number), q, m.get("mode", "-"), m.get("marks", "-")])
        question_number += 1
    if len(table_data) > 1:
        t = Table(table_data, colWidths=[1 * cm, 11 * cm, 3 * cm, 2 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5b800")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0a0a0b")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9ca3af")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(t)
    story.append(PageBreak())

    # Q&A detail
    story.append(Paragraph("Detailed Q&A", styles["H1"]))
    pair = []
    for m in messages:
        if m["role"] == "user":
            pair = [m]
        elif m["role"] == "assistant" and pair:
            q = pair[0]
            story.append(Paragraph(
                escape(f"Q ({q.get('mode','-')} - {q.get('marks','-')}): {q['content']}"),
                styles["H2"]
            ))
            story.extend(_markdown_to_flowables(m["content"], styles))
            story.append(Spacer(1, 0.5 * cm))
            pair = []

    # revision notes
    if any(m["role"] == "assistant" for m in messages):
        story.append(PageBreak())
        story.append(Paragraph("Quick Revision", styles["H1"]))
        story.append(Paragraph(
            "- Re-read each Q&A in this guide end-to-end once.<br/>"
            "- Pay extra attention to 10/15/20-mark answers - these are "
            "  the most likely long-answer questions in the exam.\n"
            "- Use the 'Exam Tomorrow' and 'PYQ Intelligence' modes in the "
            "  app to drill predicted questions again.\n"
            "- For diagrams, refer to your uploaded UVCE notes (the app "
            "  won't invent them).",
            styles["GuideBody"]
        ))

    doc.build(story)
    return buf.getvalue()


def save_study_guide(filename: str, payload: bytes) -> str:
    out_dir = Path(settings.data_dir) / "generated"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / filename
    out.write_bytes(payload)
    return str(out)
