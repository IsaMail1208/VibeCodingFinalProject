# Vibe Chat

Short description: a simple educational chat website with a **FastAPI** REST API, **SQLite** storage, and a minimal HTML/CSS/JS frontend. Built for the Vibe Coding final project.

## Features

- User registration, user list, user search (by username/email)
- 1:1 messaging, chat history
- Message search inside a conversation; API filters by sender/receiver/conversation
- Web UI: login/register screen, user list, chat window, message polling
- Extras: dark mode, “typing…” hint, emoji support, **Docker**

## Tech Stack

- Python 3.12+, FastAPI, Uvicorn
- SQLAlchemy 2, SQLite
- Pydantic, passlib (pbkdf2_sha256)
- Frontend: static files (no bundler)
- Tests: pytest, httpx (TestClient)

## Run Locally

```powershell
cd "c:\Users\user\Desktop\Salymbekov University\2 курс\VibeCodingFinalProject"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open in browser: `http://127.0.0.1:8000/`

Tests:

```powershell
pytest -q
```

Docker:

```powershell
docker build -t vibe-chat .
docker run -p 8000:8000 vibe-chat
```

## Live Website

**https://vibe-chat-hw8z.onrender.com**

## Demo Video (YouTube)

**https://youtu.be/oI9_1NhzgVo**

## Screenshots

_Add images to the repo (for example `docs/screenshot.png`) and link them here._

## Submission

- Public GitHub repository with the full source code
- Email to **kyrgyzstanait@gmail.com** with subject: `Vibe Coding Final Project – Your Full Name`
- Follow the deadline from the assignment

## GitHub (publish)

This project already includes a `.gitignore`. If you haven't pushed it to GitHub yet:

```powershell
cd "c:\Users\user\Desktop\Salymbekov University\2 курс\VibeCodingFinalProject"

# 1) Create a new empty repo on GitHub (Public)
# 2) Add remote and push
git remote add origin https://github.com/<username>/<repo>.git
git branch -M main
git push -u origin main
```

If GitHub asks for authentication, use GitHub CLI or a Personal Access Token.

## Render (deploy)

Recommended option — **Blueprint** using `render.yaml` (already included in this repo):

1) Push the code to GitHub (public repository)
2) Open Render → **New** → **Blueprint**
3) Select your repository and confirm
4) After deploy, open the site and check `/api/health`

If the build fails on `pydantic-core` / Rust: make sure Render uses a stable Python with prebuilt wheels. This repo pins `PYTHON_VERSION=3.12.3` in `render.yaml`.

SQLite note: Render’s filesystem may be ephemeral, so data can reset after rebuild/redeploy. If you need persistence, attach a **persistent disk** and set `DATA_DIR`, or use a managed Postgres.

Manual setup (without Blueprint):

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## API (quick reference)

| Method | Path | Description |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/users` | Register user |
| GET | `/api/users?q=` | List/search users |
| GET | `/api/users/{id}` | Get a single user |
| POST | `/api/messages` | Send a message |
| GET | `/api/messages/conversation/{a}/{b}?search=` | Conversation history between two users |
| GET | `/api/messages` | List messages with filters `sender_id`, `receiver_id`, `user_a`+`user_b`, `search` |

Interactive docs: `http://127.0.0.1:8000/docs`
