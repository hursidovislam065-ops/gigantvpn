import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta
from urllib.parse import unquote

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, init_db, async_session
from models import User, Plan, Payment, Device

app = FastAPI(title="GigantVPN API")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://gigantvpn-fci34x0rq-hursidovislam065-ops-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    telegram_id: int
    username: str = ""
    first_name: str = ""

class LinkEmailRequest(BaseModel):
    telegram_id: int
    email: str

class UnlinkEmailRequest(BaseModel):
    telegram_id: int

class AutoRenewRequest(BaseModel):
    telegram_id: int
    enabled: bool

class CreatePaymentRequest(BaseModel):
    user_id: int
    amount: float
    description: str = ""

class AddDeviceRequest(BaseModel):
    name: str
    platform: str = "unknown"


# ── Seed plans on startup ─────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await init_db()
    async with async_session() as db:
        result = await db.execute(select(Plan))
        if not result.scalars().first():
            plans = [
                Plan(name="7 дней", price=79, days=7, per_day="11.3"),
                Plan(name="1 месяц", price=199, days=30, per_day="6.6"),
                Plan(name="3 месяца", price=539, days=90, badge="−10%", per_day="6.0"),
                Plan(name="6 месяцев", price=999, days=180, badge="−16%", per_day="5.6"),
                Plan(name="12 месяцев", price=1799, days=365, badge="−25%", per_day="4.9"),
            ]
            db.add_all(plans)
            await db.commit()


# ── Auth ───────────────────────────────────────────────────────────

@app.post("/api/auth/verify")
async def verify_auth(body: dict, db: AsyncSession = Depends(get_db)):
    init_data = body.get("init_data", "")
    # In production: verify HMAC-SHA256 hash using bot token
    # For now, accept all requests
    return {"verified": True, "user_id": 0}


# ── Users ──────────────────────────────────────────────────────────

