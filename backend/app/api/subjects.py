from typing import cast

from fastapi import APIRouter, Query
from app.models.schemas import Subject, Semester

router = APIRouter()

SUBJECT_CATALOG = {
    1: [
        ("BSC101", "Engineering Mathematics-I"),
        ("BSC102", "Engineering Physics"),
        ("ESC101", "Problem Solving with C"),
        ("ESC102", "Basic Electrical Engineering"),
    ],

    2: [
        ("BSC201", "Engineering Mathematics-II"),
        ("BSC202", "Engineering Chemistry"),
        ("ESC201", "Python Programming"),
        ("ESC202", "Basic Electronics"),
    ],

    3: [
        ("BCS301", "Data Structures"),
        ("BCS302", "Discrete Mathematical Structures"),
        ("BCS303", "Digital Computer Organization"),
        ("BCS304", "OOP with Java"),
    ],

    4: [
        ("BCS401", "Operating Systems"),
        ("BCS402", "Design and Analysis of Algorithms"),
        ("BCS403", "Database Management Systems"),
        ("BCS404", "Microprocessor and Microcontroller"),
    ],

    5: [
        ("BCS501", "Computer Networks"),
        ("BCS502", "Theory of Computation"),
        ("BCS503", "Software Engineering"),
        ("BCS504", "Machine Learning"),
    ],

    6: [
        ("BCS601", "Cloud Computing"),
        ("BCS602", "Compiler Design"),
        ("BCS603", "Information Security"),
        ("BCS604", "Web Technologies"),
    ],

    7: [
        ("BCS701", "Artificial Intelligence"),
        ("BCS702", "Distributed Systems"),
        ("BCS703", "Deep Learning"),
        ("BCS704", "Project Phase-I"),
    ],

    8: [
        ("BCS801", "Internet of Things"),
        ("BCS802", "Blockchain Technology"),
        ("BCS803", "Project Phase-II"),
        ("BCS804", "Internship"),
    ],
}


@router.get("/subjects", response_model=list[Subject])
def list_subjects(semester: int = Query(..., ge=1, le=8)):
    return [
        Subject(
            id=code,
            code=code,
            name=name,
            semester=cast(Semester, semester),
        )
        for code, name in SUBJECT_CATALOG.get(semester, [])
    ]
