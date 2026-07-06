from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
import uuid
import hmac
import hashlib
import urllib.parse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== База данных ====================
DATABASE_URL = os.getenv("DATABASE_URL", "")
# Render иногда даёт postgres://, SQLAlchemy хочет postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = None
SessionLocal = None
Base = declarative_base()

if DATABASE_URL:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database connected")
else:
    logger.warning("⚠️ DATABASE_URL not set, using in-memory storage")


# ==================== Модели ====================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    referrer_id = Column(Integer, nullable=True)
    subscription_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.telegram_id"), nullable=False)
    plan_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.now)
    confirmed_at = Column(DateTime, nullable=True)

class Plan(Base):
    __tablename__ = "plans"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)


# ==================== Lifespan ====================
    # Shutdown
    if engine:
        engine.dispose()



def init_db():
    """Lazy DB initialization"""
    global engine, SessionLocal
    if engine is not None:
        return
    if not DATABASE_URL:
        logger.error("DATABASE_URL not set")
        return
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            if db.query(Plan).count() == 0:
                db.add_all([
                    Plan(id="7days", name="7 дней", duration_days=7, price=79),
                    Plan(id="1month", name="1 месяц", duration_days=30, price=199),
                    Plan(id="3month", name="3 месяца", duration_days=90, price=499),
                    Plan(id="6month", name="6 месяцев", duration_days=180, price=899),
                    Plan(id="12month", name="12 месяцев", duration_days=365, price=1599),
                ])
                db.commit()
        finally:
            db.close()
        logger.info("DB initialized with tables and plans")
    except Exception as e:
        logger.error(f"DB init error: {e}")
        engine = None
        SessionLocal = None


# Вызываем init_db при старте
init_db()

app = FastAPI()

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

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]


# ==================== Утилиты ====================
def get_db():
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="Database not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
            return json.loads(parsed.get("user", "{}")) if 'json' in dir() else __import__('json').loads(parsed.get("user", "{}"))
        return None
    except Exception as e:
        logger.error(f"initData verify error: {e}")
        return None

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


# ==================== Middleware ====================
@app.middleware("http")
async def log_and_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        return JSONResponse(status_code=429, content={"error": "Too many requests"})
    response = await call_next(request)
    if response.status_code >= 400:
        logger.warning(f"IP={client_ip} {request.method} {request.url.path} → {response.status_code}")
    return response


# ==================== Модели Pydantic ====================
class RegisterUser(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    referrer_id: int | None = None

class CreatePayment(BaseModel):
    user_id: int
    plan_id: str
    amount: float


# ==================== Роуты ====================
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
        "db_connected": engine is not None,
        "admin_configured": len(ADMIN_IDS) > 0,
    }

@app.get("/api/users/{telegram_id}")
async def get_user(telegram_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == telegram_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "referrer_id": user.referrer_id,
            "subscription_until": user.subscription_until.isoformat() if user.subscription_until else None,
            "created_at": user.created_at.isoformat(),
        }
    finally:
        db.close()

@app.post("/api/users/register")
async def register_user(data: RegisterUser):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == data.telegram_id).first()
        if user:
            return {
                "telegram_id": user.telegram_id,
                "username": user.username,
                "first_name": user.first_name,
                "subscription_until": user.subscription_until.isoformat() if user.subscription_until else None,
            }
        user = User(
            telegram_id=data.telegram_id,
            username=data.username,
            first_name=data.first_name,
            referrer_id=data.referrer_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "subscription_until": None,
        }
    finally:
        db.close()

@app.get("/api/users/referral/stats/{telegram_id}")
async def referral_stats(telegram_id: int):
    db = SessionLocal()
    try:
        refs = db.query(User).filter(User.referrer_id == telegram_id).all()
        return {
            "telegram_id": telegram_id,
            "referral_count": len(refs),
            "referrals": [
                {"telegram_id": r.telegram_id, "first_name": r.first_name, "username": r.username}
                for r in refs
            ],
            "referral_link": f"https://t.me/gigantvpn_bot?start=ref_{telegram_id}",
        }
    finally:
        db.close()

@app.get("/api/plans")
async def get_plans():
    db = SessionLocal()
    try:
        plans = db.query(Plan).all()
        return [
            {"id": p.id, "name": p.name, "duration_days": p.duration_days, "price": p.price}
            for p in plans
        ]
    finally:
        db.close()

@app.post("/api/payments/create")
async def create_payment(data: CreatePayment):
    db = SessionLocal()
    try:
        payment = Payment(
            user_id=data.user_id,
            plan_id=data.plan_id,
            amount=data.amount,
            status="pending",
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return {
            "payment_id": payment.id,
            "user_id": payment.user_id,
            "plan_id": payment.plan_id,
            "amount": payment.amount,
            "status": payment.status,
        }
    finally:
        db.close()

@app.post("/api/payments/confirm/{payment_id}")
async def confirm_payment(payment_id: str):
    db = SessionLocal()
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        payment.status = "confirmed"
        payment.confirmed_at = datetime.now()
        db.commit()

        # Активируем подписку
        user = db.query(User).filter(User.telegram_id == payment.user_id).first()
        if user:
            plan = db.query(Plan).filter(Plan.id == payment.plan_id).first()
            days = plan.duration_days if plan else 30
            base = user.subscription_until if user.subscription_until and user.subscription_until > datetime.now() else datetime.now()
            user.subscription_until = base + timedelta(days=days)
            db.commit()
        return {"ok": True, "payment_id": payment.id, "status": "confirmed"}
    finally:
        db.close()

@app.post("/api/admin/grant")
async def admin_grant(request: Request):
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Bot token not configured")
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    import json as _json
    user = verify_telegram_init_data(init_data)
    if not user or user.get("id") not in ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Forbidden")

    body = await request.json()
    target_id = body.get("telegram_id")
    days = body.get("days", 30)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == target_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        base = user.subscription_until if user.subscription_until and user.subscription_until > datetime.now() else datetime.now()
        user.subscription_until = base + timedelta(days=days)
        db.commit()
        return {"ok": True, "subscription_until": user.subscription_until.isoformat()}
    finally:
        db.close()

