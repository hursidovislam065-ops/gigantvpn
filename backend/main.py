from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import json
import uuid

app = FastAPI()

# CORS — чтобы фронтенд мог обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "frontend", "index.html")
DB_PATH = os.path.join(BASE_DIR, "gigantvpn.db")

# ============== Простое хранилище в JSON (замена БД для MVP) ==============
USERS_FILE = os.path.join(BASE_DIR, "users.json")
PAYMENTS_FILE = os.path.join(BASE_DIR, "payments.json")

def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ============== Модели ==============
class RegisterUser(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    referrer_id: int | None = None

class CreatePayment(BaseModel):
    user_id: int
    plan_id: str
    amount: float

# ============== Главная ==============
@app.get("/")
async def read_index():
    if not os.path.exists(INDEX_PATH):
        return JSONResponse(status_code=404, content={"error": "not found"})
    return FileResponse(INDEX_PATH)

# ============== Users ==============
@app.get("/api/users/{telegram_id}")
async def get_user(telegram_id: int):
    users = load_json(USERS_FILE, {})
    user = users.get(str(telegram_id))
    if not user:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    return user

@app.post("/api/users/register")
async def register_user(data: RegisterUser):
    users = load_json(USERS_FILE, {})
    tid = str(data.telegram_id)
    if tid in users:
        return users[tid]
    user = {
        "telegram_id": data.telegram_id,
        "username": data.username,
        "first_name": data.first_name,
        "referrer_id": data.referrer_id,
        "subscription_until": None,
        "created_at": datetime.now().isoformat(),
    }
    users[tid] = user
    save_json(USERS_FILE, users)
    return user

@app.get("/api/users/referral/stats/{telegram_id}")
async def referral_stats(telegram_id: int):
    users = load_json(USERS_FILE, {})
    refs = [u for u in users.values() if u.get("referrer_id") == telegram_id]
    return {
        "telegram_id": telegram_id,
        "referral_count": len(refs),
        "referrals": refs,
        "referral_link": f"https://t.me/gigantvpn_bot?start=ref_{telegram_id}",
    }

# ============== Plans ==============
@app.get("/api/plans")
async def get_plans():
    return [
        {"id": "1month", "name": "1 месяц", "duration_days": 30, "price": 199},
        {"id": "3month", "name": "3 месяца", "duration_days": 90, "price": 499},
        {"id": "6month", "name": "6 месяцев", "duration_days": 180, "price": 899},
        {"id": "12month", "name": "12 месяцев", "duration_days": 365, "price": 1599},
    ]

# ============== Payments ==============
@app.post("/api/payments/create")
async def create_payment(data: CreatePayment):
    payment_id = str(uuid.uuid4())
    payment = {
        "payment_id": payment_id,
        "user_id": data.user_id,
        "plan_id": data.plan_id,
        "amount": data.amount,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
    }
    payments = load_json(PAYMENTS_FILE, {})
    payments[payment_id] = payment
    save_json(PAYMENTS_FILE, payments)
    return payment

@app.post("/api/payments/confirm/{payment_id}")
async def confirm_payment(payment_id: str):
    payments = load_json(PAYMENTS_FILE, {})
    payment = payments.get(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment["status"] = "confirmed"
    payment["confirmed_at"] = datetime.now().isoformat()
    payments[payment_id] = payment
    save_json(PAYMENTS_FILE, payments)
    
    # Активируем подписку пользователю
    users = load_json(USERS_FILE, {})
    user = users.get(str(payment["user_id"]))
    if user:
        sub_end = datetime.now() + timedelta(days=30)
        user["subscription_until"] = sub_end.isoformat()
        users[str(payment["user_id"])] = user
        save_json(USERS_FILE, users)
    
    return payment

# ============== Health ==============
@app.get("/api/health")
async def health():
    return {"status": "ok", "index_exists": os.path.exists(INDEX_PATH)}
