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
