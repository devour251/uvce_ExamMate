"""In-process session store (no permanent chat history per spec)."""
from __future__ import annotations
import threading
import time
from collections import defaultdict
from typing import Any


class SessionStore:
    def __init__(self, ttl_seconds: int = 60 * 60 * 4):
        self._data: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._lock = threading.Lock()
        self._ttl = ttl_seconds
        self._last_seen: dict[str, float] = {}

    def append(self, session_id: str, message: dict[str, Any]) -> None:
        with self._lock:
            self._data[session_id].append(message)
            self._last_seen[session_id] = time.time()

    def get(self, session_id: str) -> list[dict[str, Any]]:
        self._gc()
        with self._lock:
            return list(self._data.get(session_id, []))

    def _gc(self) -> None:
        now = time.time()
        with self._lock:
            stale = [k for k, t in self._last_seen.items() if now - t > self._ttl]
            for k in stale:
                self._data.pop(k, None)
                self._last_seen.pop(k, None)


store = SessionStore()
