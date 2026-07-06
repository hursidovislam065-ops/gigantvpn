from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import uuid
import hmac
import hashlib
import urllib.parse
import logging
import json
import aiohttp
from collections import defaultdict
from time import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]

engine = None
SessionLocal = None
Base = declarative_base()


# ============ МОДЕЛИ ============
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    referrer_id = Column(Integer, nullable=True)
    subscription_until = Column(DateTime, nullable=True)
    vpn_key = Column(String, nullable=True)  # VPN-ключ
    vpn_key_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False)
    plan_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="RUB")
    method = Column(String, default="stars")  # stars, crypto, manual
    status = Column(String, default="pending")
    external_id = Column(String, nullable=True)  # ID платежа в Stars/CryptoBot
    created_at = Column(DateTime, default=datetime.now)
    confirmed_at = Column(DateTime, nullable=True)

class Plan(Base):
    __tablename__ = "plans"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    price_stars = Column(Integer, default=0)  # Цена в Telegram Stars
    active = Column(Boolean, default=True)


# ============ ИНИЦИАЛИЗАЦИЯ БД ============
def init_db():
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
                    Plan(id="7days", name="7 дней", duration_days=7, price=79, price_stars=75),
                    Plan(id="1month", name="1 месяц", duration_days=30, price=199, price_stars=190),
                    Plan(id="3month", name="3 месяца", duration_days=90, price=499, price_stars=475),
                    Plan(id="6month", name="6 месяцев", duration_days=180, price=899, price_stars=850),
                    Plan(id="12month", name="12 месяцев", duration_days=365, price=1599, price_stars=1500),
                ])
                db.commit()
                logger.info("✅ Default plans inserted")
        finally:
            db.close()
        logger.info("✅ DB ready")
    except Exception as e:
        logger.error(f"❌ DB init: {e}")
        engine = None
        SessionLocal = None

init_db()


# ============ FASTAPI ============
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


# ============ УТИЛИТЫ ============
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
            return json.loads(parsed.get("user", "{}"))
        return None
    except Exception as e:
        logger.error(f"initData verify error: {e}")
        return None

rate_limit_store = defaultdict(list)

def check_rate_limit(ip: str, max_requests: int = 30, window: int = 60) -> bool:
    now = time()
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < window]
    if len(rate_limit_store[ip]) >= max_requests:
        return False
    rate_limit_store[ip].append(now)
    return True

async def send_telegram_message(chat_id: int, text: str):
    """Отправка сообщения через Telegram Bot API"""
    if not BOT_TOKEN:
        return False
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }) as resp:
                return resp.status == 200
    except Exception as e:
        logger.error(f"Send TG message error: {e}")
        return False


# ============ MIDDLEWARE ============
@app.middleware("http")
async def log_and_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        return JSONResponse(status_code=429, content={"error": "Too many requests"})
    response = await call_next(request)
    if response.status_code >= 400:
        logger.warning(f"IP={client_ip} {request.method} {request.url.path} → {response.status_code}")
    return response


# ============ MODELS ============
class RegisterUser(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    referrer_id: int | None = None

class CreatePayment(BaseModel):
    user_id: int
    plan_id: str
    amount: float

class AdminGrantRequest(BaseModel):
    telegram_id: int
    days: int = 30


# ============ ROUTES ============
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
        "db_connected": SessionLocal is not None,
        "admin_configured": len(ADMIN_IDS) > 0,
        "bot_configured": bool(BOT_TOKEN),
    }

# ----- Users -----
@app.get("/api/users/{telegram_id}")
async def get_user(telegram_id: int):
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
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
            "vpn_key": user.vpn_key,
            "vpn_key_sent": user.vpn_key_sent,
            "created_at": user.created_at.isoformat(),
        }
    finally:
        db.close()

@app.post("/api/users/register")
async def register_user(data: RegisterUser):
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == data.telegram_id).first()
        if user:
            return {
                "telegram_id": user.telegram_id,
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
        return {"telegram_id": user.telegram_id, "subscription_until": None}
    finally:
        db.close()

@app.get("/api/users/referral/stats/{telegram_id}")
async def referral_stats(telegram_id: int):
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        refs = db.query(User).filter(User.referrer_id == telegram_id).all()
        return {
            "telegram_id": telegram_id,
            "referral_count": len(refs),
            "referrals": [{"telegram_id": r.telegram_id, "first_name": r.first_name} for r in refs],
            "referral_link": f"https://t.me/gigantvpn_bot?start=ref_{telegram_id}",
        }
    finally:
        db.close()

# ----- Plans -----
@app.get("/api/plans")
async def get_plans():
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        plans = db.query(Plan).filter(Plan.active == True).order_by(Plan.duration_days).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "duration_days": p.duration_days,
                "price": p.price,
                "price_stars": p.price_stars,
            }
            for p in plans
        ]
    finally:
        db.close()

