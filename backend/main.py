from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import json
import uuid
import hmac
import hashlib
import urllib.parse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS — только свои домены
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gigantvpn-1.onrender.com",
        "https://gigantvpn.onrender.com",
        "https://t.me",
        "https://web.telegram.org",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "frontend", "index.html")
USERS_FILE = os.path.join(BASE_DIR, "users.json")
PAYMENTS_FILE = os.path.join(BASE_DIR, "payments.json")

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]


# ============ Утилиты ============
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

def verify_telegram_init_data(init_data: str):
    if not BOT_TOKEN or not init_data:
        return None
    try:
        parsed = dict(urllib.parse.parse_qsl(init_data))
        hash_value = parsed.pop("hash", None)
        if not hash_value:
            return None
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if calculated == hash_value:
            user_data = json.loads(parsed.get("user", "{}"))
            return user_data
        return None
    except Exception as e:
        logger.error(f"initData verify error: {e}")
        return None

# Простой rate limit (in-memory)
from collections import defaultdict
from time import time
rate_limit_store = defaultdict(list)

def check_rate_limit(ip: str, max_requests: int = 30, window: int = 60) -> bool:
    now = time()
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < window]
    if len(rate_limit_store[ip]) >= max_requests:
        return False
    rate_limit_store[ip].append(now)
    return True


# ============ Middleware ============
@app.middleware("http")
async def log_and_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        return JSONResponse(status_code=429, content={"error": "Too many requests"})
    response = await call_next(request)
    if response.status_code >= 400:
        logger.warning(f"IP={client_ip} {request.method} {request.url.path} → {response.status_code}")
    return response


# ============ Модели ============
class RegisterUser(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    referrer_id: int | None = None

class CreatePayment(BaseModel):
    user_id: int
    plan_id: str
    amount: float


# ============ Роуты ============
@app.get("/")
async def read_index():
    if not os.path.exists(INDEX_PATH):
        return JSONResponse(status_code=404, content={"error": "index.html not found"})
    return FileResponse(INDEX_PATH)

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "index_exists": os.path.exists(INDEX_PATH),
        "admin_configured": len(ADMIN_IDS) > 0,
    }

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

@app.get("/api/plans")
async def get_plans():
    return [
        {"id": "1month", "name": "1 месяц", "duration_days": 30, "price": 199},
        {"id": "3month", "name": "3 месяца", "duration_days": 90, "price": 499},
        {"id": "6month", "name": "6 месяцев", "duration_days": 180, "price": 899},
        {"id": "12month", "name": "12 месяцев", "duration_days": 365, "price": 1599},
    ]

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

    users = load_json(USERS_FILE, {})
    user = users.get(str(payment["user_id"]))
    if user:
        sub_end = datetime.now() + timedelta(days=30)
        user["subscription_until"] = sub_end.isoformat()
        users[str(payment["user_id"])] = user
        save_json(USERS_FILE, users)
    return payment

@app.post("/api/admin/grant")
async def admin_grant(request: Request):
    """Выдача подписки админом"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Bot token not configured")
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    user = verify_telegram_init_data(init_data)
    if not user or user.get("id") not in ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    target_id = body.get("telegram_id")
    days = body.get("days", 30)
    users = load_json(USERS_FILE, {})
    target = users.get(str(target_id))
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    sub_end = datetime.now() + timedelta(days=days)
    target["subscription_until"] = sub_end.isoformat()
    users[str(target_id)] = target
    save_json(USERS_FILE, users)
    return {"ok": True, "subscription_until": sub_end.isoformat()}
