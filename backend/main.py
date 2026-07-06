from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
import os

app = FastAPI()

# backend/main.py → /opt/render/project/src/backend/main.py
# BASE_DIR = /opt/render/project/src/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "frontend", "index.html")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "base_dir": BASE_DIR,
        "index_path": INDEX_PATH,
        "index_exists": os.path.exists(INDEX_PATH),
    }


@app.get("/api/ls")
async def list_files():
    items = []
    for entry in sorted(os.listdir(BASE_DIR)):
        full = os.path.join(BASE_DIR, entry)
        if os.path.isdir(full):
            items.append(f"[DIR]  {entry}/")
        else:
            size = os.path.getsize(full)
            items.append(f"[FILE] {entry} ({size} bytes)")
    return {"base_dir": BASE_DIR, "items": items}


@app.get("/")
async def read_index():
    if not os.path.exists(INDEX_PATH):
        return JSONResponse(
            status_code=404,
            content={
                "error": "index.html not found",
                "expected": INDEX_PATH,
                "items_in_base": os.listdir(BASE_DIR),
            }
        )
    return FileResponse(INDEX_PATH)
