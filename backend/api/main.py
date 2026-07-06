from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Раздаём статику (index.html и т.д.) из корня проекта
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/api/hello")
async def hello():
    return {"message": "Привет с FastAPI!"}
