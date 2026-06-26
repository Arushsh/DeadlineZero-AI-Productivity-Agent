"""
DeadlineZero Agent Service
Gemini 2.5 Flash with autonomous function calling (google-genai SDK).

Resilience strategy:
  1. Try primary model (gemini-2.5-flash) first.
  2. On failure, wait briefly and try fallback models.
  3. On rate-limit (429), back off for a few seconds before retrying.
  4. If ALL models fail, return a graceful degraded response instead of crashing.
"""

import asyncio
import json
import uuid
import os
import urllib.parse
from datetime import datetime, timezone
from typing import Any

from google import genai
from google.genai import types
from google.genai.errors import ClientError

from models.task import (
    AgentRequest, AgentResponse, Task, Subtask,
    Priority, TaskStatus
)
from tools.agent_tools import AGENT_TOOLS


# ── Model fallback chain ─────────────────────────────────────────────────────
# Ordered from best to most widely available. We'll try each in sequence.
MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
]

# How long (seconds) to wait before retrying a rate-limited model
RATE_LIMIT_BACKOFF = 2


# ── Schema helpers ───────────────────────────────────────────────────────────

def _build_tool() -> types.Tool:
    """Convert AGENT_TOOLS list into a single Gemini Tool object."""
    declarations = []
    for t in AGENT_TOOLS:
        props = {}
        for pname, pdef in t["parameters"].get("properties", {}).items():
            props[pname] = _dict_to_schema(pdef)

        declarations.append(
            types.FunctionDeclaration(
                name=t["name"],
                description=t["description"],
                parameters=types.Schema(
                    type="OBJECT",
                    properties=props,
                    required=t["parameters"].get("required", [])
                )
            )
        )
    return types.Tool(function_declarations=declarations)


def _dict_to_schema(d: dict) -> types.Schema:
    """Recursively convert a JSON schema dict to types.Schema."""
    dtype = d.get("type", "string").upper()
    kwargs = {}

    if "description" in d:
        kwargs["description"] = d["description"]
    if "enum" in d:
        kwargs["enum"] = d["enum"]

    if dtype == "ARRAY":
        items_schema = _dict_to_schema(d.get("items", {"type": "string"}))
        return types.Schema(type="ARRAY", items=items_schema, **kwargs)

    if dtype == "OBJECT":
        props = {}
        for k, v in d.get("properties", {}).items():
            props[k] = _dict_to_schema(v)
        return types.Schema(
            type="OBJECT",
            properties=props,
            required=d.get("required", []),
            **kwargs
        )

    return types.Schema(type=dtype, **kwargs)


def _build_system_prompt(now: str) -> str:
    return f"""You are DeadlineZero, an autonomous AI productivity agent.
Current datetime: {now}

Your job is to proactively help users manage tasks and NEVER let them miss a deadline.
You are NOT a passive chatbot — you take action using the available tools.

RULES:
1. On every session start, ALWAYS call detect_conflicts() and flag_procrastination() first.
2. When the user describes tasks in natural language, call parse_tasks().
3. When a task sounds large or vague, call generate_subtasks().
4. When the user says something is late or asks for replanning, call reschedule().
5. When the user asks for a debrief, call generate_debrief().
6. After calling tools, give a clear, concise natural language response.
7. Be direct and proactive. Surface risks before the user asks.
8. Keep responses short — this is a productivity app, not a chat.
"""


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%A, %d %B %Y %H:%M UTC")


# ── Graceful degraded response (used when all models are unavailable) ────────

def _degraded_response(request: AgentRequest) -> AgentResponse:
    """
    Returns a helpful offline response so the app never shows a white screen
    even when Gemini is rate-limited or unreachable.
    """
    task_count = len(request.tasks)
    pending = [t for t in request.tasks if getattr(t, "status", "") != "completed"]
    critical = [t for t in pending if getattr(t, "priority", "") == "critical"]

    lines = [
        "I'm temporarily offline (Gemini rate limit or service hiccup).",
        "",
        f"Quick task summary from your data:",
        f"  - Total tasks: {task_count}",
        f"  - Pending: {len(pending)}",
        f"  - Critical: {len(critical)}",
    ]

    if critical:
        lines.append("")
        lines.append("Critical tasks needing immediate attention:")
        for t in critical[:3]:
            dl = f" — due {t.deadline}" if getattr(t, "deadline", None) else ""
            lines.append(f"  * {t.title}{dl}")

    lines += [
        "",
        "The AI features will resume automatically once the API is available again.",
        "Your tasks are safe and all manual features still work normally.",
    ]

    return AgentResponse(
        message="\n".join(lines),
        alerts=["[WARN] AI agent temporarily offline — Gemini rate limit. Manual task management still works."] if critical else [],
        updated_tasks=[],
        actions_taken=[],
    )


