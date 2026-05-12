from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class EntryType(str, enum.Enum):
    meal = "meal"
    bathroom = "bathroom"
    note = "note"


class UrineType(str, enum.Enum):
    clear = "clear"
    normal = "normal"
    concentrated = "concentrated"


class StoolType(str, enum.Enum):
    normal = "normal"
    hard = "hard"
    soft = "soft"
    diarrhea = "diarrhea"


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(SAEnum(EntryType), nullable=False, default=EntryType.note)
    raw_text = Column(String, nullable=False)
    parsed_text = Column(String)
    meal_name = Column(String)
    calories = Column(Float)
    carbs = Column(Float)
    protein = Column(Float)
    fat = Column(Float)
    urine_type = Column(SAEnum(UrineType))
    stool_type = Column(SAEnum(StoolType))
    ai_analyzed = Column(Boolean, default=False)
    confidence = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="diary_entries")
