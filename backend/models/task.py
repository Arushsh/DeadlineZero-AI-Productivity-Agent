from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"


class Subtask(BaseModel):
    id: str
    title: str
    completed: bool = False
    estimated_minutes: int = 30


class Task(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None          # ISO string
    priority: Priority = Priority.medium
    status: TaskStatus = TaskStatus.pending
    estimated_minutes: int = 60
    subtasks: List[Subtask] = []
    tags: List[str] = []
    reschedule_count: int = 0               # tracks procrastination
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Priority = Priority.medium
    estimated_minutes: int = 60
    tags: List[str] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    estimated_minutes: Optional[int] = None
    tags: Optional[List[str]] = None


class AgentRequest(BaseModel):
    user_id: str
    message: str
    tasks: List[Task] = []                  # current task list for context


class AgentResponse(BaseModel):
    message: str                            # AI response text
    actions_taken: List[str] = []          # list of tools called
    updated_tasks: List[Task] = []         # tasks modified by agent
    alerts: List[str] = []                 # proactive warnings
    debrief: Optional[str] = None          # end-of-day summary if generated


class ConflictAlert(BaseModel):
    type: str                              # "overload" | "deadline_clash" | "no_time"
    severity: str                          # "warning" | "critical"
    message: str
    affected_task_ids: List[str] = []


class ProcrastinationFlag(BaseModel):
    task_id: str
    task_title: str
    reschedule_count: int
    suggestion: str
