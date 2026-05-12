from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import messages, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vibe Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(messages.router)

static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/")
def spa_index():
    index = static_dir / "index.html"
    if index.is_file():
        return FileResponse(index)
    return {"detail": "Frontend not built. Add static/index.html"}
