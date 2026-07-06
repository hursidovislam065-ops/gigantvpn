from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
import os

app = FastAPI()

# backend/main.py → backend/ → корень проекта
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@app.get("/")
async def read_index():
    """Главная страница — отдаёт index.html"""
    index_path = os.path.join(BASE_DIR, "frontend", "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse("<h1>index.html not found at: " + index_path + "</h1>", status_code=404)
    return FileResponse(index_path)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/hello")
async def hello():
    return {"message": "Привет с FastAPI бэкенда!"}
