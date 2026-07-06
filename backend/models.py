from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, default="")
    first_name = Column(String, default="")
    email = Column(String, nullable=True)
    balance = Column(Float, default=0.0)
    subscription_until = Column(DateTime, nullable=True)
    devices_count = Column(Integer, default=3)
    network = Column(String, default="LTE")
    is_trial = Column(Boolean, default=True)
    trial_ends_at = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=False)
    referral_code = Column(String, unique=True, nullable=True)
    referred_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    days = Column(Integer, nullable=False)
    badge = Column(String, nullable=True)
    per_day = Column(String, nullable=False)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, completed, failed, refunded
    description = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    platform = Column(String, default="unknown")
    is_active = Column(Boolean, default=False)
    last_active_at = Column(DateTime, nullable=True)
