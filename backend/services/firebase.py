"""
Firebase / Firestore service.
Handles all task persistence. Falls back to in-memory store
when running without Firebase credentials (local dev / demo mode).
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from models.task import Task, TaskCreate, TaskUpdate, TaskStatus, Priority

# ── Firebase setup ───────────────────────────────────────────────────────────
_db = None
_DEMO_MODE = False


def _init_firebase():
    global _db, _DEMO_MODE
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not cred_json and (not cred_path or not os.path.exists(cred_path)):
        print("[WARN] Firebase credentials not found — running in DEMO MODE (in-memory store)")
        _DEMO_MODE = True
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        import json
        
        if not firebase_admin._apps:
            if cred_json:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
            else:
                cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
        print("[OK] Firebase connected")
    except Exception as e:
        print(f"[WARN] Firebase init failed ({e}) — running in DEMO MODE")
        _DEMO_MODE = True


_init_firebase()

# ── In-memory fallback (demo mode) ───────────────────────────────────────────
_memory_store: dict[str, dict] = {}  # task_id → task dict


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Public API ────────────────────────────────────────────────────────────────

async def get_tasks(user_id: str) -> list[Task]:
    if _DEMO_MODE:
        tasks = [
            Task(**v) for v in _memory_store.values()
            if v.get("user_id") == user_id
        ]
        return sorted(tasks, key=lambda t: t.created_at, reverse=True)

    docs = _db.collection("tasks").where("user_id", "==", user_id).stream()
    return [Task(**doc.to_dict()) for doc in docs]


async def get_task(task_id: str, user_id: str) -> Optional[Task]:
    if _DEMO_MODE:
        data = _memory_store.get(task_id)
        if data and data.get("user_id") == user_id:
            return Task(**data)
        return None

    doc = _db.collection("tasks").document(task_id).get()
    if doc.exists:
        data = doc.to_dict()
        if data.get("user_id") == user_id:
            return Task(**data)
    return None


async def create_task(user_id: str, payload: TaskCreate) -> Task:
    task = Task(
        id=str(uuid.uuid4()),
        user_id=user_id,
        **payload.model_dump()
    )
    data = task.model_dump()

    if _DEMO_MODE:
        _memory_store[task.id] = data
        return task

    _db.collection("tasks").document(task.id).set(data)
    return task


async def update_task(task_id: str, user_id: str, payload: TaskUpdate) -> Optional[Task]:
    task = await get_task(task_id, user_id)
    if not task:
        return None

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = _now()

    if _DEMO_MODE:
        _memory_store[task_id].update(updates)
        return Task(**_memory_store[task_id])

    _db.collection("tasks").document(task_id).update(updates)
    return await get_task(task_id, user_id)


async def delete_task(task_id: str, user_id: str) -> bool:
    task = await get_task(task_id, user_id)
    if not task:
        return False

    if _DEMO_MODE:
        _memory_store.pop(task_id, None)
        return True

    _db.collection("tasks").document(task_id).delete()
    return True


async def save_agent_tasks(user_id: str, tasks: list[Task]) -> None:
    """Bulk upsert tasks returned by the agent."""
    for task in tasks:
        task.user_id = user_id
        data = task.model_dump()
        if _DEMO_MODE:
            _memory_store[task.id] = data
        else:
            _db.collection("tasks").document(task.id).set(data, merge=True)


async def increment_reschedule_count(task_id: str, user_id: str) -> None:
    task = await get_task(task_id, user_id)
    if not task:
        return
    new_count = task.reschedule_count + 1
    if _DEMO_MODE:
        _memory_store[task_id]["reschedule_count"] = new_count
    else:
        _db.collection("tasks").document(task_id).update(
            {"reschedule_count": new_count, "updated_at": _now()}
        )
