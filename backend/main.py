from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import traceback

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "frontend", "index.html")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "base_dir": BASE_DIR,
        "index_exists": os.path.exists(INDEX_PATH),
    }


@app.get("/api/ls")
async def list_files():
    files = []
    if os.path.exists(BASE_DIR):
        for item in os.listdir(BASE_DIR):
            full = os.path.join(BASE_DIR, item)
            if os.path.isdir(full):
                files.append(f"[DIR]  {item}/")
            else:
                files.append(f"[FILE] {item}")
    return {"base_dir": BASE_DIR, "items": files}


@app.get("/")
async def read_index():
    if not os.path.exists(INDEX_PATH):
        return JSONResponse(
            status_code=404,
            content={
                "error": "index.html not found",
                "expected": INDEX_PATH,
                "base_dir": BASE_DIR,
                "items_in_base": os.listdir(BASE_DIR) if os.path.exists(BASE_DIR) else [],
            }
        )
    return FileResponse(INDEX_PATH)
