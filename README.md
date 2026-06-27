# DeadlineZero ⚡
 
> An autonomous AI productivity agent that proactively detects deadline risks and acts before you miss them.
 
Built for **Vibe2Ship Hackathon** · PS1: The Last-Minute Life Saver · Coding Ninjas × Google for Developers
 
---
 
## 🎯 Problem
 
Students, professionals, and entrepreneurs miss deadlines not because they forget — but because existing tools only remind passively. A notification is easy to ignore. DeadlineZero doesn't remind. It **acts**.
 
## 🤖 What Makes It Different
 
Most productivity apps wait for you to ask. DeadlineZero's AI agent:
 
- **Scans your schedule on every session start** — no prompting needed
- **Detects conflicts autonomously** — "You have 4 hours of work and 2 hours free today"
- **Breaks vague tasks into subtasks** automatically
- **Flags procrastination** — "You've rescheduled 'Study DSA' 3 times"
- **Replans your day** when something goes late
- **Gives an end-of-day debrief** with tomorrow's priority plan
---
 
## 🧠 Agentic Architecture
 
```
User Input (text or voice)
        ↓
Gemini 1.5 Flash receives full task context
        ↓
Agent autonomously selects and calls tools:
 
  parse_tasks()          → extract tasks from natural language
  detect_conflicts()     → find scheduling issues proactively  
  generate_subtasks()    → break large tasks into steps
  reschedule()           → replan when things go late
  flag_procrastination() → detect repeated pushbacks
  generate_debrief()     → end-of-day summary + tomorrow plan
        ↓
FastAPI executes tool → writes to Firestore → returns result
        ↓
React dashboard updates in real time
```
 
---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Gemini Agentic Core** | Autonomous tool-calling AI that detects conflicts and reschedules tasks proactively |
| 📅 **Google Calendar Sync** | Reads your real Google Calendar and treats events as "Hard Blocks" for scheduling |
| ✉️ **Auto-Draft Emails** | Agent drafts extension request emails on your behalf with one-click send |
| 🔥 **Burnout & Procrastination Analytics** | Visual health widget tracking overload risk and reschedule patterns |
| 🔊 **Voice Assistant** | Google Assistant-style announcements for all notifications and agent replies |
| 💀 **Deadline Notifications** | Browser + in-app toast alerts at 24h, 6h, and 1h before deadlines |
| 🔒 **Focus Mode** | Single-task view to eliminate distractions |
| ✨ **Demo Seed Data** | Pre-loaded tasks for judges to see a populated dashboard immediately |

---

## 🛠️ Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | Gemini 1.5 Flash — function calling |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| Voice | Web Speech API (browser native) |
| Deploy | Google AI Studio + Render |
 
## 🔵 Google Technologies Used
 
- **Gemini 1.5 Flash** — core AI agent with function calling
- **Google AI Studio** — deployment platform
- **Firebase Authentication** — Google Sign-In
- **Firebase Firestore** — real-time task persistence
- **google-genai SDK** — official Python client
---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- A Firebase project with Firestore and Google Auth enabled
- A Google Gemini API key

### 1. Clone the repo
```bash
git clone https://github.com/Arushsh/DeadlineZero-AI-Productivity-Agent.git
cd DeadlineZero-AI-Productivity-Agent
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/serviceAccountKey.json
```

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

---

## 🔑 Google Calendar Setup

To enable Calendar integration:
1. Enable the **Google Calendar API** in Google Cloud Console.
2. In **APIs & Services → OAuth Consent Screen**, add your email as a **Test User**.
3. Log out and log back in — the app will request calendar access.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend (React)            │
│  Dashboard → ChatPanel → AgentApi → FastAPI │
└────────────────────┬────────────────────────┘
                     │ HTTP + Firebase ID Token
┌────────────────────▼────────────────────────┐
│               Backend (FastAPI)              │
│  /agent/chat  → AgentService → Gemini API   │
│  /tasks/*     → Firestore                   │
│  Calendar fetch via Google Calendar API     │
└─────────────────────────────────────────────┘
```

---

## 👨‍💻 Author
 
**Arush Vishwakarma**  
B.Tech CS · Shambhunath Institute of Engineering and Technology  
GitHub: [@Arushsh](https://github.com/Arushsh)
 
---
 
*Vibe2Ship Hackathon 2026 · Coding Ninjas × Google for Developers*