@app.get("/api/users/{telegram_id}")
async def get_user(telegram_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "email": user.email,
        "balance": user.balance,
        "subscription_until": user.subscription_until.isoformat() if user.subscription_until else None,
        "devices_count": user.devices_count,
        "network": user.network,
        "is_trial": user.is_trial,
        "trial_ends_at": user.trial_ends_at.isoformat() if user.trial_ends_at else None,
        "auto_renew": user.auto_renew,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@app.post("/api/users/register")
async def register_user(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    existing = result.scalar_one_or_none()
    if existing:
        return {
            "id": existing.id,
            "telegram_id": existing.telegram_id,
            "username": existing.username,
            "first_name": existing.first_name,
            "email": existing.email,
            "balance": existing.balance,
            "subscription_until": existing.subscription_until.isoformat() if existing.subscription_until else None,
            "devices_count": existing.devices_count,
            "network": existing.network,
            "is_trial": existing.is_trial,
            "trial_ends_at": existing.trial_ends_at.isoformat() if existing.trial_ends_at else None,
            "auto_renew": existing.auto_renew,
            "created_at": existing.created_at.isoformat() if existing.created_at else None,
        }

    referral_code = secrets.token_hex(4)
    trial_end = datetime.utcnow() + timedelta(days=3)

    user = User(
        telegram_id=body.telegram_id,
        username=body.username,
        first_name=body.first_name,
        referral_code=referral_code,
        is_trial=True,
        trial_ends_at=trial_end,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "email": user.email,
        "balance": user.balance,
        "subscription_until": user.subscription_until.isoformat() if user.subscription_until else None,
        "devices_count": user.devices_count,
        "network": user.network,
        "is_trial": user.is_trial,
        "trial_ends_at": user.trial_ends_at.isoformat() if user.trial_ends_at else None,
        "auto_renew": user.auto_renew,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@app.post("/api/users/link-email")
async def link_email(body: LinkEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email = body.email
    await db.commit()
    return {"ok": True}


@app.post("/api/users/unlink-email")
async def unlink_email(body: UnlinkEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email = None
    await db.commit()
    return {"ok": True}


@app.post("/api/users/auto-renew")
async def toggle_auto_renew(body: AutoRenewRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.auto_renew = body.enabled
    await db.commit()
    return {"ok": True}


# ── Plans ──────────────────────────────────────────────────────────

@app.get("/api/plans")
async def get_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).order_by(Plan.price))
    plans = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "days": p.days,
            "badge": p.badge,
            "per_day": p.per_day,
        }
        for p in plans
    ]


# ── Payments ───────────────────────────────────────────────────────

@app.post("/api/payments/create")
async def create_payment(body: CreatePaymentRequest, db: AsyncSession = Depends(get_db)):
    payment = Payment(
        user_id=body.user_id,
        amount=body.amount,
        description=body.description,
        status="pending",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return {"payment_id": payment.id, "payment_url": None}


@app.post("/api/payments/confirm/{payment_id}")
async def confirm_payment(payment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = "completed"

    # Activate subscription for user
    user_result = await db.execute(select(User).where(User.id == payment.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        now = datetime.utcnow()
        current_end = user.subscription_until if user.subscription_until and user.subscription_until > now else now
        user.subscription_until = current_end + timedelta(days=30)
        user.balance += payment.amount
        user.is_trial = False

    await db.commit()
    return {"success": True}


@app.get("/api/payments/history/{user_id}")
async def get_payment_history(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payment).where(Payment.user_id == user_id).order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "amount": p.amount,
            "status": p.status,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in payments
    ]


# ── Referrals ──────────────────────────────────────────────────────

@app.get("/api/users/referral/stats/{telegram_id}")
async def get_referral_stats(telegram_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    referrals_result = await db.execute(
        select(User).where(User.referred_by == user.id)
    )
    referrals = referrals_result.scalars().all()
    active = [r for r in referrals if r.subscription_until and r.subscription_until > datetime.utcnow()]

    total_earned = sum(
        p.amount * 0.3
        for ref in referrals
        for p in (await db.execute(
            select(Payment).where(Payment.user_id == ref.id, Payment.status == "completed")
        )).scalars().all()
    )

    return {
        "total_referrals": len(referrals),
        "active_referrals": len(active),
        "total_earned": round(total_earned, 2),
        "referral_link": f"https://t.me/gigantvpn_bot?start=ref_{user.referral_code}",
        "referral_code": user.referral_code or "",
    }


# ── Devices ────────────────────────────────────────────────────────

@app.get("/api/users/{user_id}/devices")
async def get_devices(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Device).where(Device.user_id == user_id).order_by(Device.id)
    )
    devices = result.scalars().all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "platform": d.platform,
            "is_active": d.is_active,
            "last_active_at": d.last_active_at.isoformat() if d.last_active_at else None,
        }
        for d in devices
    ]


@app.post("/api/users/{user_id}/devices")
async def add_device(user_id: int, body: AddDeviceRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    count_result = await db.execute(
        select(Device).where(Device.user_id == user_id)
    )
    count = len(count_result.scalars().all())
    if count >= user.devices_count:
        raise HTTPException(status_code=400, detail="Device limit reached")

    device = Device(user_id=user_id, name=body.name, platform=body.platform)
    db.add(device)
    await db.commit()
    await db.refresh(device)

    return {
        "id": device.id,
        "name": device.name,
        "platform": device.platform,
        "is_active": device.is_active,
        "last_active_at": device.last_active_at.isoformat() if device.last_active_at else None,
    }


@app.delete("/api/users/{user_id}/devices/{device_id}")
async def remove_device(user_id: int, device_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    await db.commit()
    return {"ok": True}


@app.post("/api/users/{user_id}/devices/{device_id}/toggle")
async def toggle_device(user_id: int, device_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    device.is_active = not device.is_active
    device.last_active_at = datetime.utcnow()
    await db.commit()
    await db.refresh(device)

    return {
        "id": device.id,
        "name": device.name,
        "platform": device.platform,
        "is_active": device.is_active,
        "last_active_at": device.last_active_at.isoformat() if device.last_active_at else None,
    }
