from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class MessageDirection(str, enum.Enum):
    incoming = "in"
    outgoing = "out"


class TelegramMessage(Base):
    __tablename__ = "telegram_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    telegram_message_id = Column(Integer)
    direction = Column(SAEnum(MessageDirection), nullable=False)
    content = Column(Text, nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="telegram_messages")
