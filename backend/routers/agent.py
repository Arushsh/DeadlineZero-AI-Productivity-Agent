from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timedelta, timezone
import httpx

from models.task import AgentRequest, AgentResponse
from services.agent import get_agent
from services import firebase as db

router = APIRouter(prefix="/agent", tags=["agent"])


def _get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="x-user-id header required")
    return x_user_id


async def fetch_calendar_events(token: str) -> str:
    """Fetch events for the next 7 days from Google Calendar API."""
    if not token:
        return ""
    
    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=7)).isoformat()
    
    url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events"
    params = {
        "timeMin": time_min,
        "timeMax": time_max,
        "singleEvents": "true",
        "orderBy": "startTime",
    }
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if not items:
                    return "No upcoming calendar events."
                
                lines = ["Upcoming Calendar Events (HARD BLOCKS):"]
                for e in items:
                    start = e.get("start", {}).get("dateTime") or e.get("start", {}).get("date")
                    end = e.get("end", {}).get("dateTime") or e.get("end", {}).get("date")
                    summary = e.get("summary", "Busy")
                    lines.append(f" - {summary}: from {start} to {end}")
                return "\n".join(lines)
            else:
                print(f"[WARN] Failed to fetch calendar: {resp.status_code} {resp.text}")
                return ""
    except Exception as e:
        print(f"[ERROR] Calendar fetch error: {e}")
        return ""


@router.post("/chat", response_model=AgentResponse)
async def chat(
    body: AgentRequest,
    x_user_id: Optional[str] = Header(None),
    x_google_token: Optional[str] = Header(None)
):
    """
    Main agent endpoint.
    - Loads current tasks from Firestore
    - Sends to Gemini with full context
    - Saves any tasks created/modified by the agent
    - Returns AI response + alerts + updated tasks
    """
    user_id = _get_user_id(x_user_id)
    body.user_id = user_id

    # Load fresh task list if not provided by client
    if not body.tasks:
        body.tasks = await db.get_tasks(user_id)

    # Inject calendar events if available
    calendar_context = await fetch_calendar_events(x_google_token)
    if calendar_context:
        body.message = f"{body.message}\n\n[CALENDAR CONTEXT]\n{calendar_context}\nDo not schedule tasks during these blocks."

    try:
        agent = get_agent()
        response = await agent.run(body)
    except Exception as e:
        print(f"[ERROR] chat endpoint: {e}")
        response = AgentResponse(
            message="The AI agent encountered an error. Your tasks are safe — please try again in a moment.",
            alerts=[f"[WARN] Agent error: {str(e)[:120]}"],
        )

    # Persist any tasks the agent created or modified
    if response.updated_tasks:
        await db.save_agent_tasks(user_id, response.updated_tasks)

    return response


@router.post("/session-start", response_model=AgentResponse)
async def session_start(
    x_user_id: Optional[str] = Header(None),
    x_google_token: Optional[str] = Header(None)
):
    """
    Called when the user opens the app.
    Agent proactively runs detect_conflicts + flag_procrastination
    without any user prompt.
    """
    user_id = _get_user_id(x_user_id)
    tasks = await db.get_tasks(user_id)

    calendar_context = await fetch_calendar_events(x_google_token)
    cal_prompt = f"\n\n[CALENDAR CONTEXT]\n{calendar_context}\nDo not schedule tasks during these blocks." if calendar_context else ""

    request = AgentRequest(
        user_id=user_id,
        message=(
            "Session starting. Proactively scan all my tasks: "
            "detect any conflicts or impossible deadlines (especially against my calendar if provided), "
            "flag any tasks I've been procrastinating on, "
            f"and give me a quick status summary.{cal_prompt}"
        ),
        tasks=tasks
    )

    try:
        agent = get_agent()
        response = await agent.run(request)
    except Exception as e:
        print(f"[ERROR] session-start endpoint: {e}")
        response = AgentResponse(
            message="Session scan skipped — AI agent temporarily unavailable. Your tasks loaded normally.",
        )

    if response.updated_tasks:
        await db.save_agent_tasks(user_id, response.updated_tasks)

    return response


@router.post("/debrief", response_model=AgentResponse)
async def debrief(x_user_id: Optional[str] = Header(None)):
    """End-of-day debrief endpoint."""
    user_id = _get_user_id(x_user_id)
    tasks = await db.get_tasks(user_id)

    request = AgentRequest(
        user_id=user_id,
        message="Generate my end-of-day debrief. Summarise what I completed, what's at risk tomorrow, give me one productivity insight, and plan tomorrow.",
        tasks=tasks
    )

    try:
        agent = get_agent()
        return await agent.run(request)
    except Exception as e:
        print(f"[ERROR] debrief endpoint: {e}")
        return AgentResponse(
            message="Debrief unavailable — AI agent temporarily offline. Check back soon!",
        )