# ── AgentService ─────────────────────────────────────────────────────────────

class AgentService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        self.client = genai.Client(api_key=api_key)
        self.tool = _build_tool()
        # The working model will be discovered at first call and cached
        self._working_model: str | None = None
        print("[OK] Gemini agent ready (google-genai SDK)")

    def _tasks_context(self, tasks: list[Task]) -> str:
        if not tasks:
            return "No tasks yet."
        lines = []
        for t in tasks:
            line = (
                f"- [{t.id}] {t.title} | priority:{t.priority} | "
                f"status:{t.status} | deadline:{t.deadline or 'none'} | "
                f"est:{t.estimated_minutes}min | rescheduled:{t.reschedule_count}x"
            )
            lines.append(line)
        return "\n".join(lines)

    def _handle_tool_call(
        self,
        fn_name: str,
        fn_args: dict,
        tasks: list[Task],
        response: AgentResponse
    ) -> dict:
        response.actions_taken.append(fn_name)

        if fn_name == "parse_tasks":
            created = []
            for raw in fn_args.get("tasks", []):
                new_task = Task(
                    id=str(uuid.uuid4()),
                    user_id="pending",
                    title=raw["title"],
                    deadline=raw.get("deadline"),
                    priority=raw.get("priority", "medium"),
                    estimated_minutes=raw.get("estimated_minutes", 60),
                    tags=raw.get("tags", []),
                )
                response.updated_tasks.append(new_task)
                created.append(new_task.title)
            return {"parsed": created, "count": len(created)}

        elif fn_name == "detect_conflicts":
            conflicts = fn_args.get("conflicts", [])
            for c in conflicts:
                msg = f"[{c['severity'].upper()}] {c['message']}"
                response.alerts.append(msg)
            return {"conflict_count": len(conflicts)}

        elif fn_name == "generate_subtasks":
            task_id = fn_args.get("task_id")
            raw_subs = fn_args.get("subtasks", [])
            parent = next((t for t in tasks if t.id == task_id), None)
            if parent:
                subtasks = [
                    Subtask(
                        id=str(uuid.uuid4()),
                        title=s["title"],
                        estimated_minutes=s.get("estimated_minutes", 30)
                    )
                    for s in raw_subs
                ]
                parent.subtasks = subtasks
                parent.estimated_minutes = sum(s.estimated_minutes for s in subtasks)
                response.updated_tasks.append(parent)
                return {"task_id": task_id, "subtask_count": len(subtasks)}
            return {"error": f"Task {task_id} not found"}

        elif fn_name == "reschedule":
            updates = fn_args.get("updates", [])
            summary = fn_args.get("summary", "")
            task_map = {t.id: t for t in tasks}
            for upd in updates:
                tid = upd.get("task_id")
                if tid in task_map:
                    t = task_map[tid]
                    if upd.get("new_priority"):
                        t.priority = upd["new_priority"]
                    t.reschedule_count += 1
                    t.updated_at = datetime.now(timezone.utc).isoformat()
                    response.updated_tasks.append(t)
            if summary:
                response.alerts.append(f"Reschedule: {summary}")
            return {"updated_count": len(updates), "summary": summary}

        elif fn_name == "flag_procrastination":
            flags = fn_args.get("flags", [])
            for f in flags:
                msg = (
                    f"[WARN] '{f['task_title']}' rescheduled {f['reschedule_count']}x — "
                    f"{f['suggestion']}"
                )
                response.alerts.append(msg)
            return {"flag_count": len(flags)}

        elif fn_name == "generate_debrief":
            parts = [
                f"Today: {fn_args.get('completed_summary', '')}",
                f"Insight: {fn_args.get('productivity_insight', '')}",
                f"Tomorrow: {fn_args.get('tomorrow_plan', '')}",
            ]
            response.debrief = "\n\n".join(parts)
            return {"debrief_generated": True}

        elif fn_name == "draft_email":
            recipient = fn_args.get("recipient", "")
            email_address = fn_args.get("email_address", "")
            subject = fn_args.get("subject", "")
            body = fn_args.get("body", "")

            # Create URL-encoded mailto link
            params = {"subject": subject, "body": body}
            query = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
            mailto_link = f"mailto:{email_address}?{query}"

            alert_msg = f"[ACTION] Email drafted to {recipient}. <a href='{mailto_link}' target='_blank'>Click to Send</a>"
            response.alerts.append(alert_msg)
            return {"email_drafted": True, "mailto_link": mailto_link}

        return {"error": f"Unknown tool: {fn_name}"}

    async def _call_model(self, model: str, contents, config) -> Any:
        """
        Attempt a single model call with retry logic for rate limits (429).
        Returns the response or raises the last exception.
        """
        for attempt in range(2):          # up to 2 attempts per model
            try:
                return await self.client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
            except ClientError as e:
                status = getattr(e, "status_code", None) or getattr(e, "code", None)
                msg = str(e)

                # 429 = quota/rate limit — brief backoff then retry once
                if status == 429 or "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    if attempt == 0:
                        print(f"[WARN] Model {model} rate-limited (429), backing off {RATE_LIMIT_BACKOFF}s...")
                        await asyncio.sleep(RATE_LIMIT_BACKOFF)
                        continue
                raise   # non-recoverable error — let caller try next model
            except Exception:
                raise

    async def run(self, request: AgentRequest) -> AgentResponse:
        response = AgentResponse(message="")
        task_context = self._tasks_context(request.tasks)

        contents = [
            types.Content(
                role="user",
                parts=[types.Part(text=(
                    f"{_build_system_prompt(_now())}\n\n"
                    f"Current tasks:\n{task_context}\n\n"
                    f"User: {request.message}"
                ))]
            )
        ]

        config = types.GenerateContentConfig(
            tools=[self.tool],
            temperature=0.3,
        )

        # Build the model list: try the last-known-working model first
        models_to_try = list(dict.fromkeys(
            ([self._working_model] if self._working_model else []) + MODEL_CHAIN
        ))

        # Agentic loop — keep processing function calls until text response
        max_turns = 6
        for turn in range(max_turns):
            gemini_resp = None
            last_error = None

            for model in models_to_try:
                try:
                    gemini_resp = await self._call_model(model, contents, config)
                    # Cache the working model for subsequent calls this session
                    if self._working_model != model:
                        print(f"[OK] Using model: {model}")
                        self._working_model = model
                    break
                except Exception as e:
                    last_error = e
                    print(f"[WARN] Model {model} failed: {type(e).__name__}: {str(e)[:120]}")
                    continue

            if gemini_resp is None:
                # All models failed — return graceful degraded response
                print(f"[WARN] All models unavailable. Returning degraded response. Last error: {last_error}")
                return _degraded_response(request)

            # Guard: make sure we have candidates
            if not gemini_resp.candidates:
                print("[WARN] Empty candidates list from Gemini — returning degraded response.")
                return _degraded_response(request)

            candidate = gemini_resp.candidates[0]

            # Guard: handle missing content (e.g. safety-filtered response)
            if not candidate.content or not candidate.content.parts:
                finish = getattr(candidate, "finish_reason", "unknown")
                response.message = f"Response was filtered or empty (finish_reason: {finish}). Please rephrase."
                break

            parts = candidate.content.parts

            # Check for function calls
            fn_calls = [p for p in parts if p.function_call and p.function_call.name]

            if not fn_calls:
                # Final text response
                text_parts = [p.text for p in parts if p.text]
                response.message = " ".join(text_parts).strip()
                break

            # Add model turn to history
            contents.append(types.Content(role="model", parts=parts))

            # Execute all function calls and collect results
            fn_result_parts = []
            for part in fn_calls:
                fn_name = part.function_call.name
                fn_args = dict(part.function_call.args)
                result = self._handle_tool_call(fn_name, fn_args, request.tasks, response)
                fn_result_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=fn_name,
                            response=result
                        )
                    )
                )

            # Add tool results as user turn
            contents.append(types.Content(role="user", parts=fn_result_parts))

        if not response.message:
            response.message = "Done. Tasks updated and issues flagged above."

        return response


# ── Singleton ─────────────────────────────────────────────────────────────────

_agent: AgentService | None = None


def get_agent() -> AgentService:
    global _agent
    if _agent is None:
        _agent = AgentService()
    return _agent
