from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    settings = Column(JSON, default=dict)

    diary_entries = relationship("DiaryEntry", back_populates="user", cascade="all, delete-orphan")
    biometric_logs = relationship("BiometricLog", back_populates="user", cascade="all, delete-orphan")
    telegram_messages = relationship("TelegramMessage", back_populates="user", cascade="all, delete-orphan")
