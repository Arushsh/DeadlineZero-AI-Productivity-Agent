"""
DeadlineZero — FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Ensure the backend directory is on the Python path
# so all imports (models, services, routers, tools) resolve correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import tasks, agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up the agent (loads Gemini client) on startup
    try:
        from services.agent import get_agent
        get_agent()
        print("[OK] Agent ready")
    except Exception as e:
        print(f"[WARN] Agent init warning: {e}")
    yield


app = FastAPI(
    title="DeadlineZero API",
    description="Autonomous AI productivity agent — Vibe2Ship Hackathon",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow frontend dev server + AI Studio deploy
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",     # Vite dev
        "http://localhost:3000",
        "https://*.aistudio.google.com",
        "https://*.web.app",         # Firebase Hosting
        "https://*.firebaseapp.com",
        "*"                          # open for hackathon demo; restrict in prod
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(agent.router)


@app.get("/")
async def root():
    return {
        "app": "DeadlineZero",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}