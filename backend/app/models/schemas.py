"""Pydantic models for the API."""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field

AnswerType = Literal["2marks", "5marks", "10marks", "15marks", "20marks"]
Mode = Literal["normal", "exam_tomorrow", "pyq_intelligence", "internal_analysis", "viva"]
Semester = Literal[1, 2, 3, 4, 5, 6, 7, 8]


class Subject(BaseModel):
    id: str
    semester: Semester
    code: str
    name: str
    syllabus_pdf_url: str | None = None


class AskRequest(BaseModel):
    semester: Semester
    subject_id: str
    question: str
    mode: Mode = "normal"
    marks: AnswerType = "10marks"
    session_id: str


class Source(BaseModel):
    source: str
    page: int | None = None
    score: float | None = None
    snippet: str | None = None


class Confidence(BaseModel):
    topic: str
    score: int = Field(ge=0, le=100)


class AskResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    confidence: list[Confidence] = []
    session_id: str
    message_id: str


class GeneratePdfRequest(BaseModel):
    session_id: str
    subject_id: str