# ----- Payments -----
@app.post("/api/payments/create")
async def create_payment(data: CreatePayment):
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        plan = db.query(Plan).filter(Plan.id == data.plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        payment = Payment(
            user_id=data.user_id,
            plan_id=data.plan_id,
            amount=data.amount,
            status="pending",
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        # Создаём invoice link для Telegram Stars
        invoice_url = None
        if BOT_TOKEN:
            invoice_url = await create_stars_invoice(
                payment.id, plan.price_stars, plan.name
            )
        return {
            "payment_id": payment.id,
            "user_id": payment.user_id,
            "plan_id": payment.plan_id,
            "amount": payment.amount,
            "price_stars": plan.price_stars,
            "status": payment.status,
            "invoice_url": invoice_url,
        }
    finally:
        db.close()

async def create_stars_invoice(payment_id: str, stars: int, plan_name: str) -> str:
    """Создаёт invoice link для оплаты в Telegram Stars"""
    if not BOT_TOKEN or stars <= 0:
        return None
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/createInvoiceLink"
    payload = {
        "title": f"VPN {plan_name}",
        "description": f"Подписка на VPN — {plan_name}",
        "payload": payment_id,
        "currency": "XTR",  # XTR = Telegram Stars
        "prices": [{"label": plan_name, "amount": stars}],
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as resp:
                data = await resp.json()
                if data.get("ok"):
                    return data["result"]
                logger.error(f"createInvoiceLink error: {data}")
    except Exception as e:
        logger.error(f"Invoice error: {e}")
    return None


@app.post("/api/payments/confirm/{payment_id}")
async def confirm_payment(payment_id: str):
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status == "confirmed":
            return {"ok": True, "already_confirmed": True}
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
            # Генерируем VPN-ключ
            if not user.vpn_key:
                user.vpn_key = f"vpn-{user.telegram_id}-{uuid.uuid4().hex[:8]}"
            db.commit()
            # Отправляем ключ в Telegram
            if not user.vpn_key_sent and BOT_TOKEN:
                success = await send_telegram_message(
                    user.telegram_id,
                    f"🎉 Подписка активирована!\n\n"
                    f"📅 До: {user.subscription_until.strftime('%d.%m.%Y')}\n"
                    f"🔑 Ваш VPN-ключ: <code>{user.vpn_key}</code>\n\n"
                    f"Инструкция: импортируйте ключ в WireGuard/AmneziaVPN"
                )
                if success:
                    user.vpn_key_sent = True
                    db.commit()
        return {"ok": True, "payment_id": payment.id, "status": "confirmed"}
    finally:
        db.close()

# ----- Telegram webhook (для Stars) -----
@app.post("/api/telegram-webhook")
async def telegram_webhook(request: Request):
    """Webhook для Telegram — сюда приходят платежи"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Bot not configured")
    try:
        body = await request.json()
        logger.info(f"TG webhook: {body}")
        # Обработка pre_checkout_query
        if "pre_checkout_query" in body:
            query_id = body["pre_checkout_query"]["id"]
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/answerPreCheckoutQuery"
            async with aiohttp.ClientSession() as session:
                await session.post(url, json={"pre_checkout_query_id": query_id, "ok": True})
            return {"ok": True}
        # Обработка successful_payment
        if "message" in body and "successful_payment" in body["message"]:
            payment = body["message"]["successful_payment"]
            payload = payment.get("invoice_payload")  # это наш payment_id
            if payload:
                # Подтверждаем платёж
                async with aiohttp.ClientSession() as session:
                    await session.post(
                        f"https://gigantvpn-1.onrender.com/api/payments/confirm/{payload}"
                    )
        return {"ok": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"ok": False, "error": str(e)}

# ----- Admin -----
@app.post("/api/admin/grant")
async def admin_grant(req: Request):
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Bot not configured")
    init_data = req.headers.get("X-Telegram-Init-Data", "")
    user = verify_telegram_init_data(init_data)
    if not user or user.get("id") not in ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await req.json()
    target_id = body.get("telegram_id")
    days = body.get("days", 30)
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.telegram_id == target_id).first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        base = u.subscription_until if u.subscription_until and u.subscription_until > datetime.now() else datetime.now()
        u.subscription_until = base + timedelta(days=days)
        if not u.vpn_key:
            u.vpn_key = f"vpn-{u.telegram_id}-{uuid.uuid4().hex[:8]}"
        db.commit()
        if BOT_TOKEN:
            await send_telegram_message(
                u.telegram_id,
                f"🎁 Вам выдана подписка на {days} дней!\n"
                f"📅 До: {u.subscription_until.strftime('%d.%m.%Y')}\n"
                f"🔑 VPN-ключ: <code>{u.vpn_key}</code>"
            )
        return {"ok": True, "subscription_until": u.subscription_until.isoformat()}
    finally:
        db.close()

@app.get("/api/admin/users")
async def admin_users(req: Request):
    """Список всех пользователей (только для админа)"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Bot not configured")
    init_data = req.headers.get("X-Telegram-Init-Data", "")
    user = verify_telegram_init_data(init_data)
    if not user or user.get("id") not in ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).limit(200).all()
        return [
            {
                "telegram_id": u.telegram_id,
                "username": u.username,
                "first_name": u.first_name,
                "subscription_until": u.subscription_until.isoformat() if u.subscription_until else None,
                "vpn_key": u.vpn_key,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ]
    finally:
        db.close()

@app.get("/api/admin/stats")
async def admin_stats(req: Request):
    """Статистика для админа"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Bot not configured")
    init_data = req.headers.get("X-Telegram-Init-Data", "")
    user = verify_telegram_init_data(init_data)
    if not user or user.get("id") not in ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="DB not configured")
    db = SessionLocal()
    try:
        total_users = db.query(User).count()
        active_subs = db.query(User).filter(User.subscription_until > datetime.now()).count()
        total_payments = db.query(Payment).filter(Payment.status == "confirmed").count()
        revenue = db.query(Payment).filter(Payment.status == "confirmed").all()
        revenue_sum = sum(p.amount for p in revenue)
        return {
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "total_payments": total_payments,
            "revenue": revenue_sum,
            "currency": "RUB",
        }
    finally:
        db.close()
