"""Subject catalog for UVCE.

UVCE is autonomous so the subject list is free-form. The frontend
sends whatever subject the user typed; this endpoint just echoes
back a small seed list to make the UI usable. The real source of
truth is what the user types.
"""
from fastapi import APIRouter, Query
from app.models.schemas import Subject, Semester

router = APIRouter()

# Minimal seed — users typically type their own subject name anyway.
CATALOG: dict[int, list[Subject]] = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
}


@router.get("/subjects", response_model=list[Subject])
def list_subjects(semester: Semester = Query(...)):
    """Returns the seed catalog for the given semester.

    UVCE is autonomous, so users typically type their own subject
    name in the chat/upload UI. This endpoint just returns an empty
    list (or whatever seed is configured) for the dropdown.
    """
    return CATALOG.get(semester, [])
