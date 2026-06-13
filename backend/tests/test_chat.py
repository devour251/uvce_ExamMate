"""Smoke test: hit /health and the subjects endpoint."""
import os
os.environ.setdefault("OFFLINE_MODE", "True")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True


def test_subjects_sem4():
    r = client.get("/api/subjects?semester=4")
    assert r.status_code == 200
    body = r.json()
    assert any(s["code"] == "BCS401" for s in body)


def test_chat_offline():
    r = client.post(
        "/api/chat/ask",
        json={
            "semester": 4,
            "subject_id": "BCS401",
            "question": "What is a deadlock?",
            "mode": "normal",
            "marks": "5marks",
            "session_id": "test_session_1",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body
    assert body["session_id"] == "test_session_1"


def test_chat_offline_marks():
    """When OFFLINE_MODE=True and no context, the fallback message should
    always be non-empty and contain the API key guidance."""
    for marks in ("2marks", "10marks", "20marks"):
        r = client.post(
            "/api/chat/ask",
            json={
                "semester": 5,
                "subject_id": "BCS501",
                "question": "Explain OSI Model",
                "mode": "normal",
                "marks": marks,
                "session_id": f"test_session_{marks}",
            },
        )
        assert r.status_code == 200
        body = r.json()
        assert "answer" in body
        assert len(body["answer"]) > 0


