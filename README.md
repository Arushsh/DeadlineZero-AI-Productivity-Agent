# ⚡ DeadlineZero — AI Productivity Agent

**DeadlineZero** is an autonomous AI productivity agent that helps you **never miss a deadline**. It uses Google Gemini to proactively manage tasks, detect conflicts, draft emails, and adapt your schedule in real-time.

Built for the **Vibe2Ship Hackathon 2026** 🏆

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

## 🛠 Tech Stack

- **Frontend:** React (Vite), Tailwind CSS v4, Firebase Auth
- **Backend:** FastAPI (Python), Google Gemini API (`google-genai` SDK)
- **Database:** Google Firestore
- **Auth:** Firebase Google OAuth (with Calendar scope)

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

## 📄 License

MIT © Arush — Built for Vibe2Ship Hackathon 2026
