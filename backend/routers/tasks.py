from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from models.task import Task, TaskCreate, TaskUpdate
from services import firebase as db

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _get_user_id(x_user_id: Optional[str]) -> str:
    """
    In production this would verify a Firebase JWT.
    For hackathon demo, we accept x-user-id header directly.
    Replace with Firebase Admin token verification for production.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="x-user-id header required")
    return x_user_id


@router.get("/", response_model=list[Task])
async def list_tasks(x_user_id: Optional[str] = Header(None)):
    user_id = _get_user_id(x_user_id)
    return await db.get_tasks(user_id)


@router.post("/", response_model=Task, status_code=201)
async def create_task(
    payload: TaskCreate,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _get_user_id(x_user_id)
    return await db.create_task(user_id, payload)


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str, x_user_id: Optional[str] = Header(None)):
    user_id = _get_user_id(x_user_id)
    task = await db.get_task(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    x_user_id: Optional[str] = Header(None)
):
    user_id = _get_user_id(x_user_id)
    task = await db.update_task(task_id, user_id, payload)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, x_user_id: Optional[str] = Header(None)):
    user_id = _get_user_id(x_user_id)
    deleted = await db.delete_task(task_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/{task_id}/complete", response_model=Task)
async def complete_task(task_id: str, x_user_id: Optional[str] = Header(None)):
    user_id = _get_user_id(x_user_id)
    task = await db.update_task(task_id, user_id, TaskUpdate(status="completed"))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/reschedule", response_model=Task)
async def reschedule_task(task_id: str, x_user_id: Optional[str] = Header(None)):
    """Increment reschedule counter — used for procrastination tracking."""
    user_id = _get_user_id(x_user_id)
    await db.increment_reschedule_count(task_id, user_id)
    task = await db.get_task(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
